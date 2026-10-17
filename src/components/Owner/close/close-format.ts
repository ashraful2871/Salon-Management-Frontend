import { formatBDT } from "@/lib/money";
import { TONE_CLASSES, type Tone } from "@/lib/status-tone";

/** A balanced till is success; short or over is danger (the owner hears at ৳100+). */
export const differenceToneName = (differenceMinor: number): Tone =>
  differenceMinor === 0 ? "success" : "danger";

export const differenceTone = (differenceMinor: number) => TONE_CLASSES[differenceToneName(differenceMinor)];

export const differenceLabel = (differenceMinor: number) =>
  differenceMinor === 0
    ? "The till balances"
    : `${differenceMinor < 0 ? "Short" : "Over"} by ${formatBDT(Math.abs(differenceMinor))}`;
