"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");

  const customers = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "(555) 123-4567",
      totalVisits: 12,
      totalSpent: "$1,240",
      lastVisit: "2024-01-05",
      status: "active",
      avatar: "👩",
    },
    {
      id: 2,
      name: "Michael Brown",
      email: "michael.b@email.com",
      phone: "(555) 234-5678",
      totalVisits: 8,
      totalSpent: "$890",
      lastVisit: "2024-01-03",
      status: "active",
      avatar: "👨",
    },
    {
      id: 3,
      name: "Emily Davis",
      email: "emily.d@email.com",
      phone: "(555) 345-6789",
      totalVisits: 15,
      totalSpent: "$1,650",
      lastVisit: "2024-01-08",
      status: "vip",
      avatar: "👩",
    },
    {
      id: 4,
      name: "David Wilson",
      email: "david.w@email.com",
      phone: "(555) 456-7890",
      totalVisits: 5,
      totalSpent: "$520",
      lastVisit: "2023-12-20",
      status: "inactive",
      avatar: "👨",
    },
    {
      id: 5,
      name: "Jennifer Lee",
      email: "jen.lee@email.com",
      phone: "(555) 567-8901",
      totalVisits: 20,
      totalSpent: "$2,100",
      lastVisit: "2024-01-09",
      status: "vip",
      avatar: "👩",
    },
    {
      id: 6,
      name: "Robert Taylor",
      email: "rob.t@email.com",
      phone: "(555) 678-9012",
      totalVisits: 3,
      totalSpent: "$280",
      lastVisit: "2024-01-02",
      status: "new",
      avatar: "👨",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "vip":
        return "bg-purple-100 text-purple-800";
      case "new":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    const matchesSegment = selectedSegment === "all" || customer.status === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const segments = [
    { id: "all", name: "All Customers", count: customers.length },
    { id: "active", name: "Active", count: customers.filter((c) => c.status === "active").length },
    { id: "vip", name: "VIP", count: customers.filter((c) => c.status === "vip").length },
    { id: "new", name: "New", count: customers.filter((c) => c.status === "new").length },
    { id: "inactive", name: "Inactive", count: customers.filter((c) => c.status === "inactive").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer database</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          + Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Customers</span>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Active This Month</span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {customers.filter((c) => c.status === "active" || c.status === "vip").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">VIP Members</span>
            <span className="text-2xl">⭐</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {customers.filter((c) => c.status === "vip").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">New This Month</span>
            <span className="text-2xl">🎉</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {customers.filter((c) => c.status === "new").length}
          </p>
        </div>
      </div>

      {/* Segment Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          {segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => setSelectedSegment(segment.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSegment === segment.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {segment.name} ({segment.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                  {customer.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}>
                    {customer.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {customer.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {customer.phone}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">Visits</p>
                <p className="text-lg font-semibold text-gray-900">{customer.totalVisits}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Spent</p>
                <p className="text-lg font-semibold text-gray-900">{customer.totalSpent}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Last Visit</p>
                <p className="text-xs font-medium text-gray-900">{customer.lastVisit}</p>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <Button size="sm" variant="outline" className="flex-1">
                View Profile
              </Button>
              <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                Book Now
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredCustomers.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
