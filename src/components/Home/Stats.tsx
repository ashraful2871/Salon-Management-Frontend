import React from "react";

const Stats = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-[#DFC59F]">Partner Salons</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">50K+</div>
            <div className="text-[#DFC59F]">Happy Customers</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">200K+</div>
            <div className="text-[#DFC59F]">Bookings Made</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">4.8★</div>
            <div className="text-[#DFC59F]">Average Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
