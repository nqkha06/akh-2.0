import type { RewardHistoryItem, RewardMission, RewardsDashboardData, RewardsDataSource } from "./types";

const usd = (amount: number) => ({ amount, currency: "USD" as const });

let dashboard: RewardsDashboardData = {
  summary: {
    availableRewardBalance: usd(3.5),
    pendingRewardBalance: usd(0.25),
    currentStreak: 8,
    dailyBonusRate: "+0,8%",
    nextMilestoneLabel: "10 ngày · nhận $1",
  },
  streak: {
    currentDays: 8,
    longestStreak: 16,
    completedToday: true,
    resetAtLabel: "23:59 hôm nay",
    currentBonus: "+0,8%",
    incrementPerDay: "+0,1 điểm %",
    maxBonus: "+3%",
    recentDays: [
      { date: "2026-07-09", dayLabel: "T5", dateLabel: "09/07", status: "completed" },
      { date: "2026-07-10", dayLabel: "T6", dateLabel: "10/07", status: "completed" },
      { date: "2026-07-11", dayLabel: "T7", dateLabel: "11/07", status: "completed" },
      { date: "2026-07-12", dayLabel: "CN", dateLabel: "12/07", status: "completed" },
      { date: "2026-07-13", dayLabel: "T2", dateLabel: "13/07", status: "completed" },
      { date: "2026-07-14", dayLabel: "T3", dateLabel: "14/07", status: "completed" },
      { date: "2026-07-15", dayLabel: "T4", dateLabel: "15/07", status: "today" },
    ],
    milestones: [
      { id: "streak-3", target: 3, status: "claimed" },
      { id: "streak-7", target: 7, reward: usd(0.5), status: "claimed", claimedAt: "2026-07-14T09:00:00+07:00" },
      { id: "streak-10", target: 10, reward: usd(1), status: "current" },
      { id: "streak-20", target: 20, reward: usd(1.5), status: "upcoming" },
      { id: "streak-30", target: 30, reward: usd(3), status: "upcoming" },
      { id: "streak-60", target: 60, reward: usd(7), status: "upcoming" },
      { id: "streak-100", target: 100, reward: usd(15), status: "upcoming" },
    ],
  },
  growthMilestones: [
    {
      type: "views",
      label: "Lượt xem",
      unit: "lượt xem hợp lệ",
      currentValue: 748,
      nextTarget: 1000,
      milestones: [
        { id: "views-100", target: 100, reward: usd(0.1), status: "claimed" },
        { id: "views-500", target: 500, reward: usd(0.5), status: "claimed" },
        { id: "views-1000", target: 1000, reward: usd(1), status: "current" },
        { id: "views-5000", target: 5000, reward: usd(2.5), status: "upcoming" },
        { id: "views-10000", target: 10000, reward: usd(5), status: "upcoming" },
        { id: "views-50000", target: 50000, reward: usd(15), status: "upcoming" },
      ],
    },
    {
      type: "unlocks",
      label: "Lượt mở khóa",
      unit: "lượt mở khóa hợp lệ",
      currentValue: 324,
      nextTarget: 500,
      milestones: [
        { id: "unlocks-10", target: 10, reward: usd(0.1), status: "claimed" },
        { id: "unlocks-50", target: 50, reward: usd(0.25), status: "claimed" },
        { id: "unlocks-100", target: 100, reward: usd(0.5), status: "claimed" },
        { id: "unlocks-500", target: 500, reward: usd(1.5), status: "current" },
        { id: "unlocks-1000", target: 1000, reward: usd(3), status: "upcoming" },
        { id: "unlocks-5000", target: 5000, reward: usd(10), status: "upcoming" },
      ],
    },
    {
      type: "clicks",
      label: "Lượt nhấp",
      unit: "lượt nhấp hợp lệ",
      currentValue: 1680,
      nextTarget: 5000,
      milestones: [
        { id: "clicks-100", target: 100, reward: usd(0.1), status: "claimed" },
        { id: "clicks-500", target: 500, reward: usd(0.25), status: "claimed" },
        { id: "clicks-1000", target: 1000, reward: usd(0.5), status: "claimed" },
        { id: "clicks-5000", target: 5000, reward: usd(2), status: "current" },
        { id: "clicks-10000", target: 10000, reward: usd(5), status: "upcoming" },
      ],
    },
  ],
  missions: [
    { id: "mission-bio", icon: "bio", title: "Xuất bản trang Link-in-bio", description: "Xuất bản ít nhất một trang bio trong tuần này.", progress: 0, target: 1, reward: usd(0.5), status: "not_started", expiresLabel: "Còn 3 ngày", actionHref: "/member/bio", actionLabel: "Đi tới Link-in-bio" },
    { id: "mission-views", icon: "views", title: "Nhận 50 lượt xem trong tuần", description: "Chỉ lượt xem hợp lệ mới được tính vào tiến độ.", progress: 32, target: 50, reward: usd(0.25), status: "in_progress", expiresLabel: "Còn 3 ngày" },
    { id: "mission-unlocks", icon: "unlock", title: "Nhận 10 lượt mở khóa", description: "Phát triển Social links và nhận lượt mở khóa hợp lệ.", progress: 10, target: 10, reward: usd(0.25), status: "completed", expiresLabel: "Còn 3 ngày" },
    { id: "mission-profile", icon: "profile", title: "Hoàn thành hồ sơ tài khoản", description: "Bổ sung thông tin còn thiếu để tăng độ tin cậy.", progress: 1, target: 1, reward: usd(0.2), status: "claimed" },
  ],
  history: [
    { id: "RW-0714-0024", title: "Chuỗi 7 ngày", source: "Chuỗi hoạt động", condition: "Hoàn thành hoạt động hợp lệ trong 7 ngày liên tiếp.", amount: usd(0.5), status: "credited", earnedAt: "2026-07-14T09:00:00+07:00", creditedAt: "2026-07-14T09:04:00+07:00" },
    { id: "RW-0712-0019", title: "Mốc 500 lượt xem", source: "Cột mốc tăng trưởng", condition: "Đạt 500 lượt xem hợp lệ.", amount: usd(0.5), status: "credited", earnedAt: "2026-07-12T14:20:00+07:00", creditedAt: "2026-07-12T15:00:00+07:00" },
    { id: "RW-0711-0015", title: "Nhiệm vụ hồ sơ", source: "Nhiệm vụ tăng trưởng", condition: "Hoàn thành hồ sơ tài khoản.", amount: usd(0.2), status: "credited", earnedAt: "2026-07-11T10:15:00+07:00", creditedAt: "2026-07-11T10:16:00+07:00" },
    { id: "RW-0708-0008", title: "Mốc 100 lượt mở khóa", source: "Cột mốc tăng trưởng", condition: "Đạt 100 lượt mở khóa hợp lệ.", amount: usd(0.5), status: "verifying", earnedAt: "2026-07-08T08:40:00+07:00" },
  ],
};

