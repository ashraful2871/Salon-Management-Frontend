"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconTile } from "@/components/Shared/FeatureCard";
import { sendContactMessage } from "@/services/contact/sendContactMessage";

const LABEL = "mb-2 block text-sm font-medium text-foreground";

// A fresh key remounts the form, which is the only way to reset useActionState.
export default function ContactForm() {
  const [formKey, setFormKey] = useState(0);
  return (
    <ContactFormInner
      key={formKey}
      onReset={() => setFormKey((key) => key + 1)}
    />
  );
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
  const [state, formAction, isPending] = useActionState(
    sendContactMessage,
    null,
  );

  if (state?.success) {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <IconTile icon={CheckCircle2} className="bg-success-soft text-success" />
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Message sent{state.data?.ticketNumber ? ` — ticket #${state.data.ticketNumber}` : ""}
          </h3>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">
            Thanks, {state.values?.name}. We&apos;ll reply to{" "}
            <span className="font-medium text-foreground break-all">
              {state.values?.email}
            </span>
            .
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={onReset}>
          Send another message
        </Button>
      </div>
    );
  }

  const values = state?.values;

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <h3
          id="contact-form-title"
          className="font-display text-lg font-semibold text-foreground"
        >
          Send us a message
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We reply by email within 24 hours.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={LABEL}>
            Your name
          </label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={values?.name}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={LABEL}>
            Email
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={120}
            defaultValue={values?.email}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={LABEL}>
          Subject <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="contact-subject"
          name="subject"
          maxLength={120}
          defaultValue={values?.subject}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={LABEL}>
          Message
        </label>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={2000}
          placeholder="Tell us what you need help with"
          defaultValue={values?.message}
        />
      </div>

      {/* Honeypot: hidden from people, filled in by bots; the API rejects it. */}
      <input
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {state && !state.success && (
        <div
          role="alert"
          className="rounded-xl bg-danger-soft p-3 text-sm text-danger"
        >
          {state.message}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto"
        loading={isPending}
      >
        Send message
      </Button>
    </form>
  );
}
