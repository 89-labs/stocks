import { cn } from "@/lib/utils";

export function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  hint,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-heading">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none",
          "focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-input-bg"
        )}
      />
      {hint && <p className="mt-1 text-xs text-neutral-secondary">{hint}</p>}
    </div>
  );
}
