import { Phone } from "lucide-react";

const Topbar = () => {
  return (
    <div className="bg-primary text-white text-sm">
      <div className="container mx-auto px-4 h-10 flex items-center justify-between">
        <p className="font-heading tracking-wider uppercase text-base leading-none">
          Flat 15% Off On All Services This Week
        </p>
        <a
          href="tel:+123456789"
          className="hidden sm:flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Phone className="w-4 h-4" />
          <span>+1 234 567 890</span>
        </a>
      </div>
    </div>
  );
};

export default Topbar;
