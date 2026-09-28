"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Building2,
  FileText,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { ownerApplyForm } from "@/services/become-a-salone-woner/wonerApplyForm";
import type { UserRole } from "@/services/auth/auth-utils";
import { Section, SectionHeader } from "../Shared/Section";

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        <span className="inline-flex items-center gap-2">
          {icon ? <span>{icon}</span> : null}
          {label}
        </span>
      </label>
      {children}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

// Applications come from customer accounts: a guest signs in first, an owner
// already has a dashboard, and staff accounts can't apply.
function RoleNotice({ role }: { role?: UserRole }) {
  const card =
    "rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:col-span-3 lg:self-start";

  if (role === undefined) {
    return (
      <div className={card}>
        <h3 className="font-display text-lg font-semibold text-foreground">
          Sign in to apply
        </h3>
        <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
          Applications are tied to your account so we can reach you and set up
          your dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/login?redirect=/become-salon-owner">Sign in</Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/register?redirect=/become-salon-owner">
              Create an account
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (role === "SALON_OWNER") {
    return (
      <div className={card}>
        <h3 className="font-display text-lg font-semibold text-foreground">
          You already own a salon on SalonKhuji
        </h3>
        <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
          Manage your salons, services and bookings from your dashboard.
        </p>
        <Button asChild className="mt-6 w-full sm:w-auto">
          <Link href="/dashboard/store">Go to my salons</Link>
        </Button>
      </div>
    );
  }

  return (
    <p className={`${card} text-sm text-muted-foreground`}>
      Applications come from customer accounts. Staff and admin accounts
      can&apos;t apply.
    </p>
  );
}

const ApplyForm = ({ role }: { role?: UserRole }) => {
  const [state, formAction, isPending] = useActionState(ownerApplyForm, null);
  const formRef = useRef<HTMLFormElement>(null);
  const processedStateRef = useRef(state);

  useEffect(() => {
    if (!state || state === processedStateRef.current) return;
    processedStateRef.current = state;

    if (state.success) {
      toast.success(state.message || "Application submitted successfully!");
      formRef.current?.reset();
    } else {
      toast.error(state.message || "Failed to submit application.");
    }
  }, [state]);

  return (
    <Section id="apply" labelledBy="apply-heading">
      <SectionHeader
        align="center"
        overline="Application form"
        title="Apply to become a salon owner"
        titleId="apply-heading"
        description="Fill in the form below. We typically respond within 24–48 hours on business days."
      />

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
              <CardDescription>
                Common questions from salon owners.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    How long does verification take?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Usually 24–48 hours on business days, depending on
                    document clarity and completeness.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    What documents do you accept?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Trade license, NID, business registration, or other
                    proof of ownership/authorization.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    Do I need to be logged in to apply?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes. We require login to prevent spam and securely track
                    application status.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle>Tip</CardTitle>
              <CardDescription>Increase approval speed</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Upload a clear document and ensure business name/address match
              your verification papers.
            </CardContent>
          </Card>
        </div>

        {role === "CUSTOMER" ? (
          <Card className="border-border bg-surface lg:col-span-3">
          <CardHeader>
            <CardTitle>Business information</CardTitle>
            <CardDescription>
              Make sure details match your documents (NID/Trade
              License/etc).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form ref={formRef} action={formAction} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Business Name"
                  icon={<Building2 className="w-4 h-4 text-primary" />}
                >
                  <Input
                    id="businessName"
                    type="text"
                    name="businessName"
                    required
                    disabled={isPending}
                    autoComplete="organization"
                    placeholder="Glow & Go Salon"
                    className="h-12 border-gold"
                  />
                </Field>

                <Field
                  label="Business Phone"
                  icon={<Phone className="w-4 h-4 text-primary" />}
                >
                  <Input
                    id="businessPhone"
                    type="number"
                    name="businessPhone"
                    required
                    disabled={isPending}
                    autoComplete="tel"
                    placeholder="+8801712345678"
                    className="h-12 border-gold"
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Business Email"
                  icon={<Mail className="w-4 h-4 text-primary" />}
                >
                  <Input
                    id="businessEmail"
                    type="email"
                    name="businessEmail"
                    required
                    disabled={isPending}
                    autoComplete="email"
                    placeholder="owner@glowgosalon.com"
                    className="h-12 border-gold"
                  />
                </Field>

                <Field
                  label="Document URL"
                  icon={<FileText className="w-4 h-4 text-primary" />}
                >
                  <Input
                    id="documentUrl"
                    type="text"
                    name="documentUrl"
                    required
                    disabled={isPending}
                    autoComplete="url"
                    placeholder="https://example.com/docs/..."
                    className="h-12 border-gold"
                  />
                </Field>
              </div>

              <Field
                label="Business Address"
                icon={<MapPin className="w-4 h-4 text-primary" />}
              >
                <Input
                  id="businessAddress"
                  type="text"
                  name="businessAddress"
                  required
                  disabled={isPending}
                  autoComplete="street-address"
                  placeholder="House 12, Road 5, Banasree, Dhaka"
                  className="h-12 border-gold"
                />
              </Field>

              {/* agreement */}
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                {/* <Input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[color:var(--primary)]"
                  checked={watch.agree}
                  onChange={(e) =>
                    form.setValue("agree", e.target.checked, {
                      shouldValidate: true,
                    })
                  }
                /> */}
                <div className="text-sm">
                  <p className="font-semibold text-foreground">
                    I confirm the information is accurate
                  </p>
                  <p className="text-muted-foreground">
                    I agree to verification checks and understand false
                    information may lead to rejection.
                  </p>
                  {/* {form.formState.errors.agree?.message && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.agree?.message}
                    </p>
                  )} */}
                </div>
              </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    loading={isPending}
                  >
                    {isPending ? "Submitting..." : "Submit application"}
                  </Button>
            </form>
          </CardContent>
          </Card>
        ) : (
          <RoleNotice role={role} />
        )}
      </div>
    </Section>
  );
};

export default ApplyForm;
