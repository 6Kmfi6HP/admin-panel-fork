import { useTranslation } from "react-i18next"

import { Buildings } from "@medusajs/icons"

import { ActionMenu } from "../../../../../components/common/action-menu"
import type { ExtendedAdminProductVariantInventoryItemWithQuantity } from "../../../../../types/product"

export const InventoryActions = ({ item }: { item: ExtendedAdminProductVariantInventoryItemWithQuantity }) => {
  const { t } = useTranslation()

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <Buildings />,
              label: t("products.variant.inventory.navigateToItem"),
              to: `/inventory/${item.id}`,
            },
          ],
        },
      ]}
    />
  )
}
