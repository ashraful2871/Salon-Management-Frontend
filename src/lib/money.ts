export const toMinor = (taka: number) => Math.round(taka * 100);
export const toTaka = (minor: number) => minor / 100;
export const formatBDT = (minor: number) =>
  `৳${(minor / 100).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
