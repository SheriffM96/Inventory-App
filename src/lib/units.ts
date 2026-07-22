export const UNITS = [
  "kg",
  "g",
  "litre",
  "ml",
  "pcs",
  "bunch",
  "tin",
  "bottle",
  "box",
  "pack",
  "case",
  "roll",
  "carton",
  "tray",
] as const;

export type Unit = (typeof UNITS)[number];
