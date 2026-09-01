"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";

import { TrimlyButton } from "@/components/ui/TrimlyButton";

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/assets/banner-img1.png)",
            backgroundColor: "#1a1a1a",
          }}
        />
        <div className="absolute inset-0 bg-charcoal/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
      </div>

      {/* Decorative shapes */}
      <div className="absolute top-1/3 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 py-24">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-3xl"
        >
          <motion.p
            variants={item}
            className="inline-flex items-center gap-3 px-5 py-2 bg-primary/15 border border-primary/40 text-primary rounded-full text-sm uppercase tracking-widest mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary" />
            Premier Grooming Studio
          </motion.p>

          <motion.h1
            variants={item}
            className="text-6xl md:text-7xl lg:text-8xl font-heading font-semibold leading-[0.95] text-white mb-6"
          >
            Sharp Looks.
            <br />
            <span className="text-primary">Timeless</span> Style.
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg md:text-xl text-white/75 mb-10 max-w-xl leading-relaxed"
          >
            Expert barbers and stylists crafting precision cuts, classic
            shaves, and modern grooming experiences tailored to you.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
            <TrimlyButton asChild size="lg">
              <a href="#book">Book Appointment</a>
            </TrimlyButton>
            <TrimlyButton asChild variant="outlineLight" size="lg">
              <Link href="/about">Our Services</Link>
            </TrimlyButton>
          </motion.div>

          <motion.div
            variants={item}
            className="flex items-center gap-10 mt-14 pt-8 border-t border-white/15"
          >
            <div>
              <div className="text-3xl font-heading font-semibold text-primary">
                15+
              </div>
              <div className="text-sm text-white/60 uppercase tracking-wider">
                Years of Trust
              </div>
            </div>
            <div>
              <div className="text-3xl font-heading font-semibold text-primary">
                20k+
              </div>
              <div className="text-sm text-white/60 uppercase tracking-wider">
                Happy Clients
              </div>
            </div>
            <div>
              <div className="text-3xl font-heading font-semibold text-primary">
                4.9
              </div>
              <div className="text-sm text-white/60 uppercase tracking-wider">
                Average Rating
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
