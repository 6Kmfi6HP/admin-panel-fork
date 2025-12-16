import { XMarkMini } from "@medusajs/icons"
import type { HttpTypes, PromotionRuleOperatorValues } from "@medusajs/types"
import { Badge, Button, Heading, IconButton, Select, Text } from "@medusajs/ui"
import { forwardRef, Fragment, useEffect, useRef } from "react"
import type {
  ControllerRenderProps,
  FieldValues,
  UseFormReturn,
} from "react-hook-form"
import { useFieldArray, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { FormRule, RuleToRemove } from "@custom-types/promotion/common"
import { Form } from "@/components/common/form"
import {
  usePromotionRuleAttributes,
  usePromotionRules,
} from "@/hooks/api/promotions"
import { useDocumentDirection } from "@/hooks/use-document-direction"
import type { CreatePromotionSchemaType } from "@/routes/promotions/promotion-create/components/create-promotion-form/form-schema"
import type { EditRulesType } from "@/routes/promotions/common/edit-rules/components/edit-rules-form/form-schema"
import { generateRuleAttributes } from "@/routes/promotions/common/edit-rules/components/edit-rules-form/utils"
import { RuleValueFormField } from "@/routes/promotions/common/edit-rules/components/rule-value-form-field"
import { requiredProductRule } from "./constants"

type RulesFormFieldType = {
  promotion?: HttpTypes.AdminPromotion
  form: UseFormReturn<CreatePromotionSchemaType> | UseFormReturn<EditRulesType>
  ruleType: "rules" | "target-rules" | "buy-rules"
  setRulesToRemove?: (rules: RuleToRemove[]) => void
  rulesToRemove?: RuleToRemove[]
  scope?:
    | "application_method.buy_rules"
    | "rules"
    | "application_method.target_rules"
  formType?: "create" | "edit"
}

export const RulesFormField = ({
  form,
  ruleType,
  setRulesToRemove,
  rulesToRemove,
  scope = "rules",
  promotion,
  formType = "create",
}: RulesFormFieldType) => {
  const initialRulesSet = useRef(false)

  const { t } = useTranslation()
  const direction = useDocumentDirection()
  
  // Type-safe form data access based on formType
  const formData = form.getValues()
  const formTypeValue = formType === "create" 
    ? (formData as CreatePromotionSchemaType).type
    : (formData as EditRulesType).type
  
  const applicationMethodTargetTypeValue = formType === "create"
    ? (formData as CreatePromotionSchemaType).application_method?.target_type
    : (formData as EditRulesType).application_method?.target_type

  const { attributes } = usePromotionRuleAttributes(
    ruleType,
    formTypeValue,
    applicationMethodTargetTypeValue
  )

  // Type-safe field array - use conditional logic based on formType
  // Helper to get the correct field name based on scope
  const getFieldName = (): "rules" | "application_method.buy_rules" | "application_method.target_rules" => {
    if (scope === "rules") {
      return "rules"
    }
    if (scope === "application_method.buy_rules") {
      return "application_method.buy_rules"
    }

    return "application_method.target_rules"
  }

  const fieldName = getFieldName()

  const createFormFieldArray = formType === "create"
    ? useFieldArray({
        control: (form as UseFormReturn<CreatePromotionSchemaType>).control,
        name: fieldName as "rules" | "application_method.buy_rules" | "application_method.target_rules",
      })
    : useFieldArray({
        control: (form as UseFormReturn<EditRulesType>).control,
        name: "rules" as const, // EditRulesType only supports "rules"
      })

  const { fields, append, remove, update, replace } = createFormFieldArray

  // Type-safe watch - handle union type properly
  const promotionType = formType === "create"
    ? useWatch({
        control: (form as UseFormReturn<CreatePromotionSchemaType>).control,
        name: "type",
        defaultValue: promotion?.type,
      })
    : useWatch({
        control: (form as UseFormReturn<EditRulesType>).control,
        name: "type",
        defaultValue: promotion?.type,
      })

  const applicationMethodType = formType === "create"
    ? useWatch({
        control: (form as UseFormReturn<CreatePromotionSchemaType>).control,
        name: "application_method.type",
        defaultValue: promotion?.application_method?.type,
      })
    : undefined

  const applicationMethodTargetType = formType === "create"
    ? useWatch({
        control: (form as UseFormReturn<CreatePromotionSchemaType>).control,
        name: "application_method.target_type",
        defaultValue: promotion?.application_method?.target_type,
      })
    : useWatch({
        control: (form as UseFormReturn<EditRulesType>).control,
        name: "application_method.target_type",
        defaultValue: promotion?.application_method?.target_type,
      })

  const query: Record<string, string> = promotionType
    ? {
        promotion_type: promotionType,
        ...(applicationMethodType && { application_method_type: applicationMethodType }),
        ...(applicationMethodTargetType && { application_method_target_type: applicationMethodTargetType }),
      }
    : {}

  const { rules: apiRules, isLoading } = usePromotionRules(
    promotion?.id || null,
    ruleType,
    query,
    {
      enabled: !!promotion?.id || (!!promotionType && !!applicationMethodType),
    }
  )

  // Type-safe conversion: API returns HttpTypes.AdminPromotionRule[] but we need ExtendedAdminPromotionRule[]
  const rules = apiRules as HttpTypes.AdminPromotionRule[] | undefined

  useEffect(() => {
    if (isLoading) {
      return
    }

    /**
     * This effect sets rules after mount but since it is reused in create and edit flows, prevent this hook from recreating rules
     * when fields are intentionally set to empty (e.g. "Clear all" is pressed).
     */
    if (!fields.length && formType === "edit" && initialRulesSet.current) {
      return
    }

    if (ruleType === "rules" && !fields.length) {
      if (formType === "create") {
        (form as UseFormReturn<CreatePromotionSchemaType>).resetField("rules")
      } else {
        (form as UseFormReturn<EditRulesType>).resetField("rules")
      }
      replace(generateRuleAttributes(rules) as CreatePromotionSchemaType["rules"] | EditRulesType["rules"])
    }

    if (ruleType === "buy-rules" && !fields.length) {
      // EditRulesType doesn't have buy_rules, only CreatePromotionSchemaType does
      if (formType === "create") {
        (form as UseFormReturn<CreatePromotionSchemaType>).resetField("application_method.buy_rules")
      }
      const rulesToAppend =
        promotion?.id || promotionType === "standard"
          ? rules
          : [...(rules || []), requiredProductRule as HttpTypes.AdminPromotionRule]

      replace(generateRuleAttributes(rulesToAppend) as CreatePromotionSchemaType["application_method"]["buy_rules"])
    }

    if (ruleType === "target-rules" && !fields.length) {
      if (formType === "create") {
        (form as UseFormReturn<CreatePromotionSchemaType>).resetField("application_method.target_rules")
      }
      const rulesToAppend =
        promotion?.id || promotionType === "standard"
          ? rules
          : [...(rules || []), requiredProductRule as HttpTypes.AdminPromotionRule]

      replace(generateRuleAttributes(rulesToAppend) as CreatePromotionSchemaType["application_method"]["target_rules"])
    }

    initialRulesSet.current = true
  }, [
    promotionType,
    isLoading,
    ruleType,
    fields.length,
    formType,
    form,
    replace,
    rules,
    promotion?.id,
  ])

  return (
    <div className="flex flex-col" data-testid={`rules-form-field-${ruleType}`}>
      <Heading level="h2" className="mb-2" data-testid={`rules-form-field-heading-${ruleType}`}>
        {ruleType === "target-rules" && applicationMethodTargetType
          ? applicationMethodTargetType === "order"
            ? t("promotions.fields.conditions.target-rules.order.title")
            : applicationMethodTargetType === "shipping_methods"
            ? t("promotions.fields.conditions.target-rules.shipping_methods.title")
            : t("promotions.fields.conditions.target-rules.items.title")
          : ruleType === "rules"
          ? t("promotions.fields.conditions.rules.title")
          : t("promotions.fields.conditions.buy-rules.title")}
      </Heading>

      <Text className="text-ui-fg-subtle txt-small mb-6" data-testid={`rules-form-field-description-${ruleType}`}>
        {ruleType === "target-rules" && applicationMethodTargetType
          ? applicationMethodTargetType === "order"
            ? t("promotions.fields.conditions.target-rules.order.description")
            : applicationMethodTargetType === "shipping_methods"
            ? t("promotions.fields.conditions.target-rules.shipping_methods.description")
            : t("promotions.fields.conditions.target-rules.items.description")
          : ruleType === "rules"
          ? t("promotions.fields.conditions.rules.description")
          : t("promotions.fields.conditions.buy-rules.description")}
      </Text>

      {fields.map((fieldRule, index) => {
        const typedFieldRule = fieldRule as FormRule
        const identifier = typedFieldRule.id ?? `field-${index}`

        return (
          <Fragment key={`${typedFieldRule.id ?? identifier}.${index}.${typedFieldRule.attribute}`}>
            <div className="bg-ui-bg-subtle border-ui-border-base flex flex-row gap-2 rounded-xl border px-2 py-2" data-testid={`rules-form-field-rule-${ruleType}-${index}`}>
              <div className="grow">
                <Form.Field
                  name={`${scope}.${index}.attribute`}
                  render={({ field }) => {
                    const { onChange, ref, ...fieldProps } = field

                    const existingAttributes =
                      fields?.map((field) => (field as FormRule).attribute).filter(Boolean) as string[] || []
                    
                    const attributeOptions =
                      attributes?.filter((attr) => {
                        if (attr.value === typedFieldRule.attribute) {
                          return true
                        }

                        return !existingAttributes.includes(attr.value)
                      }) || []

                    const disabled = !!typedFieldRule.required
                    const onValueChange = (e: string) => {
                      const currentAttributeOption = attributeOptions.find(
                        (ao) => ao.id === e
                      )

                      const fieldRuleOverrides: FormRule = {
                        ...typedFieldRule,
                        disguised: currentAttributeOption?.disguised || false,
                      }

                      if (currentAttributeOption?.operators?.length === 1) {
                        fieldRuleOverrides.operator =
                          currentAttributeOption.operators[0].value as PromotionRuleOperatorValues
                      }

                      if (fieldRuleOverrides.operator === "eq") {
                        fieldRuleOverrides.values = ""
                      } else {
                        fieldRuleOverrides.values = []
                      }

                      update(index, fieldRuleOverrides)
                      onChange(e)
                    }

                    return (
                      <Form.Item className="mb-2" data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-item`}>
                        {typedFieldRule.required && (
                          <div className="flex items-center px-2" data-testid={`rules-form-field-rule-${ruleType}-${index}-required-label`}>
                            <p className="text text-ui-fg-muted txt-small">
                              {t("promotions.form.required")}
                            </p>
                          </div>
                        )}

                        <Form.Control data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-control`}>
                          {!disabled ? (
                            <Select
                              dir={direction}
                              {...fieldProps}
                              onValueChange={onValueChange}
                              disabled={typedFieldRule.required}
                              data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-select`}
                            >
                              <Select.Trigger
                                ref={ref}
                                className="bg-ui-bg-base"
                                data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-select-trigger`}
                              >
                                <Select.Value
                                  placeholder={t(
                                    "promotions.form.selectAttribute"
                                  )}
                                />
                              </Select.Trigger>

                              <Select.Content data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-select-content`}>
                                {attributeOptions?.map((c, i) => (
                                  <Select.Item
                                    key={`${identifier}-attribute-option-${i}`}
                                    value={c.value}
                                    data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-select-option-${c.value}`}
                                  >
                                    <span className="text-ui-fg-subtle">
                                      {c.label}
                                    </span>
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select>
                          ) : (
                            <DisabledField
                              label={
                                attributeOptions?.find(
                                  (ao) => ao.value === typedFieldRule.attribute
                                )?.label ?? ""
                              }
                              field={field}
                            />
                          )}
                        </Form.Control>
                        <Form.ErrorMessage data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-error`} />
                      </Form.Item>
                    )
                  }}
                />

                <div className="flex gap-2">
                  <Form.Field
                    name={`${scope}.${index}.operator`}
                    render={({ field }) => {
                      const { onChange, ref, ...fieldProps } = field

                      const currentAttributeOption = attributes?.find(
                        (attr) => attr.value === typedFieldRule.attribute
                      )

                      const options =
                        currentAttributeOption?.operators?.map((o, idx) => ({
                          label: o.label,
                          value: o.value,
                          key: `${identifier}-operator-option-${idx}`,
                        })) || []

                      const disabled =
                        !!typedFieldRule.attribute && options?.length <= 1

                      return (
                        <Form.Item className="basis-1/2" data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-item`}>
                          <Form.Control data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-control`}>
                            {!disabled ? (
                              <Select
                                dir={direction}
                                {...fieldProps}
                                value={fieldProps.value || undefined}
                                disabled={!typedFieldRule.attribute}
                                onValueChange={onChange}
                                data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-select`}
                              >
                                <Select.Trigger
                                  ref={ref}
                                  className="bg-ui-bg-base"
                                  data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-select-trigger`}
                                >
                                  <Select.Value placeholder="Select Operator" />
                                </Select.Trigger>

                                <Select.Content data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-select-content`}>
                                  {options?.map((c) => (
                                    <Select.Item key={c.key} value={c.value} data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-select-option-${c.value}`}>
                                      <span className="text-ui-fg-subtle">
                                        {c.label}
                                      </span>
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select>
                            ) : (
                              <DisabledField
                                label={
                                  options.find(
                                    (o) => o.value === fieldProps.value
                                  )?.label || ""
                                }
                                field={field}
                              />
                            )}
                          </Form.Control>
                          <Form.ErrorMessage data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-error`} />
                        </Form.Item>
                      )
                    }}
                  />

                  <RuleValueFormField
                    form={form}
                    identifier={identifier}
                    scope={scope}
                    name={`${scope}.${index}.values`}
                    operator={`${scope}.${index}.operator`}
                    fieldRule={typedFieldRule}
                    attributes={attributes ?? []}
                    ruleType={ruleType}
                    applicationMethodTargetType={applicationMethodTargetType}
                  />
                </div>
              </div>

              <div className="size-7 flex-none self-center">
                {!typedFieldRule.required && (
                  <IconButton
                    size="small"
                    variant="transparent"
                    className="text-ui-fg-muted"
                    type="button"
                    onClick={() => {
                      if (!typedFieldRule.required && typedFieldRule.id && typedFieldRule.attribute) {
                        const ruleToRemove: RuleToRemove = {
                          id: typedFieldRule.id,
                          attribute: typedFieldRule.attribute,
                          disguised: typedFieldRule.disguised,
                        }
                        if (setRulesToRemove) {
                          const existingIds = new Set((rulesToRemove || []).map((r) => r.id))
                          if (!existingIds.has(ruleToRemove.id)) {
                            setRulesToRemove([...(rulesToRemove || []), ruleToRemove])
                          }
                        }
                      }
                      remove(index)
                    }}
                    data-testid={`rules-form-field-rule-${ruleType}-${index}-remove-button`}
                  >
                    <XMarkMini />
                  </IconButton>
                )}
              </div>
            </div>

            {index < fields.length - 1 && (
              <div className="relative px-6 py-3" data-testid={`rules-form-field-rule-${ruleType}-${index}-separator`}>
                <div className="border-ui-border-strong absolute bottom-0 left-[40px] top-0 z-[-1] w-px bg-[linear-gradient(var(--border-strong)_33%,rgba(255,255,255,0)_0%)] bg-[length:1px_3px] bg-repeat-y"></div>

                <Badge size="2xsmall" className=" text-xs" data-testid={`rules-form-field-rule-${ruleType}-${index}-and-badge`}>
                  {t("promotions.form.and")}
                </Badge>
              </div>
            )}
          </Fragment>
        )
      })}

      <div className={fields.length ? "mt-6" : ""} data-testid={`rules-form-field-actions-${ruleType}`}>
        <Button
          type="button"
          variant="secondary"
          className="inline-block"
          onClick={() => {
            const newRule: FormRule = {
              attribute: "",
              operator: "" as PromotionRuleOperatorValues,
              values: [],
              required: false,
            }
            append(newRule)
          }}
          data-testid={`rules-form-field-add-condition-button-${ruleType}`}
        >
          {t("promotions.fields.addCondition")}
        </Button>

        {!!fields.length && (
          <Button
            type="button"
            variant="transparent"
            className="text-ui-fg-muted hover:text-ui-fg-subtle ml-2 inline-block"
            onClick={() => {
              const typedFields = fields as FormRule[]
              const indicesToRemove = typedFields
                .map((field, index) => (field.required ? null : index))
                .filter((f): f is number => f !== null)

              const rulesToRemoveFromFields: RuleToRemove[] = typedFields
                .filter((field): field is FormRule & { id: string; attribute: string } => 
                  !field.required && !!field.id && !!field.attribute
                )
                .map((field) => ({
                  id: field.id,
                  attribute: field.attribute,
                  disguised: field.disguised,
                }))

              if (setRulesToRemove) {
                // Merge with existing rulesToRemove, avoiding duplicates
                const existingIds = new Set((rulesToRemove || []).map((r) => r.id))
                const newRulesToRemove = rulesToRemoveFromFields.filter((r) => !existingIds.has(r.id))
                setRulesToRemove([...(rulesToRemove || []), ...newRulesToRemove])
              }
              remove(indicesToRemove)
            }}
            data-testid={`rules-form-field-clear-all-button-${ruleType}`}
          >
            {t("promotions.fields.clearAll")}
          </Button>
        )}
      </div>
    </div>
  )
}

type DisabledAttributeProps = {
  label: string
  field: Partial<ControllerRenderProps<FieldValues>>
}

/**
 * Render this if an attribute is disabled, or
 * if there is only one option available.
 */
const DisabledField = forwardRef<HTMLInputElement, DisabledAttributeProps>(
  ({ label, field }, ref) => {
    return (
      <div>
        <div className="txt-compact-small bg-ui-bg-component shadow-borders-base text-ui-fg-base h-8 rounded-md px-2 py-1.5">
          {label}
        </div>
        <input {...field} ref={ref} disabled hidden />
      </div>
    )
  }
)

DisabledField.displayName = "DisabledField"
