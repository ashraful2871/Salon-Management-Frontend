"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Eye,
  Store,
} from "lucide-react";

import { updateSalonStatus } from "@/services/salon/updateSalonStatus";

/* ---------------- Types ---------------- */

type SalonStatus = "ACTIVE" | "INACTIVE" | "PENDING_APPROVAL" | "REJECTED";

type Salon = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  status: SalonStatus;
  createdAt: string;
  owner?: {
    user: {
      name: string;
      email: string;
      phone: string;
    };
  };
};

export default function ApprovalSalon({ salons }: { salons: Salon[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | SalonStatus
  >("ALL");

  const [selected, setSelected] = useState<Salon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  /* ---------------- Stats ---------------- */
  const total = salons.length;
  const pending = salons.filter((s) => s.status === "PENDING_APPROVAL").length;
  const active = salons.filter((s) => s.status === "ACTIVE").length;
  const rejected = salons.filter((s) => s.status === "REJECTED").length;

  /* ---------------- Filtering ---------------- */
  const filteredSalons = useMemo(() => {
    return salons.filter((item) => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch =
        item.name?.toLowerCase().includes(searchStr) ||
        item.email?.toLowerCase().includes(searchStr) ||
        item.city?.toLowerCase().includes(searchStr) ||
        item.owner?.user?.name?.toLowerCase().includes(searchStr) ||
        item.owner?.user?.email?.toLowerCase().includes(searchStr);

      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [salons, searchTerm, statusFilter]);

  /* ---------------- UI helpers ---------------- */

  const statusBadge = (status: SalonStatus) => {
    if (status === "PENDING_APPROVAL") return <Badge variant="secondary">Pending</Badge>;
    if (status === "ACTIVE")
      return (
        <Badge className="bg-sage text-accent-foreground text-white">
          Active
        </Badge>
      );
    if (status === "INACTIVE") return <Badge variant="outline">Inactive</Badge>;
    return <Badge variant="destructive">Rejected</Badge>;
  };

  const openDetails = (salon: Salon) => {
    setSelected(salon);
    setDialogOpen(true);
  };

  /* ---------------- Actions ---------------- */

  const handleStatusChange = async (id: string, newStatus: SalonStatus) => {
    setIsUpdating(true);
    const res = await updateSalonStatus(id, newStatus);
    
    if (res?.success) {
      toast.success(res.message || "Salon status updated successfully!");
      if (selected?.id === id) {
        setSelected({ ...selected, status: newStatus });
      }
      router.refresh();
    } else {
      toast.error(res?.message || "Failed to update salon status.");
    }
    setIsUpdating(false);
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
          <h1 className="font-serif text-3xl font-bold">Salon Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage salon registration statuses
          </p>
        </div>

        <Badge className="bg-primary/10 text-primary border border-border px-4 py-2 rounded-full">
          Total: {total}
        </Badge>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, icon: Store },
          { label: "Pending", value: pending, icon: Calendar },
          { label: "Active", value: active, icon: CheckCircle2 },
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
            placeholder="Search by salon name, city, owner name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING_APPROVAL", "ACTIVE", "INACTIVE", "REJECTED"] as const).map((s) => (
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
              {s === "ALL" ? "All" : s === "PENDING_APPROVAL" ? "Pending" : s.toLowerCase().replace("_", " ")}
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
            <CardTitle>Salons</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {filteredSalons.length} results
            </p>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salon Details</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredSalons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <p className="text-muted-foreground">
                        No salons found.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSalons.map((salon) => (
                    <TableRow
                      key={salon.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => openDetails(salon)}
                    >
                      {/* Salon */}
                      <TableCell>
                        <p className="font-medium text-primary">{salon.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {salon.city} - {salon.address}
                        </p>
                      </TableCell>

                      {/* Owner */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
                            {salon.owner?.user?.name
                              ? salon.owner.user.name.split(" ").map((n) => n[0]).join("")
                              : "N/A"}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{salon.owner?.user?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {salon.owner?.user?.email || "N/A"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {salon.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {salon.phone}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {statusBadge(salon.status)}
                      </TableCell>

                      {/* Created */}
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(salon.createdAt).toLocaleDateString()}
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
                            onClick={() => openDetails(salon)}
                            className="font-semibold"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          
                          {salon.status === "PENDING_APPROVAL" && (
                            <Button
                              size="sm"
                              className="bg-sage text-white hover:opacity-90 font-semibold"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(salon.id, "ACTIVE")}
                            >
                              Approve
                            </Button>
                          )}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Salon Information</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Review salon details and update operational status.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              {/* top row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-xl text-primary">
                    {selected.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 max-w-lg">
                    {selected.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(selected.status)}
                </div>
              </div>

              {/* info cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-primary" />
                      Location
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selected.address}
                    </p>
                    <p className="text-sm text-muted-foreground font-semibold">
                      {selected.city}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4 text-primary" />
                      Salon Contact
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selected.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selected.email}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-soft sm:col-span-2">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4 text-primary" />
                      Owner Contact Information
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                        <p className="text-sm text-muted-foreground">
                           <span className="font-medium text-foreground">Name:</span> {selected.owner?.user?.name || "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                           <span className="font-medium text-foreground">Email:</span> {selected.owner?.user?.email || "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                           <span className="font-medium text-foreground">Phone:</span> {selected.owner?.user?.phone || "N/A"}
                        </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* footer */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Registered on: {new Date(selected.createdAt).toLocaleString()}
                </p>

                <div className="flex flex-wrap gap-2 justify-end">
                  {selected.status !== "ACTIVE" && (
                    <Button
                      className="bg-sage text-white hover:opacity-90 font-semibold"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(selected.id, "ACTIVE")}
                    >
                      Set Active
                    </Button>
                  )}
                  {selected.status !== "INACTIVE" && (
                     <Button
                       variant="outline"
                       disabled={isUpdating}
                       onClick={() => handleStatusChange(selected.id, "INACTIVE")}
                       className="font-semibold"
                     >
                       Set Inactive
                     </Button>
                  )}
                  {selected.status !== "REJECTED" && (
                    <Button
                      variant="destructive"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(selected.id, "REJECTED")}
                      className="text-white font-semibold"
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
