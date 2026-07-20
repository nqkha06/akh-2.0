"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronRight, Clock3, FileWarning, LifeBuoy, MessageSquarePlus, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

import type { SupportArticle, SupportDashboardData, SupportTopic } from "./types";

export function SupportTopicRow({ topic }: { topic: SupportTopic }) {
  const Icon = topic.icon;
  return <Link href={topic.href} className="group flex min-h-[72px] items-center gap-3 border-b border-border px-4 py-3 outline-none transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"><Icon className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" /><div className="min-w-0 flex-1"><h3 className="text-sm font-medium">{topic.title}</h3><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{topic.description}</p></div>{typeof topic.articleCount === "number" ? <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">{topic.articleCount} bài viết</span> : null}<ChevronRight className="size-4 shrink-0 text-muted-foreground" /></Link>;
}

export function SupportTopics({ topics }: { topics: SupportTopic[] }) {
  return <section aria-labelledby="support-topics-title"><div><h2 id="support-topics-title" className="text-lg font-semibold tracking-[-0.015em]">Chủ đề hỗ trợ</h2><p className="mt-1 text-sm text-muted-foreground">Chọn một chủ đề để xem hướng dẫn và câu hỏi thường gặp.</p></div><div className="mt-4 grid overflow-hidden rounded-lg border border-border sm:grid-cols-2 sm:[&>*:nth-child(odd)]:border-r">{topics.map((topic) => <SupportTopicRow key={topic.id} topic={topic} />)}</div></section>;
}

export function RecommendedArticles({ articles }: { articles: SupportArticle[] }) {
  return <section aria-labelledby="recommended-articles-title"><h2 id="recommended-articles-title" className="text-lg font-semibold tracking-[-0.015em]">Được xem nhiều</h2><div className="mt-3 border-y border-border">{articles.map((article) => <Link key={article.id} href={article.href} className="group flex min-h-16 items-center gap-3 border-b border-border px-1 py-3 outline-none last:border-b-0 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring"><div className="min-w-0 flex-1"><p className="text-sm font-medium group-hover:text-primary">{article.title}</p><p className="mt-1 text-xs text-muted-foreground">{article.category}{article.readingTime ? ` · ${article.readingTime}` : ""}</p></div><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" /></Link>)}</div></section>;
}

export function ContactSupportPanel({ contact, onCreate, onViewRequests, onReportAbuse }: { contact: SupportDashboardData["contact"]; onCreate: () => void; onViewRequests: () => void; onReportAbuse: () => void }) {
  return <aside className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]"><span className="grid size-9 place-items-center rounded-md border border-border bg-muted/30"><LifeBuoy className="size-4 text-muted-foreground" /></span><h2 className="mt-4 text-base font-semibold">Cần thêm trợ giúp?</h2><p className="mt-1.5 text-sm leading-6 text-muted-foreground">Gửi yêu cầu và đội ngũ Rekonise sẽ phản hồi sớm nhất có thể.</p><Separator className="my-5" /><dl className="space-y-4 text-sm">{contact.responseTime ? <div><dt className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Thời gian phản hồi thông thường</dt><dd className="mt-1.5 font-medium">{contact.responseTime}</dd></div> : null}{contact.workingHours ? <div><dt className="text-xs text-muted-foreground">Giờ làm việc</dt><dd className="mt-1.5 font-medium">{contact.workingHours}</dd></div> : null}<div><dt className="text-xs text-muted-foreground">Kênh hỗ trợ khả dụng</dt><dd className="mt-1.5 font-medium">{contact.channels.join(", ")}</dd></div></dl><div className="mt-5 grid gap-2"><Button className="h-10" onClick={onCreate}><MessageSquarePlus />Gửi yêu cầu hỗ trợ</Button><Button variant="outline" className="h-10" onClick={onViewRequests}>Xem yêu cầu của tôi</Button><Button variant="ghost" className="h-10 justify-start text-muted-foreground" onClick={onReportAbuse}><ShieldAlert />Báo cáo nội dung vi phạm</Button></div></aside>;
}

const faqItems = [
  { question: "Làm cách nào để tạo Social link?", answer: "Mở Social links, chọn tạo link mới, thêm nội dung đích và cấu hình những hành động người xem cần hoàn thành trước khi xuất bản." },
  { question: "File tải lên được dùng ở đâu?", answer: "File đã tải lên có thể được chọn làm nội dung đích cho Social link khi định dạng và quyền truy cập phù hợp." },
  { question: "Khi nào tôi có thể rút tiền?", answer: "Bạn có thể tạo yêu cầu khi số dư khả dụng đạt mức tối thiểu và phương thức nhận tiền đã hoàn tất yêu cầu xác minh." },
  { question: "Phần thưởng được cộng vào ví khi nào?", answer: "Phần thưởng được cộng vào ví hoạt động sau khi điều kiện của cột mốc hoặc nhiệm vụ được xác nhận hợp lệ." },
  { question: "Làm sao để báo cáo một link vi phạm?", answer: "Chọn “Báo cáo nội dung vi phạm”, cung cấp URL và loại vi phạm. Không gửi mật khẩu, token hoặc dữ liệu nhạy cảm trong mô tả." },
];

export function SupportFAQ() {
  return <section id="support-faq" aria-labelledby="support-faq-title"><div className="flex items-center gap-2"><FileWarning className="size-5 text-muted-foreground" /><h2 id="support-faq-title" className="text-lg font-semibold tracking-[-0.015em]">Câu hỏi thường gặp</h2></div><div className="mt-3 border-y border-border">{faqItems.map((item) => <Collapsible key={item.question}><CollapsibleTrigger className="group flex min-h-13 w-full items-center justify-between gap-4 border-b border-border px-1 py-3 text-left text-sm font-medium outline-none last:border-b-0 focus-visible:ring-2 focus-visible:ring-ring"><span>{item.question}</span><ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" /></CollapsibleTrigger><CollapsibleContent className="border-b border-border px-1 pb-4 pr-10 text-sm leading-6 text-muted-foreground">{item.answer}</CollapsibleContent></Collapsible>)}</div></section>;
}
