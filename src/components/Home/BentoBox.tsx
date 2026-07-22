import {
  Scissors,
  Sparkles,
  Flower2,
  Heart,
  Palette,
  Crown,
  Clock,
  Star,
} from "lucide-react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-soft hover:scale-[1.02] hover:shadow-card transition-all duration-300 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-rose/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface FeatureCardProps {
  icon: typeof Star;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <GlassCard className="p-6">
      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-cream mb-2">{title}</h3>
      <p className="text-sm text-cream/60 leading-relaxed">{description}</p>
    </GlassCard>
  );
}

interface ServiceCardProps {
  icon: typeof Scissors;
  title: string;
  description: string;
  className?: string;
}

function ServiceCard({
  icon: Icon,
  title,
  description,
  className = "",
}: ServiceCardProps) {
  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gold-light" />
      </div>
      <h3 className="text-lg font-semibold text-cream mb-2">{title}</h3>
      <p className="text-sm text-cream/60 leading-relaxed">{description}</p>
    </GlassCard>
  );
}

const features = [
  {
    icon: Star,
    title: "Premium Services",
    description:
      "Curated selection of top-rated salons with verified reviews and quality guarantees.",
  },
  {
    icon: Clock,
    title: "Easy Booking",
    description:
      "Book appointments in seconds, manage your schedule effortlessly.",
  },
] as const;

const services = [
  {
    icon: Scissors,
    title: "Haircut & Styling",
    description:
      "Professional cuts, styling, and treatments by expert stylists using premium products.",
  },
  {
    icon: Sparkles,
    title: "Nail Care",
    description:
      "Manicure, pedicure, and nail art with the latest trends and techniques.",
  },
  {
    icon: Flower2,
    title: "Facial & Skincare",
    description:
      "Rejuvenating facials and customized skincare treatments for a radiant glow.",
  },
  {
    icon: Heart,
    title: "Massage Therapy",
    description:
      "Relaxing massages to relieve stress and tension, tailored to your needs.",
  },
  {
    icon: Palette,
    title: "Makeup Artistry",
    description:
      "Professional makeup for any occasion, from natural to glamorous styles.",
  },
] as const;

const BentoBox = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-[#1a1a1a] to-charcoal relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/3 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest">
            What We Offer
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-cream mt-3 mb-4">
            Premium Salon Experience
          </h2>
          <p className="text-cream/60 max-w-2xl mx-auto">
            From classic cuts to luxury bridal packages, discover everything we
            offer at your fingertips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          <div className="md:col-span-2 lg:row-span-2 relative overflow-hidden rounded-3xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-soft hover:scale-[1.01] hover:shadow-card transition-all duration-500 p-8 lg:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-rose/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mb-6 shadow-gold">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-cream mb-4">
                  Why Choose Us
                </h3>
                <p className="text-cream/60 max-w-lg leading-relaxed">
                  We connect you with the finest salons and make booking a
                  breeze. Experience luxury beauty services tailored just for
                  you.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/10">
                <div>
                  <div className="text-2xl font-bold text-gold">500+</div>
                  <div className="text-xs text-cream/50">Partner Salons</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gold">50K+</div>
                  <div className="text-xs text-cream/50">Happy Clients</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gold">4.8★</div>
                  <div className="text-xs text-cream/50">Average Rating</div>
                </div>
              </div>
            </div>
          </div>

          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}

          {services.slice(0, 3).map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}

          <ServiceCard
            icon={services[3].icon}
            title={services[3].title}
            description={services[3].description}
            className="lg:col-span-2"
          />

          <ServiceCard
            icon={services[4].icon}
            title={services[4].title}
            description={services[4].description}
          />
        </div>
      </div>
    </section>
  );
};

export default BentoBox;
