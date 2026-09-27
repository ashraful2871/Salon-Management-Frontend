"use client";
import { useOptimistic, useState, useTransition } from "react";
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
  Package,
  Tags,
  Banknote,
} from "lucide-react";
import AddServiceModal from "./AddServiceModal";
import { deleteService } from "@/services/service/deleteService";
import { showResultToast } from "@/components/Shared/showResultToast";
import { formatBDT } from "@/lib/money";
import { PageHeader } from "@/components/Shared/PageHeader";
import { StatCard } from "@/components/Shared/StatCard";
import { ConfirmDialog } from "@/components/Shared/ConfirmDialog";

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
  const [, startTransition] = useTransition();

  const serverServices = Array.isArray(servicesResponse?.data)
    ? servicesResponse.data
    : [];
  // A deleted service leaves the list at once and comes back if the API refuses.
  const [servicesData, removeService] = useOptimistic(
    serverServices,
    (list: { id: string }[], id: string) => list.filter((s) => s.id !== id),
  );
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
    const id = deleteServiceId;
    setDeleteServiceId(null);

    startTransition(async () => {
      removeService(id);
      const res = await deleteService(id);
      showResultToast(res, "Service deleted successfully", "Failed to delete service");
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Manage your salon services and pricing"
        actions={
          <Button
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          { label: "Total services", value: servicesData.length, icon: Package },
          { label: "Categories", value: categories.length, icon: Tags },
          {
            label: "Avg. duration",
            icon: Clock,
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
            label: "Avg. price",
            icon: Banknote,
            value: servicesData.length
              ? formatBDT(
                  Math.round(
                    servicesData.reduce(
                      (acc: any, s: any) => acc + s.priceMinor,
                      0,
                    ) / servicesData.length,
                  ),
                )
              : formatBDT(0),
          },
        ].map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Services Table */}
      <div>
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
                          {formatBDT(service.priceMinor)}
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
      </div>

      {/* Add Modal */}
      <AddServiceModal
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        salons={salonsData}
      />

      <ConfirmDialog
        open={!!deleteServiceId}
        onOpenChange={(open) => !open && setDeleteServiceId(null)}
        destructive
        title="Delete this service?"
        description="Customers will no longer be able to book it. This can't be undone."
        confirmLabel="Delete service"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
