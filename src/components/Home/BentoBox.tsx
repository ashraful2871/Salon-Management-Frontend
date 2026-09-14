import Image from "next/image";
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
      className={`group relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ${className}`}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

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
    <GlassCard className="p-8">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex items-center justify-center mb-6">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-xl font-bold font-display text-slate-900 mb-3">
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed font-medium">
        {description}
      </p>
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
    <GlassCard className={`p-8 ${className}`}>
      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 shadow-sm">
          <Icon className="w-5 h-5 text-slate-700 group-hover:text-primary" />
        </div>
        <div className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-500 shadow-sm">
          <span className="text-primary font-bold text-xs">↗</span>
        </div>
      </div>
      <h3 className="text-lg font-bold font-display text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed font-medium">
        {description}
      </p>
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
      "Book appointments in seconds, manage your schedule effortlessly on any device.",
  },
] as const;

const services = [
  {
    icon: Scissors,
    title: "Haircut & Styling",
    description: "Professional cuts by expert stylists.",
  },
  {
    icon: Sparkles,
    title: "Nail Care",
    description: "Manicure, pedicure, and nail art.",
  },
  {
    icon: Flower2,
    title: "Facial & Skin",
    description: "Rejuvenating customized skincare.",
  },
  {
    icon: Heart,
    title: "Massage",
    description: "Relaxing stress relief therapy.",
  },
  {
    icon: Palette,
    title: "Makeup",
    description: "Professional event makeup.",
  },
] as const;

const BentoBox = () => {
  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[150px] mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-rose/10 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Modern Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3 rounded-full bg-white border border-slate-200 text-xs font-bold text-primary uppercase tracking-widest mb-4 shadow-sm">
              What We Offer
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-slate-900 tracking-tight">
              Premium Salon{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold">
                Experience
              </span>
            </h2>
          </div>
          <p className="text-slate-600 max-w-sm leading-relaxed font-medium">
            From classic cuts to luxury bridal packages, discover everything we
            offer through our network of elite professionals.
          </p>
        </div>

        {/* True Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Main Hero Card (Spans 2x2) */}
          <div className="md:col-span-2 lg:row-span-2 relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-700 p-10 lg:p-12 group">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10" />
            <Image
              src="https://i.ibb.co/VYNrdY4T/hero-salon.jpg"
              alt="Salon Interior"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000 z-0"
            />

            <div className="relative z-20 h-full flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center mb-8 shadow-glow">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl lg:text-4xl font-black font-display text-white mb-4 leading-tight">
                  Why Choose <br />
                  SalonKhuji?
                </h3>
                <p className="text-white/90 max-w-sm leading-relaxed font-medium text-lg drop-shadow-md">
                  We connect you with the finest salons and make booking an
                  absolute breeze.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/30 bg-white/10 p-6 rounded-2xl backdrop-blur-xl">
                <div>
                  <div className="text-3xl font-black font-display text-white">
                    500<span className="text-primary-300">+</span>
                  </div>
                  <div className="text-xs text-white/80 uppercase tracking-wider mt-1 font-semibold">
                    Partners
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black font-display text-white">
                    50K<span className="text-primary-300">+</span>
                  </div>
                  <div className="text-xs text-white/80 uppercase tracking-wider mt-1 font-semibold">
                    Clients
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black font-display text-white">
                    4.8<span className="text-gold">★</span>
                  </div>
                  <div className="text-xs text-white/80 uppercase tracking-wider mt-1 font-semibold">
                    Rating
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Row Features */}
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}

          {/* Bottom Row Services */}
          {services.slice(0, 2).map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>

        {/* Services Marquee / Secondary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {services.slice(2, 5).map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoBox;
