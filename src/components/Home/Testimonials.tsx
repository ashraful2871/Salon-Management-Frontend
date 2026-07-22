import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Johnson",
    role: "Regular Client",
    content:
      "Absolutely love this platform! I found an amazing salon near me and booked an appointment in minutes. The whole experience was seamless from start to finish.",
    rating: 5,
  },
  {
    name: "Emily Davis",
    role: "Bride-to-be",
    content:
      "The bridal package was incredible. My makeup artist understood my vision perfectly and I felt absolutely stunning on my big day.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Salon Owner",
    content:
      "Being part of this platform has transformed my business. I have gained so many new clients and the booking management system is a breeze to use.",
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-gold text-gold" />
      ))}
    </div>
  );
}

function QuoteCard({
  testimonial,
  featured = false,
}: {
  testimonial: Testimonial;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-soft hover:shadow-glow hover:border-gold/30 transition-all duration-500 ${
        featured ? "p-8 lg:p-10" : "p-6 lg:p-8"
      }`}
    >
      <Quote className="absolute top-4 right-4 w-8 h-8 text-gold/10" />
      <div className="relative z-10">
        <StarRating rating={testimonial.rating} />
        <p
          className={`text-cream/80 leading-relaxed mt-4 mb-6 ${
            featured ? "text-base lg:text-lg" : "text-sm"
          }`}
        >
          &ldquo;{testimonial.content}&rdquo;
        </p>
        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {testimonial.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <p className="font-semibold text-cream text-sm">
              {testimonial.name}
            </p>
            <p className="text-cream/50 text-xs">{testimonial.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const Testimonials = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-charcoal to-[#1a1a1a] relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-cream mt-3 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-cream/60 max-w-2xl mx-auto">
            Hear from thousands of satisfied customers who trust us for their
            beauty needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 lg:col-span-2">
            <QuoteCard testimonial={testimonials[0]} featured />
          </div>
          <div>
            <QuoteCard testimonial={testimonials[1]} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <QuoteCard testimonial={testimonials[2]} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
