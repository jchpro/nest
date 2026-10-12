import { kebabCase } from "case-anything";

export function getTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const h = now.getHours();
  const min = now.getMinutes();
  const s = now.getSeconds();
  return kebabCase(`${y} ${pad2(m)} ${pad2(d)} ${pad2(h)}${pad2(min)}${pad2(s)}`);
}

function pad2(num: number): string {
  return num.toString().padStart(2, '0');
}
