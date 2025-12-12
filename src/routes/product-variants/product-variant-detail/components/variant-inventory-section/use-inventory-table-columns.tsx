import type { InventoryLevelDTO } from "@medusajs/types"

import { InventoryActions } from "./inventory-actions"
import { PlaceholderCell } from "../../../../../components/table/table-cells/common/placeholder-cell"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { ExtendedInventoryItem } from "../../../../../types/product"

const columnHelper = createColumnHelper<ExtendedInventoryItem>()

export const useInventoryTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.display({
        id: "title",
        header: t("fields.title"),
        cell: ({ row }) => {
          const title = row.original.title

          if (!title) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{title}</span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "sku",
        header: t("fields.sku"),
        cell: ({ row }) => {
          const sku = row.original.sku

          if (!sku) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{sku}</span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "required_quantity",
        header: t("fields.requiredQuantity"),
        cell: ({ row }) => {
          const quantity = row.original.required_quantity

          if (quantity === undefined || Number.isNaN(quantity)) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{quantity}</span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "inventory_quantity",
        header: t("fields.inventory"),
        cell: ({ row: { original: inventory } }) => {
          if (!inventory.location_levels?.length) {
            return <PlaceholderCell />
          }

          let quantity = 0
          let locations = 0

          inventory.location_levels.forEach((level: InventoryLevelDTO) => {
            quantity += level.available_quantity
            locations += 1
          })

          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">
                {t("products.variant.tableItem", {
                  availableCount: quantity,
                  locationCount: locations,
                  count: locations,
                })}
              </span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <InventoryActions item={row.original} />,
      }),
    ],
    [t]
  )
}
