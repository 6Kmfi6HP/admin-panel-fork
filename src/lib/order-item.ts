import { AdminOrderLineItem, OrderLineItemDTO } from '@medusajs/types';

export const getFulfillableQuantity = (item: OrderLineItemDTO | AdminOrderLineItem) => {
  return item.quantity - item.detail.fulfilled_quantity;
};

export const canItemBeFulfilledByAdmin = (
  item: AdminOrderLineItem,
  adminLocationIds: Set<string>
): boolean => {
  if (!item.variant?.manage_inventory) {
    const product = item.variant?.product;
    const hasSeller = product?.seller !== null && product?.seller !== undefined;

    return !hasSeller;
  }

  const inventory = item.variant?.inventory?.[0];
  if (!inventory?.location_levels?.length) {
    return false;
  }

  return inventory.location_levels.some(level => adminLocationIds.has(level.location_id));
};

export const filterItemsFulfillableByAdmin = (
  items: AdminOrderLineItem[],
  adminLocationIds: Set<string>
): AdminOrderLineItem[] => {
  return items.filter(item => canItemBeFulfilledByAdmin(item, adminLocationIds));
};
