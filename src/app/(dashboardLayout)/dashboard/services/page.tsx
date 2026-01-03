"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const services = [
    {
      id: 1,
      name: "Haircut & Styling",
      category: "Hair",
      description: "Professional haircut with styling",
      duration: "1 hour",
      price: "$80",
      image: "💇",
      status: "active",
      bookings: 45,
    },
    {
      id: 2,
      name: "Hair Coloring",
      category: "Hair",
      description: "Full hair coloring service",
      duration: "2 hours",
      price: "$150",
      image: "🎨",
      status: "active",
      bookings: 32,
    },
    {
      id: 3,
      name: "Manicure",
      category: "Nails",
      description: "Complete nail care and polish",
      duration: "45 mins",
      price: "$70",
      image: "💅",
      status: "active",
      bookings: 28,
    },
    {
      id: 4,
      name: "Pedicure",
      category: "Nails",
      description: "Foot spa and nail treatment",
      duration: "1 hour",
      price: "$85",
      image: "🦶",
      status: "active",
      bookings: 25,
    },
    {
      id: 5,
      name: "Facial Treatment",
      category: "Skincare",
      description: "Deep cleansing facial",
      duration: "1 hour",
      price: "$90",
      image: "✨",
      status: "active",
      bookings: 21,
    },
    {
      id: 6,
      name: "Massage Therapy",
      category: "Wellness",
      description: "Relaxing full body massage",
      duration: "1.5 hours",
      price: "$120",
      image: "💆",
      status: "active",
      bookings: 18,
    },
    {
      id: 7,
      name: "Makeup Application",
      category: "Makeup",
      description: "Professional makeup for events",
      duration: "1 hour",
      price: "$100",
      image: "💄",
      status: "active",
      bookings: 15,
    },
    {
      id: 8,
      name: "Hair Treatment",
      category: "Hair",
      description: "Deep conditioning treatment",
      duration: "45 mins",
      price: "$65",
      image: "🧴",
      status: "inactive",
      bookings: 8,
    },
  ];

  const categories = [
    { id: "all", name: "All Services" },
    { id: "Hair", name: "Hair Services" },
    { id: "Nails", name: "Nail Services" },
    { id: "Skincare", name: "Skincare" },
    { id: "Wellness", name: "Wellness" },
    { id: "Makeup", name: "Makeup" },
  ];

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage your salon services and pricing</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          + Add Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Services</span>
            <span className="text-2xl">💇</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{services.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Active Services</span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {services.filter((s) => s.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Bookings</span>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {services.reduce((sum, s) => sum + s.bookings, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Avg. Price</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">$92</p>
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
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">{service.image}</div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                service.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {service.status}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{service.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium text-gray-900">{service.category}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">{service.duration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Bookings:</span>
                <span className="font-medium text-gray-900">{service.bookings} this month</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-2xl font-bold text-purple-600">{service.price}</span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Book
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredServices.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
