"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useActionState } from "react";
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

function PreviewRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-muted-foreground">{label}</p>
      <p className={`text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}
// Mock useAuth hook
function useAuthMock() {
  const [loading] = React.useState(false);
  const [user] = React.useState<{
    id: string;
    name?: string;
    email?: string;
  } | null>({
    id: "user_123",
    name: "Admin",
    email: "admin@example.com",
  });
  return { user, loading };
}

const formSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessAddress: z.string().min(5, "Business address is required"),
  businessPhone: z
    .string()
    .min(8, "Phone number is required")
    .regex(/^\+?[0-9\s\-()]{8,}$/, "Please enter a valid phone number"),
  businessEmail: z.string().email("Please enter a valid email"),
  documentUrl: z.string().url("Please provide a valid URL"),
  aboutSalon: z.string().min(20, "Tell us a bit more (minimum 20 characters)"),
  services: z.string().min(3, "Add at least one service"),
  agree: z
    .boolean()
    .refine((v) => v === true, "You must agree before submitting"),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  businessName: "Glow & Go Salon",
  businessAddress: "House 12, Road 5, Banasree, Dhaka",
  businessPhone: "+8801712345678",
  businessEmail: "owner@glowgosalon.com",
  documentUrl: "https://example.com/docs/nid-trade-license.pdf",
  aboutSalon:
    "We’re a modern salon focused on premium service, hygiene, and a friendly customer experience.",
  services: "Haircut, Hair Color, Facial, Manicure, Pedicure",
  agree: false,
};

const ApplyForm = () => {
  const [state, formAction, isPending] = useActionState(ownerApplyForm, null);

  const { user, loading } = useAuthMock();

  const [submitting, setSubmitting] = React.useState(false);
  const [serverMsg, setServerMsg] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onTouched",
  });

  const watch = form.watch();
  const isAuthed = !!user && !loading;

  async function onSubmit(values: FormValues) {
    setServerMsg(null);

    if (!isAuthed) {
      setServerMsg("Please login to submit your application.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...values,
        uploadedDocumentName: selectedFile?.name ?? null,
      };
      console.log(payload);
      return;
      const res = await fetch("/api/v1/salon-owner/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok)
        throw new Error(data?.message || "Failed to submit application");

      setServerMsg(
        "✅ Application submitted successfully! We’ll review and get back to you soon.",
      );
      form.reset({ ...defaultValues, agree: false });
      setSelectedFile(null);
    } catch (err: any) {
      setServerMsg(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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

          {!isAuthed && (
            <Alert className="mb-6 border border-border bg-card">
              <AlertTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Login required
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                You must be logged in to submit the application. You can still
                fill the form, but submission will be disabled until you login.
              </AlertDescription>
            </Alert>
          )}

          {serverMsg && (
            <Alert className="mb-6 border border-border bg-card">
              <AlertTitle>Update</AlertTitle>
              <AlertDescription>{serverMsg}</AlertDescription>
            </Alert>
          )}

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
                <form action={formAction} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field
                      label="Business Name"
                      icon={<Building2 className="w-4 h-4 text-primary" />}
                      error={form.formState.errors.businessName?.message}
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
                      error={form.formState.errors.businessPhone?.message}
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
                      error={form.formState.errors.businessEmail?.message}
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
                      error={form.formState.errors.documentUrl?.message}
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
                    error={form.formState.errors.businessAddress?.message}
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
                    <Input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[color:var(--primary)]"
                      checked={watch.agree}
                      onChange={(e) =>
                        form.setValue("agree", e.target.checked, {
                          shouldValidate: true,
                        })
                      }
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-foreground">
                        I confirm the information is accurate
                      </p>
                      <p className="text-muted-foreground">
                        I agree to verification checks and understand false
                        information may lead to rejection.
                      </p>
                      {form.formState.errors.agree?.message && (
                        <p className="mt-1 text-xs text-destructive">
                          {form.formState.errors.agree?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* submit */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      disabled={!isAuthed || submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Application"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    <Badge
                      variant="secondary"
                      className="border border-border bg-background"
                    >
                      {isAuthed ? "Logged in ✅" : "Not logged in ❗"}
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
              <CardContent className="space-y-3 text-sm">
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
              </CardContent>
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
