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
import { Search, Plus, Edit, Trash2, Clock, DollarSign } from "lucide-react";

const servicesData = [
  {
    id: 1,
    name: "Haircut & Styling",
    category: "Hair",
    duration: "45 min",
    price: 50,
    popular: true,
  },
  {
    id: 2,
    name: "Color Treatment",
    category: "Hair",
    duration: "2 hours",
    price: 120,
    popular: true,
  },
  {
    id: 3,
    name: "Beard Trim",
    category: "Grooming",
    duration: "30 min",
    price: 25,
    popular: false,
  },
  {
    id: 4,
    name: "Manicure",
    category: "Nails",
    duration: "45 min",
    price: 35,
    popular: false,
  },
  {
    id: 5,
    name: "Pedicure",
    category: "Nails",
    duration: "1 hour",
    price: 45,
    popular: false,
  },
  {
    id: 6,
    name: "Facial Treatment",
    category: "Skincare",
    duration: "1 hour",
    price: 90,
    popular: true,
  },
  {
    id: 7,
    name: "Full Spa Package",
    category: "Spa",
    duration: "3 hours",
    price: 250,
    popular: true,
  },
  {
    id: 8,
    name: "Massage Therapy",
    category: "Spa",
    duration: "1 hour",
    price: 80,
    popular: false,
  },
];

const Services = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = servicesData.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(servicesData.map((s) => s.category))];

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
        <Button>
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
            label: "Popular Services",
            value: servicesData.filter((s) => s.popular).length,
          },
          {
            label: "Avg. Price",
            value: `$${Math.round(
              servicesData.reduce((acc, s) => acc + s.price, 0) /
                servicesData.length
            )}`,
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
        <Card>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {service.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{service.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.duration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-semibold text-sage">
                        <DollarSign className="h-4 w-4" />
                        {service.price}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.popular && (
                        <Badge className="bg-gradient-gold">Popular</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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

export default Services;
