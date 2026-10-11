import { CreditCard, Mail, Scissors, Sparkles, type LucideIcon } from "lucide-react";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { formatDhaka } from "@/components/Admin/Timeline";
import type { HealthLevel, SystemIntegrations } from "@/services/admin/system/types";
import { LEVEL_LABEL, LEVEL_TONE, relativeTime } from "./format";

function Card({
  icon: Icon,
  title,
  status,
  detail,
  children,
}: {
  icon: LucideIcon;
  title: string;
  status: HealthLevel;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 font-heading text-sm font-semibold">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {title}
        </h3>
        <ToneBadge status={status} tone={LEVEL_TONE[status]} dot>
          {LEVEL_LABEL[status]}
        </ToneBadge>
      </div>
      <p className="mt-2 text-sm">{detail}</p>
      {children && <div className="mt-2 space-y-1 text-xs text-muted-foreground">{children}</div>}
    </section>
  );
}

/** Email · Payments · Gemini · Try-on, each OK / Warning / Down with one line. */
export function IntegrationCards({ data, nowMs }: { data: SystemIntegrations; nowMs: number }) {
  const { email, payments, gemini, tryOn } = data;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card icon={Mail} title="Email" status={email.status} detail={email.detail}>
        {email.lastError && (
          <p className="break-words">
            Last error {relativeTime(email.lastFailureAt, nowMs)}: {email.lastError}
          </p>
        )}
      </Card>
      <Card icon={CreditCard} title="Payments" status={payments.status} detail={payments.detail}>
        {payments.providers.map((p) => (
          <p key={p.provider}>
            <span className="font-medium text-foreground">{p.label}</span>{" "}
            {p.enabled ? p.mode : "off"} · last success{" "}
            {p.lastSuccessAt ? (
              <time dateTime={p.lastSuccessAt} title={formatDhaka(p.lastSuccessAt)}>
                {relativeTime(p.lastSuccessAt, nowMs)}
              </time>
            ) : (
              "never"
            )}
            {p.stuck > 0 && <span className="text-danger"> · {p.stuck} stuck</span>}
            {p.tokenExpiresAt && <> · token {relativeTime(p.tokenExpiresAt, nowMs)}</>}
          </p>
        ))}
      </Card>
      <Card icon={Sparkles} title="Gemini" status={gemini.status} detail={gemini.detail}>
        {gemini.models.map((m) => (
          <p key={m.model} className="break-words">
            <span className="font-mono">{m.model}</span>
            {m.coolingDown ? <span className="text-warning"> · cooling down</span> : " · ready"}
            {m.lastFailureAt && <> · last failure {relativeTime(m.lastFailureAt, nowMs)}</>}
          </p>
        ))}
      </Card>
      <Card icon={Scissors} title="Try-on" status={tryOn.status} detail={tryOn.detail} />
    </div>
  );
}
