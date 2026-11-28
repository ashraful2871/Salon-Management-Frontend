"use client";

import type { ComponentType, SVGProps } from "react";
import { MessageSquareText, Share2 } from "lucide-react";

import { useMounted } from "@/components/Salons/useMounted";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { FacebookIcon, MessengerIcon, WhatsAppIcon } from "./brand-icons";

type LinkChannel = "whatsapp" | "messenger" | "facebook" | "sms";

/** On the charcoal hero: a light outline pill that keeps AA on the dark ground. */
export const ON_DARK = "border-white/30 bg-white/10 text-cream hover:bg-white/20 hover:text-cream";

const enc = encodeURIComponent;

/** Phones and tablets: the Messenger app link only opens there. iPadOS reports a Mac with touch. */
const isPhone = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

const CHANNELS: Record<
  LinkChannel,
  {
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    href: (message: string, link: string) => string;
    /** A web page opens in a new tab; an app link (`sms:`, `fb-messenger:`) opens the app. */
    web: boolean;
  }
> = {
  whatsapp: { label: "Share on WhatsApp", icon: WhatsAppIcon, href: (m) => `https://wa.me/?text=${enc(m)}`, web: true },
  messenger: { label: "Messenger", icon: MessengerIcon, href: (_, l) => `fb-messenger://share/?link=${enc(l)}`, web: false },
  facebook: {
    label: "Facebook",
    icon: FacebookIcon,
    href: (_, l) => `https://www.facebook.com/sharer/sharer.php?u=${enc(l)}`,
    web: true,
  },
  sms: { label: "SMS", icon: MessageSquareText, href: (m) => `sms:?&body=${enc(m)}`, web: false },
};

/** One share link as a pill: WhatsApp is the primary, widest one; the rest are secondary. 44 px or more. */
export function ShareLink({
  channel,
  message,
  link,
  className,
  onDark = false,
}: {
  channel: LinkChannel;
  message: string;
  link: string;
  className?: string;
  /** On the charcoal hero: the secondary pills turn light-on-dark. */
  onDark?: boolean;
}) {
  const { label, icon: Icon, href, web } = CHANNELS[channel];
  const primary = channel === "whatsapp";
  return (
    <Button
      asChild
      size={primary ? "xl" : "lg"}
      variant={primary ? "default" : "secondary"}
      className={cn(primary ? "h-12 sm:px-7" : "px-5", !primary && onDark && ON_DARK, className)}
    >
      <a
        href={href(message, link)}
        {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        onClick={() => track("referral_share", `channel:${channel}`)}
      >
        <Icon className={primary ? "size-5" : "size-4"} />
        {label}
        {web && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    </Button>
  );
}

/**
 * The share row: WhatsApp first and widest, then Messenger (phones only),
 * Facebook, SMS and "More…", the system share sheet (only where the browser
 * has one). Each counts a `referral_share` with its channel.
 */
export function ShareButtons({
  message,
  link,
  className,
  onDark = false,
}: {
  message: string;
  link: string;
  className?: string;
  onDark?: boolean;
}) {
  const mounted = useMounted();
  const phone = mounted && isPhone();
  const canShare = mounted && typeof navigator.share === "function";

  const nativeShare = async () => {
    try {
      await navigator.share({ text: message });
      track("referral_share", "channel:native");
    } catch {
      // Closed the sheet, or the browser refused: nothing to report.
    }
  };

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center", className)}>
      <ShareLink channel="whatsapp" message={message} link={link} className="col-span-2" />
      {phone && <ShareLink channel="messenger" message={message} link={link} onDark={onDark} />}
      <ShareLink channel="facebook" message={message} link={link} onDark={onDark} />
      <ShareLink channel="sms" message={message} link={link} onDark={onDark} />
      {canShare && (
        <Button type="button" size="lg" variant="secondary" className={cn("px-5", onDark && ON_DARK)} onClick={nativeShare}>
          <Share2 aria-hidden="true" />
          More…
        </Button>
      )}
    </div>
  );
}
