export const UNIVERSITIES = [
  "Narxoz",
  "KBTU",
  "SDU",
  "AITU",
  "KazNU",
  "Satbayev University",
  "Nazarbayev University",
  "AlmaU",
  "KIMEP",
  "IITU",
  "ENU",
  "Другой",
] as const;

export function isUniversity(s: unknown): s is (typeof UNIVERSITIES)[number] {
  return typeof s === "string" && (UNIVERSITIES as readonly string[]).includes(s);
}
