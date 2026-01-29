import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskPhone(v: string) {
  const digits = (v || "").replace(/\D/g, "");
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 7);
  const p3 = digits.slice(7, 11);
  let out = "";
  if (p1) out += `(${p1}`;
  if (p1 && p1.length === 2) out += ") ";
  if (p2) out += p2;
  if (p3) out += `-${p3}`;
  return out;
}
