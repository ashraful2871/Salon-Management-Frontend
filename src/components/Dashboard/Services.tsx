"use client";
import { motion } from "framer-motion";
import { useState, useTransition } from "react";
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
  Search,
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AddServiceModal from "./AddServiceModal";
import { deleteService } from "@/services/service/deleteService";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Services({
  servicesResponse,
  salonsResponse,
}: {
  servicesResponse: any;
  salonsResponse: any;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const servicesData = Array.isArray(servicesResponse?.data)
    ? servicesResponse.data
    : [];
  const salonsData = Array.isArray(salonsResponse?.data)
    ? salonsResponse.data
    : [];

  const filteredServices = servicesData.filter(
    (service: any) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const categories = [...new Set(servicesData.map((s: any) => s.category))];

  const confirmDelete = () => {
    if (!deleteServiceId) return;

    startTransition(async () => {
      const res = await deleteService(deleteServiceId);
      if (res?.success) {
        toast.success("Service deleted successfully");
        setDeleteServiceId(null);
        router.refresh();
      } else {
        toast.error(res?.message || "Failed to delete service");
        setDeleteServiceId(null);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage your salon services and pricing
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-sage hover:opacity-90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Services", value: servicesData.length },
          { label: "Categories", value: categories.length },
          {
            label: "Avg. Duration",
            value: `${
              servicesData.length
                ? Math.round(
                    servicesData.reduce(
                      (acc: any, s: any) => acc + s.duration,
                      0,
                    ) / servicesData.length,
                  )
                : 0
            } min`,
          },
          {
            label: "Avg. Price",
            value: `$${
              servicesData.length
                ? Math.round(
                    servicesData.reduce(
                      (acc: any, s: any) => acc + s.price,
                      0,
                    ) / servicesData.length,
                  )
                : 0
            }`,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-soft">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Services Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="shadow-card">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Services</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredServices.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No services found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Salon</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service: any) => (
                    <TableRow key={service.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{service.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {service.duration} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-semibold text-sage">
                          <DollarSign className="h-4 w-4" />
                          {service.price}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {service.salon?.name || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteServiceId(service.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Modal */}
      <AddServiceModal
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        salons={salonsData}
        onCreate={() => {
          router.refresh();
        }}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deleteServiceId}
        onOpenChange={(open) => !open && setDeleteServiceId(null)}
      >
        <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-2xl p-0">
          <div className="p-6 pb-4 border-b bg-destructive/5 shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Are you sure you want to delete this service? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-background flex justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteServiceId(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
              className="text-white"
            >
              {isPending ? "Deleting..." : "Delete Service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
