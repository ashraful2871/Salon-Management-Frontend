"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Search,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { approveApplication } from "@/services/become-a-salone-woner/approveApplication";

/* ---------------- Types ---------------- */

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

type SalonOwnerApplication = {
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

type ApplicationsResponse = {
  success: boolean;
  message: string;
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: SalonOwnerApplication[];
};

export default function OwnerRequest({
  applicationsResponse,
}: {
  applicationsResponse: ApplicationsResponse;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");

  const [selected, setSelected] = useState<SalonOwnerApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const applications = applicationsResponse?.data ?? [];

  /* ---------------- Stats ---------------- */
  const total = applications.length;
  const pending = applications.filter(
    (a) => a.applicationStatus === "PENDING",
  ).length;
  const approved = applications.filter(
    (a) => a.applicationStatus === "APPROVED",
  ).length;
  const rejected = applications.filter(
    (a) => a.applicationStatus === "REJECTED",
  ).length;

  /* ---------------- Filtering ---------------- */
  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const matchesSearch =
        item.businessName?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        item.user.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        item.businessEmail?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        item.businessPhone?.toLowerCase().includes(searchTerm?.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ? true : item.applicationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  /* ---------------- UI helpers ---------------- */

  const statusBadge = (status: ApplicationStatus) => {
    if (status === "PENDING") return <Badge variant="secondary">Pending</Badge>;
    if (status === "APPROVED")
      return (
        <Badge className="bg-sage text-accent-foreground text-white">
          Approved
        </Badge>
      );
    return <Badge variant="destructive">Rejected</Badge>;
  };

  const verificationBadge = (verified: boolean) => {
    if (verified)
      return (
        <Badge className="bg-gradient-gold text-primary-foreground">
          Verified
        </Badge>
      );
    return (
      <Badge variant="secondary" className="gap-1">
        <ShieldCheck className="h-3.5 w-3.5" />
        Not verified
      </Badge>
    );
  };

  const openDetails = (application: SalonOwnerApplication) => {
    setSelected(application);
    setDialogOpen(true);
  };

  /* ---------------- Actions (UI only - connect API later) ---------------- */

  const handleApprove = async (id: string) => {
    await approveApplication(id);
  };

  const handleReject = async (id: string) => {
    // ✅ Connect your backend endpoint here
    // await fetch(`/api/v1/salon-owner/applications/${id}/reject`, { method: "PATCH" })
    console.log("Reject:", id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Owner Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage salon owner applications and verification requests
          </p>
        </div>

        <Badge className="bg-primary/10 text-primary border border-border px-4 py-2 rounded-full">
          Total: {applicationsResponse?.meta?.total ?? 0}
        </Badge>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, icon: User },
          { label: "Pending", value: pending, icon: Calendar },
          { label: "Approved", value: approved, icon: CheckCircle2 },
          { label: "Rejected", value: rejected, icon: XCircle },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="shadow-soft">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by salon name, owner name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              className={
                statusFilter === s
                  ? ""
                  : "bg-background hover:bg-muted border-border"
              }
              onClick={() => setStatusFilter(s)}
            >
              {s === "ALL" ? "All" : s.toLowerCase()}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="shadow-card">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <CardTitle>Applications</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {filteredApplications.length} results
            </p>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Salon</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <p className="text-muted-foreground">
                        No applications found.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow
                      key={app.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => openDetails(app)}
                    >
                      {/* Owner */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {app.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="font-medium">{app.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {app.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Salon */}
                      <TableCell>
                        <p className="font-medium">{app.businessName}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {app.businessAddress}
                        </p>
                      </TableCell>

                      {/* Contact */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {app.businessEmail}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {app.businessPhone}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {statusBadge(app.applicationStatus)}
                      </TableCell>

                      {/* Verification */}
                      <TableCell>
                        {verificationBadge(app.verificationStatus)}
                      </TableCell>

                      {/* Applied */}
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetails(app)}
                            className="font-semibold"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>

                          <Button
                            size="sm"
                            className="bg-sage text-white hover:opacity-90 font-semibold"
                            disabled={app.applicationStatus !== "PENDING"}
                            onClick={() => handleApprove(app.id)}
                          >
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Review business details and documents before making a decision.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              {/* top row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-lg">
                    {selected.businessName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Owner: {selected.user.name} ({selected.user.email})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(selected.applicationStatus)}
                  {verificationBadge(selected.verificationStatus)}
                </div>
              </div>

              {/* info cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-primary" />
                      Address
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selected.businessAddress}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4 text-primary" />
                      Contact
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selected.businessPhone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selected.businessEmail}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* doc */}
              <Card className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Document URL
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        {selected.documentUrl}
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <a
                        href={selected.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* footer */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Applied on: {new Date(selected.createdAt).toLocaleString()}
                </p>

                <div className="flex gap-2 justify-end">
                  <Button
                    className="bg-sage text-white hover:opacity-90 font-semibold"
                    disabled={selected.applicationStatus !== "PENDING"}
                    onClick={() => handleApprove(selected.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={selected.applicationStatus !== "PENDING"}
                    onClick={() => handleReject(selected.id)}
                    className="text-white font-semibold"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
