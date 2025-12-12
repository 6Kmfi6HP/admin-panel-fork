import type { ExtendedAdminProductVariant } from "@custom-types/product"
import type { OrderLineItemDTO } from "@medusajs/types"

export function checkInventoryKit(
  item: OrderLineItemDTO & {
    variant?: ExtendedAdminProductVariant
  }
) {
  const variant = item.variant

  if (!variant) {
    return false
  }

  return (
    (!!variant.inventory_items?.length && variant.inventory_items?.length > 1) ||
    (variant.inventory_items?.length === 1 &&
      variant.inventory_items[0].required_quantity! > 1)
  )
}
