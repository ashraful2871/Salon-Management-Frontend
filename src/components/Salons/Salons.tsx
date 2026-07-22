/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRouter, useSearchParams } from "next/navigation";

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
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { BANGLADESH_LOCATIONS } from "@/constants/bangladesh-locations";
import SalonCard from "../Shared/SalonCard";



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
  images?: string[];
  operatingHours?: OperatingHours;
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("searchTerm") || "");
  const [divisionFilter, setDivisionFilter] = useState(searchParams.get("division") || "");
  const [districtFilter, setDistrictFilter] = useState(searchParams.get("district") || "");
  const [areaFilter, setAreaFilter] = useState(searchParams.get("area") || "");
  const [activeCategory, setActiveCategory] = useState("All");

  const ALL_DIVISIONS = BANGLADESH_LOCATIONS.map((d) => d.division).sort();
  
  const AVAILABLE_DISTRICTS = useMemo(() => {
    if (!divisionFilter) return [];
    const div = BANGLADESH_LOCATIONS.find((d) => d.division === divisionFilter);
    return div ? div.districts.map((d) => d.district).sort() : [];
  }, [divisionFilter]);

  const AVAILABLE_AREAS = useMemo(() => {
    if (!divisionFilter || !districtFilter) return [];
    const div = BANGLADESH_LOCATIONS.find((d) => d.division === divisionFilter);
    if (!div) return [];
    const dist = div.districts.find((d) => d.district === districtFilter);
    return dist ? [...dist.areas].sort() : [];
  }, [divisionFilter, districtFilter]);

  const updateUrl = (newDiv: string, newDist: string, newArea: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("searchTerm", search);
    else params.delete("searchTerm");
    
    if (newDiv) params.set("division", newDiv);
    else params.delete("division");
    
    if (newDist) params.set("district", newDist);
    else params.delete("district");
    
    if (newArea) params.set("area", newArea);
    else params.delete("area");
    
    router.push(`/salons?${params.toString()}`);
  };

  /** ✅ Normalize your API data into the same fields your UI already expects */
  const normalizedSalons = useMemo(() => {
    return (allSalons || []).map((salon) => {
      const fallbackImage = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop";
      const img = salon.images?.[0]?.trim();
      const firstImage = (
        img && 
        img !== "" && 
        img !== "null" && 
        img !== "undefined" &&
        (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/") || img.startsWith("data:"))
      ) 
        ? img 
        : fallbackImage;

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
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search salons..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 bg-background"
                />
              </div>
              <Button 
                className="h-12 px-8" 
                onClick={() => updateUrl(divisionFilter, districtFilter, areaFilter)}
              >
                Search
              </Button>
            </div>

            {/* Location Filters */}
            <div className="flex flex-col md:flex-row gap-3 mt-2">
              {/* Division */}
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                <Select
                  value={divisionFilter || "all"}
                  onValueChange={(value) => {
                    const newDiv = value === "all" ? "" : value;
                    setDivisionFilter(newDiv);
                    setDistrictFilter("");
                    setAreaFilter("");
                    updateUrl(newDiv, "", "");
                  }}
                >
                  <SelectTrigger className="h-12 w-full bg-background pl-12">
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {ALL_DIVISIONS.map((div) => (
                      <SelectItem key={div} value={div}>{div}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District */}
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none opacity-50" />
                <Select
                  value={districtFilter || "all"}
                  onValueChange={(value) => {
                    const newDist = value === "all" ? "" : value;
                    setDistrictFilter(newDist);
                    setAreaFilter("");
                    updateUrl(divisionFilter, newDist, "");
                  }}
                  disabled={!divisionFilter}
                >
                  <SelectTrigger className="h-12 w-full bg-background pl-12">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {AVAILABLE_DISTRICTS.map((dist) => (
                      <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Area */}
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none opacity-50" />
                <Select
                  value={areaFilter || "all"}
                  onValueChange={(value) => {
                    const newArea = value === "all" ? "" : value;
                    setAreaFilter(newArea);
                    updateUrl(divisionFilter, districtFilter, newArea);
                  }}
                  disabled={!districtFilter}
                >
                  <SelectTrigger className="h-12 w-full bg-background pl-12">
                    <SelectValue placeholder="Select Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {AVAILABLE_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <SalonCard key={salon.id} salon={salon} index={index} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Salons;
