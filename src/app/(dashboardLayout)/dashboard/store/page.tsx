"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function StorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const products = [
    {
      id: 1,
      name: "Premium Shampoo",
      category: "Hair Care",
      description: "Moisturizing shampoo for all hair types",
      price: "$29.99",
      stock: 45,
      image: "🧴",
      status: "in-stock",
      sales: 120,
    },
    {
      id: 2,
      name: "Hair Conditioner",
      category: "Hair Care",
      description: "Deep conditioning treatment",
      price: "$32.99",
      stock: 38,
      image: "🧴",
      status: "in-stock",
      sales: 98,
    },
    {
      id: 3,
      name: "Styling Gel",
      category: "Styling",
      description: "Strong hold styling gel",
      price: "$19.99",
      stock: 52,
      image: "💈",
      status: "in-stock",
      sales: 85,
    },
    {
      id: 4,
      name: "Hair Serum",
      category: "Hair Care",
      description: "Nourishing hair serum with vitamins",
      price: "$45.99",
      stock: 8,
      image: "💧",
      status: "low-stock",
      sales: 156,
    },
    {
      id: 5,
      name: "Nail Polish Set",
      category: "Nail Care",
      description: "Set of 12 premium nail polishes",
      price: "$39.99",
      stock: 0,
      image: "💅",
      status: "out-of-stock",
      sales: 203,
    },
    {
      id: 6,
      name: "Face Cream",
      category: "Skincare",
      description: "Anti-aging moisturizing cream",
      price: "$54.99",
      stock: 25,
      image: "🧴",
      status: "in-stock",
      sales: 142,
    },
    {
      id: 7,
      name: "Makeup Brush Set",
      category: "Makeup",
      description: "Professional 12-piece brush set",
      price: "$89.99",
      stock: 18,
      image: "🖌️",
      status: "in-stock",
      sales: 67,
    },
    {
      id: 8,
      name: "Hair Dryer",
      category: "Tools",
      description: "Professional ionic hair dryer",
      price: "$129.99",
      stock: 12,
      image: "💨",
      status: "in-stock",
      sales: 45,
    },
  ];

  const categories = [
    { id: "all", name: "All Products" },
    { id: "Hair Care", name: "Hair Care" },
    { id: "Styling", name: "Styling" },
    { id: "Nail Care", name: "Nail Care" },
    { id: "Skincare", name: "Skincare" },
    { id: "Makeup", name: "Makeup" },
    { id: "Tools", name: "Tools" },
  ];

  const getStockStatus = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-green-100 text-green-800";
      case "low-stock":
        return "bg-yellow-100 text-yellow-800";
      case "out-of-stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store</h1>
          <p className="text-gray-600 mt-1">Manage your salon products and inventory</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          + Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Products</span>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">In Stock</span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {products.filter((p) => p.status === "in-stock").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Low Stock</span>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {products.filter((p) => p.status === "low-stock").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Sales</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {products.reduce((sum, p) => sum + p.sales, 0)}
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">{product.image}</div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatus(product.status)}`}>
                {product.status.replace("-", " ")}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{product.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium text-gray-900">{product.category}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Stock:</span>
                <span className="font-medium text-gray-900">{product.stock} units</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sales:</span>
                <span className="font-medium text-gray-900">{product.sales} sold</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-xl font-bold text-purple-600">{product.price}</span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold mb-2">Sales Report</h3>
          <p className="text-purple-100 text-sm mb-4">View detailed sales analytics</p>
          <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/10">
            View Report
          </Button>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-md p-6 text-white">
          <div className="text-4xl mb-3">📦</div>
          <h3 className="text-lg font-semibold mb-2">Inventory Check</h3>
          <p className="text-pink-100 text-sm mb-4">Review low stock items</p>
          <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/10">
            Check Now
          </Button>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="text-4xl mb-3">🛒</div>
          <h3 className="text-lg font-semibold mb-2">New Order</h3>
          <p className="text-blue-100 text-sm mb-4">Place a new product order</p>
          <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/10">
            Order Now
          </Button>
        </div>
      </div>
    </div>
  );
}
