import { ExtendedAdminOrderLineItem } from '@custom-types/order';
import { OrderLineItemDTO } from '@medusajs/types';

export const getFulfillableQuantity = (item: OrderLineItemDTO | ExtendedAdminOrderLineItem) => {
  return item.quantity - item.detail.fulfilled_quantity;
};
