import { Star } from "lucide-react";

const Marquee = () => {
  const items = [
    "Premium Haircuts",
    "Luxury Bridal Makeup",
    "Advanced Skincare",
    "Relaxing Massage",
    "Nail Art & Care",
    "Color & Highlights",
    "Keratin Treatment",
    "Spa Pedicure",
  ];

  return (
    <div className="w-full bg-white border-y border-slate-200 overflow-hidden py-4 flex items-center shadow-sm relative z-10">
      {/* Gradients for smooth fade effect at edges */}
      <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      {/* Marquee Content Container */}
      <div className="flex whitespace-nowrap animate-marquee">
        {/* We duplicate the array multiple times to ensure seamless infinite scrolling */}
        {[...items, ...items, ...items, ...items].map((item, index) => (
          <div key={index} className="flex items-center mx-6">
            <span className="text-sm font-semibold text-slate-800 uppercase tracking-widest">{item}</span>
            <Star className="w-4 h-4 mx-6 text-gold fill-gold" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
