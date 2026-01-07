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
import {
  Search,
  Plus,
  Filter,
  Package,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";

const productsData = [
  {
    id: 1,
    name: "Professional Hair Serum",
    category: "Hair Care",
    price: 45.99,
    stock: 24,
    status: "in-stock",
    image:
      "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=100&q=80",
  },
  {
    id: 2,
    name: "Organic Shampoo",
    category: "Hair Care",
    price: 28.99,
    stock: 56,
    status: "in-stock",
    image:
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=100&q=80",
  },
  {
    id: 3,
    name: "Moisturizing Face Cream",
    category: "Skincare",
    price: 65.0,
    stock: 8,
    status: "low-stock",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&q=80",
  },
  {
    id: 4,
    name: "Nail Polish Set",
    category: "Nails",
    price: 34.99,
    stock: 0,
    status: "out-of-stock",
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=100&q=80",
  },
  {
    id: 5,
    name: "Essential Oil Blend",
    category: "Aromatherapy",
    price: 22.5,
    stock: 42,
    status: "in-stock",
    image:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=100&q=80",
  },
  {
    id: 6,
    name: "Hair Styling Gel",
    category: "Hair Care",
    price: 18.99,
    stock: 5,
    status: "low-stock",
    image:
      "https://images.unsplash.com/photo-1597854710175-6ac7f6c53839?w=100&q=80",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "in-stock":
      return <Badge className="bg-sage text-accent-foreground">In Stock</Badge>;
    case "low-stock":
      return (
        <Badge className="bg-gold text-primary-foreground">Low Stock</Badge>
      );
    case "out-of-stock":
      return <Badge variant="destructive">Out of Stock</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const Store = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = productsData.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = productsData.length;
  const inStock = productsData.filter((p) => p.status === "in-stock").length;
  const lowStock = productsData.filter((p) => p.status === "low-stock").length;
  const outOfStock = productsData.filter(
    (p) => p.status === "out-of-stock"
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Store Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products and inventory
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Products",
            value: totalProducts,
            color: "bg-primary/10 text-primary",
          },
          { label: "In Stock", value: inStock, color: "bg-sage/20 text-sage" },
          {
            label: "Low Stock",
            value: lowStock,
            color: "bg-gold/20 text-gold",
          },
          {
            label: "Out of Stock",
            value: outOfStock,
            color: "bg-destructive/20 text-destructive",
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
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg mb-2 ${stat.color}`}
                >
                  <Package className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Products</CardTitle>
            <div className="flex gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          width={600}
                          height={400}
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
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

export default Store;
