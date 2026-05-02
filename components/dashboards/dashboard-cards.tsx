"use client";

import React from "react";
import { CreditCard, LucideIcon, Wallet } from "lucide-react";
import { OrderWithRelations } from "@/schemas/type-export.schema";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

// ── Utilities ────────────────────────────────────────────────────────────────

export function fmtCurrency(val: number) {
  return `$${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── DashboardHeroCard ───────────────────────────────────────────────────────

interface DashboardHeroCardProps {
  readonly title: string;
  readonly value: number | string;
  readonly icon: LucideIcon;
  readonly footerText?: string;
  readonly bgClass: string;
  readonly delay?: number;
  readonly isCurrency?: boolean;
}

export function DashboardHeroCard({
  title,
  value,
  icon: Icon,
  footerText,
  bgClass,
  delay = 0,
  isCurrency = true,
}: DashboardHeroCardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(value.toString());
  const animValue = useCountUp(numericValue);

  return (
    <div
      className={cn(
        "animate-dash-enter relative overflow-hidden rounded-xl p-6 min-h-30 flex flex-col justify-between",
        bgClass
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-col justify-center z-10">
        <h3 className="text-sm font-medium text-neutral-50/90 uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-2xl text-white font-bold tracking-tight">
          {isCurrency ? fmtCurrency(animValue) : animValue}
        </p>
      </div>
      {footerText && (
        <div className="z-10 mt-auto">
          <p className="text-[10px] bg-white/20 text-white w-max px-2 py-0.5 rounded-full backdrop-blur-sm">
            {footerText}
          </p>
        </div>
      )}
      <Icon className="absolute -right-4 -top-4 h-24 w-24 text-white/15 rotate-12" />
    </div>
  );
}

// ── DashboardDetailCard ─────────────────────────────────────────────────────

interface DashboardDetailCardProps {
  readonly title: string;
  readonly value: number;
  readonly icon: LucideIcon;
  readonly footerLabel: string;
  readonly footerValue: string | number;
  readonly href?: string;
  readonly hrefLabel?: string;
  readonly colorClass: string;
  readonly separatorClass: string;
  readonly delay?: number;
  readonly isCurrency?: boolean;
}

export function DashboardDetailCard({
  title,
  value,
  icon: Icon,
  footerLabel,
  footerValue,
  href,
  hrefLabel,
  colorClass,
  separatorClass,
  delay = 0,
  isCurrency = true,
}: DashboardDetailCardProps) {
  const animValue = useCountUp(value);

  return (
    <div
      className="animate-dash-enter bg-card aspect-auto rounded-xl p-6 border"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className={cn("text-2xl font-bold", colorClass)}>
              {isCurrency ? fmtCurrency(animValue) : animValue}
            </p>
          </div>
          <Icon className={cn("h-12 w-12", colorClass)} />
        </div>
        <Separator className={cn("my-2", separatorClass)} />
        <div className="flex justify-between items-center">
          <p className={cn("text-xs bg-neutral-50 dark:bg-neutral-800 w-max px-2 rounded-full mt-1", colorClass)}>
            {footerValue} {footerLabel}
          </p>
          {href && (
            <Link href={href} className="text-xs underline">
              {hrefLabel || "View All"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DashboardCompactCard ────────────────────────────────────────────────────

interface DashboardCompactCardProps {
  readonly title: string;
  readonly value: number;
  readonly icon: LucideIcon;
  readonly colorClass: string;
  readonly iconBgClass: string;
  readonly detailLabel: string;
  readonly detailValue: string | number;
  readonly delay?: number;
  readonly borderClass?: string;
}

export function DashboardCompactCard({
  title,
  value,
  icon: Icon,
  colorClass,
  iconBgClass,
  detailLabel,
  detailValue,
  delay = 0,
  borderClass,
}: DashboardCompactCardProps) {
  const animValue = useCountUp(value);

  return (
    <div
      className={cn(
        "animate-dash-enter bg-card aspect-auto rounded-xl p-6 border",
        borderClass
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className={cn("text-2xl font-bold mt-1", colorClass)}>
              {animValue}
            </p>
          </div>
          <div className={cn("p-2 rounded-lg", iconBgClass)}>
            <Icon className={cn("h-5 w-5", colorClass)} />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">{detailLabel}</p>
          <p className={cn("text-sm font-semibold", colorClass)}>
            {detailValue}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── DashboardMetricCard ─────────────────────────────────────────────────────

interface DashboardMetricCardProps {
  readonly title: string;
  readonly value: number | string;
  readonly icon: LucideIcon;
  readonly colorClass: string;
  readonly iconBgClass: string;
  readonly borderClass: string;
  readonly hoverBorderClass: string;
  readonly delay?: number;
  readonly href?: string;
}

export function DashboardMetricCard({
  title,
  value,
  icon: Icon,
  colorClass,
  iconBgClass,
  borderClass,
  hoverBorderClass,
  delay = 0,
  href,
}: DashboardMetricCardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(value.toString());
  const animValue = useCountUp(isNaN(numericValue) ? 0 : numericValue);
  const displayValue = isNaN(numericValue) ? value : animValue;

  const content = (
    <div className="flex items-center gap-3">
      <div className={cn(
        "p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
        iconBgClass,
        borderClass
      )}>
        <Icon className={cn("h-5 w-5", colorClass)} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{title}</p>
        <p className={cn("text-2xl font-bold", colorClass.includes("text-") ? colorClass : "")}>
          {displayValue}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "animate-dash-enter bg-card rounded-xl border p-4 group transition-all duration-300 hover:shadow-md",
        borderClass,
        hoverBorderClass,
        href && "cursor-pointer"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {href ? <Link href={href}>{content}</Link> : content}
    </div>
  );
}

// ── Partial Payment Components ─────────────────────────────────────────────

export function usePartialPaymentStats(orders: OrderWithRelations[]) {
  const partialOrders = orders.filter(
    (o) =>
      o.invoice &&
      Number(o.invoice.amountPaid) > 0 &&
      Number(o.invoice.amountPaid) < Number(o.invoice.totalAmount),
  );
  const totalBalanceDue = partialOrders.reduce(
    (sum, o) =>
      sum + (Number(o.invoice!.totalAmount) - Number(o.invoice!.amountPaid)),
    0,
  );
  return { partialOrders, totalBalanceDue };
}

interface PartialPaymentHeroCardProps {
  readonly count: number;
  readonly totalBalanceDue: number;
  readonly delay?: number;
}

export function PartialPaymentHeroCard({
  count,
  totalBalanceDue,
  delay = 0,
}: PartialPaymentHeroCardProps) {
  return (
    <DashboardHeroCard
      title="Partial Payments"
      value={count}
      icon={CreditCard}
      footerText={`${fmtCurrency(totalBalanceDue)} outstanding`}
      bgClass="bg-[#7c3aed]"
      delay={delay}
      isCurrency={false}
    />
  );
}

interface PartialPaymentDetailCardProps {
  readonly count: number;
  readonly totalBalanceDue: number;
  readonly delay?: number;
}

export function PartialPaymentDetailCard({
  count,
  totalBalanceDue,
  delay = 0,
}: PartialPaymentDetailCardProps) {
  return (
    <DashboardDetailCard
      title="Partial Payments"
      value={count}
      icon={Wallet}
      footerLabel="due"
      footerValue={fmtCurrency(totalBalanceDue)}
      href="/sales/invoice"
      hrefLabel="View Invoices"
      colorClass="text-violet-600 dark:text-violet-400"
      separatorClass="bg-violet-500 dark:bg-violet-400"
      delay={delay}
      isCurrency={false}
    />
  );
}

interface PartialPaymentCompactCardProps {
  readonly count: number;
  readonly totalBalanceDue: number;
  readonly delay?: number;
}

export function PartialPaymentCompactCard({
  count,
  totalBalanceDue,
  delay = 0,
}: PartialPaymentCompactCardProps) {
  return (
    <DashboardCompactCard
      title="Partial Payments"
      value={count}
      icon={Wallet}
      colorClass="text-violet-600 dark:text-violet-400"
      iconBgClass="bg-violet-100 dark:bg-violet-900/30"
      detailLabel="Balance Due"
      detailValue={fmtCurrency(totalBalanceDue)}
      delay={delay}
      borderClass="border-violet-200 dark:border-violet-800"
    />
  );
}
