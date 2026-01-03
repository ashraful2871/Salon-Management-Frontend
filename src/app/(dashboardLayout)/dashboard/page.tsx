"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState("thisMonth");

  const stats = [
    {
      title: "Total Appointments",
      value: "156",
      change: "+12%",
      icon: "📅",
      color: "bg-blue-500",
    },
    {
      title: "Total Revenue",
      value: "$12,450",
      change: "+8%",
      icon: "💰",
      color: "bg-green-500",
    },
    {
      title: "Active Customers",
      value: "89",
      change: "+5%",
      icon: "👥",
      color: "bg-purple-500",
    },
    {
      title: "Pending Bookings",
      value: "23",
      change: "-3%",
      icon: "⏱️",
      color: "bg-orange-500",
    },
  ];

  const recentAppointments = [
    {
      id: 1,
      customer: "Sarah Johnson",
      service: "Haircut & Styling",
      date: "2024-01-10",
      time: "10:00 AM",
      status: "confirmed",
    },
    {
      id: 2,
      customer: "Michael Brown",
      service: "Hair Coloring",
      date: "2024-01-10",
      time: "2:00 PM",
      status: "pending",
    },
    {
      id: 3,
      customer: "Emily Davis",
      service: "Manicure",
      date: "2024-01-11",
      time: "11:00 AM",
      status: "confirmed",
    },
    {
      id: 4,
      customer: "David Wilson",
      service: "Massage Therapy",
      date: "2024-01-11",
      time: "3:00 PM",
      status: "completed",
    },
  ];

  const topServices = [
    { name: "Haircut & Styling", count: 45, revenue: "$3,600" },
    { name: "Hair Coloring", count: 32, revenue: "$4,800" },
    { name: "Manicure & Pedicure", count: 28, revenue: "$1,960" },
    { name: "Facial Treatment", count: 21, revenue: "$1,890" },
    { name: "Massage Therapy", count: 18, revenue: "$2,160" },
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your salon overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
          <Button className="bg-purple-600 hover:bg-purple-700">
            New Appointment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
              <span className={`text-sm font-semibold ${
                stat.change.startsWith("+") ? "text-green-600" : "text-red-600"
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Overview</h2>
          <div className="h-64 flex items-end justify-between space-x-2">
            {[65, 80, 70, 90, 85, 95, 88].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-md"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-gray-600 mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Services</h2>
          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {service.name}
                    </span>
                    <span className="text-sm text-gray-600">{service.count} bookings</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(service.count / 45) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 text-sm font-semibold text-gray-900">
                  {service.revenue}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Appointments</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Service</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{appointment.customer}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{appointment.service}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{appointment.date}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{appointment.time}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-lg font-semibold mb-2">Schedule Appointment</h3>
          <p className="text-purple-100 text-sm mb-4">Book a new appointment for your customer</p>
          <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/10">
            Schedule Now
          </Button>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-md p-6 text-white">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-lg font-semibold mb-2">Add Customer</h3>
          <p className="text-pink-100 text-sm mb-4">Register a new customer to your salon</p>
          <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/10">
            Add Now
          </Button>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="text-4xl mb-3">💇</div>
          <h3 className="text-lg font-semibold mb-2">Manage Services</h3>
          <p className="text-blue-100 text-sm mb-4">Update your salon services and pricing</p>
          <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/10">
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
}
