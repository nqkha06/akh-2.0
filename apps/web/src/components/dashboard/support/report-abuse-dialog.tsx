"use client";

import { useState } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { SupportController } from "./use-support-controller";

export function ReportAbuseDialog({ controller }: { controller: SupportController }) {
  const [url, setUrl] = useState("");
  const [violation, setViolation] = useState("spam");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    try { new URL(url); } catch { setError("Vui lòng nhập URL hợp lệ cần báo cáo."); return; }
    if (description.trim().length < 10) { setError("Vui lòng mô tả rõ nội dung vi phạm."); return; }
    setError("");
    toast.success("Báo cáo đã được ghi nhận.");
    controller.setAbuseOpen(false);
    setUrl(""); setDescription(""); setViolation("spam");
  };
  return <Dialog open={controller.abuseOpen} onOpenChange={controller.setAbuseOpen}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-muted-foreground" />Báo cáo nội dung hoặc link vi phạm</DialogTitle><DialogDescription>Cung cấp URL và mô tả ngắn. Không gửi mật khẩu, token hoặc dữ liệu cá nhân nhạy cảm.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><label htmlFor="abuse-url" className="text-sm font-medium">URL cần báo cáo</label><Input id="abuse-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." className="h-10" /></div><div className="space-y-2"><label htmlFor="abuse-type" className="text-sm font-medium">Loại vi phạm</label><Select value={violation} onValueChange={setViolation}><SelectTrigger id="abuse-type" className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="spam">Spam hoặc lừa đảo</SelectItem><SelectItem value="harmful">Nội dung gây hại</SelectItem><SelectItem value="copyright">Vi phạm bản quyền</SelectItem><SelectItem value="privacy">Xâm phạm quyền riêng tư</SelectItem><SelectItem value="other">Khác</SelectItem></SelectContent></Select></div><div className="space-y-2"><label htmlFor="abuse-description" className="text-sm font-medium">Mô tả</label><Textarea id="abuse-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả nội dung vi phạm..." className="min-h-24" /></div>{error ? <Alert variant="destructive"><AlertCircle /><AlertDescription>{error}</AlertDescription></Alert> : null}</div><DialogFooter><Button variant="outline" onClick={() => controller.setAbuseOpen(false)}>Hủy</Button><Button onClick={submit}>Gửi báo cáo</Button></DialogFooter></DialogContent></Dialog>;
}
