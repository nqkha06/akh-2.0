import {
  BadgeDollarSign,
  Gift,
  MousePointerClick,
  ChartNoAxesCombined,
  ShoppingBag,
  Trophy,
  Star,
  TrendingUp,
  UserPlus,
  Zap,
  CheckCircle2Icon,
} from "lucide-react";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "../ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
const rewardTypes = [
  {
    id: "daily",
    icon: Zap,
    progress: 33,
    progressValue: "1 / 3",
    tiers: ["3:+$0.05", "7:+$0.25", "30:+$1.00", "100:+$5.00"],
  },
  {
    id: "clicks",
    icon: MousePointerClick,
    progress: 0,
    progressValue: "0 / 10,000",
    tiers: ["10,000:+$1.00", "100,000:+$10.00", "1,000,000:+$100.00", "10,000,000:+$500.00", "100,000,000:+$1,000.00"],
  },
  {
    id: "referrals",
    icon: UserPlus,
    progress: 0,
    progressValue: "0 / 5",
    tiers: ["5:+$5.00", "25:+$25.00", "100:+$100.00", "500:+$500.00", "1,000:+$1,000.00", "10,000:+$10,000.00"],
  },
] as const;

type RewardHistory = {
  id: string
  type: string
  milestone: string
  amount: number
  createdAt: string
  relativeTime: string
}

const rewardHistory: RewardHistory[] = [
  {
    id: "1",
    type: "dailyLogin",
    milestone: "daily_2026-07-12",
    amount: 0.01,
    createdAt: "2026-07-12T17:16:00+07:00",
    relativeTime: "3h",
  },
]

