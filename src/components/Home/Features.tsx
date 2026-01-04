import { Clock, Shield, Sparkles, Star } from "lucide-react";
import React from "react";

const Features = () => {
  const features = [
    {
      icon: Sparkles,
      title: "Premium Services",
      description:
        "Curated selection of top-rated salons with verified reviews",
    },
    {
      icon: Clock,
      title: "Easy Booking",
      description:
        "Book appointments in seconds, manage your schedule effortlessly",
    },
    {
      icon: Star,
      title: "Trusted Quality",
      description:
        "All salons vetted for quality, hygiene, and customer satisfaction",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description:
        "Safe and seamless payment options for worry-free transactions",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Why Choose Glamour?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We connect you with the best salons and make booking a breeze
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#F3ECE0] flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[#BD7F28]" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
