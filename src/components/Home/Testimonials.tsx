import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Regular Client",
    content:
      "Absolutely love this platform! I found an amazing salon near me and booked an appointment in minutes. The whole experience was seamless.",
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
      "Being part of this platform has transformed my business. I have gained so many new clients and the booking management is a breeze.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-cream">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-gold uppercase tracking-widest">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mt-3 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-charcoal-light max-w-2xl mx-auto">
            Hear from thousands of satisfied customers who trust us for their
            beauty needs.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white rounded-2xl p-8 border border-border shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex gap-1 mb-5">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-gold text-gold"
                  />
                ))}
              </div>
              <p className="text-charcoal-light leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-white font-semibold text-sm">
                  {testimonial.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-semibold text-charcoal text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-charcoal-light text-xs">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
