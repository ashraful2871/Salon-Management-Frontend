"use client";
import React from "react";
import { Badge } from "../ui/badge";
import { BadgeCheck, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-background border border-border shadow-soft">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

const PageFeatures = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              Why partner with Glamour?
            </h2>

            <div className="grid gap-4">
              <Feature
                icon={<Sparkles className="w-5 h-5 text-primary" />}
                title="Get discovered"
                desc="Your salon appears in search with a verified badge and premium profile."
              />
              <Feature
                icon={<Clock3 className="w-5 h-5 text-primary" />}
                title="Easy booking"
                desc="Customers book in seconds. You control services, staff, and availability."
              />
              <Feature
                icon={<ShieldCheck className="w-5 h-5 text-primary" />}
                title="Secure flow"
                desc="Payments, cancellations, and communication handled smoothly."
              />
            </div>

            <div className="mt-8 flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">
                Verified
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <BadgeCheck className="h-4 w-4" />
                Trusted Partners
              </Badge>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="rounded-2xl overflow-hidden border border-border shadow-card">
              <Image
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1400&q=80"
                alt="Salon interior"
                width={600}
                height={420}
                className="w-full h-[420px] object-cover"
                loading="lazy"
              />
            </div>

            {/* decorative shapes like your About page */}
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-2xl -z-10" />
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gold/20 rounded-full -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageFeatures;
