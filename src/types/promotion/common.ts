import type { CampaignBudgetTypeValues, HttpTypes, PromotionRuleOperatorValues } from "@medusajs/types"

export interface ExtendedAdminPromotionRule extends Omit<HttpTypes.AdminPromotionRule, "values"> {
  field_type?: string
  required?: boolean
  disguised?: boolean
  attribute_label?: string
  operator_label?: string
  values: ExtendedAdminPromotionRuleValue[]
}

export interface ExtendedAdminPromotionRuleValue {
  id: string
  value?: string
  label?: string
}

export type ExtendedCampaignBudgetType = CampaignBudgetTypeValues | "use_by_attribute"

export interface ExtendedCampaignBudget {
  type?: ExtendedCampaignBudgetType
  limit?: number | null
  used?: number
  currency_code?: string | null
  attribute?: string | null
}

export type FormattedPromotionRuleTypes = "rules" | "target-rules" | "buy-rules"

export interface FormRule {
  id?: string
  attribute: string
  operator: PromotionRuleOperatorValues
  values: string | number | string[]
  required?: boolean
  disguised?: boolean
  field_type?: string
}

export interface RuleToRemove {
  id: string
  disguised?: boolean
  attribute: string
}

