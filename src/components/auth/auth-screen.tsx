"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Link2,
  LockKeyhole,
  Mail,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";

import styles from "./auth-screen.module.css";

type AuthMode = "login" | "register" | "forgot";
type FieldErrors = Partial<Record<"name" | "email" | "password" | "confirmPassword" | "terms", string>>;

const pageCopy = {
  login: {
    kicker: "Chào mừng trở lại",
    title: "Đăng nhập vào Linkicom",
    description: "Quản lý mọi creator link, nội dung mở khoá và chỉ số tăng trưởng ở một nơi.",
    submit: "Đăng nhập",
    footer: "Bạn chưa có tài khoản?",
    footerLink: "Tạo tài khoản",
    footerHref: "/register",
  },
  register: {
    kicker: "Bắt đầu miễn phí",
    title: "Tạo tài khoản của bạn",
    description: "Ra mắt creator page đầu tiên và biến mỗi lượt nhấp thành một kết nối có giá trị.",
    submit: "Tạo tài khoản",
    footer: "Bạn đã có tài khoản?",
    footerLink: "Đăng nhập",
    footerHref: "/login",
  },
  forgot: {
    kicker: "Khôi phục tài khoản",
    title: "Đặt lại mật khẩu",
    description: "Nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn để bạn quay lại tài khoản.",
    submit: "Gửi liên kết khôi phục",
    footer: "Bạn đã nhớ mật khẩu?",
    footerLink: "Đăng nhập",
    footerHref: "/login",
  },
} as const;

function Brand() {
  return (
    <Link className={styles.brand} href="/" aria-label="Linkicom — Trang chủ">
      <span className={styles.brandMark} aria-hidden="true">
        <i />
        <i />
      </span>
      <span>Linkicom</span>
    </Link>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.39a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.97-4.33 2.97-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.87A6.02 6.02 0 0 1 6.07 12c0-.65.11-1.28.32-1.87V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.61Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.61C7.18 7.76 9.39 6 12 6Z" />
    </svg>
  );
}

function ProductPreview() {
  return (
    <aside className={styles.previewPanel} aria-label="Xem trước sản phẩm Linkicom">
      <div className={styles.previewCopy}>
        <span className={styles.previewKicker}><Sparkles size={13} /> Không gian dành cho creator</span>
        <h2>Một link gọn gàng.<br />Mọi tín hiệu tăng trưởng.</h2>
        <p>Tạo trải nghiệm mở khoá đáng tin cậy và hiểu chính xác điều gì khiến cộng đồng của bạn hành động.</p>
      </div>

      <div className={styles.productWindow} aria-hidden="true">
        <div className={styles.windowTopbar}>
          <span className={styles.windowDots}><i /><i /><i /></span>
          <span className={styles.windowAddress}>app.linkicom.io/overview</span>
          <span />
        </div>
        <div className={styles.windowBody}>
          <nav className={styles.mockSidebar}>
            <span className={styles.mockLogo}><i /><i /></span>
            <span className={styles.mockNavActive}><TrendingUp size={15} /></span>
            <span><Link2 size={15} /></span>
            <span><LockKeyhole size={15} /></span>
          </nav>
          <div className={styles.mockContent}>
            <div className={styles.mockHeading}>
              <div><small>OVERVIEW</small><strong>Creator growth</strong></div>
              <span>30 ngày qua</span>
            </div>
            <div className={styles.statsGrid}>
              <div><small>Lượt xem</small><strong>28.4K</strong><em>+18.2%</em></div>
              <div><small>Hành động</small><strong>10.8K</strong><em>+12.4%</em></div>
              <div><small>Chuyển đổi</small><strong>38.1%</strong><em>+4.3%</em></div>
            </div>
            <div className={styles.chart}>
              <span className={styles.chartLine} />
              <i className={styles.chartPoint} />
            </div>
            <div className={styles.activity}>
              <span><ShieldCheck size={16} /></span>
              <div><strong>482 hành động đã xác minh</strong><small>Nội dung được mở khoá an toàn hôm nay</small></div>
              <Check size={15} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.trustRow}>
        <span><MousePointerClick size={14} /> Trải nghiệm đơn giản</span>
        <span><ShieldCheck size={14} /> Dữ liệu được bảo vệ</span>
      </div>
    </aside>
  );
}

function validateForm(mode: AuthMode, form: HTMLFormElement) {
  const formData = new FormData(form);
  const errors: FieldErrors = {};
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (mode === "register" && name.length < 2) errors.name = "Vui lòng nhập họ và tên.";
  if (!email) errors.email = "Vui lòng nhập email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email chưa đúng định dạng.";

  if (mode !== "forgot") {
    if (!password) errors.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 8) errors.password = "Mật khẩu cần có ít nhất 8 ký tự.";
  }

  if (mode === "register") {
    if (!confirmPassword) errors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
    else if (confirmPassword !== password) errors.confirmPassword = "Mật khẩu nhập lại chưa khớp.";
    if (!formData.get("terms")) errors.terms = "Bạn cần đồng ý với điều khoản để tiếp tục.";
  }

  return errors;
}

