"use client";

type BadgeVariant =
  | "unbilled"
  | "to_do"
  | "in_progress"
  | "completed"
  | "invoiced"
  | "paid"
  | "draft"
  | "sent"
  | "default";

const variantStyles: Record<BadgeVariant, string> = {
  unbilled: "bg-gray-100 text-gray-600",
  to_do: "bg-slate-50 text-slate-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  invoiced: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  draft: "bg-gray-100 text-gray-500",
  sent: "bg-violet-50 text-violet-700",
  default: "bg-gray-100 text-gray-600",
};

const variantLabels: Record<string, string> = {
  unbilled: "Unbilled",
  to_do: "To-Do",
  in_progress: "In Progress",
  completed: "Completed",
  invoiced: "Invoiced",
  paid: "Paid",
  draft: "Draft",
  sent: "Sent",
};

interface BadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
}

export function Badge({ status, label, size = "md" }: BadgeProps) {
  const variant = (status as BadgeVariant) in variantStyles ? (status as BadgeVariant) : "default";
  const displayLabel = label ?? variantLabels[status] ?? status;
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${variantStyles[variant]}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          variant === "paid" || variant === "completed"
            ? "bg-green-500"
            : variant === "in_progress"
            ? "bg-amber-500"
            : variant === "to_do"
            ? "bg-slate-400"
            : variant === "invoiced" || variant === "sent"
            ? "bg-blue-500"
            : "bg-gray-400"
        }`}
      />
      {displayLabel}
    </span>
  );
}
