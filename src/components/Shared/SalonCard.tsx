import { motion } from "framer-motion";
import { Clock, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
    openNow: boolean;
  };
  index: number;
}

const SalonCard = ({ salon, index }: SalonCardProps) => {
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
            <div className="flex items-center gap-1 text-sm shrink-0">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="font-semibold">{salon.rating}</span>
              <span className="text-muted-foreground">
                ({salon.reviews})
              </span>
            </div>
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
