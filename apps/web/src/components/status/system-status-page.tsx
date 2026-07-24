"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  FileX2,
  Link2Off,
  PauseCircle,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";

import styles from "./system-status-page.module.css";
import { SiteBrandLink } from "@/components/site-brand";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";

export type StatusKind = "default404" | "linkNotFound" | "violation" | "deleted" | "unavailable";

const statusContent = {
  default404: {
    code: "404",
    eyebrow: "Lạc đường một chút",
    title: "Trang này không tồn tại.",
    description: "Có thể địa chỉ đã thay đổi, hoặc trang bạn đang tìm chưa từng được tạo.",
    Icon: Compass,
    label: "Không tìm thấy trang",
    primary: "Về trang chủ",
    primaryHref: "/",
    secondary: "Mở dashboard",
    secondaryHref: "/member",
  },
  linkNotFound: {
    code: "404",
    eyebrow: "Link không khả dụng",
    title: "Không tìm thấy link này.",
    description: "Link có thể chưa được tạo, đã đổi địa chỉ hoặc URL bạn mở chưa chính xác.",
    Icon: Link2Off,
    label: "Link not found",
    primary: "Tạo link của bạn",
    primaryHref: "/member/new",
    secondary: "Về trang chủ",
    secondaryHref: "/",
  },
  violation: {
    code: "403",
    eyebrow: "Nội dung bị hạn chế",
    title: "Link đã bị vô hiệu hoá.",
    description: "Link này không còn khả dụng vì vi phạm tiêu chuẩn cộng đồng hoặc chính sách sử dụng của hệ thống.",
    Icon: ShieldAlert,
    label: "Policy violation",
    primary: "Về trang chủ",
    primaryHref: "/",
    secondary: "Xem chính sách",
    secondaryHref: "/member/support",
  },
  deleted: {
    code: "410",
    eyebrow: "Nội dung không còn tồn tại",
    title: "Link đã bị xoá.",
    description: "Chủ sở hữu đã xoá link này. Nội dung đích và các hành động liên quan không còn truy cập được.",
    Icon: Trash2,
    label: "Link deleted",
    primary: "Tạo link mới",
    primaryHref: "/member/new",
    secondary: "Về trang chủ",
    secondaryHref: "/",
  },
  unavailable: {
    code: "410",
    eyebrow: "Link tạm không khả dụng",
    title: "Link này hiện không thể mở.",
    description: "Link có thể đang tạm dừng, đã hết hạn hoặc đạt giới hạn lượt truy cập do chủ sở hữu thiết lập.",
    Icon: PauseCircle,
    label: "Link unavailable",
    primary: "Về trang chủ",
    primaryHref: "/",
    secondary: "Tạo link mới",
    secondaryHref: "/member/create",
  },
} as const;

function Logo() {
  return <SiteBrandLink className={styles.logo} logoClassName={styles.logoMark} />;
}

export function SystemStatusPage({ kind }: { kind: StatusKind }) {
  const brand = useSiteBrand();
  const content = statusContent[kind];
  const Icon = content.Icon;

  return (
    <main className={`${styles.page} ${styles[kind]}`}>
      <header className={styles.header}><Logo /><Link href="/member/support">Trợ giúp</Link></header>
      <section className={styles.content}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{content.eyebrow}</span>
          <span className={styles.code} aria-hidden="true">{content.code}</span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href={content.primaryHref}>{content.primary} <ArrowRight size={16} /></Link>
            <Link className={styles.secondaryButton} href={content.secondaryHref}><ArrowLeft size={15} /> {content.secondary}</Link>
          </div>
        </div>
        <div className={styles.visual} aria-label={content.label}>
          <div className={styles.orbitOne} /><div className={styles.orbitTwo} />
          <div className={styles.statePanel}>
            <span className={styles.stateIcon}><Icon size={35} /></span>
            <small>{brand.siteName.toLocaleUpperCase()} PUBLIC LINK</small>
            <strong>{content.label}</strong>
            <div className={styles.fakeUrl}><span><FileX2 size={14} /></span><i /><i /></div>
            <div className={styles.stateLine}><span /><span /><span /></div>
          </div>
          <span className={styles.sparkle}><Sparkles size={21} /></span>
        </div>
      </section>
      <footer className={styles.footer}><span>© {new Date().getFullYear()} {brand.siteName}</span><span>Creator links, protected.</span></footer>
    </main>
  );
}
