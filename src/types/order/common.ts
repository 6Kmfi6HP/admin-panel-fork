import type { HttpTypes, PaginatedResponse } from "@medusajs/types";
import type { FulfillmentSetType } from "@routes/locations/common/constants";
import type { ExtendedAdminProductVariant } from "..";

export interface ExtendedAdminOrder extends Omit<HttpTypes.AdminOrder, "items" | "fulfillments"> {
  canceled_at?: string | null;
  items: ExtendedAdminOrderLineItem[];
  fulfillments: ExtendedAdminOrderFulfillment[];
}

export interface ExtendedAdminOrderFulfillment extends HttpTypes.AdminOrderFulfillment {
  shipping_option: ExtendedAdminOrderFulfillmentShippingOption
  items: ExtendedAdminOrderLineItem[]
  labels?: ExtendedAdminOrderFulfillmentLabel[]
}
export interface ExtendedAdminOrderFulfillmentShippingOption {
  service_zone: ExtendedAdminOrderFulfillmentServiceZone
}
export interface ExtendedAdminOrderFulfillmentServiceZone extends HttpTypes.AdminServiceZone {
  fulfillment_set: ExtendedAdminOrderFulfillmentSet
}
interface ExtendedAdminOrderFulfillmentSet extends HttpTypes.AdminFulfillmentSet {
  type: FulfillmentSetType
}
export interface ExtendedAdminOrderLineItem extends HttpTypes.AdminOrderLineItem {
  line_item_id: string
  variant?: ExtendedAdminProductVariant
}

export interface ExtendedAdminOrderFulfillmentLabel {
  tracking_number: string
  tracking_url: string
  label_url: string
}
export interface ExtendedAdminOrderResponse extends HttpTypes.AdminOrderResponse {
  order: ExtendedAdminOrder;
}
export interface ExtendedAdminOrderListResponse extends PaginatedResponse<Omit<HttpTypes.AdminOrder, 'orders'>> {
  orders: ExtendedAdminOrder[];
}