import { AdminHeader } from "@/components/admin/admin-header";
import { AdminLanguagesPage } from "@/features/languages/components/admin-languages-page";

export default function LanguagesAdminPage() {
  return (
    <>
      <AdminHeader title="Languages" />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
            Localization
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.6px]">
            Ngôn ngữ
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Quản lý locale nội dung, ngôn ngữ mặc định, hướng hiển thị và thứ tự
            xuất hiện trong các màn hình biên tập.
          </p>
        </div>
        <AdminLanguagesPage />
      </main>
    </>
  );
}
