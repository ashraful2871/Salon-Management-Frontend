"use client";
import { motion } from "framer-motion";
import { Clock, Filter, MapPin, Search, Star } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";

const allSalons = [
  {
    id: 1,
    name: "Luxe Hair Studio",
    rating: 4.9,
    reviews: 234,
    specialty: "Hair & Color",
    location: "Downtown LA",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
    price: "$$$",
    services: ["Haircut", "Coloring", "Styling"],
    openNow: true,
  },
  {
    id: 2,
    name: "Serenity Spa",
    rating: 4.8,
    reviews: 189,
    specialty: "Wellness & Spa",
    location: "Beverly Hills",
    image:
      "https://plus.unsplash.com/premium_photo-1661780553870-091aaf88d9cc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fFNlcmVuaXR5JTIwU3BhfGVufDB8fDB8fHww",
    price: "$$$$",
    services: ["Spa", "Massage", "Facial"],
    openNow: true,
  },
  {
    id: 3,
    name: "Glow Beauty Bar",
    rating: 4.9,
    reviews: 312,
    specialty: "Makeup & Nails",
    location: "Santa Monica",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
    price: "$$",
    services: ["Makeup", "Nails", "Waxing"],
    openNow: false,
  },
  {
    id: 4,
    name: "The Cutting Edge",
    rating: 4.7,
    reviews: 156,
    specialty: "Hair & Styling",
    location: "Hollywood",
    image:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=300&fit=crop",
    price: "$$$",
    services: ["Haircut", "Beard Trim", "Styling"],
    openNow: true,
  },
  {
    id: 5,
    name: "Bliss Nail Lounge",
    rating: 4.8,
    reviews: 278,
    specialty: "Nails & Pedicure",
    location: "West Hollywood",
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
    price: "$$",
    services: ["Skincare", "Facial", "Lashes"],
    openNow: true,
  },
  {
    id: 6,
    name: "Zen Wellness Center",
    rating: 4.9,
    reviews: 421,
    specialty: "Spa & Massage",
    location: "Malibu",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
    price: "$$$$",
    services: ["Manicure", "Pedicure", "Nail Art"],
    openNow: false,
  },
];

const categories = [
  "All",
  "Hair & Color",
  "Wellness & Spa",
  "Makeup & Nails",
  "Spa & Massage",
];

const Salons = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredSalons = allSalons.filter((salon) => {
    const matchesSearch =
      salon.name.toLowerCase().includes(search.toLowerCase()) ||
      salon.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || salon.specialty === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* Header */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Discover Salons
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find and book appointments at the best salons near you
            </p>
          </div>

          {/* Search & Filter */}
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search salons or locations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 bg-background"
                />
              </div>
              <Button variant="outline" size="icon" className="h-12 w-12">
                <Filter className="w-5 h-5" />
              </Button>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground shadow-gold"
                      : "bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Salons Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <p className="text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filteredSalons.length}
              </span>{" "}
              salons
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSalons.map((salon, index) => (
              <motion.div
                key={salon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden group cursor-pointer h-full">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={salon.image}
                      alt={salon.name}
                      width={600}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={salon.openNow ? "default" : "destructive"}
                        className={salon.openNow ? "bg-primary" : "text-white"}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {salon.openNow ? "Open Now" : "Closed"}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{salon.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-gold text-gold" />
                        <span className="font-semibold">{salon.rating}</span>
                        <span className="text-muted-foreground">
                          ({salon.reviews})
                        </span>
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {salon.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {salon.services.map((service) => (
                        <Badge
                          key={service}
                          variant="secondary"
                          className="font-normal"
                        >
                          {service}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full cursor-pointer">
                      Book Appointment
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Salons;
