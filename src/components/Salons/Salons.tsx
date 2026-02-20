/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "framer-motion";
import { Clock, Filter, MapPin, Search, Star } from "lucide-react";
import React, { useMemo, useState } from "react";
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

/** ✅ Your API types */
type OperatingHour = { open: string; close: string };
type OperatingHours = Partial<
  Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    OperatingHour
  >
>;

type SalonService = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  duration?: number | null;
  images?: string[];
  isActive?: boolean;
};

type Salon = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  images?: string[]; // may be empty
  operatingHours?: OperatingHours;
  status?: "ACTIVE" | "INACTIVE";
  rating?: number;
  totalReviews?: number;
  services?: SalonService[];
};

const dayKey = (d: number) => {
  // JS: 0=Sun ... 6=Sat
  const map = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  return map[d];
};

const timeToMinutes = (t: string) => {
  // "09:00"
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
};

const isOpenNow = (operatingHours?: OperatingHours) => {
  if (!operatingHours) return false;

  const now = new Date();
  const key = dayKey(now.getDay());
  const today = operatingHours[key];
  if (!today?.open || !today?.close) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = timeToMinutes(today.open);
  const closeMinutes = timeToMinutes(today.close);

  // normal same-day range (e.g., 09:00 -> 21:00)
  if (closeMinutes >= openMinutes) {
    return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
  }

  // overnight range (e.g., 20:00 -> 02:00)
  return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
};

const Salons = ({ allSalons }: { allSalons: Salon[] }) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  /** ✅ Normalize your API data into the same fields your UI already expects */
  const normalizedSalons = useMemo(() => {
    return (allSalons || []).map((salon) => {
      const firstImage =
        salon.images?.[0] ||
        // fallback placeholder (keeps design stable even if images: [])
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop";

      const services = (salon.services || [])
        .filter((s) => s?.isActive !== false)
        .map((s) => s.name);

      // Category/specialty: use first service category if exists, else "Salon"
      const specialty = (
        salon.services?.find((s) => s.category)?.category ?? "Salon"
      ).replaceAll("_", " ");

      const locationParts = [salon.city, salon.state].filter(Boolean);
      const location = locationParts.length
        ? locationParts.join(", ")
        : salon.address || "Unknown";

      return {
        id: salon.id,
        name: salon.name,
        rating: salon.rating ?? 0,
        reviews: salon.totalReviews ?? 0,
        specialty, // used for filter categories
        location,
        image: firstImage,
        services: services.length ? services : ["Service"], // keep badges visible
        openNow: isOpenNow(salon.operatingHours),
      };
    });
  }, [allSalons]);

  /** ✅ Build categories from your API (still same UI) */
  const categories = useMemo(() => {
    const set = new Set<string>();
    normalizedSalons.forEach((s) => set.add(s.specialty));
    return ["All", ...Array.from(set)];
  }, [normalizedSalons]);

  const filteredSalons = normalizedSalons.filter((salon) => {
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
