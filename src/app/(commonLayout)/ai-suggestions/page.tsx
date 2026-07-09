import AiSearchInterface from "@/components/AI-Suggestions/AiSearchInterface";

export const metadata = {
  title: "AI Salon Match | Glamour",
  description: "Find your perfect salon with our AI-powered suggestions.",
};

export default function AiSuggestionsPage() {
  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      {/* Page Header */}
      <section className="container mx-auto px-4 mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
          Meet Your AI Stylist
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Describe what you&apos;re looking for, and our smart AI will find the perfect salons and services for you instantly.
        </p>
      </section>

      {/* Main Interface */}
      <section className="container mx-auto px-4">
        <AiSearchInterface />
      </section>
    </div>
  );
}
