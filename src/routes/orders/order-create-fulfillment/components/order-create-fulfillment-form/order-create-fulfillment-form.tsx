import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AdminOrder, HttpTypes, OrderLineItemDTO } from '@medusajs/types';
import { Alert, Button, Heading, Select, Switch, Text, toast } from '@medusajs/ui';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as zod from 'zod';

import { Form } from '../../../../../components/common/form';
import { Combobox } from '../../../../../components/inputs/combobox';
import { RouteFocusModal, useRouteModal } from '../../../../../components/modals';
import { KeyboundForm } from '../../../../../components/utilities/keybound-form';
import { useReservationItems, useShippingOptions } from '../../../../../hooks/api';
import { useCreateOrderFulfillment } from '../../../../../hooks/api/orders';
import { useComboboxData } from '../../../../../hooks/use-combobox-data';
import { useDocumentDirection } from '../../../../../hooks/use-document-direction';
import { sdk } from '../../../../../lib/client';
import {
  filterItemsFulfillableByAdmin,
  getFulfillableQuantity
} from '../../../../../lib/order-item';
import { getReservationsLimitCount } from '../../../../../lib/orders';
import { CreateFulfillmentSchema } from './constants';
import { OrderCreateFulfillmentItem } from './order-create-fulfillment-item';

type OrderCreateFulfillmentFormProps = {
  order: AdminOrder;
  requiresShipping: boolean;
};

