"use client";

import {
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Laptop,
  LockKeyhole,
  Mail,
  Monitor,
  Palette,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "../ui";

export function AccountView() {
  const t = useTranslations("Account");
  const notifySaved = () => toast.success(t("toast.saved"));

  const tabs = [
    ["profile", User, t("tabs.profile")],
    ["security", LockKeyhole, t("tabs.security")],
    ["notifications", Bell, t("tabs.notifications")],
    ["preferences", Palette, t("tabs.preferences")],
    ["verification", ShieldCheck, t("tabs.verification")],
  ] as const;

  return (
    <section className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />
     
    </section>
  );
}
