import { dhakaToday, formatDay } from "@/components/Dashboard/appointments/format";

// "Now" in Dhaka, worked out on the server so the server and the browser
// render the same greeting and the same "upcoming" booking.
const dhakaNow = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());

const greetingAt = (hhmm: string) => {
  const hour = Number(hhmm.slice(0, 2));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

/** "Good morning, Rafi · Thu, 8 Oct" plus the Dhaka date and time it used. */
export const dashboardGreeting = (display: { hasName?: boolean; name: string } | null) => {
  const ymd = dhakaToday();
  const hhmm = dhakaNow();
  const firstName = display?.hasName ? display.name.trim().split(/\s+/)[0] : "";
  const greeting = `${greetingAt(hhmm)}${firstName ? `, ${firstName}` : ""} · ${formatDay(ymd)}`;
  return { greeting, now: { ymd, hhmm } };
};
