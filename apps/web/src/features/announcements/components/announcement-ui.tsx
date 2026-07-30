import type { ReactNode } from "react";
import { CircleCheck, CircleX, Info, Megaphone, TriangleAlert } from "lucide-react";

import type { AnnouncementType } from "../types";

export function AnnouncementIcon({ type, className = "size-4" }: { type: AnnouncementType; className?: string }) {
  const Icon = type === "success" ? CircleCheck : type === "warning" ? TriangleAlert : type === "danger" ? CircleX : type === "update" ? Megaphone : Info;
  return <Icon className={className} aria-hidden />;
}

export function announcementTone(type: AnnouncementType) {
  if (type === "success") return "border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300";
  if (type === "warning") return "border-amber-500/30 bg-amber-500/8 text-amber-800 dark:text-amber-300";
  if (type === "danger") return "border-destructive/30 bg-destructive/8 text-destructive";
  if (type === "update") return "border-violet-500/25 bg-violet-500/8 text-violet-700 dark:text-violet-300";
  return "border-primary/25 bg-primary/8 text-primary";
}

export function announcementPlainText(value: string) {
  return value
    .replace(/\[([^\]]+)\]\((?:https:\/\/|\/)[^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inlineContent(value: string): ReactNode[] {
  const parts = value.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\((?:https:\/\/|\/)[^)]+\))/g);
  return parts.filter(Boolean).map((part, index) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong key={index} className="font-semibold text-foreground">{bold[1]}</strong>;
    const link = /^\[([^\]]+)\]\(((?:https:\/\/|\/)[^)]+)\)$/.exec(part);
    if (link) return <a key={index} href={link[2]} target={link[2].startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">{link[1]}</a>;
    return part;
  });
}

export function AnnouncementContent({ content, compact = false }: { content: string; compact?: boolean }) {
  const lines = content.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (!list.length) return;
    nodes.push(<ul key={`list-${nodes.length}`} className="list-disc space-y-1 pl-5">{list.map((line, index) => <li key={index}>{inlineContent(line)}</li>)}</ul>);
    list = [];
  };
  for (const line of lines) {
    if (/^[-*]\s+/.test(line)) {
      list.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    flushList();
    if (line.trim()) nodes.push(<p key={`p-${nodes.length}`}>{inlineContent(line)}</p>);
  }
  flushList();
  return <div className={compact ? "line-clamp-3 text-xs leading-5 text-muted-foreground" : "space-y-3 text-sm leading-6 text-muted-foreground"}>{nodes}</div>;
}
