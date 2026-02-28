"use client";

import { useState } from "react";
import { useAttributes, useAttributeMutations } from "@/hooks/useAttribute";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/dialog-template";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Palette,
  Type,
  List,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Attribute,
  AttributeType,
  AttributeValue,
} from "@/schemas/attribute.schema";
import { SharedLayout } from "@/components/shared-layout";

function AttributesPage() {
  const { data: attributes, isLoading } = useAttributes();
  const { can } = usePermission();
  const {
    createAttribute,
    updateAttribute,
    deleteAttribute,
    addValue,
    updateValue,
    deleteValue,
  } = useAttributeMutations();

  const [attrDialog, setAttrDialog] = useState(false);
  const [editAttrId, setEditAttrId] = useState<number | null>(null);
  const [attrForm, setAttrForm] = useState({
    name: "",
    displayName: "",
    type: "SELECT" as AttributeType,
    isRequired: false,
    sortOrder: 0,
  });

  const [valueDialog, setValueDialog] = useState(false);
  const [valueAttrId, setValueAttrId] = useState<number | null>(null);
  const [editValueId, setEditValueId] = useState<number | null>(null);
  const [valueForm, setValueForm] = useState({
    value: "",
    displayValue: "",
    colorHex: "",
    sortOrder: 0,
  });

  const [deleteAttrId, setDeleteAttrId] = useState<number | null>(null);
  const [deleteValueId, setDeleteValueId] = useState<number | null>(null);

  const openCreateAttr = () => {
    setEditAttrId(null);
    setAttrForm({
      name: "",
      displayName: "",
      type: "SELECT",
      isRequired: false,
      sortOrder: 0,
    });
    setAttrDialog(true);
  };

  const openEditAttr = (attr: Attribute) => {
    setEditAttrId(attr.id);
    setAttrForm({
      name: attr.name,
      displayName: attr.displayName,
      type: attr.type,
      isRequired: attr.isRequired,
      sortOrder: attr.sortOrder ?? 0,
    });
    setAttrDialog(true);
  };

  const handleSaveAttr = async () => {
    try {
      if (editAttrId) {
        await updateAttribute.mutateAsync({ id: editAttrId, ...attrForm });
        toast.success("Attribute updated");
      } else {
        await createAttribute.mutateAsync(attrForm);
        toast.success("Attribute created");
      }
      setAttrDialog(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save attribute",
      );
    }
  };

  const openAddValue = (attrId: number) => {
    setValueAttrId(attrId);
    setEditValueId(null);
    setValueForm({ value: "", displayValue: "", colorHex: "", sortOrder: 0 });
    setValueDialog(true);
  };

  const openEditValue = (attrId: number, val: AttributeValue) => {
    setValueAttrId(attrId);
    setEditValueId(val.id);
    setValueForm({
      value: val.value,
      displayValue: val.displayValue,
      colorHex: val.colorHex ?? "",
      sortOrder: val.sortOrder ?? 0,
    });
    setValueDialog(true);
  };

  const handleSaveValue = async () => {
    if (!valueAttrId) return;

    // Get current attribute to check its type
    const currentAttr = attributes?.find((a) => a.id === valueAttrId);
    const isColorType = currentAttr?.type === "COLOR";

    try {
      if (editValueId) {
        await updateValue.mutateAsync({
          id: editValueId,
          ...valueForm,
          colorHex: isColorType ? valueForm.colorHex || undefined : undefined,
        });
        toast.success("Value updated");
      } else {
        await addValue.mutateAsync({
          attributeId: valueAttrId,
          ...valueForm,
          colorHex: isColorType ? valueForm.colorHex || undefined : undefined,
        });
        toast.success("Value added");
      }
      setValueDialog(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save value",
      );
    }
  };

  const handleDeleteAttr = async () => {
    if (!deleteAttrId) return;

    try {
      await deleteAttribute.mutateAsync(deleteAttrId);
      toast.success("Attribute deleted");
      setDeleteAttrId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete attribute",
      );
    }
  };

  const handleDeleteValue = async () => {
    if (!deleteValueId) return;

    try {
      await deleteValue.mutateAsync(deleteValueId);
      toast.success("Value deleted");
      setDeleteValueId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete value",
      );
    }
  };

  const typeIcon = (type: string) => {
    if (type === "COLOR") return <Palette className="h-4 w-4 text-pink-500" />;
    if (type === "TEXT") return <Type className="h-4 w-4 text-blue-500" />;
    return <List className="h-4 w-4 text-indigo-500" />;
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attributes</h1>
          <p className="text-muted-foreground mt-1">
            Define product attributes like size, color, and material
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                onClick={openCreateAttr}
                disabled={!can("product:create")}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Attribute
              </Button>
            </span>
          </TooltipTrigger>
          {!can("product:create") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map((key) => (
            <div key={key} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && attributes?.length === 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Layers className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No attributes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create attributes like Size, Color, or Material to use in product
              variants.
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={openCreateAttr}
                    disabled={!can("product:create")}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Attribute
                  </Button>
                </span>
              </TooltipTrigger>
              {!can("product:create") && (
                <TooltipContent>No permission</TooltipContent>
              )}
            </Tooltip>
          </CardContent>
        </Card>
      )}

      {!isLoading && attributes && attributes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attributes.map((attr) => (
            <Card key={attr.id} className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {typeIcon(attr.type)}
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {attr.displayName}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">
                        {attr.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditAttr(attr)}
                            disabled={!can("product:update")}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!can("product:update") && (
                        <TooltipContent>No permission</TooltipContent>
                      )}
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteAttrId(attr.id)}
                            disabled={!can("product:delete")}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!can("product:delete") && (
                        <TooltipContent>No permission</TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {attr.type.toLowerCase()}
                  </Badge>
                  {attr.isRequired && (
                    <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200 border">
                      Required
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Values ({attr.values.length})
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => openAddValue(attr.id)}
                          disabled={!can("product:create")}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!can("product:create") && (
                      <TooltipContent>No permission</TooltipContent>
                    )}
                  </Tooltip>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-8">
                  {attr.values.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No values yet
                    </p>
                  ) : (
                    attr.values.map((val) => (
                      <div
                        key={val.id}
                        className="group flex items-center gap-1 bg-secondary rounded-full px-2.5 py-1 text-xs"
                      >
                        {attr.type === "COLOR" && val.colorHex && (
                          <span
                            className="h-3 w-3 rounded-full border border-border/50 shrink-0"
                            style={{ backgroundColor: val.colorHex }}
                          />
                        )}
                        <span>{val.displayValue || val.value}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex opacity-0 group-hover:opacity-100">
                              <button
                                className="ml-0.5 text-muted-foreground hover:text-foreground transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => openEditValue(attr.id, val)}
                                disabled={!can("product:update")}
                              >
                                <Pencil className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          </TooltipTrigger>
                          {!can("product:update") && (
                            <TooltipContent>No permission</TooltipContent>
                          )}
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex opacity-0 group-hover:opacity-100">
                              <button
                                className="text-destructive hover:text-destructive/80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setDeleteValueId(val.id)}
                                disabled={!can("product:delete")}
                              >
                                ×
                              </button>
                            </span>
                          </TooltipTrigger>
                          {!can("product:delete") && (
                            <TooltipContent>No permission</TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Attribute Dialog */}
      <Dialog open={attrDialog} onOpenChange={setAttrDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editAttrId ? "Edit Attribute" : "New Attribute"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Internal Name *</Label>
              <Input
                value={attrForm.name}
                onChange={(e) =>
                  setAttrForm({ ...attrForm, name: e.target.value })
                }
                placeholder="e.g. size"
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase, no spaces
              </p>
            </div>
            <div>
              <Label>Display Name *</Label>
              <Input
                value={attrForm.displayName}
                onChange={(e) =>
                  setAttrForm({ ...attrForm, displayName: e.target.value })
                }
                placeholder="e.g. Size"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={attrForm.type}
                onValueChange={(v) =>
                  setAttrForm({ ...attrForm, type: v as AttributeType })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELECT">Select (dropdown)</SelectItem>
                  <SelectItem value="COLOR">Color (with hex)</SelectItem>
                  <SelectItem value="TEXT">Text (free input)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Required</Label>
              <Switch
                checked={attrForm.isRequired}
                onCheckedChange={(v) =>
                  setAttrForm({ ...attrForm, isRequired: v })
                }
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                value={attrForm.sortOrder}
                onChange={(e) =>
                  setAttrForm({
                    ...attrForm,
                    sortOrder: Number(e.target.value),
                  })
                }
                type="number"
                className="mt-1 w-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttrDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAttr}
              disabled={createAttribute.isPending || updateAttribute.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Value Dialog */}
      <Dialog open={valueDialog} onOpenChange={setValueDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editValueId ? "Edit Value" : "Add Value"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Internal Value *</Label>
              <Input
                value={valueForm.value}
                onChange={(e) =>
                  setValueForm({ ...valueForm, value: e.target.value })
                }
                placeholder="e.g. medium"
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div>
              <Label>Display Value *</Label>
              <Input
                value={valueForm.displayValue}
                onChange={(e) =>
                  setValueForm({ ...valueForm, displayValue: e.target.value })
                }
                placeholder="e.g. Medium"
                className="mt-1"
              />
            </div>
            {/* Only show color hex field for COLOR type attributes */}
            {attributes?.find((a) => a.id === valueAttrId)?.type ===
              "COLOR" && (
              <div>
                <Label>Color Hex *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={valueForm.colorHex}
                    onChange={(e) =>
                      setValueForm({ ...valueForm, colorHex: e.target.value })
                    }
                    placeholder="#3B82F6"
                    className="font-mono text-sm"
                  />
                  {valueForm.colorHex && (
                    <div
                      className="h-9 w-9 rounded-lg border border-border shrink-0"
                      style={{ backgroundColor: valueForm.colorHex }}
                    />
                  )}
                  <input
                    type="color"
                    value={valueForm.colorHex || "#000000"}
                    onChange={(e) =>
                      setValueForm({ ...valueForm, colorHex: e.target.value })
                    }
                    className="h-9 w-9 rounded cursor-pointer border border-border"
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Sort Order</Label>
              <Input
                value={valueForm.sortOrder}
                onChange={(e) =>
                  setValueForm({
                    ...valueForm,
                    sortOrder: Number(e.target.value),
                  })
                }
                type="number"
                className="mt-1 w-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValueDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveValue}
              disabled={addValue.isPending || updateValue.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Attr */}
      <ConfirmDialog
        open={deleteAttrId !== null}
        onOpenChange={() => setDeleteAttrId(null)}
        title="Delete Attribute"
        description="This will delete the attribute and all its values permanently. Note: You can only delete attributes that are not linked to any products."
        item={null}
        renderItem={() => (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              All attribute values will be permanently deleted.
            </AlertDescription>
          </Alert>
        )}
        onConfirm={handleDeleteAttr}
        confirmLabel="Deleting"
        isLoading={deleteAttribute.isPending}
      />

      {/* Delete Value */}
      <ConfirmDialog
        open={deleteValueId !== null}
        onOpenChange={() => setDeleteValueId(null)}
        title="Delete Value"
        description="This will delete this attribute value. This action cannot be undone."
        item={null}
        renderItem={() => null}
        onConfirm={handleDeleteValue}
        confirmLabel="Deleting"
        isLoading={deleteValue.isPending}
      />
    </div>
  );
}

export default function AttributesPageWrapper() {
  return (
    <SharedLayout>
      <AttributesPage />
    </SharedLayout>
  );
}
