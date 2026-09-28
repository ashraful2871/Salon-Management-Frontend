/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Mail, Phone, Calendar, Users, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/Shared/PageHeader";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { StatCard } from "@/components/Shared/StatCard";

const getStatusBadge = (status: string) => (
  <ToneBadge status={(status || "UNKNOWN").toUpperCase()} />
);

const Customers = ({ usersResponse }: { usersResponse: any }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const usersData = Array.isArray(usersResponse?.data)
    ? usersResponse.data
    : [];

  const filteredCustomers = usersData.filter(
    (customer: any) =>
      (customer.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phoneNumber || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const totalCustomers = usersData.length;
  const activeCustomers = usersData.filter(
    (c: any) => c.status === "ACTIVE"
  ).length;
  const suspendedCustomers = usersData.filter(
    (c: any) => c.status === "SUSPENDED" || c.status === "BLOCKED"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer database"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        {[
          {
            label: "Total customers",
            value: totalCustomers,
            icon: Users,
            tone: "neutral" as const,
          },
          {
            label: "Active",
            value: activeCustomers,
            icon: UserCheck,
            tone: "success" as const,
          },
          {
            label: "Suspended / blocked",
            value: suspendedCustomers,
            icon: UserX,
            tone: "danger" as const,
          },
        ].map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      {/* Customers Table */}
      <div>
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Customers</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No customers found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer: any) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {(customer.name || "U")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </div>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                          {customer.phoneNumber && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {customer.phoneNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {customer.gender || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString()
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(customer.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Customers;
