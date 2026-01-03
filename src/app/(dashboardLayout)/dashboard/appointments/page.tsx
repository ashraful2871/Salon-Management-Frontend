"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AppointmentsPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const appointments = [
    {
      id: 1,
      customer: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "(555) 123-4567",
      service: "Haircut & Styling",
      date: "2024-01-10",
      time: "10:00 AM",
      duration: "1 hour",
      price: "$80",
      status: "confirmed",
      stylist: "Emma Wilson",
    },
    {
      id: 2,
      customer: "Michael Brown",
      email: "michael.b@email.com",
      phone: "(555) 234-5678",
      service: "Hair Coloring",
      date: "2024-01-10",
      time: "2:00 PM",
      duration: "2 hours",
      price: "$150",
      status: "pending",
      stylist: "Lisa Anderson",
    },
    {
      id: 3,
      customer: "Emily Davis",
      email: "emily.d@email.com",
      phone: "(555) 345-6789",
      service: "Manicure",
      date: "2024-01-11",
      time: "11:00 AM",
      duration: "45 mins",
      price: "$70",
      status: "confirmed",
      stylist: "Rachel Green",
    },
    {
      id: 4,
      customer: "David Wilson",
      email: "david.w@email.com",
      phone: "(555) 456-7890",
      service: "Massage Therapy",
      date: "2024-01-11",
      time: "3:00 PM",
      duration: "1.5 hours",
      price: "$120",
      status: "completed",
      stylist: "Monica Geller",
    },
    {
      id: 5,
      customer: "Jennifer Lee",
      email: "jen.lee@email.com",
      phone: "(555) 567-8901",
      service: "Facial Treatment",
      date: "2024-01-12",
      time: "9:00 AM",
      duration: "1 hour",
      price: "$90",
      status: "confirmed",
      stylist: "Phoebe Buffay",
    },
    {
      id: 6,
      customer: "Robert Taylor",
      email: "rob.t@email.com",
      phone: "(555) 678-9012",
      service: "Haircut",
      date: "2024-01-12",
      time: "1:00 PM",
      duration: "30 mins",
      price: "$50",
      status: "cancelled",
      stylist: "Emma Wilson",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus;
    const matchesSearch =
      appointment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.stylist.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage all your salon appointments</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          + New Appointment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`p-4 rounded-lg border-2 transition-all ${
              filterStatus === status
                ? "border-purple-600 bg-purple-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-600 capitalize">{status}</div>
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by customer, service, or stylist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option>Sort by Date</option>
              <option>Sort by Customer</option>
              <option>Sort by Service</option>
              <option>Sort by Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Service</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Stylist</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Duration</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{appointment.customer}</div>
                      <div className="text-xs text-gray-500">{appointment.phone}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">{appointment.service}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{appointment.stylist}</td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900">{appointment.date}</div>
                    <div className="text-xs text-gray-500">{appointment.time}</div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{appointment.duration}</td>
                  <td className="py-4 px-4 text-sm font-semibold text-gray-900">{appointment.price}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No Results */}
        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Pagination */}
        {filteredAppointments.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{filteredAppointments.length}</span> of{" "}
              <span className="font-medium">{filteredAppointments.length}</span> results
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
