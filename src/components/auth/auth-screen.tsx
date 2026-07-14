"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  Link2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import styles from "./auth-screen.module.css";

type AuthMode = "login" | "register" | "forgot";

const pageCopy = {
  login: {
    eyebrow: "Chào mừng trở lại",
    title: "Tiếp tục hành trình sáng tạo.",
    description: "Đăng nhập để quản lý link, nội dung mở khoá và hiệu suất của bạn.",
    submit: "Đăng nhập",
    footer: "Chưa có tài khoản?",
    footerLink: "Tạo tài khoản miễn phí",
    footerHref: "/register",
  },
  register: {
    eyebrow: "Bắt đầu miễn phí",
    title: "Tạo một link. Mở ra nhiều cơ hội.",
    description: "Thiết lập creator page và bắt đầu biến lượt xem thành cộng đồng của riêng bạn.",
    submit: "Tạo tài khoản",
    footer: "Đã có tài khoản?",
    footerLink: "Đăng nhập",
    footerHref: "/login",
  },
  forgot: {
    eyebrow: "Khôi phục tài khoản",
    title: "Quên mật khẩu? Không sao cả.",
    description: "Nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.",
    submit: "Gửi liên kết khôi phục",
    footer: "Đã nhớ mật khẩu?",
    footerLink: "Quay lại đăng nhập",
    footerHref: "/login",
  },
} as const;

function Logo() {
  return (
    <Link className={styles.logo} href="/" aria-label="Linkicom home">
      <span className={styles.logoMark} aria-hidden="true"><i /><i /></span>
      Linkicom
    </Link>
  );
}

function AuthVisual({ mode }: { mode: AuthMode }) {
  return (
    <aside className={styles.visualPanel} aria-label="Linkicom product preview">
      <div className={styles.visualGlow} />
      <div className={styles.visualCopy}>
        <span><Sparkles size={14} /> Dành riêng cho creator</span>
        <h2>{mode === "register" ? "Khởi động growth loop đầu tiên trong vài phút." : "Mọi công cụ tăng trưởng, trong một creator link."}</h2>
        <p>Link-in-bio, verified unlock, protected content và analytics trên cùng một nền tảng.</p>
      </div>
      <div className={styles.productPreview}>
        <div className={styles.previewTopbar}>
          <span><i /><i /><i /></span>
          <span>app.linkicom.io</span>
          <span />
        </div>
        <div className={styles.previewBody}>
          <div className={styles.previewSidebar}>
            <span className={styles.activeNav}><BarChart3 size={14} /></span>
            <span><Link2 size={14} /></span>
            <span><LockKeyhole size={14} /></span>
          </div>
          <div className={styles.previewContent}>
            <div className={styles.previewHeading}><div><small>TỔNG QUAN</small><b>Creator growth</b></div><span>30 ngày qua</span></div>
            <div className={styles.previewStats}><div><small>Lượt xem</small><b>28.4K</b><em>+18%</em></div><div><small>Hành động</small><b>10.8K</b><em>+12%</em></div><div><small>Chuyển đổi</small><b>38.1%</b><em>+4%</em></div></div>
            <div className={styles.previewChart}><svg viewBox="0 0 500 130" preserveAspectRatio="none" aria-hidden="true"><path d="M0 112 C40 108 62 90 99 97 S160 110 198 70 S260 88 304 53 S362 66 405 38 S466 42 500 16" /></svg></div>
            <div className={styles.previewActivity}><span><ShieldCheck size={16} /></span><div><b>482 hành động đã xác minh</b><small>Nội dung được mở khoá an toàn hôm nay</small></div><Check size={16} /></div>
          </div>
        </div>
      </div>
      <div className={styles.visualTrust}><ShieldCheck size={15} /> Dữ liệu của bạn được bảo vệ</div>
    </aside>
  );
}

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const copy = pageCopy[mode];
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setMessage(mode === "forgot"
      ? "Giao diện đã sẵn sàng. Cần kết nối API email để gửi liên kết khôi phục."
      : "Giao diện đã sẵn sàng. Cần kết nối API xác thực để hoàn tất thao tác.");
  }

  return (
    <main className={styles.page}>
      <section className={styles.formSide}>
        <div className={styles.formSideInner}>
          <div className={styles.mobileHeader}><Logo /><Link href="/">Về trang chủ</Link></div>
          <div className={styles.formWrap}>
            {mode === "forgot" && <Link className={styles.backLink} href="/login"><ArrowLeft size={15} /> Quay lại đăng nhập</Link>}
            <span className={styles.eyebrow}>{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p className={styles.description}>{copy.description}</p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate={false}>
              {mode === "register" && (
                <label>
                  <span>Họ và tên</span>
                  <div className={styles.inputWrap}><User size={17} /><input name="name" type="text" autoComplete="name" placeholder="Nguyễn Minh Anh" minLength={2} required /></div>
                </label>
              )}
              <label>
                <span>Email</span>
                <div className={styles.inputWrap}><Mail size={17} /><input name="email" type="email" autoComplete="email" placeholder="creator@example.com" required /></div>
              </label>
              {mode !== "forgot" && (
                <label>
                  <span className={styles.passwordLabel}>Mật khẩu {mode === "login" && <Link href="/forgot-password">Quên mật khẩu?</Link>}</span>
                  <div className={styles.inputWrap}>
                    <LockKeyhole size={17} />
                    <input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "Tối thiểu 8 ký tự" : "Nhập mật khẩu"} minLength={8} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </div>
                </label>
              )}
              {mode === "register" && <p className={styles.terms}>Bằng cách tiếp tục, bạn đồng ý với <Link href="/">Điều khoản</Link> và <Link href="/">Chính sách quyền riêng tư</Link> của Linkicom.</p>}
              <button className={styles.submitButton} type="submit">{copy.submit} <ArrowRight size={17} /></button>
              <p className={styles.apiMessage} role="status" aria-live="polite">{message}</p>
            </form>

            <p className={styles.switchMode}>{copy.footer} <Link href={copy.footerHref}>{copy.footerLink}</Link></p>
          </div>
          <div className={styles.formFooter}><span>© 2026 Linkicom</span><Link href="/">Trợ giúp</Link></div>
        </div>
      </section>
      <AuthVisual mode={mode} />
    </main>
  );
}