export function RewardsView({ title }: { title: string }) {
  const t = useTranslations("SimplePages.rewards");
const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date))

  const formatTime = (date: string) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(date))
  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        description={t("description")}
      />
      

      {/* alert */}
      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        <Gift className="size-4" />

        <AlertTitle>{"Ưu đãi dành cho bạn"}</AlertTitle>

        <AlertDescription className="text-amber-800 dark:text-amber-300">
          {t("context")}
        </AlertDescription>
      </Alert>
      <StatisticsCard></StatisticsCard>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t("waysTitle")}
          </h2>

          <p className="text-sm leading-6 text-muted-foreground">
            {t("waysDescription")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rewardTypes.map((reward) => (
            <RewardCard key={reward.id} reward={reward} />
          ))}
        </div>
      </section>


      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>{t("historyTitle")}</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableCaption className="sr-only">
              {t("historyTitle")}
            </TableCaption>

            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 px-5 sm:px-6">
                  {t("table.type")}
                </TableHead>

                <TableHead className="h-11 px-5 sm:px-6">
                  {t("table.milestone")}
                </TableHead>

                <TableHead className="h-11 px-5 text-right sm:px-6">
                  {t("table.amount")}
                </TableHead>

                <TableHead className="h-11 px-5 sm:px-6">
                  {t("table.date")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rewardHistory.length > 0 ? (
                rewardHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-4 sm:px-6">
                      <Badge
                        variant="secondary"
                        className="gap-1.5 whitespace-nowrap"
                      >
                        <Zap className="size-3.5" />
                        {t(item.type)}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-5 py-4 sm:px-6">
                      <code className="whitespace-nowrap rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {item.milestone}
                      </code>
                    </TableCell>

                    <TableCell className="px-5 py-4 text-right font-semibold tabular-nums text-emerald-600 sm:px-6 dark:text-emerald-400">
                      +{formatAmount(item.amount)}
                    </TableCell>

                    <TableCell className="px-5 py-4 sm:px-6">
                      <time
                        dateTime={item.createdAt}
                        className="flex min-w-max items-center gap-2"
                      >
                        <span className="font-medium">
                          {formatDate(item.createdAt)}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {formatTime(item.createdAt)} · {item.relativeTime}
                        </span>
                      </time>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-28 text-center text-muted-foreground"
                  >
                    {t("emptyHistory")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RewardCard({
  reward,
}: {
  reward: (typeof rewardTypes)[number];
}) {
  const t = useTranslations("SimplePages.rewards");
  const Icon = reward.icon;

  const [baseLabel = "", baseAmount = ""] = t(
    `rewards.${reward.id}.base`,
  ).split("|");

  return (
    <Card className="group flex h-full flex-col overflow-hidden">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10 transition-transform duration-200 group-hover:scale-105">
            <Icon className="size-5" />
          </div>

          <CardTitle className="text-lg leading-tight">
            {t(`rewards.${reward.id}.title`)}
          </CardTitle>
        </div>

        <CardDescription className="min-h-12 text-sm leading-6">
          {t(`rewards.${reward.id}.description`)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 px-5 pb-5">
        {reward.id === "daily" && (
          <div className="rounded-xl border bg-primary/5 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {baseLabel}
            </p>

            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {baseAmount}
              </span>

              <span className="text-xs text-muted-foreground">
                {t("perDay")}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {reward.tiers.map((tier) => {
            const [milestone = "", amount = ""] = tier.split(":");

            return (
              <div
                key={tier}
                className="flex items-center justify-between gap-4 rounded-lg border border-transparent bg-muted/50 px-3.5 py-2.5 transition-colors hover:border-border hover:bg-muted"
              >
                <span className="text-sm font-medium text-foreground/80">
                  {t(`rewards.${reward.id}.tier`, {
                    value: milestone,
                  })}
                </span>

                <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {amount}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="mt-auto border-t bg-muted/20 px-5 py-4">
        <div className="w-full space-y-2.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              {t("yourProgress")}
            </span>

            <span className="font-semibold tabular-nums text-foreground">
              {reward.progressValue}
            </span>
          </div>

          <Progress
            value={reward.progress}
            aria-label={t("yourProgress")}
            className="h-2 [&>[data-slot=progress-indicator]]:bg-primary"
          />
        </div>
      </CardFooter>
    </Card>
  );
}
function RewardMetric({ icon, label, value, suffix, primary = false }: { icon: React.ReactNode; label: string; value: string; suffix?: string; primary?: boolean }) {
  return <div className={`border-b p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0 ${primary ? "bg-blue-600 text-white" : "bg-white"}`}><p className={`flex items-center gap-2 text-sm font-medium ${primary ? "text-blue-100" : "text-slate-500"}`}>{icon}{label}</p><p className={`mt-3 text-3xl font-semibold tracking-tight ${primary ? "text-white" : "text-slate-950"}`}>{value}{suffix ? <span className={`ml-1 text-base font-normal ${primary ? "text-blue-100" : "text-slate-500"}`}>{suffix}</span> : null}</p></div>;
}

const StatisticsCard = () => {
    const EcommerceActions = [
        {
            title: 'Login Streak',
            subtitle: '5868 ngày',
            cardIcon: Zap,
            badgeColor: 'bg-teal-400/10',
        },
        
        {
            title: 'Total earned',
            subtitle: '$82,906',
            cardIcon: ChartNoAxesCombined,
            badgeColor: 'bg-teal-400/10',
        },
        {
            title: 'Rewards granted',
            subtitle: '1',
            cardIcon: Star,
            badgeColor: 'bg-teal-400/10',
        },
    ];

    return (
        <div className="w-full">
            <Card className="p-0">
                <CardContent className="flex items-center w-full lg:flex-nowrap flex-wrap px-0">
                    {EcommerceActions.map((item, index) => {
                        const CardIcon = item.cardIcon;

                        return (
                            <div
                                className="lg:w-6/12 md:w-6/12 w-full border-e border-border last:border-e-0"
                                key={index}
                            >
                                <div className="p-6">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-start">
                                            <h5 className="text-base font-medium">{item.title}</h5>
                                            <div className={`p-3 rounded-full outline outline-border text-primary`}>
                                                <CardIcon className="size-4" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <h5 className="text-2xl font-semibold">{item.subtitle}</h5>
                      
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