export function OrderCreateFulfillmentForm({
  order,
  requiresShipping
}: OrderCreateFulfillmentFormProps) {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const direction = useDocumentDirection();
  const { mutateAsync: createOrderFulfillment, isPending: isMutating } = useCreateOrderFulfillment(
    order.id
  );

  const { reservations } = useReservationItems({
    line_item_id: order.items.map(i => i.id),
    limit: getReservationsLimitCount(order)
  });

  const stockLocations = useComboboxData({
    queryFn: params => sdk.admin.stockLocation.list(params),
    queryKey: ['stock_locations'],
    getOptions: data =>
      data.stock_locations.map(location => ({
        label: location.name,
        value: location.id
      }))
  });

  const adminLocationIds = useMemo(() => {
    return new Set(stockLocations.options.map(opt => opt.value));
  }, [stockLocations.options]);

  const [fulfillableItems, setFulfillableItems] = useState(() => {
    const itemsWithQuantity = (order.items || []).filter(
      item => item.requires_shipping === requiresShipping && getFulfillableQuantity(item) > 0
    );
    return filterItemsFulfillableByAdmin(itemsWithQuantity, adminLocationIds);
  });

  const form = useForm<zod.infer<typeof CreateFulfillmentSchema>>({
    defaultValues: {
      quantity: fulfillableItems.reduce(
        (acc, item) => {
          acc[item.id] = getFulfillableQuantity(item);
          return acc;
        },
        {} as Record<string, number>
      ),
      selected_items: fulfillableItems.map(item => item.id),
      send_notification: !order.no_notification
    },
    resolver: zodResolver(CreateFulfillmentSchema)
  });

  const selectedLocationId = useWatch({
    name: 'location_id',
    control: form.control
  });

  const { shipping_options = [], isLoading: isShippingOptionsLoading } = useShippingOptions({
    stock_location_id: selectedLocationId,
    // is_return: false, // TODO: 500 when enabled
    fields: '+service_zone.fulfillment_set.location.id'
  });

  const shippingOptionId = useWatch({
    name: 'shipping_option_id',
    control: form.control
  });

  const handleSubmit = form.handleSubmit(async data => {
    const selectedShippingOption = shipping_options.find(o => o.id === shippingOptionId);

    if (!selectedShippingOption) {
      form.setError('shipping_option_id', {
        type: 'manual',
        message: t('orders.fulfillment.error.noShippingOption')
      });
      return;
    }

    if (!selectedLocationId) {
      form.setError('location_id', {
        type: 'manual',
        message: t('orders.fulfillment.error.noLocation')
      });
      return;
    }

    let items = Object.entries(data.quantity)
      .map(([id, quantity]) => ({
        id,
        quantity
      }))
      .filter(({ quantity, id }) => !!quantity && data.selected_items.includes(id));

    /**
     * If items require shipping fulfill only items with matching shipping profile.
     */
    if (requiresShipping) {
      const selectedShippingProfileId = selectedShippingOption?.shipping_profile_id;

      const itemShippingProfileMap = order.items.reduce((acc, item) => {
        acc[item.id] = item.variant?.product?.shipping_profile?.id;
        return acc;
      }, {} as any);

      items = items.filter(({ id }) => itemShippingProfileMap[id] === selectedShippingProfileId);
    }

    if (items.length === 0) {
      toast.error(t('orders.fulfillment.error.noItems'));
      return;
    }

    const payload: HttpTypes.AdminCreateOrderFulfillment = {
      location_id: selectedLocationId,
      shipping_option_id: shippingOptionId,
      no_notification: !data.send_notification,
      items
    };

    try {
      await createOrderFulfillment(payload);

      toast.success(t('orders.fulfillment.toast.created'));
      handleSuccess(`/orders/${order.id}`);
    } catch (e) {
      toast.error(e.message);
    }
  });

  useEffect(() => {
    if (shipping_options?.length) {
      const initialShippingOptionId = order.shipping_methods?.[0]?.shipping_option_id;

      if (initialShippingOptionId) {
        const shippingOption = shipping_options.find(o => o.id === initialShippingOptionId);

        if (shippingOption) {
          const locationId = shippingOption.service_zone.fulfillment_set.location.id;

          form.setValue('location_id', locationId);
          form.setValue('shipping_option_id', initialShippingOptionId || undefined);
        } // else -> TODO: what if original shipping option is deleted?
      }
    }
  }, [shipping_options]);

  const adminLocationIdsKey = useMemo(
    () => Array.from(adminLocationIds).sort().join(','),
    [adminLocationIds]
  );

  const fulfilledQuantitiesKey = useMemo(
    () =>
      (order.items || [])
        .filter(item => item.requires_shipping === requiresShipping)
        .map(item => `${item.id}:${item.detail.fulfilled_quantity}`)
        .sort()
        .join(','),
    [order.items, requiresShipping]
  );

  useEffect(() => {
    const itemsWithQuantity =
      order?.items?.filter(
        item => item.requires_shipping === requiresShipping && getFulfillableQuantity(item) > 0
      ) || [];

    const itemsToFulfill = filterItemsFulfillableByAdmin(itemsWithQuantity, adminLocationIds);

    setFulfillableItems(itemsToFulfill);

    if (itemsToFulfill.length) {
      form.clearErrors('root');
    } else {
      form.setError('root', {
        type: 'manual',
        message: t('orders.fulfillment.error.noItems')
      });
    }

    const quantityMap = itemsToFulfill.reduce(
      (acc, item) => {
        acc[item.id] = getFulfillableQuantity(item as OrderLineItemDTO);
        return acc;
      },
      {} as Record<string, number>
    );

    form.setValue('quantity', quantityMap);
  }, [fulfilledQuantitiesKey, requiresShipping, adminLocationIdsKey]);

  const differentOptionSelected =
    shippingOptionId && order.shipping_methods?.[0]?.shipping_option_id !== shippingOptionId;

  const showLevelsWarning = useMemo(() => {
    if (!selectedLocationId) {
      return false;
    }

    const allItemsHaveLocation = fulfillableItems
      .map(item => {
        if (!item.variant_id) {
          return true;
        }

        if (!item.variant?.manage_inventory) {
          return true;
        }

        const inventory = (item.variant as any)?.inventory?.[0];
        const locationLevels = inventory?.location_levels;

        return locationLevels?.find((l: any) => l.location_id === selectedLocationId);
      })
      .every(Boolean);

    return !allItemsHaveLocation;
  }, [fulfillableItems, selectedLocationId]);

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col"
      >
        <RouteFocusModal.Header />

        <RouteFocusModal.Body className="flex size-full justify-center overflow-y-auto">
          <div className="flex size-full w-[752px] max-w-[100%] flex-col gap-8 px-4 pt-16">
            <Heading level="h2">{t('orders.fulfillment.create')}</Heading>
            <div className="flex w-full flex-col justify-center">
              <div className="flex flex-col divide-y divide-dashed">
                <div className="pb-8">
                  <Form.Field
                    control={form.control}
                    name="location_id"
                    render={({ field: { ...field } }) => {
                      return (
                        <Form.Item>
                          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                            <div className="flex-1">
                              <Form.Label>{t('fields.location')}</Form.Label>
                              <Form.Hint>{t('orders.fulfillment.locationDescription')}</Form.Hint>
                            </div>
                            <div className="flex-1">
                              <Form.Control>
                                <Combobox
                                  {...field}
                                  options={stockLocations.options}
                                  searchValue={stockLocations.searchValue}
                                  onSearchValueChange={stockLocations.onSearchValueChange}
                                  disabled={stockLocations.disabled}
                                />
                              </Form.Control>
                            </div>
                          </div>
                          <Form.ErrorMessage />
                        </Form.Item>
                      );
                    }}
                  />
                  {showLevelsWarning && (
                    <Alert
                      variant="warning"
                      dismissible
                      className="mt-4 p-3"
                    >
                      <Text
                        weight="plus"
                        leading="compact"
                        className="mb-1 text-ui-fg-base"
                        size="small"
                      >
                        {t('orders.returns.noInventoryLevel')}
                      </Text>
                      <Text
                        leading="normal"
                        className="text-ui-fg-subtle"
                        size="small"
                      >
                        {t('orders.returns.noInventoryLevelDesc')}
                      </Text>
                    </Alert>
                  )}
                </div>

                <div className="py-8">
                  <Form.Field
                    control={form.control}
                    name="shipping_option_id"
                    render={({ field: { onChange, ref, ...field } }) => {
                      return (
                        <Form.Item>
                          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                            <div className="flex-1">
                              <Form.Label>{t('fields.shippingMethod')}</Form.Label>
                              <Form.Hint>{t('orders.fulfillment.methodDescription')}</Form.Hint>
                            </div>
                            <div className="flex-1">
                              <Form.Control>
                                <Select
                                  dir={direction}
                                  onValueChange={onChange}
                                  {...field}
                                  disabled={!selectedLocationId}
                                >
                                  <Select.Trigger
                                    className="bg-ui-bg-base"
                                    ref={ref}
                                  >
                                    {isShippingOptionsLoading ? (
                                      <span className="text-right">{t('labels.loading')}...</span>
                                    ) : (
                                      <Select.Value />
                                    )}
                                  </Select.Trigger>
                                  <Select.Content>
                                    {shipping_options.map(o => (
                                      <Select.Item
                                        key={o.id}
                                        value={o.id}
                                      >
                                        {o.name}
                                      </Select.Item>
                                    ))}
                                  </Select.Content>
                                </Select>
                              </Form.Control>
                            </div>
                          </div>
                          <Form.ErrorMessage />
                        </Form.Item>
                      );
                    }}
                  />

                  {differentOptionSelected && (
                    <Alert
                      className="mt-4 border-none p-3 shadow-elevation-card-rest"
                      variant="warning"
                      dismissible
                    >
                      <span className="-mt-[3px] block font-medium">{t('labels.beaware')}</span>
                      <span className="text-ui-fg-muted">
                        {t('orders.fulfillment.differentOptionSelected')}
                      </span>
                    </Alert>
                  )}
                </div>
                <div>
                  <Form.Item className="mt-8 space-y-3">
                    <div>
                      <Form.Label>{t('orders.fulfillment.itemsToFulfill')}</Form.Label>
                      <Form.Hint>{t('orders.fulfillment.itemsToFulfillDesc')}</Form.Hint>
                    </div>

                    <div className="flex flex-col gap-y-2">
                      {fulfillableItems.map(item => {
                        const isShippingProfileMatching =
                          shipping_options.find(o => o.id === shippingOptionId)
                            ?.shipping_profile_id === item.variant?.product?.shipping_profile?.id;

                        return (
                          <OrderCreateFulfillmentItem
                            key={item.id}
                            form={form}
                            item={item}
                            locationId={selectedLocationId}
                            disabled={
                              (requiresShipping && !isShippingProfileMatching) || showLevelsWarning
                            }
                            reservations={reservations}
                          />
                        );
                      })}
                    </div>
                  </Form.Item>
                  {form.formState.errors.root && (
                    <Alert
                      variant="error"
                      dismissible={false}
                      className="flex items-center"
                    >
                      {form.formState.errors.root.message}
                    </Alert>
                  )}
                </div>

                <div className="mt-8 pt-8">
                  <Form.Field
                    control={form.control}
                    name="send_notification"
                    render={({ field: { onChange, value, ...field } }) => {
                      return (
                        <Form.Item>
                          <div className="flex gap-x-3 rounded-lg bg-ui-bg-component p-3 shadow-elevation-card-rest">
                            <Form.Control>
                              <Form.Control>
                                <Switch
                                  dir="ltr"
                                  className="rtl:rotate-180"
                                  checked={!!value}
                                  onCheckedChange={onChange}
                                  {...field}
                                />
                              </Form.Control>
                            </Form.Control>
                            <div>
                              <Form.Label>{t('orders.returns.sendNotification')}</Form.Label>
                              <Form.Hint className="!mt-1 text-ui-fg-subtle">
                                {t('orders.fulfillment.sendNotificationHint')}
                              </Form.Hint>
                            </div>
                          </div>
                          <Form.ErrorMessage />
                        </Form.Item>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="py-4" />
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button
                size="small"
                variant="secondary"
              >
                {t('actions.cancel')}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isMutating}
              disabled={!shippingOptionId || showLevelsWarning}
            >
              {t('actions.confirm')}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
}