export function getRewardsDemoData() {
  return structuredClone(dashboard);
}

export const rewardsDataSource: RewardsDataSource = {
  async getDashboard() {
    return getRewardsDemoData();
  },
  async claimMission(id) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    const mission = dashboard.missions.find((item) => item.id === id);
    if (!mission) throw new Error("Không tìm thấy nhiệm vụ.");
    if (mission.status === "claimed") throw new Error("Phần thưởng này đã được nhận.");
    if (mission.status !== "completed") throw new Error("Nhiệm vụ chưa đủ điều kiện nhận thưởng.");
    const claimedMission: RewardMission = { ...mission, status: "claimed" };
    const historyItem: RewardHistoryItem = {
      id: `RW-${Date.now().toString().slice(-8)}`,
      title: mission.title,
      source: "Nhiệm vụ tăng trưởng",
      condition: mission.description,
      amount: mission.reward,
      status: "credited",
      earnedAt: new Date().toISOString(),
      creditedAt: new Date().toISOString(),
    };
    dashboard = {
      ...dashboard,
      summary: {
        ...dashboard.summary,
        availableRewardBalance: usd(dashboard.summary.availableRewardBalance.amount + mission.reward.amount),
      },
      missions: dashboard.missions.map((item) => item.id === id ? claimedMission : item),
      history: [historyItem, ...dashboard.history],
    };
    return { mission: structuredClone(claimedMission), historyItem: structuredClone(historyItem) };
  },
};
