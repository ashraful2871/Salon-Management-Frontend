import { Star, Quote, ChevronRight } from "lucide-react";

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
    <div className="flex gap-1.5">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-gold text-gold" />
      ))}
    </div>
  );
}

function QuoteCard({
  testimonial,
  featured = false,
  index,
}: {
  testimonial: Testimonial;
  featured?: boolean;
  index: number;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 group ${
        featured ? "p-10 lg:p-12 md:col-span-2" : "p-8 lg:p-10"
      }`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-start justify-between mb-8">
            <StarRating rating={testimonial.rating} />
            <Quote className="w-8 h-8 text-slate-200 group-hover:text-primary/20 transition-colors duration-500" />
          </div>
          <p
            className={`text-slate-600 leading-relaxed font-medium ${
              featured ? "text-xl lg:text-2xl" : "text-lg"
            }`}
          >
            "{testimonial.content}"
          </p>
        </div>
        
        <div className="flex items-center gap-4 pt-8 mt-8 border-t border-slate-100">
          <div className="w-12 h-12 rounded-full border-2 border-slate-100 overflow-hidden relative shadow-sm">
            <img src={`https://i.pravatar.cc/150?img=${index + 20}`} alt={testimonial.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold font-display text-slate-900 text-lg">
              {testimonial.name}
            </p>
            <p className="text-primary font-semibold text-sm">{testimonial.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const Testimonials = () => {
  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden border-t border-slate-200">
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-rose/10 rounded-full blur-[150px] mix-blend-multiply pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div>
            <span className="inline-block py-1 px-3 rounded-full bg-white border border-slate-200 text-xs font-bold text-primary uppercase tracking-widest mb-4 shadow-sm">
              Real Stories
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-slate-900 tracking-tight">
              What Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gold">Clients Say</span>
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-4">
              <button className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                  <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <button className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition-all shadow-premium">
                  <ChevronRight className="w-6 h-6" />
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuoteCard testimonial={testimonials[0]} featured index={0} />
          <QuoteCard testimonial={testimonials[1]} index={1} />
          <div className="md:col-span-2 lg:col-span-3">
            <QuoteCard testimonial={testimonials[2]} index={2} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
