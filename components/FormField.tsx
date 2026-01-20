import { Label } from "./ui/label";

interface FormFieldProps {
  readonly label: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly children: React.ReactNode;
}

export function FormField({
  label,
  required,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col p-2">
      <Label className="mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
