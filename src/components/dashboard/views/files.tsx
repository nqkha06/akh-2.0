import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CloudUpload,
  FilePlus,
  Folder,
  HardDrive,
  Home,
  ImageIcon,
  MoreVertical,
} from "lucide-react";

const files = [
  {
    id: "1",
    name: "z5980644724748_4b35713e28e6e92f5904e6349705d8a4.jpg",
    size: "221.72 KB",
    uploadedAt: "Nov 9, 2024",
    type: "image",
  },
];

export function FilesView() {
  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200/80 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <Folder size={23} strokeWidth={2.2} />
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Files
              </h1>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Quản lý ảnh, tài liệu và tài nguyên dùng cho link SUB to unlock.
            </p>
          </div>

          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800">
            <FilePlus size={17} />
            Upload file
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap items-center gap-3">
        <button className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
          <Home size={17} />
          Overview
        </button>
        <button className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-500 transition hover:border-slate-300 hover:text-slate-950">
          <CloudUpload size={17} />
          Upload file
        </button>
      </nav>

      <section className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-sm font-bold text-slate-600">
                  <th className="w-20 px-6 py-4" />
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">
                    <span className="inline-flex items-center gap-1">
                      Uploaded on
                      <ArrowDown size={16} />
                    </span>
                  </th>
                  <th className="w-16 px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                {files.map((file) => (
                  <tr key={file.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500">
                        <ImageIcon size={20} />
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="block max-w-[520px] truncate text-slate-800">
                        {file.name}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500">{file.size}</td>
                    <td className="px-6 py-5 text-slate-500">
                      {file.uploadedAt}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        aria-label="File actions"
                        className="inline-grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              Items per page:
              <button className="inline-flex h-10 items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 font-bold text-slate-700">
                10
                <ArrowDown size={15} />
              </button>
            </div>
            <span className="text-sm font-semibold text-slate-500">
              1 - 1 of 1
            </span>
            <div className="flex items-center gap-1 text-slate-400">
              <button className="grid size-9 place-items-center rounded-lg transition hover:bg-slate-100 hover:text-slate-950">
                <ChevronsLeft size={18} />
              </button>
              <button className="grid size-9 place-items-center rounded-lg transition hover:bg-slate-100 hover:text-slate-950">
                <ChevronLeft size={18} />
              </button>
              <button className="grid size-9 place-items-center rounded-lg transition hover:bg-slate-100 hover:text-slate-950">
                <ChevronRight size={18} />
              </button>
              <button className="grid size-9 place-items-center rounded-lg transition hover:bg-slate-100 hover:text-slate-950">
                <ChevronsRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <HardDrive size={20} />
            </span>
            <div>
              <h2 className="font-bold text-slate-950">Storage</h2>
              <p className="text-sm font-semibold text-slate-500">
                221.72 KB used
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-500">
              <span>Usage</span>
              <span>0.022%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[3%] rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800">Light UI</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-emerald-700/80">
              Bố cục lấy cảm hứng từ Rekonise, chuyển sang nền sáng, viền mảnh
              và bảng dễ scan.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
