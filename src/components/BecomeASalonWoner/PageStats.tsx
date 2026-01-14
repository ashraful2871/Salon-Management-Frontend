"use client";
import React from "react";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center animate-slide-up">
      <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">
        {value}
      </div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}

const PageStats = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <Stat value="500+" label="Partner salons" />
          <Stat value="50K+" label="Happy customers" />
          <Stat value="200K+" label="Bookings made" />
          <Stat value="4.8★" label="Average rating" />
        </div>
      </div>
    </section>
  );
};

export default PageStats;
