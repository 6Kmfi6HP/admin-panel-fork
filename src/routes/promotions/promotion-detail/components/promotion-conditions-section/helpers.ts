import type { FormattedPromotionRuleTypes } from "@custom-types/promotion/common"
import type { ApplicationMethodTargetTypeValues } from "@medusajs/types"

export const getConditionsTitleKey = (
    ruleType: FormattedPromotionRuleTypes,
    applicationMethodTargetType?: ApplicationMethodTargetTypeValues
  ) => {
    if (ruleType === "target-rules") {
      if (!applicationMethodTargetType) {
        throw new Error("target-rules requires applicationMethodTargetType")
      }
  
      return `promotions.fields.conditions.target-rules.${applicationMethodTargetType}.title` as const
    }
  
    return `promotions.fields.conditions.${ruleType}.title` as const
  }