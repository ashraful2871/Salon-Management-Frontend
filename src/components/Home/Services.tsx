import { Scissors, Sparkles, Flower2, Heart, Palette, Crown } from "lucide-react";

const services = [
  {
    icon: Scissors,
    title: "Haircut & Styling",
    description:
      "Professional cuts, styling, and treatments by expert stylists using premium products.",
    accent: "from-gold/20 to-gold/5",
    iconBg: "bg-gold/10",
    iconColor: "text-gold",
  },
  {
    icon: Sparkles,
    title: "Nail Care",
    description:
      "Manicure, pedicure, and nail art services with the latest trends and techniques.",
    accent: "from-rose/20 to-rose/5",
    iconBg: "bg-rose/10",
    iconColor: "text-rose",
  },
  {
    icon: Flower2,
    title: "Facial & Skincare",
    description:
      "Rejuvenating facials and customized skincare treatments for a radiant glow.",
    accent: "from-sage/20 to-sage/5",
    iconBg: "bg-sage/10",
    iconColor: "text-sage",
  },
  {
    icon: Heart,
    title: "Massage Therapy",
    description:
      "Relaxing massages to relieve stress and tension, tailored to your needs.",
    accent: "from-rose/20 to-rose/5",
    iconBg: "bg-rose/10",
    iconColor: "text-rose",
  },
  {
    icon: Palette,
    title: "Makeup Artistry",
    description:
      "Professional makeup for any occasion, from natural to glamorous styles.",
    accent: "from-gold/20 to-gold/5",
    iconBg: "bg-gold/10",
    iconColor: "text-gold",
  },
  {
    icon: Crown,
    title: "Bridal Packages",
    description:
      "Complete bridal beauty packages including hair, makeup, and trial sessions.",
    accent: "from-sage/20 to-sage/5",
    iconBg: "bg-sage/10",
    iconColor: "text-sage",
  },
];

const Services = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest">
            Our Services
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mt-3 mb-4">
            Premium Beauty Services
          </h2>
          <p className="text-charcoal-light max-w-2xl mx-auto">
            From classic cuts to luxury bridal packages, we offer a full range
            of professional beauty services.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="group relative bg-card rounded-2xl border border-border p-8 hover:shadow-card transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
                <div className="relative z-10">
                  <div
                    className={`w-14 h-14 rounded-xl ${service.iconBg} flex items-center justify-center mb-5`}
                  >
                    <Icon className={`w-7 h-7 ${service.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-charcoal mb-3">
                    {service.title}
                  </h3>
                  <p className="text-charcoal-light leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
