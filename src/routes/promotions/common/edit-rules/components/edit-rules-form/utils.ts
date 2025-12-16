import type { HttpTypes } from "@medusajs/types"
import type { ExtendedAdminPromotionRule } from "@custom-types/promotion/common"


export const generateRuleAttributes = (rules?: HttpTypes.AdminPromotionRule[]) =>
  (rules || []).map((rule) => {
    const extendedRule = rule as ExtendedAdminPromotionRule
    
    const values =
      extendedRule.field_type === "number" || extendedRule.operator === "eq"
        ? Array.isArray(extendedRule.values) && extendedRule.values.length > 0
          ? extendedRule.values[0]?.value
          : typeof extendedRule.values === "string" || typeof extendedRule.values === "number"
          ? extendedRule.values
          : ""
        : Array.isArray(extendedRule.values)
        ? extendedRule.values.map((v) => v.value ?? "").filter(Boolean)
        : []
    
    return {
      id: extendedRule.id,
      required: extendedRule.required,
      field_type: extendedRule.field_type,
      disguised: extendedRule.disguised,
      attribute: extendedRule.attribute ?? "",
      operator: extendedRule.operator ?? "",
      values: values as string | number | string[],
    }
  })
