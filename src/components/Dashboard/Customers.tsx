"use client";
import { motion } from "framer-motion";
import { useState } from "react";
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
import { Search, Plus, Mail, Phone, Calendar } from "lucide-react";

const customersData = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@email.com",
    phone: "+1 (555) 123-4567",
    visits: 12,
    lastVisit: "2025-12-28",
    totalSpent: 890,
    status: "vip",
  },
  {
    id: 2,
    name: "Emily Chen",
    email: "emily@email.com",
    phone: "+1 (555) 234-5678",
    visits: 8,
    lastVisit: "2025-12-30",
    totalSpent: 560,
    status: "regular",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael@email.com",
    phone: "+1 (555) 345-6789",
    visits: 3,
    lastVisit: "2025-12-15",
    totalSpent: 175,
    status: "new",
  },
  {
    id: 4,
    name: "Jessica Davis",
    email: "jessica@email.com",
    phone: "+1 (555) 456-7890",
    visits: 15,
    lastVisit: "2026-01-02",
    totalSpent: 1250,
    status: "vip",
  },
  {
    id: 5,
    name: "Amanda Wilson",
    email: "amanda@email.com",
    phone: "+1 (555) 567-8901",
    visits: 6,
    lastVisit: "2025-12-22",
    totalSpent: 420,
    status: "regular",
  },
  {
    id: 6,
    name: "David Lee",
    email: "david@email.com",
    phone: "+1 (555) 678-9012",
    visits: 1,
    lastVisit: "2026-01-03",
    totalSpent: 50,
    status: "new",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "vip":
      return <Badge className="bg-gradient-gold">VIP</Badge>;
    case "regular":
      return (
        <Badge className="bg-sage text-accent-foreground text-white">
          Regular
        </Badge>
      );
    case "new":
      return <Badge variant="secondary">New</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customersData.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCustomers = customersData.length;
  const vipCustomers = customersData.filter((c) => c.status === "vip").length;
  const newCustomers = customersData.filter((c) => c.status === "new").length;
  const totalRevenue = customersData.reduce((acc, c) => acc + c.totalSpent, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: totalCustomers, icon: "👥" },
          { label: "VIP Members", value: vipCustomers, icon: "⭐" },
          { label: "New This Month", value: newCustomers, icon: "🆕" },
          {
            label: "Total Revenue",
            value: `$${totalRevenue.toLocaleString()}`,
            icon: "💰",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 text-center">
                <span className="text-2xl">{stat.icon}</span>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Customers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
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
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {customer.visits}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(customer.lastVisit).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold text-sage">
                      ${customer.totalSpent}
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Customers;
