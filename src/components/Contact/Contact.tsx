"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { useState } from "react";

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    value: "hello@glamour.com",
    description: "We respond within 24 hours",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+1 (555) 123-4567",
    description: "Mon-Fri, 9am-6pm PST",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: "123 Beauty Lane, Suite 100",
    description: "Los Angeles, CA 90210",
  },
  {
    icon: Clock,
    title: "Business Hours",
    value: "Monday - Friday",
    description: "9:00 AM - 6:00 PM PST",
  },
];

export default function Contact() {
  // const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // toast({
    //   title: "Message Sent!",
    //   description: "We will get back to you within 24 hours.",
    // });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <>
      {/* Hero */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Get In Touch
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
              We would Love to
              <br />
              <span className="text-primary">Hear From You</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Have a question, feedback, or want to partner with us? Reach out
              and we will get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div
                key={info.title}
                className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-card transition-all duration-300 text-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {info.title}
                </h3>
                <p className="text-primary font-medium mb-1">{info.value}</p>
                <p className="text-sm text-muted-foreground">
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="animate-slide-up">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                Send Us a Message
              </h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form and our team will get back to you within 24
                hours. We are here to help with any questions about our
                platform, partnerships, or support.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-semibold text-sm">
                      1
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Quick Response
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      We typically respond within 24 hours on business days.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-semibold text-sm">
                      2
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Dedicated Support
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Our team is here to ensure you get the help you need.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-semibold text-sm">
                      3
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Partnership Ready
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Interested in listing your salon? We would love to talk.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 animate-scale-in"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Name
                  </label>
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="h-12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <Input
                  placeholder="How can we help?"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <Textarea
                  placeholder="Tell us more about your inquiry..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  rows={5}
                  className="resize-none"
                />
              </div>
              <Button type="submit" variant="gold" size="lg" className="w-full">
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="h-80 bg-muted relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Map integration coming soon</p>
          </div>
        </div>
      </section>
    </>
  );
}
