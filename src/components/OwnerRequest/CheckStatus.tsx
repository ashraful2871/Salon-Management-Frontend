"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  ShieldCheck,
  CheckCircle2,
  Clock3,
  XCircle,
  FileText,
  MapPin,
  Phone,
  Mail,
  Building2,
  Calendar,
  ArrowUpRight,
  Dot,
} from "lucide-react";

/* ---------------- Types ---------------- */

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

type Application = {
  id: string;
  userId: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  verificationStatus: boolean;
  documentUrl: string;
  applicationStatus: ApplicationStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type StatusResponse = {
  success: boolean;
  message: string;
  data: Application | null; // ✅ now single object
};

/* ---------------- Helpers ---------------- */

const statusBadge = (status: ApplicationStatus) => {
  if (status === "APPROVED")
    return (
      <Badge className="bg-sage text-white flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4" />
        Approved
      </Badge>
    );

  if (status === "PENDING")
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock3 className="h-4 w-4" />
        Pending
      </Badge>
    );

  return (
    <Badge variant="destructive" className="flex items-center gap-1">
      <XCircle className="h-4 w-4" />
      Rejected
    </Badge>
  );
};

const verifiedBadge = (verified: boolean) => {
  if (verified)
    return (
      <Badge className="bg-gradient-gold text-primary-foreground flex items-center gap-1">
        <ShieldCheck className="h-4 w-4" />
        Verified
      </Badge>
    );

  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <ShieldCheck className="h-4 w-4" />
      Not Verified
    </Badge>
  );
};

// ✅ Stepper: Submitted → Review → Done
const steps = [
  { key: "submitted", label: "Submitted" },
  { key: "review", label: "Under Review" },
  { key: "done", label: "Decision" },
];

function getStepIndex(status: ApplicationStatus) {
  if (status === "PENDING") return 1; // review
  if (status === "APPROVED" || status === "REJECTED") return 2; // done
  return 0;
}

/* ---------------- Component ---------------- */

export default function CheckStatus({
  statusResponse,
}: {
  statusResponse: StatusResponse;
}) {
  const app = statusResponse?.data ?? null;

  if (!app) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>No application found</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              You haven’t submitted any salon owner application yet. Please
              apply first.
            </AlertDescription>
          </Alert>

          <Button asChild className="bg-sage hover:opacity-90 text-white">
            <Link href="/become-salon-owner">Apply Now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stepIndex = getStepIndex(app.applicationStatus);
  const created = new Date(app.createdAt).toLocaleString();
  const updated = new Date(app.updatedAt).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Application Status</h1>
          <p className="text-muted-foreground mt-1">
            Track your salon owner application progress
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusBadge(app.applicationStatus)}
          {verifiedBadge(app.verificationStatus)}
          <Badge variant="secondary" className="text-xs">
            ID: {app.id.slice(0, 8)}...
          </Badge>
        </div>
      </motion.div>

      {/* Stepper (Professional UX) */}
      <Card className="shadow-soft">
        <CardContent className="p-5">
          <p className="text-sm font-medium mb-4">Progress</p>

          <div className="flex items-center justify-between gap-2">
            {steps.map((s, idx) => {
              const done = idx <= stepIndex;
              const isCurrent = idx === stepIndex;

              return (
                <div key={s.key} className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center border ${
                        done
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Dot />}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          done ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {s.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-muted-foreground">
                          Current step
                        </p>
                      )}
                    </div>
                  </div>

                  {idx !== steps.length - 1 && (
                    <div
                      className={`mt-3 h-[2px] w-full ${
                        idx < stepIndex ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Submitted: {created} • Last update: {updated}
          </div>
        </CardContent>
      </Card>

      {/* Status Alerts */}
      {app.applicationStatus === "REJECTED" && (
        <Alert className="border-destructive/40 bg-destructive/5">
          <AlertTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            Application Rejected
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            <span className="font-medium text-destructive">Reason:</span>{" "}
            {app.rejectionReason || "No rejection reason provided."}
          </AlertDescription>
        </Alert>
      )}

      {app.applicationStatus === "PENDING" && (
        <Alert className="border-primary/20 bg-primary/5">
          <AlertTitle className="flex items-center gap-2 text-primary">
            <Clock3 className="h-4 w-4" />
            Application Under Review
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Your application is being reviewed. Usually approval takes 24–48
            hours. Please check back later.
          </AlertDescription>
        </Alert>
      )}

      {app.applicationStatus === "APPROVED" && (
        <Card className="shadow-soft border border-border bg-gradient-card">
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-sage" />
                Congratulations! You’re approved ✅
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You can now access the Salon Owner dashboard and manage your
                salon.
              </p>
            </div>

            <Button className="bg-sage hover:opacity-90 text-white" asChild>
              <Link href="/dashboard">
                Go to Dashboard <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Details Card */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {app.businessName}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Applicant: <span className="font-medium">{app.user.name}</span>{" "}
              <span className="text-xs text-muted-foreground">
                ({app.user.role})
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {statusBadge(app.applicationStatus)}
            {verifiedBadge(app.verificationStatus)}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBox
              icon={<MapPin className="h-4 w-4 text-primary" />}
              title="Business Address"
              value={app.businessAddress}
            />
            <InfoBox
              icon={<Phone className="h-4 w-4 text-primary" />}
              title="Business Phone"
              value={app.businessPhone}
            />
            <InfoBox
              icon={<Mail className="h-4 w-4 text-primary" />}
              title="Business Email"
              value={app.businessEmail}
            />
            <InfoBox
              icon={<Calendar className="h-4 w-4 text-primary" />}
              title="Application Date"
              value={created}
            />
          </div>

          <Separator />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4">
            <div className="space-y-1">
              <p className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Verification Document
              </p>
              <p className="text-xs text-muted-foreground break-all">
                {app.documentUrl}
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated: {updated}
              </p>
            </div>

            <Button variant="outline" asChild>
              <a href={app.documentUrl} target="_blank" rel="noreferrer">
                View Document <ArrowUpRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- UI Helper ---------------- */

function InfoBox({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}
