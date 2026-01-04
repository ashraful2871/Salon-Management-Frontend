import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";

const Services = () => {
  const featuredSalons = [
    {
      id: 1,
      name: "Luxe Hair Studio",
      rating: 4.9,
      reviews: 234,
      specialty: "Hair & Color",
      image:
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      name: "Serenity Spa",
      rating: 4.8,
      reviews: 189,
      specialty: "Wellness & Spa",
      image:
        "https://plus.unsplash.com/premium_photo-1661780553870-091aaf88d9cc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fFNlcmVuaXR5JTIwU3BhfGVufDB8fDB8fHww",
    },
    {
      id: 3,
      name: "Glow Beauty Bar",
      rating: 4.9,
      reviews: 312,
      specialty: "Makeup & Nails",
      image:
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredSalons.map((salon) => (
            <Link
              key={salon.id}
              href={`/salons/${salon.id}`}
              className="group rounded-2xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-card transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <Image
                  src={salon.image}
                  alt={salon.name}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {salon.specialty}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                  {salon.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  <span className="font-medium text-foreground">
                    {salon.rating}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    ({salon.reviews} reviews)
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