export function AuthScreen({
  mode,
  googleEnabled = false,
}: {
  mode: AuthMode;
  googleEnabled?: boolean;
}) {
  const router = useRouter();
  const copy = pageCopy[mode];
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearField(field: keyof FieldErrors) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (message) setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(mode, event.currentTarget);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage("");
      return;
    }

    if (mode !== "login") {
      setMessage(
        mode === "forgot"
          ? "Yêu cầu hợp lệ — chức năng gửi email sẽ được triển khai ở bước tiếp theo."
          : "Đăng ký bằng email sẽ được triển khai sau luồng đăng nhập.",
      );
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await signIn("credentials", {
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
        redirect: false,
        redirectTo: "/member",
      });

      if (!result?.ok) {
        setMessage("Email hoặc mật khẩu không đúng.");
        return;
      }

      router.push(result.url || "/member");
      router.refresh();
    } catch {
      setMessage("Không thể kết nối máy chủ xác thực. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setErrors({});
    if (!googleEnabled) {
      setMessage("Google OAuth chưa được cấu hình trong môi trường hiện tại.");
      return;
    }

    setIsSubmitting(true);
    await signIn("google", { redirectTo: "/member" });
  }

  return (
    <main className={styles.page}>
      <section className={styles.formPanel}>
        <div className={styles.formPanelInner}>
          <header className={styles.header}>
            <Brand />
            <Link href="/" className={styles.homeLink}>Về trang chủ <ArrowRight size={14} /></Link>
          </header>

          <div className={styles.formContainer}>
            {mode === "forgot" && (
              <Link href="/login" className={styles.backLink}><ArrowLeft size={15} /> Quay lại đăng nhập</Link>
            )}

            <span className={styles.kicker}>{copy.kicker}</span>
            <h1>{copy.title}</h1>
            <p className={styles.description}>{copy.description}</p>

            {mode !== "forgot" && (
              <>
                <button className={styles.googleButton} type="button" onClick={handleGoogle} disabled={isSubmitting}>
                  <GoogleIcon />
                  Tiếp tục với Google
                </button>
                <div className={styles.divider}><span>hoặc tiếp tục bằng email</span></div>
              </>
            )}

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {mode === "register" && (
                <label className={styles.field}>
                  <span>Họ và tên</span>
                  <div className={`${styles.inputBox} ${errors.name ? styles.inputError : ""}`}>
                    <UserRound size={17} />
                    <input
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Nguyễn Minh Anh"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      onChange={() => clearField("name")}
                    />
                  </div>
                  {errors.name && <small id="name-error" className={styles.errorText}>{errors.name}</small>}
                </label>
              )}

              <label className={styles.field}>
                <span>Email</span>
                <div className={`${styles.inputBox} ${errors.email ? styles.inputError : ""}`}>
                  <Mail size={17} />
                  <input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="creator@example.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    onChange={() => clearField("email")}
                  />
                </div>
                {errors.email && <small id="email-error" className={styles.errorText}>{errors.email}</small>}
              </label>

              {mode !== "forgot" && (
                <label className={styles.field}>
                  <span className={styles.passwordLabel}>
                    Mật khẩu
                    {mode === "login" && <Link href="/forgot-password">Quên mật khẩu?</Link>}
                  </span>
                  <div className={`${styles.inputBox} ${errors.password ? styles.inputError : ""}`}>
                    <LockKeyhole size={17} />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                      placeholder={mode === "register" ? "Tối thiểu 8 ký tự" : "Nhập mật khẩu"}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      onChange={() => clearField("password")}
                    />
                    <button
                      type="button"
                      className={styles.revealButton}
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && <small id="password-error" className={styles.errorText}>{errors.password}</small>}
                </label>
              )}

              {mode === "register" && (
                <label className={styles.field}>
                  <span>Nhập lại mật khẩu</span>
                  <div className={`${styles.inputBox} ${errors.confirmPassword ? styles.inputError : ""}`}>
                    <LockKeyhole size={17} />
                    <input
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                      onChange={() => clearField("confirmPassword")}
                    />
                  </div>
                  {errors.confirmPassword && <small id="confirm-password-error" className={styles.errorText}>{errors.confirmPassword}</small>}
                </label>
              )}

              {mode === "register" && (
                <div>
                  <label className={styles.terms}>
                    <input name="terms" type="checkbox" onChange={() => clearField("terms")} />
                    <span aria-hidden="true"><Check size={12} /></span>
                    <p>Tôi đồng ý với <Link href="/">Điều khoản sử dụng</Link> và <Link href="/">Chính sách quyền riêng tư</Link>.</p>
                  </label>
                  {errors.terms && <small className={styles.errorText}>{errors.terms}</small>}
                </div>
              )}

              <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang xác thực..." : copy.submit}<ArrowRight size={16} />
              </button>
              <p className={styles.statusMessage} role="status" aria-live="polite">{message}</p>
            </form>

            <p className={styles.switchMode}>
              {copy.footer} <Link href={copy.footerHref}>{copy.footerLink}</Link>
            </p>
          </div>

          <footer className={styles.footer}>
            <span>© 2026 Linkicom</span>
            <span>Đơn giản · An toàn · Dành cho creator</span>
          </footer>
        </div>
      </section>
      <ProductPreview />
    </main>
  );
}
