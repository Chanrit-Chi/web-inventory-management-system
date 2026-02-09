"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReactNode, useState, useEffect } from "react";
import { useForm, FieldValues, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ============================================
// Generic Base Dialog Component
// ============================================
interface BaseDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly className?: string;
}

export function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className = "sm:max-w-106.25",
}: BaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${className} max-h-[95vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Generic Form Field Configuration
// ============================================
export interface FormField<T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "password" | "number" | "textarea";
  rows?: number;
  description?: string;
}

// ============================================
// Generic Form Dialog Component
// ============================================
interface FormDialogProps<TSchema extends z.ZodType<FieldValues>> {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: ReactNode;
  readonly fields: FormField<z.infer<TSchema>>[];
  readonly schema: TSchema;
  readonly defaultValues?: Partial<z.infer<TSchema>>;
  readonly onSubmit: (data: z.infer<TSchema>) => Promise<void>;
  readonly submitLabel: string;
  readonly isSubmitting?: boolean;
  readonly className?: string;
}

export function FormDialog<TSchema extends z.ZodType<FieldValues>>({
  open,
  onOpenChange,
  title,
  description,
  fields,
  schema,
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  className,
}: FormDialogProps<TSchema>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<TSchema>>({
    resolver: (zodResolver as any)(schema),
    defaultValues: defaultValues as any,
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset(defaultValues as any);
    }
  }, [open, reset, defaultValues]);

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const renderField = (field: FormField<z.infer<TSchema>>) => {
    const commonProps = {
      id: field.name,
      ...register(field.name),
      placeholder: field.placeholder,
    };

    if (field.type === "textarea") {
      return (
        <textarea
          {...commonProps}
          rows={field.rows || 3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      );
    }

    return <Input {...commonProps} type={field.type || "text"} />;
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className={className}
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="generic-form" disabled={isSubmitting}>
            {isSubmitting ? `${submitLabel}...` : submitLabel}
          </Button>
        </>
      }
    >
      <form id="generic-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 py-4">
          {fields.map((field) => (
            <div key={field.name} className="grid gap-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </Label>
              {field.description && (
                <p className="text-xs text-muted-foreground -mt-1">
                  {field.description}
                </p>
              )}
              {renderField(field)}
              {errors[field.name] && (
                <p className="text-sm text-red-500">
                  {errors[field.name]?.message as string}
                </p>
              )}
            </div>
          ))}
        </div>
      </form>
    </BaseDialog>
  );
}

// ============================================
// Generic View Dialog Component
// ============================================
interface ViewField<T> {
  label: string;
  value: (item: T) => ReactNode;
}

interface ViewDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  fields: ViewField<T>[];
  item: T;
  className?: string;
}

export function ViewDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  fields,
  item,
  className,
}: ViewDialogProps<T>) {
  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className={className}
      footer={
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      <div className="grid gap-4 py-4">
        {fields.map((field, index) => (
          <div key={index} className="grid gap-2">
            <Label className="font-semibold">{field.label}</Label>
            <div className="text-sm">{field.value(item)}</div>
          </div>
        ))}
      </div>
    </BaseDialog>
  );
}

// ============================================
// Generic Confirmation Dialog Component
// ============================================
interface ConfirmDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  item: T;
  renderItem?: (item: T) => ReactNode;
  onConfirm: () => Promise<void>;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
  isLoading?: boolean;
  className?: string;
}

export function ConfirmDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  item,
  renderItem,
  onConfirm,
  confirmLabel = "Confirm",
  confirmVariant = "default",
  isLoading = false,
  className,
}: ConfirmDialogProps<T>) {
  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className={className}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? `${confirmLabel}ing...` : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="py-4">
        {renderItem ? (
          renderItem(item)
        ) : (
          <div className="rounded-lg bg-muted p-4">
            <pre className="text-sm">{JSON.stringify(item, null, 2)}</pre>
          </div>
        )}
      </div>
    </BaseDialog>
  );
}

// ============================================
// Hook for Dialog State Management
// ============================================
export function useDialog<T = unknown>() {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const openDialog = (item?: T) => {
    setSelectedItem(item || null);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setSelectedItem(null);
  };

  return {
    open,
    selectedItem,
    openDialog,
    closeDialog,
    setOpen,
  };
}
