import CopyButton from "@/components/Wallet/CopyButton";
import { cn } from "@/lib/utils";

/** `01712345789` → `017•••••789`. */
export const maskPhone = (phone: string) => {
  const value = phone.trim();
  if (value.length <= 6) return "•".repeat(value.length);
  return `${value.slice(0, 3)}${"•".repeat(value.length - 6)}${value.slice(-3)}`;
};

/** `rafi@gmail.com` → `ra•••@gmail.com`. */
export const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  if (!domain) return maskPhone(email);
  return `${local.slice(0, 2)}•••@${domain}`;
};

/**
 * A phone or email shown masked, for viewers without `users.view_pii` or who
 * simply do not need the whole value. The API masks too; this is for values
 * it already sent whole.
 */
export function MaskedValue({
  value,
  kind,
  className,
}: {
  value: string | null | undefined;
  kind: "phone" | "email";
  className?: string;
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const masked = kind === "email" ? maskEmail(value) : maskPhone(value);
  return (
    <span className={cn("tabular-nums", className)} title="Masked">
      {masked}
    </span>
  );
}

/** A short monospace id (first 8 characters) with a button that copies the whole id. */
export function CopyId({
  id,
  label = "ID",
  className,
}: {
  id: string;
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <code className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-xs" title={id}>
        {id.length > 12 ? id.slice(0, 8) : id}
      </code>
      <CopyButton value={id} label={label} />
    </span>
  );
}
