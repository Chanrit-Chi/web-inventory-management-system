import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
              className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3"
            >
              <div className="flex items-center gap-3">
                <select
                  value={attr.attributeId || ""}
                  onChange={(e) =>
                    onUpdateAttributeId(
                      attr.id,
                      Number.parseInt(e.target.value),
                    )
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select attribute...</option>
                  {attributes
                    .filter(
                      (a) =>
                        a.id === attr.attributeId ||
                        !selectedAttributes.some(
                          (sel) => sel.attributeId === a.id,
                        ),
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.displayName}
                      </option>
                    ))}
                </select>
                <Button
                  type="button"
                  onClick={() => onRemoveAttribute(attr.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                          : "bg-white text-gray-700 border border-gray-300 hover:border-primary"
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
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
          Click &quot;Add Attribute&quot; to start creating variants
        </div>
      )}
    </div>
  );
}
