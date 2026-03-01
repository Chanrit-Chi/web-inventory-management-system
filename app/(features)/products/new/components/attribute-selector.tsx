import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface AttributeValue {
  id: number;
  value: string;
  displayValue: string;
}

interface Attribute {
  id: number;
  name: string;
  displayName: string;
  values: AttributeValue[];
}

interface AttributeSelectionState {
  id: string;
  attributeId: number | null;
  selectedValueIds: number[];
}

interface AttributeSelectorProps {
  readonly attributes: Attribute[];
  readonly selectedAttributes: AttributeSelectionState[];
  readonly availableAttributes: Attribute[];
  readonly loadingAttributes: boolean;
  readonly onAddAttribute: () => void;
  readonly onRemoveAttribute: (id: string) => void;
  readonly onUpdateAttributeId: (id: string, attributeId: number) => void;
  readonly onToggleValueSelection: (attrId: string, valueId: number) => void;
}

export function AttributeSelector({
  attributes,
  selectedAttributes,
  availableAttributes,
  loadingAttributes,
  onAddAttribute,
  onRemoveAttribute,
  onUpdateAttributeId,
  onToggleValueSelection,
}: AttributeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Select Variant Attributes
        </Label>
        <Button
          type="button"
          onClick={onAddAttribute}
          disabled={availableAttributes.length === 0}
          size="sm"
          variant="outline"
        >
          <Plus size={16} className="mr-1" />
          Add Attribute
        </Button>
      </div>

      {loadingAttributes ? (
        <div>Loading attributes...</div>
      ) : (
        selectedAttributes.map((attr) => {
          const selectedAttr = attributes.find(
            (a) => a.id === attr.attributeId,
          );
          return (
            <div
              key={attr.id}
              className="p-4 border border-border rounded-lg bg-muted/30 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Select
                  value={
                    attr.attributeId ? String(attr.attributeId) : undefined
                  }
                  onValueChange={(value) =>
                    onUpdateAttributeId(attr.id, Number.parseInt(value))
                  }
                >
                  <SelectTrigger className="flex-1 bg-background">
                    <SelectValue placeholder="Select attribute..." />
                  </SelectTrigger>
                  <SelectContent>
                    {attributes
                      .filter(
                        (a) =>
                          a.id === attr.attributeId ||
                          !selectedAttributes.some(
                            (sel) => sel.attributeId === a.id,
                          ),
                      )
                      .map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.displayName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => onRemoveAttribute(attr.id)}
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={18} />
                </Button>
              </div>

              {selectedAttr && (
                <div className="flex flex-wrap gap-2">
                  {selectedAttr.values.map((value) => (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => onToggleValueSelection(attr.id, value.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        attr.selectedValueIds.includes(value.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-foreground border border-border hover:border-primary"
                      }`}
                    >
                      {value.displayValue || value.value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {selectedAttributes.length === 0 && (
        <div className="p-6 border-2 border-dashed border-border rounded-lg text-center text-muted-foreground">
          Click &quot;Add Attribute&quot; to start creating variants
        </div>
      )}
    </div>
  );
}
