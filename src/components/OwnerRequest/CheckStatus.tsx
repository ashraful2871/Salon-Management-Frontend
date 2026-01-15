/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

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
  Search,
  Layers,
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
  data: Application[];
};

export default function CheckStatus({
  statusResponse,
}: {
  statusResponse: StatusResponse;
}) {
  const applications = Array.isArray(statusResponse?.data)
    ? statusResponse.data
    : [];

  const [selectedId, setSelectedId] = React.useState<string>("");
  const [search, setSearch] = React.useState("");

  // ✅ Empty State
  if (!applications.length) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>No application found</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              You haven’t submitted any salon owner application yet. Please
              apply first.
            </AlertDescription>
          </Alert>

          <div className="mt-5">
            <Button asChild>
              <Link href="/become-salon-owner">Apply Now</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ Sort newest first
  const sortedApps = [...applications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // ✅ Default selected = latest
  useEffect(() => {
    if (!selectedId && sortedApps.length > 0) {
      setSelectedId(sortedApps[0].id);
    }
  }, [selectedId, sortedApps]);

  const selectedApp =
    sortedApps.find((app) => app.id === selectedId) || sortedApps[0];

  // ✅ Filter for left list
  const filteredApps = sortedApps.filter((app) => {
    const q = search.toLowerCase();
    return (
      app.businessName.toLowerCase().includes(q) ||
      app.applicationStatus.toLowerCase().includes(q) ||
      app.id.toLowerCase().includes(q)
    );
  });

  /* ---------------- UI Helpers ---------------- */

  const statusBadge = (status: ApplicationStatus) => {
    if (status === "APPROVED") {
      return (
        <Badge className="bg-sage text-white flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" />
          Approved
        </Badge>
      );
    }

    if (status === "PENDING") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock3 className="h-4 w-4" />
          Pending
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-4 w-4" />
        Rejected
      </Badge>
    );
  };

  const verifiedBadge = (verified: boolean) => {
    if (verified) {
      return (
        <Badge className="bg-gradient-gold text-primary-foreground flex items-center gap-1">
          <ShieldCheck className="h-4 w-4" />
          Verified
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <ShieldCheck className="h-4 w-4" />
        Not Verified
      </Badge>
    );
  };

  const activeTag = (appId: string) => {
    // newest is "Active"
    if (sortedApps[0].id === appId) {
      return (
        <Badge className="bg-primary text-primary-foreground text-xs">
          Active
        </Badge>
      );
    }
    return null;
  };

  const total = applications.length;
  const approvedCount = applications.filter(
    (a) => a.applicationStatus === "APPROVED"
  ).length;
  const pendingCount = applications.filter(
    (a) => a.applicationStatus === "PENDING"
  ).length;
  const rejectedCount = applications.filter(
    (a) => a.applicationStatus === "REJECTED"
  ).length;

  return (
    <div className="space-y-6">
      {/* ✅ Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Application Status</h1>
          <p className="text-muted-foreground mt-1">
            View all your salon owner applications and current status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusBadge(selectedApp.applicationStatus)}
          {verifiedBadge(selectedApp.verificationStatus)}
          {activeTag(selectedApp.id)}
        </div>
      </motion.div>

      {/* ✅ Summary Stats (Industry standard) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={total}
          icon={<Layers className="h-5 w-5" />}
        />
        <StatCard
          title="Approved"
          value={approvedCount}
          icon={<CheckCircle2 className="h-5 w-5 text-sage" />}
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={<Clock3 className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Rejected"
          value={rejectedCount}
          icon={<XCircle className="h-5 w-5 text-destructive" />}
        />
      </div>

      {/* ✅ Main Layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT LIST (Applications) */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center justify-between">
              Applications
              <Badge variant="secondary">{filteredApps.length}</Badge>
            </CardTitle>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by status / name / id..."
                className="pl-9"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {filteredApps.map((app) => {
              const isSelected = app.id === selectedApp.id;

              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedId(app.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all hover:bg-muted/40 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {app.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(app.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {activeTag(app.id)}
                      {statusBadge(app.applicationStatus)}
                    </div>
                  </div>

                  {app.applicationStatus === "REJECTED" &&
                    app.rejectionReason && (
                      <p className="mt-2 text-xs text-destructive">
                        Reason: {app.rejectionReason}
                      </p>
                    )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* RIGHT DETAILS (Selected App) */}
        <div className="lg:col-span-3 space-y-5">
          {/* ✅ Status Alerts */}
          {selectedApp.applicationStatus === "REJECTED" && (
            <Alert className="border-destructive/40 bg-destructive/5">
              <AlertTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                Application Rejected
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                <span className="font-medium text-destructive">Reason:</span>{" "}
                {selectedApp.rejectionReason || "No rejection reason provided."}
              </AlertDescription>
            </Alert>
          )}

          {selectedApp.applicationStatus === "PENDING" && (
            <Alert className="border-primary/20 bg-primary/5">
              <AlertTitle className="flex items-center gap-2 text-primary">
                <Clock3 className="h-4 w-4" />
                Application Under Review
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Your application is under review. Usually approval takes 24–48
                hours. Please check back later.
              </AlertDescription>
            </Alert>
          )}

          {selectedApp.applicationStatus === "APPROVED" && (
            <Card className="shadow-soft border border-border bg-gradient-card">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-sage" />
                    Approved ✅ You can access your dashboard
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage services, appointments and customers from Salon Owner
                    dashboard.
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

          {/* ✅ Details Card */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selectedApp.businessName}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Owner:{" "}
                  <span className="font-medium">{selectedApp.user.name}</span>
                </p>
              </div>

              <Badge variant="secondary" className="text-xs">
                App ID: {selectedApp.id.slice(0, 8)}...
              </Badge>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox
                  icon={<MapPin className="h-4 w-4 text-primary" />}
                  title="Business Address"
                  value={selectedApp.businessAddress}
                />
                <InfoBox
                  icon={<Phone className="h-4 w-4 text-primary" />}
                  title="Business Phone"
                  value={selectedApp.businessPhone}
                />
                <InfoBox
                  icon={<Mail className="h-4 w-4 text-primary" />}
                  title="Business Email"
                  value={selectedApp.businessEmail}
                />
                <InfoBox
                  icon={<Calendar className="h-4 w-4 text-primary" />}
                  title="Created At"
                  value={new Date(selectedApp.createdAt).toLocaleString()}
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
                    {selectedApp.documentUrl}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {new Date(selectedApp.updatedAt).toLocaleString()}
                  </p>
                </div>

                <Button variant="outline" asChild>
                  <a
                    href={selectedApp.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Document <ArrowUpRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small UI Components ---------------- */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

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
