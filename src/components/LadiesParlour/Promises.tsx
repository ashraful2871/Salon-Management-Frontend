import { PROMISES } from "./content";

/**
 * Four promises in a thin band under the hero: two by two below lg, one row
 * from lg, with the icon beside the text once there is room for it (xl).
 */
export default function Promises() {
  return (
    <section aria-label="Why book here" className="border-y border-border/60 bg-surface">
      <ul className="container mx-auto grid grid-cols-2 gap-x-4 gap-y-8 px-4 py-9 sm:px-6 lg:grid-cols-4 lg:gap-0 lg:px-8 lg:py-10">
        {PROMISES.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            className="flex flex-col items-center gap-3 text-center lg:border-l lg:border-border/60 lg:px-5 lg:first:border-l-0 xl:flex-row xl:items-start xl:gap-4 xl:px-8 xl:text-left xl:first:pl-0 xl:last:pr-0"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/30 bg-primary-soft text-primary-hover">
              <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span>
              <span className="block font-display text-[15px] font-semibold text-foreground">
                {title}
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                {text}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
