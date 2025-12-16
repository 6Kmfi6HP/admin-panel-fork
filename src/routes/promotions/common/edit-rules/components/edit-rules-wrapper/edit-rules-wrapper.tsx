import type {
  CreatePromotionRuleDTO,
  HttpTypes,
  PromotionRuleDTO,
} from "@medusajs/types"
import type { RuleToRemove } from "@custom-types/promotion/common"
import { useRouteModal } from "@/components/modals"
import {
  usePromotionAddRules,
  usePromotionRemoveRules,
  usePromotionUpdateRules,
  useUpdatePromotion,
} from "@/hooks/api/promotions"
import type { RuleTypeValues } from "@/routes/promotions/common/edit-rules/edit-rules"
import { EditRulesForm } from "@/routes/promotions/common/edit-rules/components/edit-rules-form/edit-rules-form"
import type { EditRulesType } from "@/routes/promotions/common/edit-rules/components/edit-rules-form/form-schema"

type EditPromotionFormProps = {
  promotion: HttpTypes.AdminPromotion
  rules: PromotionRuleDTO[]
  ruleType: RuleTypeValues
}

export const EditRulesWrapper = ({
  promotion,
  rules,
  ruleType,
}: EditPromotionFormProps) => {
  const { handleSuccess } = useRouteModal()
  const { mutateAsync: updatePromotion } = useUpdatePromotion(promotion.id)
  const { mutateAsync: addPromotionRules } = usePromotionAddRules(
    promotion.id,
    ruleType
  )

  const { mutateAsync: removePromotionRules } = usePromotionRemoveRules(
    promotion.id,
    ruleType
  )

  const { mutateAsync: updatePromotionRules, isPending } =
    usePromotionUpdateRules(promotion.id, ruleType)

  const handleSubmit = (rulesToRemove?: RuleToRemove[]) => {
    return async function (data: EditRulesType) {
      const applicationMethodData: Record<string, string | number | null> = {}
      const { rules: allRules = [] } = data
      const disguisedRules = allRules.filter((rule) => rule.disguised)
      const disguisedRulesToRemove =
        rulesToRemove?.filter((r) => r.disguised) || []

      // For all the rules that were disguised, convert them to actual values in the
      // database, they are currently all under application_method. If more of these are coming
      // up, abstract this away.
      for (const rule of disguisedRules) {
        const value = Array.isArray(rule.values)
          ? rule.values[0] || null
          : rule.values || null

        applicationMethodData[rule.attribute] =
          rule.field_type === "number" && value ? Number(value) : value
      }

      for (const rule of disguisedRulesToRemove) {
        applicationMethodData[rule.attribute] = null
      }

      // This variable will contain the rules that are actual rule objects, without the disguised
      // objects
      const rulesData = allRules.filter((rule) => !rule.disguised)
      
      const existingRuleIds = new Set(rules.map((r) => r.id).filter(Boolean))
      
      const currentFormRuleIds = new Set(
        rulesData
          .map((r) => r.id)
          .filter((id): id is string => typeof id === "string" && id !== "")
      )
      
      const explicitlyMarkedForRemoval = new Set(
        (rulesToRemove || []).map((r) => r.id).filter(Boolean)
      )

      const rulesToRemoveIds = new Set([
        ...explicitlyMarkedForRemoval,
        ...rules
          .map((r) => r.id)
          .filter((id): id is string => Boolean(id) && !currentFormRuleIds.has(id)),
      ])
      
      // Rules to create: no ID or ID doesn't exist in current promotion
      const rulesToCreate = rulesData.filter(
        (rule) => !rule.id || rule.id === "" || !existingRuleIds.has(rule.id)
      )
      
      // Rules to update: have ID and ID exists in current promotion
      const rulesToUpdate = rulesData.filter(
        (rule): rule is EditRulesType["rules"][number] & { id: string } =>
          typeof rule.id === "string" && rule.id !== "" && existingRuleIds.has(rule.id)
      )

      if (Object.keys(applicationMethodData).length) {
        await updatePromotion({
          application_method: applicationMethodData,
        })
      }

      if (rulesToCreate.length) {
        await addPromotionRules({
          rules: rulesToCreate.map((rule): CreatePromotionRuleDTO => {
            const values: string | string[] = Array.isArray(rule.values)
              ? rule.values.map((v) => String(v))
              : typeof rule.values === "number"
              ? String(rule.values)
              : rule.values

            return {
              attribute: rule.attribute,
              operator: rule.operator,
              values,
            }
          }),
        })
      }

      if (rulesToRemoveIds.size > 0) {
        await removePromotionRules({
          rule_ids: Array.from(rulesToRemoveIds) as string[],
        })
      }

      if (rulesToUpdate.length) {
        await updatePromotionRules({
          rules: rulesToUpdate.map((rule) => {
            const values: string | string[] = Array.isArray(rule.values)
              ? rule.values.map((v) => String(v))
              : typeof rule.values === "number"
              ? String(rule.values)
              : rule.values

            return {
              id: rule.id,
              attribute: rule.attribute,
              operator: rule.operator,
              values,
            }
          }),
        })
      }

      handleSuccess()
    }
  }

  return (
    <EditRulesForm
      promotion={promotion}
      rules={rules}
      ruleType={ruleType}
      handleSubmit={handleSubmit}
      isSubmitting={isPending}
    />
  )
}
