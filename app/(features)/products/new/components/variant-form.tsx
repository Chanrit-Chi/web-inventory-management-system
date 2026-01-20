import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function VariantForm() {
  return (
    <div className="w-full">
      <FieldGroup>
        <FieldSet>
          <RadioGroup
            defaultValue="single"
            className="flex sm:flex-col-1 gap-4"
          >
            <FieldLabel htmlFor="single">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Single Product</FieldTitle>
                  <FieldDescription>
                    A single product with fixed attributes.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="single" id="single" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="variable">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Variable Product</FieldTitle>
                  <FieldDescription>
                    A product with variable attributes.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="variable" id="variable" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </FieldSet>
      </FieldGroup>
    </div>
  );
}
