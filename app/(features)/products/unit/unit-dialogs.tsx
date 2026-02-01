import { Unit, UnitCreate, UnitUpdate } from "@/schemas/type-export.schema";

import { toast } from "sonner";

import {
  ConfirmDialog,
  FormDialog,
  ViewDialog,
} from "@/components/dialog-template";
import { useGetUnitById, useUnitMutations } from "@/hooks/useUnit";
import { UnitCreateSchema, UnitUpdateSchema } from "@/schemas/unit.schema";

// Create Category Dialog
export function CreateUnitDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { addUnit } = useUnitMutations();

  const handleSubmit = async (data: UnitCreate) => {
    try {
      await addUnit.mutateAsync(data);
      toast.success("Unit created successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create unit");
      console.error(error);
    }
  };

  return (
    <FormDialog<typeof UnitCreateSchema>
      open={open}
      onOpenChange={onOpenChange}
      title="Create Unit"
      description="Add a new unit to your inventory"
      schema={UnitCreateSchema}
      fields={[
        {
          name: "name",
          label: "Name",
          placeholder: "Enter unit name",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          placeholder: "Enter unit description",
        },
      ]}
      defaultValues={{
        name: "",
      }}
      onSubmit={handleSubmit}
      submitLabel="Create"
      isSubmitting={addUnit.isPending}
    />
  );
}

// View Unit Dialog
export function ViewUnitDialog({
  unit,
  open,
  onOpenChange,
}: {
  readonly unit: Unit;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <ViewDialog<Unit>
      open={open}
      onOpenChange={onOpenChange}
      title="View Unit"
      description="Unit details and information"
      item={unit}
      fields={[
        {
          label: "Name",
          value: (unit) => unit.name,
        },
        {
          label: "Description",
          value: (unit) => unit.description || "N/A",
        },
        {
          label: "Created At",
          value: (unit) => new Date(unit.createdAt).toLocaleString(),
        },
        {
          label: "Updated At",
          value: (unit) => new Date(unit.updatedAt).toLocaleString(),
        },
      ]}
    />
  );
}

// Update Unit Dialog
export function UpdateUnitDialog({
  unit,
  open,
  onOpenChange,
}: {
  readonly unit: Unit;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { updateUnit } = useUnitMutations();
  const { data: unitData } = useGetUnitById(unit.id);

  const handleSubmit = async (data: UnitUpdate) => {
    try {
      await updateUnit.mutateAsync({ id: unit.id, data });
      toast.success("Unit updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update unit");
      console.error(error);
    }
  };

  return (
    <FormDialog<typeof UnitUpdateSchema>
      open={open}
      onOpenChange={onOpenChange}
      title="Update Unit"
      description="Make changes to the unit information"
      schema={UnitUpdateSchema}
      fields={[
        {
          name: "name",
          label: "Name",
          placeholder: "Enter unit name",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          placeholder: "Enter unit description",
        },
      ]}
      defaultValues={{
        name: unitData?.name || unit.name,
        description: unitData?.description || unit.description || "",
      }}
      onSubmit={handleSubmit}
      submitLabel="Updating"
      isSubmitting={updateUnit.isPending}
    />
  );
}

// Delete Unit Dialog
export function DeleteUnitDialog({
  unit,
  open,
  onOpenChange,
}: {
  readonly unit: Unit;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { deleteUnit } = useUnitMutations();
  const handleDelete = async () => {
    try {
      await deleteUnit.mutateAsync(unit.id);
      toast.success("Unit deleted successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete unit");
      console.error(error);
    }
  };

  return (
    <ConfirmDialog<Unit>
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Unit"
      description="Are you sure you want to delete this unit? This action cannot be undone."
      item={unit}
      renderItem={(unit) => (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-semibold">Unit Name:</p>
          <p className="text-sm">{unit.name}</p>
          {unit.description && (
            <>
              <p className="text-sm font-semibold mt-2">Description:</p>
              <p className="text-sm">{unit.description}</p>
            </>
          )}
        </div>
      )}
      onConfirm={handleDelete}
      confirmLabel="Deleting"
      isLoading={deleteUnit.isPending}
    />
  );
}
