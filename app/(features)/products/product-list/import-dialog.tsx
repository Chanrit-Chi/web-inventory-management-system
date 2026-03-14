"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { BaseDialog } from "@/components/dialog-template";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileUp,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";

interface ImportResults {
  success: number;
  updated: number;
  failed: number;
  errors: string[];
}

interface ImportProductDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onImportSuccess?: () => void;
}

export function ImportProductDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportProductDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResults(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import products");
      }

      const data: ImportResults = await response.json();
      setResults(data);

      if (data.success > 0 || data.updated > 0) {
        toast.success("Import completed", {
          description: `Successfully imported ${data.success} new products and updated ${data.updated} existing ones.`,
        });
        onImportSuccess?.();
      } else if (data.failed > 0) {
        toast.error("Import failed", {
          description:
            "No products were imported. Check the errors for details.",
        });
      }
    } catch (error: unknown) {
      toast.error("Import error", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during import.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setFile(null);
      setResults(null);
      setIsImporting(false);
    }, 300);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleClose}
      title="Import Products"
      description="Upload an Excel or CSV file to bulk import or update products."
      className="sm:max-w-md"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="min-w-24"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing
                </>
              ) : (
                "Start Import"
              )}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 py-4">
        {results === null ? (
          <>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <FileUp className="h-10 w-10 text-muted-foreground" />
                {file ? (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span>{file.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      {isDragActive
                        ? "Drop the file here"
                        : "Click or drag file to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      XLSX, XLS or CSV files only
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-muted/50 p-3 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">
                    Multiple Variants Support:
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Group variants using the same <strong>productSku</strong>.
                    Each row represents a variant with its own{" "}
                    <strong>variantSku</strong> and attributes (Color, Size,
                    etc.).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-1 border-t border-muted/50 pt-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Download Template:
                </span>
                <a
                  href="/templates/product-import-template.xlsx"
                  download
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Excel (.xlsx)
                </a>
                <a
                  href="/templates/product-import-template.csv"
                  download
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  CSV (.csv)
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <span className="text-xl font-bold text-green-700 dark:text-green-400">
                  {results.success}
                </span>
                <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-500">
                  New
                </span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <span className="text-xl font-bold text-blue-700 dark:text-blue-400">
                  {results.updated}
                </span>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-500">
                  Updated
                </span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <span className="text-xl font-bold text-red-700 dark:text-red-400">
                  {results.failed}
                </span>
                <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-500">
                  Failed
                </span>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Error Details:
                </p>
                <div className="max-h-40 overflow-y-auto rounded-md border text-xs divide-y">
                  {results.errors.map((err, i) => (
                    <div
                      key={`error-${i}-${err.substring(0, 20)}`}
                      className="p-2 text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-900/10"
                    >
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-foreground">
                Import process finalized.
              </p>
            </div>
          </div>
        )}
      </div>
    </BaseDialog>
  );
}
