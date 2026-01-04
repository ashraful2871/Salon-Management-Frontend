import { Button } from "@/components/ui/button";

import { Heart, Users, Award, Target, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const stats = [
  { value: "500+", label: "Partner Salons" },
  { value: "50K+", label: "Happy Clients" },
  { value: "4.9", label: "Average Rating" },
  { value: "10+", label: "Cities" },
];

const values = [
  {
    icon: Heart,
    title: "Passion for Beauty",
    description:
      "We believe everyone deserves to feel beautiful. Our platform connects you with passionate professionals who share this vision.",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "We've built a thriving community of salon owners, stylists, and beauty enthusiasts who support each other.",
  },
  {
    icon: Award,
    title: "Excellence Always",
    description:
      "Every salon on our platform is carefully vetted to ensure they meet our high standards of quality and service.",
  },
  {
    icon: Target,
    title: "Innovation Driven",
    description:
      "We continuously improve our technology to make booking and managing appointments seamless for everyone.",
  },
];

const team = [
  {
    name: "Sarah Chen",
    role: "CEO & Founder",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
  },
  {
    name: "Michael Rodriguez",
    role: "CTO",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
  },
  {
    name: "Emily Johnson",
    role: "Head of Operations",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
  },
  {
    name: "David Kim",
    role: "Head of Partnerships",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
  },
];

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              About Us
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
              Redefining the
              <br />
              <span className="text-primary">Beauty Experience</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              We started Glamour with a simple mission: make it easy for
              everyone to discover and book amazing salon services. Today, we
              are proud to connect thousands of clients with top-rated salons
              every day.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Glamour was born from a frustrating experience. Our founder,
                  Sarah, spent hours trying to find a reliable salon in a new
                  city. She realized there had to be a better way.
                </p>
                <p>
                  In 2020, we launched Glamour with just 10 partner salons.
                  Today, we work with over 500 salons across 10+ cities, helping
                  thousands of clients look and feel their best every day.
                </p>
                <p>
                  Our platform does not just help clients book appointments—it
                  empowers salon owners with powerful management tools,
                  analytics, and a steady stream of new customers.
                </p>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <Image
                src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=500&fit=crop"
                alt="Salon interior"
                className="rounded-2xl shadow-card"
                width={600}
                height={500}
              />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-2xl -z-10" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gold/20 rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we do at Glamour
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-card transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Meet Our Team
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The passionate people behind Glamour
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <div
                key={member.name}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 relative inline-block">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={400}
                    height={300}
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-background shadow-card"
                  />
                </div>
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#26211C]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
            Join Our Growing Community
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Whether your a client looking for your next favorite salon or a
            salon owner ready to grow your business, we would love to have you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gold" size="xl" asChild>
              <Link href="/salons">
                Find a Salon
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="/contact">Partner With Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
