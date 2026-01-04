"use client";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "../ui/card";

const Services = () => {
  const featuredSalons = [
    {
      id: 1,
      name: "Luxe Hair Studio",
      location: "Downtown Manhattan",
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
    },
    {
      id: 2,
      name: "Serenity Spa & Salon",
      location: "Brooklyn Heights",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80",
    },
    {
      id: 3,
      name: "The Beauty Bar",
      location: "Upper East Side",
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=400&q=80",
    },
  ];
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Featured Salons
            </h2>
            <p className="text-muted-foreground">
              Hand-picked salons loved by our community
            </p>
          </div>
          <Button variant="outline" asChild className="mt-4 md:mt-0">
            <Link href="/salons">
              View All Salons
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {featuredSalons.map((salon, index) => (
            <motion.div
              key={salon.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden group cursor-pointer py-0">
                <div className="relative h-60 overflow-hidden ">
                  <Image
                    fill
                    src={salon.image}
                    alt={salon.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                    <h3 className="font-serif text-xl font-semibold mb-1">
                      {salon.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm opacity-90">
                        <MapPin className="h-4 w-4" />
                        {salon.location}
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <Star fill="gold" className="h-4 w-4 text-yellow-400" />
                        {salon.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
