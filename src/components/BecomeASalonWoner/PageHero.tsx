"use client";
import React from "react";
import { Button } from "../ui/button";
import { ArrowRight, Clock3, Sparkles, Users } from "lucide-react";

function useAuthMock() {
  const [loading] = React.useState(false);
  const [user] = React.useState<{
    id: string;
    name?: string;
    email?: string;
  } | null>({
    id: "user_123",
    name: "Admin",
    email: "admin@example.com",
  });
  return { user, loading };
}

const PageHero = () => {
  const { user, loading } = useAuthMock();
  const isAuthed = !!user && !loading;
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            Become a Salon Owner
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
            Grow your salon with
            <br />
            <span className="text-primary">more bookings</span> and loyal
            customers
          </h1>

          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Join our platform to get discovered, manage appointments, and build
            a premium brand presence—without the hassle.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="gold"
              size="lg"
              onClick={() =>
                document
                  .getElementById("apply")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Apply Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            {!isAuthed ? (
              <Button variant="outline" size="lg">
                Login to Apply
              </Button>
            ) : (
              <Button variant="outline" size="lg">
                View Partner Guidelines
              </Button>
            )}
          </div>

          {/* quick highlights pills */}
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-soft">
              <Sparkles className="h-4 w-4 text-primary" />
              Premium visibility
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-soft">
              <Clock3 className="h-4 w-4 text-primary" />
              Faster scheduling
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-soft">
              <Users className="h-4 w-4 text-primary" />
              Repeat customers
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageHero;
