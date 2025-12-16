import { zodResolver } from "@hookform/resolvers/zod"
import type { HttpTypes, PromotionRuleDTO } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { RuleToRemove } from "@custom-types/promotion/common"
import { RouteDrawer } from "@/components/modals"
import { KeyboundForm } from "@/components/utilities/keybound-form"
import type { RuleTypeValues } from "../../edit-rules"
import { RulesFormField } from "../rules-form-field"
import { EditRules, type EditRulesType } from "./form-schema"

type EditPromotionFormProps = {
  promotion: HttpTypes.AdminPromotion
  rules: PromotionRuleDTO[]
  ruleType: RuleTypeValues
  handleSubmit: (rulesToRemove?: RuleToRemove[]) => (data: EditRulesType) => Promise<void>
  isSubmitting: boolean
}

export const EditRulesForm = ({
  promotion,
  ruleType,
  handleSubmit,
  isSubmitting,
}: EditPromotionFormProps) => {
  const { t } = useTranslation()
  const [rulesToRemove, setRulesToRemove] = useState<RuleToRemove[]>([])

  const form = useForm<EditRulesType>({
    defaultValues: {
      rules: [],
      type: promotion.type,
      application_method: {
        target_type: promotion.application_method?.target_type || "items",
      },
    },
    resolver: zodResolver(EditRules),
  })

  const handleFormSubmit = form.handleSubmit((data) => {
    return handleSubmit(rulesToRemove)(data)
  })

  return (
    <RouteDrawer.Form form={form} data-testid={`promotion-edit-rules-form-${ruleType}`}>
      <KeyboundForm
        onSubmit={handleFormSubmit}
        className="flex h-full flex-col"
      >
        <RouteDrawer.Body data-testid={`promotion-edit-rules-form-body-${ruleType}`}>
          <RulesFormField
            form={form}
            ruleType={ruleType}
            setRulesToRemove={setRulesToRemove}
            rulesToRemove={rulesToRemove}
            promotion={promotion}
            formType="edit"
          />
        </RouteDrawer.Body>

        <RouteDrawer.Footer data-testid={`promotion-edit-rules-form-footer-${ruleType}`}>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" disabled={isSubmitting} data-testid={`promotion-edit-rules-form-cancel-button-${ruleType}`}>
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button size="small" type="submit" isLoading={isSubmitting} data-testid={`promotion-edit-rules-form-save-button-${ruleType}`}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
