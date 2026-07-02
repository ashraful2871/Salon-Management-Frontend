"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  ArrowRight,
  Building2,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
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
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { ownerApplyForm } from "@/services/become-a-salone-woner/wonerApplyForm";

function Step({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
        <span className="text-primary font-semibold text-sm">{number}</span>
      </div>
      <div>
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

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

const ApplyForm = () => {
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
    <section id="apply" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Application Form
            </span>

            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Apply to become a salon owner
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Fill the form below. We typically respond within 24–48 hours on
              business days.
            </p>
          </div>

          {/* <Alert className="mb-6 border border-border bg-card">
              <AlertTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Login required
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                You must be logged in to submit the application. You can still
                fill the form, but submission will be disabled until you login.
              </AlertDescription>
            </Alert> */}

          {/* {serverMsg && (
            <Alert className="mb-6 border border-border bg-card">
              <AlertTitle>Update</AlertTitle>
              <AlertDescription>{serverMsg}</AlertDescription>
            </Alert>
          )} */}

          <div className="grid gap-8 lg:grid-cols-5">
            {/* left info (like contact left column steps) */}
            <div className="lg:col-span-2 space-y-6 animate-slide-up">
              <Card className="bg-card border border-border shadow-soft">
                <CardHeader>
                  <CardTitle>How it works</CardTitle>
                  <CardDescription>
                    Simple steps to become a verified partner.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Step
                    number="1"
                    title="Fill your business info"
                    desc="Provide salon details and services."
                  />
                  <Step
                    number="2"
                    title="Upload verification"
                    desc="Trade license/NID/business papers."
                  />
                  <Step
                    number="3"
                    title="Get approved and go live"
                    desc="Start receiving bookings & reviews."
                  />
                </CardContent>
              </Card>

              <Card className="bg-card border border-border shadow-soft">
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
            </div>

            {/* form */}
            <Card className="lg:col-span-3 bg-card border border-border shadow-card animate-scale-in">
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

                  {/* submit */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      disabled={isPending}
                    >
                      {isPending ? "Submitting..." : "Submit Application"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    <Badge
                      variant="secondary"
                      className="border border-border bg-background"
                    >
                      {/* {isAuthed ? "Logged in ✅" : "Not logged in ❗"} */}
                    </Badge>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* preview (optional, matches your style) */}
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <Card className="bg-card border border-border shadow-soft lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Application preview
                </CardTitle>
                <CardDescription>
                  What we’ll review for verification.
                </CardDescription>
              </CardHeader>
              {/* <CardContent className="space-y-3 text-sm">
                <PreviewRow label="Business Name" value={watch.businessName} />
                <PreviewRow label="Phone" value={watch.businessPhone} />
                <PreviewRow label="Email" value={watch.businessEmail} />
                <PreviewRow label="Address" value={watch.businessAddress} />
                <Separator />
                <PreviewRow
                  label="Document URL"
                  value={watch.documentUrl}
                  mono
                />
              </CardContent> */}
            </Card>

            <Card className="bg-card border border-border shadow-soft">
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
        </div>
      </div>
    </section>
  );
};

export default ApplyForm;
