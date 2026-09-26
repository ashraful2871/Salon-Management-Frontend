import { motion } from "framer-motion";
import { Clock, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatRating } from "@/lib/rating";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface SalonCardProps {
  salon: {
    id: string;
    name: string;
    rating: number;
    reviews: number;
    location: string;
    image: string;
    services: string[];
    // null: the salon has not listed its hours, so say nothing rather than "Closed".
    openNow: boolean | null;
  };
  index: number;
  // Preformatted by formatDistance; a leading "~" marks an approximate pin.
  distance?: string;
}

const SalonCard = ({ salon, index, distance }: SalonCardProps) => {
  const approximate = distance?.startsWith("~") ?? false;


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="overflow-hidden group cursor-pointer h-full flex flex-col">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={salon.image}
            alt={salon.name}
            width={600}
            height={400}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {distance && (
            <div className="absolute top-3 left-3">
              <Badge
                variant="secondary"
                title={
                  approximate
                    ? "Approximate location. The salon hasn't pinned its exact spot yet."
                    : undefined
                }
                className="bg-white/90 text-charcoal shadow-sm backdrop-blur-sm"
              >
                <MapPin className="h-3 w-3 mr-1 text-gold" />
                {distance}
                {approximate && (
                  <span className="sr-only"> (approximate location)</span>
                )}
              </Badge>
            </div>
          )}
          {salon.openNow !== null && (
            <div className="absolute top-3 right-3">
              <Badge
                variant={salon.openNow ? "default" : "destructive"}
                className={salon.openNow ? "bg-primary" : "text-white"}
              >
                <Clock className="h-3 w-3 mr-1" />
                {salon.openNow ? "Open Now" : "Closed"}
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl min-w-0">{salon.name}</CardTitle>
            {salon.reviews > 0 ? (
              <div
                className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-sm"
                aria-label={`Rated ${formatRating(salon.rating)} out of 5 from ${salon.reviews} review${salon.reviews === 1 ? "" : "s"}`}
              >
                <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
                <span className="font-semibold text-foreground">
                  {formatRating(salon.rating)}
                </span>
                <span className="text-xs text-muted-foreground" aria-hidden="true">
                  ({salon.reviews})
                </span>
              </div>
            ) : (
              <span className="mt-0.5 shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                New
              </span>
            )}
          </div>
          <CardDescription className="flex items-center gap-1 line-clamp-1">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{salon.location}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 justify-between gap-4 mt-auto">
          <div className="flex flex-wrap gap-2">
            {salon.services.slice(0, 3).map((service) => (
              <Badge
                key={service}
                variant="secondary"
                className="font-normal"
              >
                {service}
              </Badge>
            ))}
            {salon.services.length > 3 && (
              <Badge variant="secondary" className="font-normal">
                +{salon.services.length - 3} more
              </Badge>
            )}
          </div>
          <Link href={`/salons/${salon.id}`} className="mt-auto block">
            <Button className="w-full cursor-pointer">
              Book Appointment
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SalonCard;
