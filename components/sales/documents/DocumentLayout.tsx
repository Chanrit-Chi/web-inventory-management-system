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
    <div className="bg-white text-slate-900 border border-slate-200 min-h-[296mm] w-[210mm] mx-auto flex flex-col shadow-sm print:shadow-none print:border-none relative box-border overflow-hidden print:overflow-visible">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      {/* Document Header - Static height */}
      <div className="p-8 border-b-2 border-slate-900 shrink-0">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic bg-primary text-white px-3 py-1 inline-block">
              {title}
            </h1>
            <div className="flex flex-col gap-0.5 mt-4">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                Document Number
              </p>
              <p className="font-mono font-bold text-lg text-slate-900">
                {documentNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-4 w-full sm:w-auto">
            <div className="flex flex-col items-start sm:items-end scale-100 origin-right">
              {statusBadge}
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-col gap-x-6 gap-y-2 text-xs sm:text-right">
              <div>
                <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                  Issue Date
                </p>
                <p className="font-semibold text-slate-900">{date}</p>
              </div>
              {dueDate && (
                <div>
                  <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                    Due Date
                  </p>
                  <p className="font-bold text-red-600">{dueDate}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Expands to fill A4 */}
      <div className="px-8 py-6 flex-grow flex flex-col overflow-hidden print:overflow-visible">
        {/* Customer Info - Static */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 shrink-0">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-1.5">
            <User className="h-3.5 w-3.5 text-slate-600" />
            <h2 className="text-[10px] uppercase font-black tracking-widest text-slate-500">
              Bill To
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900 text-xl tracking-tight">
                {customer.name}
              </p>
              <div className="flex flex-col text-xs text-slate-600 font-medium">
                {customer.email && <span>{customer.email}</span>}
                {customer.phone && <span>{customer.phone}</span>}
              </div>
            </div>
            {customer.address && (
              <div className="text-xs text-slate-600 leading-relaxed font-medium">
                {customer.address}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table - This container grows to push the summary down */}
        <div className="flex-grow mb-6 overflow-hidden print:overflow-visible">
          {children}
        </div>

        {/* Bottom Section - Pushed to the bottom of the growable area */}
        <div className="mt-auto shrink-0 pb-2">
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between gap-8">
            <div className="flex-1 max-w-md space-y-6">
              {paymentMethod && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span className="text-[9px] uppercase font-bold tracking-widest">
                      Payment Method
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg inline-block border border-slate-200 text-sm">
                    {paymentMethod}
                  </p>
                </div>
              )}

              {(notes || terms) && (
                <div className="space-y-4">
                  {notes && (
                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 flex gap-3">
                      <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-bold text-blue-500 tracking-widest leading-none">
                          Internal Notes
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {notes}
                        </p>
                      </div>
                    </div>
                  )}
                  {terms && (
                    <div className="space-y-1.5 px-1">
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                        Terms & Conditions
                      </p>
                      <p className="text-[10px] text-slate-500 italic leading-relaxed">
                        {terms}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full sm:max-w-[280px] space-y-3">
              <div className="bg-white border border-slate-900 rounded-xl overflow-hidden shadow-lg shadow-slate-200/50">
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Subtotal</span>
                    <span className="font-black text-slate-700">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                      <span className="font-bold uppercase tracking-wider text-[9px]">
                        Discount ({discountPercent}%)
                      </span>
                      <span className="font-black">
                        -${discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {taxAmount > 0 && (
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                        Tax ({taxPercent}%)
                      </span>
                      <span className="font-black text-slate-700">
                        +${taxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-primary p-4 flex justify-between items-center text-white">
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80">
                    Total Due
                  </span>
                  <span className="text-2xl font-black italic tracking-tighter">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Pushed to the absolute bottom */}
          <div className="mt-8 text-center border-t border-slate-100 pt-4">
            <p className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-400">
              Thank you for your order
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
