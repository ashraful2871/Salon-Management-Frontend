"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SalonsStorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const salons = [
    {
      id: 1,
      name: "Glamour Studio",
      location: "Downtown, New York",
      rating: 4.8,
      reviews: 125,
      services: ["Haircut", "Coloring", "Styling"],
      price: "$$$",
      image: "💇‍♀️",
      description: "Premium hair salon with expert stylists",
    },
    {
      id: 2,
      name: "Beauty Lounge",
      location: "Manhattan, New York",
      rating: 4.9,
      reviews: 210,
      services: ["Facial", "Massage", "Makeup"],
      price: "$$$$",
      image: "✨",
      description: "Luxury spa and beauty treatments",
    },
    {
      id: 3,
      name: "Style & Shine",
      location: "Brooklyn, New York",
      rating: 4.7,
      reviews: 95,
      services: ["Haircut", "Manicure", "Pedicure"],
      price: "$$",
      image: "💅",
      description: "Affordable salon with quality service",
    },
    {
      id: 4,
      name: "Elite Hair Studio",
      location: "Queens, New York",
      rating: 4.9,
      reviews: 180,
      services: ["Haircut", "Coloring", "Highlights"],
      price: "$$$",
      image: "💇",
      description: "Modern hair salon with latest trends",
    },
    {
      id: 5,
      name: "Radiance Spa",
      location: "Bronx, New York",
      rating: 4.6,
      reviews: 88,
      services: ["Facial", "Skincare", "Massage"],
      price: "$$$",
      image: "🧖",
      description: "Relaxing spa treatments and wellness",
    },
    {
      id: 6,
      name: "Nails & Beyond",
      location: "Staten Island, New York",
      rating: 4.8,
      reviews: 142,
      services: ["Manicure", "Pedicure", "Nail Art"],
      price: "$$",
      image: "💅",
      description: "Creative nail art and designs",
    },
  ];

  const categories = [
    { id: "all", name: "All Services" },
    { id: "hair", name: "Hair Services" },
    { id: "nails", name: "Nail Services" },
    { id: "spa", name: "Spa & Wellness" },
    { id: "makeup", name: "Makeup" },
  ];

  const filteredSalons = salons.filter((salon) => {
    const matchesSearch = salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Salon
          </h1>
          <p className="text-xl text-gray-600">
            Browse through our curated list of top-rated salons in your area
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Salons
              </label>
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredSalons.length} salon{filteredSalons.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Salon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalons.map((salon) => (
            <div
              key={salon.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{salon.image}</div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold text-gray-900">{salon.rating}</span>
                    <span className="text-gray-500 text-sm">({salon.reviews})</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {salon.name}
                </h3>
                <p className="text-gray-600 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {salon.location}
                </p>
                <p className="text-gray-600 mb-4">{salon.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {salon.services.map((service, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-50 text-purple-600 text-sm rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-gray-900 font-semibold">{salon.price}</span>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredSalons.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No salons found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

