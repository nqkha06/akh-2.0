import { Copy, ExternalLink, Link2, MousePointerClick, Plus, TrendingUp } from "lucide-react";

import { CreateLinkDialog } from "@/components/create-link-dialog";
import {
  AppButton,
  Badge,
  DropdownFilter,
  EmptyState,
  PageHeader,
  StatCard,
  TabPills,
  TableShell,
  Toolbar,
} from "@/components/dashboard/ui";
import { linkRows } from "@/lib/dashboard-data";

export function LinksView() {
  return (
    <>
      <PageHeader
        eyebrow="Affiliate links"
        title="Quản lí liên kết"
        description="Theo dõi hiệu suất từng link, copy nhanh URL rút gọn và tối ưu chiến dịch có doanh thu cao."
        action={<CreateLinkDialog />}
      />

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Tổng liên kết"
          value="128"
          detail="+12 link mới"
          icon={<Link2 size={20} />}
          tone="blue"
        />
        <StatCard
          label="Click tháng này"
          value="42.8K"
          detail="+8.1%"
          icon={<MousePointerClick size={20} />}
          tone="emerald"
        />
        <StatCard
          label="Tỉ lệ chuyển đổi"
          value="12.6%"
          detail="Top 15% nền tảng"
          icon={<TrendingUp size={20} />}
          tone="violet"
        />
      </section>

      <div className="mb-5">
        <Toolbar placeholder="Tìm chiến dịch, URL rút gọn..." />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <TabPills items={["Tất cả", "Đang chạy", "Nháp", "Tạm dừng"]} active={0} />
        <DropdownFilter label="Trạng thái" />
        <DropdownFilter label="Ngày tạo" />
        <DropdownFilter label="Hiệu suất" />
      </div>

      {linkRows.length === 0 ? (
        <EmptyState
          title="Chưa có liên kết nào"
          description="Tạo link đầu tiên để bắt đầu đo click, chuyển đổi và doanh thu."
          action={
            <AppButton>
              <Plus size={16} />
              Tạo liên kết mới
            </AppButton>
          }
        />
      ) : (
        <TableShell
          headers={[
            "Tên chiến dịch",
            "URL rút gọn",
            "Click",
            "Chuyển đổi",
            "Doanh thu",
            "Trạng thái",
            "",
          ]}
          rows={linkRows.map((row, index) => (
            <tr key={row.name} className="transition hover:bg-blue-50/35">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">{row.name}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-400">
                      {row.type}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <button className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  link4sub.com/{row.name.toLowerCase().replaceAll(" ", "-")}
                  <Copy size={13} />
                </button>
              </td>
              <td className="px-5 py-4">{row.views}</td>
              <td className="px-5 py-4">{index === 0 ? "18.4%" : "9.8%"}</td>
              <td className="px-5 py-4">{row.revenue}</td>
              <td className="px-5 py-4">
                <Badge tone={row.status === "Nháp" ? "slate" : "emerald"}>
                  {row.status}
                </Badge>
              </td>
              <td className="px-5 py-4 text-right">
                <button className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:text-blue-600 hover:shadow-[0_2px_6px_rgba(15,23,42,0.08)]">
                  <ExternalLink size={16} />
                </button>
              </td>
            </tr>
          ))}
        />
      )}
    </>
  );
}
