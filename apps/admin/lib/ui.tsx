/**
 * Primitives UI usadas em todo o admin.
 * Estilo: Tailwind + tons stone + accent niver-600 (laranja queimado).
 */

import { clsx } from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// ===== Button =====

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
type ButtonSize = "sm" | "md" | "lg";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-niver-600 hover:bg-niver-700 text-white border-transparent",
  secondary: "bg-white hover:bg-stone-50 text-stone-800 border-stone-300",
  danger: "bg-red-50 hover:bg-red-100 text-red-700 border-red-200",
  ghost: "bg-transparent hover:bg-stone-100 text-stone-700 border-transparent",
  success: "bg-green-600 hover:bg-green-700 text-white border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "secondary", size = "md", className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        "border rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        buttonStyles[variant],
        sizeStyles[size],
        className,
      )}
    />
  );
}

// ===== Input =====

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      className={clsx(
        "w-full px-3 py-2 border rounded-lg text-sm bg-white",
        "focus:outline-none focus:ring-2 focus:ring-niver-500/30 focus:border-niver-500",
        invalid ? "border-red-300 bg-red-50/30" : "border-stone-300",
        className,
      )}
    />
  );
}

// ===== Textarea =====

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, ...rest }: TextareaProps) {
  return (
    <textarea
      {...rest}
      className={clsx(
        "w-full px-3 py-2 border rounded-lg text-sm bg-white resize-y leading-relaxed",
        "focus:outline-none focus:ring-2 focus:ring-niver-500/30 focus:border-niver-500",
        invalid ? "border-red-300 bg-red-50/30" : "border-stone-300",
        className,
      )}
    />
  );
}

// ===== Select =====

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <select
      {...rest}
      className={clsx(
        "px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white",
        "focus:outline-none focus:ring-2 focus:ring-niver-500/30 focus:border-niver-500",
        className,
      )}
    >
      {children}
    </select>
  );
}

// ===== Field (label + child + helper) =====

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode; // ex: char counter
}

export function Field({ label, hint, error, required, className, children, trailing }: FieldProps) {
  return (
    <label className={clsx("block", className)}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-stone-600 uppercase tracking-wide">
          {label} {required && <span className="text-red-600">*</span>}
        </span>
        {trailing}
      </div>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-stone-500">{hint}</p>
      ) : null}
    </label>
  );
}

// ===== Badge (status) =====

type BadgeTone = "neutral" | "amber" | "green" | "red" | "violet" | "blue" | "stone";

const badgeStyles: Record<BadgeTone, string> = {
  neutral: "bg-stone-100 text-stone-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-blue-100 text-blue-700",
  stone: "bg-stone-200 text-stone-800",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", badgeStyles[tone])}>
      {children}
    </span>
  );
}

// ===== Card (panel) =====

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("bg-white border border-stone-200 rounded-xl", className)}>
      {children}
    </div>
  );
}

// ===== Char counter helper =====

/**
 * Retorna tone do contador de chars baseado em range alvo + hard limit.
 * Ex: metaTitle ideal 54-60, hard max 60, soft min 50.
 */
export function charCounterTone(
  count: number,
  idealMin: number,
  idealMax: number,
  softMin: number = idealMin - 4,
  hardMax: number = idealMax,
): "green" | "amber" | "red" {
  if (count > hardMax) return "red";
  if (count < softMin) return "red";
  if (count < idealMin || count > idealMax) return "amber";
  return "green";
}
