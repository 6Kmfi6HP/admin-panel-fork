import type { ExtendedAdminPromotionRule } from "@custom-types/promotion/common"

export const getRuleValue = (rule: ExtendedAdminPromotionRule): string | number | null => {
  if (rule.field_type === "number") {
    const value = Array.isArray(rule.values) && rule.values.length > 0
      ? rule.values[0]?.value
      : typeof rule.values === "string"
      ? rule.values
      : null
    
    return value ? parseInt(value, 10) : null
  }

  if (Array.isArray(rule.values)) {
    return rule.values.length > 0 ? rule.values[0]?.value ?? null : null
  }

  return typeof rule.values === "string" ? rule.values : null
}
