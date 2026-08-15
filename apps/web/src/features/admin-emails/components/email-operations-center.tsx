"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Gauge,
  Mail,
  Send,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { getEmailOverview } from "../api/emails.client";
import type { EmailOverview } from "../types";
import { EmailActivityTab } from "./email-activity";
import { EmailOverviewTab } from "./email-overview";
import { EmailPreferencesTab } from "./email-preferences";
import { EmailSendersTab } from "./email-senders";
import { EmailSettingsTab } from "./email-settings";
import { EmailStatusBadge } from "./email-ui";
import { EmailTemplatesTab, QuickTestEmailDialog } from "./email-templates";

const tabDefinitions = [
  { value: "overview", label: "Overview", icon: Gauge, permissions: ["emails.read"] },
  { value: "senders", label: "Senders", icon: Send, permissions: ["emails.read", "emails.senders.manage"] },
  { value: "templates", label: "Templates", icon: Mail, permissions: ["emails.templates.read", "emails.templates.create", "emails.templates.update"] },
  { value: "preferences", label: "Preferences", icon: SlidersHorizontal, permissions: ["emails.read", "emails.preferences.manage"] },
  { value: "activity", label: "Activity", icon: Activity, permissions: ["emails.logs.read"] },
  { value: "settings", label: "Settings", icon: Settings2, permissions: ["emails.read", "emails.settings.update"] },
] as const;

type EmailTab = (typeof tabDefinitions)[number]["value"];

export function EmailOperationsCenter() {
  const permissions = useAdminPermissions();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const availableTabs = tabDefinitions.filter((tab) =>
    tab.permissions.some((permission) => permissions.includes(permission)),
  );
  const requested = searchParams.get("tab") as EmailTab | null;
  const activeTab = availableTabs.some((tab) => tab.value === requested)
    ? requested!
    : availableTabs[0]?.value || "overview";
  const [overview, setOverview] = React.useState<EmailOverview | null>(null);
  const [quickTestOpen, setQuickTestOpen] = React.useState(false);

  const loadHeader = React.useCallback(async () => {
    if (!permissions.includes("emails.read")) return;
    try {
      const params = new URLSearchParams({ range: "30d", mailType: "all" });
      setOverview(await getEmailOverview(params));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải trạng thái email.");
    }
  }, [permissions, setOverview]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => void loadHeader(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadHeader]);

  function changeTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "overview") params.delete("tab");
    else params.set("tab", value);
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  const provider = overview?.health.sesConfiguration;
  const transactional = overview?.health.transactionalEnabled;
  const marketing = overview?.health.marketingEnabled;
  const canTest = permissions.includes("emails.test.send");

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 pb-8">
      <AdminPageHeader
        title="Email"
        description="Quản lý cấu hình, sender, template và hoạt động gửi email."
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <EmailStatusBadge
              status={provider?.status || "incomplete"}
              label={provider?.status === "configured" ? "Amazon SES" : "Chưa cấu hình"}
            />
            <EmailStatusBadge
              status={transactional ? "active" : "paused"}
              label={`Transactional: ${transactional ? "Hoạt động" : "Tạm dừng"}`}
            />
            <EmailStatusBadge
              status={marketing ? "active" : "paused"}
              label={`Marketing: ${marketing ? "Hoạt động" : "Tạm dừng"}`}
            />
            {overview?.reputation.status === "warning" ? (
              <EmailStatusBadge status="warning" label="Cảnh báo reputation" />
            ) : null}
          </div>
        }
        actions={
          <>
            {canTest ? (
              <Button variant="outline" onClick={() => setQuickTestOpen(true)}>
                <Send /> Send test email
              </Button>
            ) : null}
            {availableTabs.some((tab) => tab.value === "settings") ? (
              <Button onClick={() => changeTab("settings")}>
                <Settings2 /> Open settings
              </Button>
            ) : null}
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={changeTab}>
        <div className="overflow-x-auto border-b">
          <TabsList variant="line" className="h-11 min-w-max justify-start bg-transparent p-0">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="h-11">
                  <Icon /> {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-6">
          <EmailOverviewTab initialData={overview} onData={setOverview} />
        </TabsContent>
        <TabsContent value="senders" className="mt-6">
          <EmailSendersTab />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <EmailTemplatesTab />
        </TabsContent>
        <TabsContent value="preferences" className="mt-6">
          <EmailPreferencesTab />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <EmailActivityTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <EmailSettingsTab onUpdated={() => void loadHeader()} />
        </TabsContent>
      </Tabs>
      <QuickTestEmailDialog open={quickTestOpen} onOpenChange={setQuickTestOpen} />
    </div>
  );
}
