import React, { ReactNode } from "react";
import { User, CreditCard, Info } from "lucide-react";

interface CustomerInfo {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface DocumentLayoutProps {
  title: string;
  documentNumber: string;
  date: string;
  dueDate?: string;
  statusBadge: ReactNode;
  customer: CustomerInfo;
  paymentMethod?: string | null;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  children: ReactNode;
  notes?: string | null;
  terms?: string | null;
}

export function DocumentLayout({
  title,
  documentNumber,
  date,
  dueDate,
  statusBadge,
  customer,
  paymentMethod,
  subtotal,
  discountPercent,
  discountAmount,
  taxPercent,
  taxAmount,
  totalAmount,
  children,
  notes,
  terms,
}: Readonly<DocumentLayoutProps>) {
  return (
    <div className="bg-white text-slate-900 border border-slate-200">
      {/* Document Header */}
      <div className="p-8 border-b-2 border-slate-900">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic bg-primary text-white px-2 py-1 inline-block">
              {title}
            </h1>
            <div className="flex flex-col gap-1 mt-4">
              <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">
                Document Number
              </p>
              <p className="font-mono font-bold text-lg text-slate-900">
                {documentNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-4 w-full sm:w-auto">
            <div className="flex flex-col items-start sm:items-end">
              {statusBadge}
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-col gap-x-8 gap-y-2 text-sm sm:text-right">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  Issue Date
                </p>
                <p className="font-semibold text-slate-900">{date}</p>
              </div>
              {dueDate && (
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    Due Date
                  </p>
                  <p className="font-bold text-red-600">{dueDate}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Customer Info */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
            <User className="h-4 w-4 text-slate-600" />
            <h2 className="text-xs uppercase font-black tracking-widest text-slate-500">
              Bill To
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-xl tracking-tight">
                {customer.name}
              </p>
              {customer.email && (
                <p className="text-sm text-slate-600 font-medium">
                  {customer.email}
                </p>
              )}
              {customer.phone && (
                <p className="text-sm text-slate-600 font-medium">
                  {customer.phone}
                </p>
              )}
            </div>
            {customer.address && (
              <div className="text-sm text-slate-600 leading-relaxed font-medium">
                {customer.address}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        {children}

        {/* Financial Summary */}
        <div className="flex flex-col sm:flex-row justify-between gap-8 pt-8 border-t border-slate-200">
          <div className="flex-1 max-w-md space-y-6">
            {paymentMethod && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">
                    Payment Method
                  </span>
                </div>
                <p className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg inline-block border border-slate-200">
                  {paymentMethod}
                </p>
              </div>
            )}

            {(notes || terms) && (
              <div className="space-y-4">
                {notes && (
                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex gap-3">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-blue-500 tracking-widest">
                        Internal Notes
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {notes}
                      </p>
                    </div>
                  </div>
                )}
                {terms && (
                  <div className="space-y-1 px-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      Terms & Conditions
                    </p>
                    <p className="text-xs text-slate-500 italic leading-relaxed">
                      {terms}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-full sm:max-w-xs space-y-3">
            <div className="bg-white border-2 border-slate-900 rounded-xl overflow-hidden">
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-700">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    <span className="font-bold">
                      Discount ({discountPercent}%)
                    </span>
                    <span className="font-bold">
                      -${discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">
                      Tax ({taxPercent}%)
                    </span>
                    <span className="font-bold text-slate-700">
                      +${taxAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-primary p-4 flex justify-between items-center text-white">
                <span className="text-xs uppercase font-black tracking-widest opacity-80">
                  Total Due
                </span>
                <span className="text-2xl font-black italic">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center border-t border-slate-100 pt-8 opacity-50">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-900">
            Thank you for your order
          </p>
        </div>
      </div>
    </div>
  );
}
