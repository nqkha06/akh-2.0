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
      <Tabs defaultValue="profile" className="gap-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max min-w-full">
            {tabs.map(([value, Icon, label]) => (
              <TabsTrigger key={value} value={value}>
                <Icon />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Card className="h-fit">
              <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
                <div className="relative">
                  <div className="flex size-16 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                    NV
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    aria-label={t("profile.changeAvatar")}
                    className="absolute -right-1 -bottom-1 rounded-full"
                    onClick={() => toast.message(t("profile.avatarHint"))}
                  >
                    <Camera />
                  </Button>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <p className="font-medium">Nguyễn Văn An</p>
                    <Badge>{t("verified")}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">nguyenvanan@example.com</p>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-center text-sm text-muted-foreground">
                  {t("profile.completeDescription")}
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("profile.title")}</CardTitle>
                <CardDescription>{t("profile.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-5 sm:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    notifySaved();
                  }}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">{t("profile.firstName")}</Label>
                    <Input id="first-name" defaultValue="Nguyễn Văn" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">{t("profile.lastName")}</Label>
                    <Input id="last-name" defaultValue="An" />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="profile-email">{t("profile.email")}</Label>
                    <Input id="profile-email" type="email" defaultValue="nguyenvanan@example.com" />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="profile-bio">{t("profile.bio")}</Label>
                    <Textarea id="profile-bio" defaultValue={t("profile.bioValue")} />
                  </div>
                  <div className="flex justify-end sm:col-span-2">
                    <Button type="submit">{t("saveChanges")}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader>
                <CardTitle>{t("security.passwordTitle")}</CardTitle>
                <CardDescription>{t("security.passwordDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-5 sm:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    notifySaved();
                  }}
                >
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="current-password">{t("security.currentPassword")}</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">{t("security.newPassword")}</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">{t("security.confirmPassword")}</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <div className="flex justify-end sm:col-span-2">
                    <Button type="submit">{t("security.updatePassword")}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck />{t("security.twoFactorTitle")}</CardTitle>
                <CardDescription>{t("security.twoFactorDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button onClick={() => toast.message(t("security.twoFactorHint"))}>
                  {t("security.enableTwoFactor")}
                </Button>
                <Button variant="outline">
                  {t("security.manageSessions")} <ChevronRight />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("notifications.title")}</CardTitle>
              <CardDescription>{t("notifications.description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3"><Mail className="mt-0.5 text-muted-foreground" /><div><p className="font-medium">{t("notifications.emailTitle")}</p><p className="text-sm text-muted-foreground">{t("notifications.emailDescription")}</p></div></div>
                <Switch defaultChecked aria-label={t("notifications.emailTitle")} />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3"><Bell className="mt-0.5 text-muted-foreground" /><div><p className="font-medium">{t("notifications.productTitle")}</p><p className="text-sm text-muted-foreground">{t("notifications.productDescription")}</p></div></div>
                <Switch defaultChecked aria-label={t("notifications.productTitle")} />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3"><Smartphone className="mt-0.5 text-muted-foreground" /><div><p className="font-medium">{t("notifications.pushTitle")}</p><p className="text-sm text-muted-foreground">{t("notifications.pushDescription")}</p></div></div>
                <Switch aria-label={t("notifications.pushTitle")} />
              </div>
            </CardContent>
            <CardFooter className="justify-end"><Button onClick={notifySaved}>{t("saveChanges")}</Button></CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t("preferences.title")}</CardTitle>
              <CardDescription>{t("preferences.description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3"><Globe2 className="mt-0.5 text-muted-foreground" /><div><p className="font-medium">{t("preferences.languageTitle")}</p><p className="text-sm text-muted-foreground">{t("preferences.languageDescription")}</p></div></div>
                <Select defaultValue="vi"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vi">Tiếng Việt</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select>
              </div>
              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3"><Monitor className="mt-0.5 text-muted-foreground" /><div><p className="font-medium">{t("preferences.themeTitle")}</p><p className="text-sm text-muted-foreground">{t("preferences.themeDescription")}</p></div></div>
                <Select defaultValue="system"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light">{t("preferences.light")}</SelectItem><SelectItem value="dark">{t("preferences.dark")}</SelectItem><SelectItem value="system">{t("preferences.system")}</SelectItem></SelectContent></Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-3"><Laptop className="mt-0.5 text-muted-foreground" /><div><p className="font-medium">{t("preferences.compactTitle")}</p><p className="text-sm text-muted-foreground">{t("preferences.compactDescription")}</p></div></div>
                <Switch aria-label={t("preferences.compactTitle")} />
              </div>
            </CardContent>
            <CardFooter className="justify-end"><Button onClick={notifySaved}>{t("saveChanges")}</Button></CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 />{t("verification.title")}</CardTitle>
              <CardDescription>{t("verification.description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-3"><Mail className="mt-0.5 text-muted-foreground" /><div><p className="font-medium">{t("verification.emailTitle")}</p><p className="text-sm text-muted-foreground">{t("verification.emailDescription")}</p></div></div>
                <Badge>{t("verification.complete")}</Badge>
              </div>
              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3"><ShieldCheck className="mt-0.5 text-muted-foreground" /><div><p className="font-medium">{t("verification.securityTitle")}</p><p className="text-sm text-muted-foreground">{t("verification.securityDescription")}</p></div></div>
                <Button variant="outline" onClick={() => toast.message(t("verification.securityHint"))}>{t("verification.review")}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
