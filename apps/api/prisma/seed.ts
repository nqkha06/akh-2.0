import { Prisma, PrismaClient } from "@prisma/client";
import { permissionCatalog } from "@stu/contracts";
import { hash } from "bcryptjs";

import { defaultCookiePages } from "./seeds/cookie-pages";
import { defaultPrivacyPages } from "./seeds/privacy-pages";
import { defaultTermsPages } from "./seeds/terms-pages";

const prisma = new PrismaClient();

const defaultEmailPreferenceTopics = [
  {
    code: "account_security",
    name: "Bảo mật tài khoản",
    description: "Xác minh email, đổi mật khẩu và cảnh báo đăng nhập.",
    category: "transactional",
    isRequired: true,
    isEnabled: true,
    displayOrder: 10,
  },
  {
    code: "payments_and_payouts",
    name: "Thanh toán và chi trả",
    description: "Cập nhật giao dịch, rút tiền và payout.",
    category: "transactional",
    isRequired: true,
    isEnabled: true,
    displayOrder: 20,
  },
  {
    code: "product_updates",
    name: "Cập nhật sản phẩm",
    description: "Tính năng mới và thay đổi quan trọng của sản phẩm.",
    category: "marketing",
    isRequired: false,
    isEnabled: true,
    displayOrder: 30,
  },
  {
    code: "promotions",
    name: "Ưu đãi",
    description: "Khuyến mãi và ưu đãi dành cho thành viên.",
    category: "marketing",
    isRequired: false,
    isEnabled: true,
    displayOrder: 40,
  },
  {
    code: "weekly_digest",
    name: "Tổng hợp hàng tuần",
    description: "Bản tổng hợp hoạt động và nội dung nổi bật mỗi tuần.",
    category: "marketing",
    isRequired: false,
    isEnabled: true,
    displayOrder: 50,
  },
] as const;

const defaultEmailTemplates = [
  {
    code: "verify_email",
    name: "Xác minh email",
    description: "Gửi liên kết xác minh địa chỉ email mới.",
    category: "transactional",
    status: "active",
    subject: "Xác minh email của bạn",
    preheader: "Hoàn tất xác minh để bảo vệ tài khoản.",
    htmlContent:
      "<h1>Xin chào {{user.name}}</h1><p>Vui lòng xác minh email bằng liên kết sau:</p><p><a href=\"{{verifyUrl}}\">Xác minh email</a></p><p>{{company.name}}</p>",
    textContent:
      "Xin chào {{user.name}}\n\nXác minh email: {{verifyUrl}}\n\n{{company.name}}",
    variables: [
      { key: "user.name", label: "Tên người dùng", type: "string", required: true, example: "Nguyễn An", description: "Tên hiển thị của người nhận." },
      { key: "verifyUrl", label: "Liên kết xác minh", type: "url", required: true, example: "https://example.com/verify/test", description: "Signed verification URL." },
      { key: "company.name", label: "Tên công ty", type: "string", required: true, example: "Link4Sub", description: "Tên thương hiệu hiện tại." },
    ],
  },
  {
    code: "password_reset",
    name: "Đặt lại mật khẩu",
    description: "Gửi liên kết đặt lại mật khẩu có thời hạn.",
    category: "transactional",
    status: "active",
    subject: "Yêu cầu đặt lại mật khẩu",
    preheader: "Liên kết này sẽ hết hạn sau {{expiresMinutes}} phút.",
    htmlContent:
      "<h1>Đặt lại mật khẩu</h1><p>Xin chào {{user.name}},</p><p><a href=\"{{resetUrl}}\">Tạo mật khẩu mới</a></p><p>Liên kết hết hạn sau {{expiresMinutes}} phút.</p>",
    textContent:
      "Xin chào {{user.name}}\n\nĐặt lại mật khẩu: {{resetUrl}}\nLiên kết hết hạn sau {{expiresMinutes}} phút.",
    variables: [
      { key: "user.name", label: "Tên người dùng", type: "string", required: true, example: "Nguyễn An", description: "Tên hiển thị của người nhận." },
      { key: "resetUrl", label: "Liên kết reset", type: "url", required: true, example: "https://example.com/reset-password/test", description: "Signed password reset URL." },
      { key: "expiresMinutes", label: "Số phút hết hạn", type: "number", required: true, example: 30, description: "TTL của reset token." },
    ],
  },
  {
    code: "payout_completed",
    name: "Payout hoàn tất",
    description: "Xác nhận yêu cầu chi trả đã hoàn tất.",
    category: "transactional",
    status: "active",
    subject: "Chi trả {{payout.amount}} đã hoàn tất",
    preheader: "Mã giao dịch {{payout.reference}}.",
    htmlContent:
      "<h1>Chi trả hoàn tất</h1><p>Xin chào {{user.name}},</p><p>Khoản {{payout.amount}} đã được xử lý.</p><p>Mã giao dịch: {{payout.reference}}</p>",
    textContent:
      "Xin chào {{user.name}}\n\nKhoản {{payout.amount}} đã được xử lý.\nMã giao dịch: {{payout.reference}}",
    variables: [
      { key: "user.name", label: "Tên người dùng", type: "string", required: true, example: "Nguyễn An", description: "Tên hiển thị của người nhận." },
      { key: "payout.amount", label: "Số tiền", type: "currency", required: true, example: "1.250.000 ₫", description: "Số tiền payout đã định dạng." },
      { key: "payout.reference", label: "Mã giao dịch", type: "string", required: true, example: "PAY-2026-0001", description: "Mã tham chiếu payout." },
    ],
  },
  {
    code: "new_feature_announcement",
    name: "Thông báo tính năng mới",
    description: "Template marketing cho cập nhật sản phẩm, để ở draft.",
    category: "marketing",
    status: "draft",
    subject: "Khám phá {{feature.name}}",
    preheader: "{{feature.summary}}",
    htmlContent:
      "<h1>{{feature.name}}</h1><p>{{feature.summary}}</p><p><a href=\"{{feature.url}}\">Khám phá ngay</a></p>",
    textContent:
      "{{feature.name}}\n\n{{feature.summary}}\n\n{{feature.url}}",
    variables: [
      { key: "feature.name", label: "Tên tính năng", type: "string", required: true, example: "Analytics mới", description: "Tên tính năng được giới thiệu." },
      { key: "feature.summary", label: "Mô tả ngắn", type: "string", required: true, example: "Hiểu hiệu suất nội dung rõ hơn.", description: "Thông điệp chính." },
      { key: "feature.url", label: "Liên kết", type: "url", required: true, example: "https://example.com/features/analytics", description: "Trang giới thiệu tính năng." },
    ],
  },
] as const;

// Snapshot from VietQR's transfer-supported bank catalog on 2026-08-15.
// MoMo is excluded here because it is seeded as a separate payment method.
const vietnamBankOptions = [
  { value: "ABB", label: "ABBANK — Ngân hàng TMCP An Bình" },
  { value: "ACB", label: "ACB — Ngân hàng TMCP Á Châu" },
  {
    value: "VBA",
    label: "Agribank — Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
  },
  {
    value: "BAB",
    label: "BacABank — Ngân hàng TMCP Bắc Á",
  },
  {
    value: "BVB",
    label: "BaoVietBank — Ngân hàng TMCP Bảo Việt",
  },
  {
    value: "BIDV",
    label: "BIDV — Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
  },
  {
    value: "CAKE",
    label: "CAKE — Ngân hàng số CAKE by VPBank",
  },
  {
    value: "CIMB",
    label: "CIMB — Ngân hàng TNHH MTV CIMB Việt Nam",
  },
  {
    value: "COOPBANK",
    label: "COOPBANK — Ngân hàng Hợp tác xã Việt Nam",
  },
  {
    value: "EIB",
    label: "Eximbank — Ngân hàng TMCP Xuất Nhập khẩu Việt Nam",
  },
  {
    value: "HDB",
    label: "HDBank — Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh",
  },
  {
    value: "KBank",
    label: "KBank — Ngân hàng Đại chúng TNHH Kasikornbank",
  },
  {
    value: "KLB",
    label: "KienLongBank — Ngân hàng TMCP Kiên Long",
  },
  {
    value: "LPB",
    label: "LPBank — Ngân hàng TMCP Lộc Phát Việt Nam",
  },
  { value: "MB", label: "MBBank — Ngân hàng TMCP Quân đội" },
  {
    value: "MBV",
    label: "MBV — Ngân hàng TNHH MTV Việt Nam Hiện Đại",
  },
  { value: "MSB", label: "MSB — Ngân hàng TMCP Hàng Hải Việt Nam" },
  { value: "NAB", label: "NamABank — Ngân hàng TMCP Nam Á" },
  { value: "NCB", label: "NCB — Ngân hàng TMCP Quốc Dân" },
  { value: "OCB", label: "OCB — Ngân hàng TMCP Phương Đông" },
  {
    value: "PGB",
    label: "PGBank — Ngân hàng TMCP Thịnh vượng và Phát triển",
  },
  {
    value: "PVCB",
    label: "PVcomBank — Ngân hàng TMCP Đại Chúng Việt Nam",
  },
  {
    value: "PVDB",
    label: "PVcomBank Pay — Ngân hàng số PVcomBank",
  },
  { value: "STB", label: "Sacombank — Ngân hàng TMCP Sài Gòn Thương Tín" },
  {
    value: "SGICB",
    label: "SaigonBank — Ngân hàng TMCP Sài Gòn Công Thương",
  },
  { value: "SCB", label: "SCB — Ngân hàng TMCP Sài Gòn" },
  { value: "SEAB", label: "SeABank — Ngân hàng TMCP Đông Nam Á" },
  { value: "SHB", label: "SHB — Ngân hàng TMCP Sài Gòn - Hà Nội" },
  {
    value: "SHBVN",
    label: "ShinhanBank — Ngân hàng TNHH MTV Shinhan Việt Nam",
  },
  { value: "TCB", label: "Techcombank — Ngân hàng TMCP Kỹ thương Việt Nam" },
  { value: "TIMO", label: "Timo — Ngân hàng số Timo" },
  { value: "TPB", label: "TPBank — Ngân hàng TMCP Tiên Phong" },
  { value: "Ubank", label: "Ubank — Ngân hàng số Ubank by VPBank" },
  { value: "VAB", label: "VietABank — Ngân hàng TMCP Việt Á" },
  {
    value: "VCCB",
    label: "VietCapitalBank — Ngân hàng TMCP Bản Việt",
  },
  {
    value: "VIETBANK",
    label: "VietBank — Ngân hàng TMCP Việt Nam Thương Tín",
  },
  {
    value: "VCB",
    label: "Vietcombank — Ngân hàng TMCP Ngoại Thương Việt Nam",
  },
  {
    value: "ICB",
    label: "VietinBank — Ngân hàng TMCP Công thương Việt Nam",
  },
  { value: "VIB", label: "VIB — Ngân hàng TMCP Quốc tế Việt Nam" },
  { value: "VPB", label: "VPBank — Ngân hàng TMCP Việt Nam Thịnh Vượng" },
  {
    value: "WVN",
    label: "Woori — Ngân hàng TNHH MTV Woori Việt Nam",
  },
] as const;

const defaultPaymentMethods = [
  {
    id: 1,
    withdrawFee: "0",
    minWithdrawAmount: "0",
    status: "published",
    translations: [
      {
        locale: "vi",
        name: "Chuyển khoản ngân hàng (Việt Nam)",
        fields: [
          {
            key: "bank_code",
            label: "Ngân hàng",
            type: "select",
            required: true,
            placeholder: "Chọn ngân hàng",
            options: vietnamBankOptions,
          },
          {
            key: "account_name",
            label: "Tên chủ tài khoản",
            type: "text",
            required: true,
            placeholder: "NGUYEN VAN A",
          },
          {
            key: "account_number",
            label: "Số tài khoản",
            type: "text",
            required: true,
            placeholder: "Nhập số tài khoản",
          },
        ],
      },
      {
        locale: "en",
        name: "Bank transfer (Vietnam)",
        fields: [
          {
            key: "bank_code",
            label: "Bank",
            type: "select",
            required: true,
            placeholder: "Select a bank",
            options: vietnamBankOptions,
          },
          {
            key: "account_name",
            label: "Account holder name",
            type: "text",
            required: true,
            placeholder: "NGUYEN VAN A",
          },
          {
            key: "account_number",
            label: "Account number",
            type: "text",
            required: true,
            placeholder: "Enter the account number",
          },
        ],
      },
      {
        locale: "id",
        name: "Transfer bank (Vietnam)",
        fields: [
          {
            key: "bank_code",
            label: "Bank",
            type: "select",
            required: true,
            placeholder: "Pilih bank",
            options: vietnamBankOptions,
          },
          {
            key: "account_name",
            label: "Nama pemilik rekening",
            type: "text",
            required: true,
            placeholder: "NGUYEN VAN A",
          },
          {
            key: "account_number",
            label: "Nomor rekening",
            type: "text",
            required: true,
            placeholder: "Masukkan nomor rekening",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    withdrawFee: "0",
    minWithdrawAmount: "0",
    status: "published",
    translations: [
      {
        locale: "vi",
        name: "MoMo (Việt Nam)",
        fields: [
          { key: "account_number", label: "Số điện thoại MoMo", type: "tel", required: true, placeholder: "09xxxxxxxx" },
          { key: "account_name", label: "Tên chủ tài khoản", type: "text", required: true, placeholder: "NGUYEN VAN A" },
        ],
      },
      {
        locale: "en",
        name: "MoMo (Vietnam)",
        fields: [
          { key: "account_number", label: "MoMo phone number", type: "tel", required: true, placeholder: "09xxxxxxxx" },
          { key: "account_name", label: "Account holder name", type: "text", required: true, placeholder: "NGUYEN VAN A" },
        ],
      },
      {
        locale: "id",
        name: "MoMo (Vietnam)",
        fields: [
          { key: "account_number", label: "Nomor telepon MoMo", type: "tel", required: true, placeholder: "09xxxxxxxx" },
          { key: "account_name", label: "Nama pemilik akun", type: "text", required: true, placeholder: "NGUYEN VAN A" },
        ],
      },
    ],
  },
  {
    id: 3,
    withdrawFee: "0",
    minWithdrawAmount: "0",
    status: "published",
    translations: [
      {
        locale: "vi",
        name: "ZaloPay (Việt Nam)",
        fields: [
          { key: "account_number", label: "Số điện thoại ZaloPay", type: "tel", required: true, placeholder: "09xxxxxxxx" },
          { key: "account_name", label: "Tên chủ tài khoản", type: "text", required: true, placeholder: "NGUYEN VAN A" },
        ],
      },
      {
        locale: "en",
        name: "ZaloPay (Vietnam)",
        fields: [
          { key: "account_number", label: "ZaloPay phone number", type: "tel", required: true, placeholder: "09xxxxxxxx" },
          { key: "account_name", label: "Account holder name", type: "text", required: true, placeholder: "NGUYEN VAN A" },
        ],
      },
      {
        locale: "id",
        name: "ZaloPay (Vietnam)",
        fields: [
          { key: "account_number", label: "Nomor telepon ZaloPay", type: "tel", required: true, placeholder: "09xxxxxxxx" },
          { key: "account_name", label: "Nama pemilik akun", type: "text", required: true, placeholder: "NGUYEN VAN A" },
        ],
      },
    ],
  },
  {
    id: 4,
    withdrawFee: "1.5",
    minWithdrawAmount: "0",
    status: "published",
    translations: [
      {
        locale: "vi",
        name: "USDT (TRC20 · Việt Nam & Quốc tế)",
        fields: [
          { key: "wallet_address", label: "Địa chỉ ví USDT (TRC20)", type: "text", required: true, placeholder: "Bắt đầu bằng T" },
        ],
      },
      {
        locale: "en",
        name: "USDT (TRC20 · Vietnam & International)",
        fields: [
          { key: "wallet_address", label: "USDT wallet address (TRC20)", type: "text", required: true, placeholder: "Starts with T" },
        ],
      },
      {
        locale: "id",
        name: "USDT (TRC20 · Vietnam & Internasional)",
        fields: [
          { key: "wallet_address", label: "Alamat dompet USDT (TRC20)", type: "text", required: true, placeholder: "Diawali dengan T" },
        ],
      },
    ],
  },
  {
    id: 5,
    withdrawFee: "0.1",
    minWithdrawAmount: "0",
    status: "published",
    translations: [
      {
        locale: "vi",
        name: "USDT (BEP20 · Việt Nam & Quốc tế)",
        fields: [
          { key: "wallet_address", label: "Địa chỉ ví USDT (BEP20)", type: "text", required: true, placeholder: "Bắt đầu bằng 0x" },
        ],
      },
      {
        locale: "en",
        name: "USDT (BEP20 · Vietnam & International)",
        fields: [
          { key: "wallet_address", label: "USDT wallet address (BEP20)", type: "text", required: true, placeholder: "Starts with 0x" },
        ],
      },
      {
        locale: "id",
        name: "USDT (BEP20 · Vietnam & Internasional)",
        fields: [
          { key: "wallet_address", label: "Alamat dompet USDT (BEP20)", type: "text", required: true, placeholder: "Diawali dengan 0x" },
        ],
      },
    ],
  },
] as const;

const demoSnippets = [
  {
    id: "demo-snippet-welcome",
    name: "Welcome Message",
    content: "Welcome to our exclusive content!",
  },
  {
    id: "demo-snippet-coupon",
    name: "Limited Offer",
    content: "Get 50% off on your first purchase",
  },
  {
    id: "demo-snippet-newsletter",
    name: "Newsletter Signup",
    content: "Subscribe to our newsletter for updates",
  },
];

const demoLinks = [
  {
    slug: "music-drop",
    destinationUrl: "https://open.spotify.com/artist/demo",
    title: "Music drop unlock",
    inputType: "url",
    subtitle: "Follow and watch to unlock the new track.",
    customAlias: "music-drop",
    coverImageUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    clicks: 1820,
    status: "active",
    selectedBackgroundId: "1",
    selectedBackgroundName: "Neon Flow",
    backgroundMediaType: "image",
    backgroundMediaUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80",
    actions: [
      {
        platform: "youtube",
        action: "watch",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        platform: "spotify",
        action: "follow-artist",
        url: "https://open.spotify.com/artist/demo",
      },
    ],
  },
  {
    slug: "creator-pack",
    destinationUrl: "/api/backend/files/demo-pack/download",
    title: "Creator preset pack",
    inputType: "file",
    selectedFile: "demo-file-pack",
    subtitle: "Complete social actions to download the preset pack.",
    customAlias: "creator-pack",
    coverImageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
    expiryEnabled: true,
    expiryType: "clicks",
    maxClicks: 5000,
    clicks: 742,
    status: "active",
    selectedBackgroundId: "6",
    selectedBackgroundName: "Chromatic Wave",
    backgroundMediaType: "image",
    backgroundMediaUrl:
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1400&q=80",
    actions: [
      {
        platform: "instagram",
        action: "follow",
        url: "https://instagram.com/demo",
      },
      {
        platform: "tiktok",
        action: "follow",
        url: "https://tiktok.com/@demo",
      },
    ],
  },
  {
    slug: "summer-code",
    destinationUrl: "SUMMER-25-OFF",
    title: "Summer coupon code",
    inputType: "snippet",
    selectedSnippet: "demo-snippet-coupon",
    subtitle: "Reveal a limited coupon after joining the community.",
    customAlias: "summer-code",
    expiryEnabled: true,
    expiryType: "date",
    expiryDate: new Date("2026-08-01T00:00:00.000Z"),
    expiryTime: "23:59",
    clicks: 96,
    status: "paused",
    selectedBackgroundId: "youtube",
    selectedBackgroundName: "YouTube video",
    backgroundMediaType: "youtube",
    backgroundMediaUrl: "https://www.youtube.com/watch?v=3EEnvO0yMHY",
    actions: [
      {
        platform: "discord",
        action: "join-server",
        url: "https://discord.gg/demo",
      },
    ],
  },
  {
    slug: "launch-upvote",
    destinationUrl: "https://www.producthunt.com/posts/demo",
    title: "Product launch boost",
    inputType: "url",
    subtitle: "Upvote and follow the maker to unlock the bonus.",
    customAlias: "launch-upvote",
    coverImageUrl:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    clicks: 311,
    status: "inactive",
    selectedBackgroundId: "15",
    selectedBackgroundName: "Midnight Bloom",
    backgroundMediaType: "image",
    backgroundMediaUrl:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80",
    actions: [
      {
        platform: "productHunt",
        action: "upvote-product",
        url: "https://www.producthunt.com/posts/demo",
      },
      {
        platform: "twitter",
        action: "follow",
        url: "https://x.com/demo",
      },
    ],
  },
  {
    slug: "join-channel",
    destinationUrl: "https://t.me/demo",
    title: "Telegram community invite",
    inputType: "url",
    subtitle: "Join the channel and unlock the private resource.",
    customAlias: "join-channel",
    clicks: 58,
    status: "active",
    selectedBackgroundId: "17",
    selectedBackgroundName: "Tropical Echo",
    backgroundMediaType: "image",
    backgroundMediaUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    actions: [
      {
        platform: "telegram",
        action: "join-channel",
        url: "https://t.me/demo",
      },
    ],
  },
];

const defaultMonetizationLevels = [
  {
    key: "clean",
    status: "published",
    isDefault: false,
    sortOrder: 10,
    profitBps: 100,
    stepCount: 1,
    densities: {
      popup: "limited",
      banner: "none",
      interstitial: "none",
      notification: "none",
    },
    translations: {
      vi: {
        name: "Sạch",
        description:
          "Trải nghiệm nhẹ, chỉ có quảng cáo pop-up mật độ giới hạn.",
      },
      en: {
        name: "Clean",
        description: "A light experience with limited popup advertising.",
      },
    },
  },
  {
    key: "balanced",
    status: "published",
    isDefault: true,
    sortOrder: 20,
    profitBps: 300,
    stepCount: 2,
    densities: {
      popup: "limited",
      banner: "limited",
      interstitial: "limited",
      notification: "none",
    },
    translations: {
      vi: {
        name: "Cân bằng",
        description: "Cân bằng doanh thu và trải nghiệm của người truy cập.",
      },
      en: {
        name: "Balanced",
        description: "Balances revenue with the visitor experience.",
      },
    },
  },
  {
    key: "maximum",
    status: "published",
    isDefault: false,
    sortOrder: 30,
    profitBps: 500,
    stepCount: 3,
    densities: {
      popup: "maximum",
      banner: "maximum",
      interstitial: "maximum",
      notification: "limited",
    },
    translations: {
      vi: {
        name: "Tối đa",
        description: "Ưu tiên doanh thu với mật độ quảng cáo cao.",
      },
      en: {
        name: "Maximum",
        description: "Prioritizes revenue with a higher advertising density.",
      },
    },
  },
] as const;

const loyaltyBenefitCatalog = [
  { key: "cpm_bonus", vi: "Thưởng CPM", en: "CPM bonus" },
  {
    key: "analytics_history",
    vi: "Lịch sử phân tích",
    en: "Analytics history",
  },
  { key: "custom_slugs", vi: "Custom slug", en: "Custom slugs" },
  {
    key: "link_scheduling",
    vi: "Lập lịch bật hoặc tắt link",
    en: "Link scheduling",
  },
  { key: "csv_export", vi: "Xuất báo cáo CSV", en: "CSV report export" },
  {
    key: "storage_bonus",
    vi: "Tăng dung lượng lưu trữ",
    en: "Additional storage",
  },
  { key: "custom_qr", vi: "Tùy chỉnh QR code", en: "Custom QR codes" },
  {
    key: "priority_support",
    vi: "Hỗ trợ ưu tiên",
    en: "Priority support",
  },
] as const;

type LoyaltyBenefitKey = (typeof loyaltyBenefitCatalog)[number]["key"];
type LoyaltyBenefitValues = Partial<
  Record<LoyaltyBenefitKey, string | null>
>;

function loyaltyBenefits(
  locale: "vi" | "en",
  included: LoyaltyBenefitValues,
) {
  return loyaltyBenefitCatalog.map((benefit) => ({
    key: benefit.key,
    label: benefit[locale],
    included: Object.prototype.hasOwnProperty.call(included, benefit.key),
    value: included[benefit.key] ?? null,
  }));
}

const defaultLoyaltyTiers = [
  {
    key: "started",
    minimumValidViews: 0,
    sortOrder: 10,
    iconKey: "sparkles",
    translations: {
      vi: {
        name: "Khởi đầu",
        description: "Các công cụ cơ bản để bắt đầu tích lũy lượt xem hợp lệ.",
        included: { analytics_history: "7 ngày" },
      },
      en: {
        name: "Starter",
        description: "Core tools for starting to collect valid views.",
        included: { analytics_history: "7 days" },
      },
    },
  },
  {
    key: "bronze",
    minimumValidViews: 1_000,
    sortOrder: 20,
    iconKey: "shield-check",
    translations: {
      vi: {
        name: "Đồng",
        description: "Dành cho creator đang xây dựng lưu lượng ổn định.",
        included: {
          cpm_bonus: "+1%",
          analytics_history: "30 ngày",
          custom_slugs: "5 mỗi tháng",
        },
      },
      en: {
        name: "Bronze",
        description: "For creators building a consistent traffic base.",
        included: {
          cpm_bonus: "+1%",
          analytics_history: "30 days",
          custom_slugs: "5 per month",
        },
      },
    },
  },
  {
    key: "gold",
    minimumValidViews: 5_000,
    sortOrder: 30,
    iconKey: "trophy",
    translations: {
      vi: {
        name: "Vàng",
        description: "Bộ quyền lợi hiển thị cho creator có lưu lượng tăng trưởng.",
        included: {
          cpm_bonus: "+3%",
          analytics_history: "90 ngày",
          custom_slugs: "5 mỗi tháng",
          link_scheduling: null,
          csv_export: null,
          storage_bonus: null,
        },
      },
      en: {
        name: "Gold",
        description: "Displayed benefits for creators with growing traffic.",
        included: {
          cpm_bonus: "+3%",
          analytics_history: "90 days",
          custom_slugs: "5 per month",
          link_scheduling: null,
          csv_export: null,
          storage_bonus: null,
        },
      },
    },
  },
  {
    key: "diamond",
    minimumValidViews: 10_000,
    sortOrder: 40,
    iconKey: "gem",
    translations: {
      vi: {
        name: "Kim cương",
        description: "Hạng cao nhất trong danh mục Loyalty hiện tại.",
        included: {
          cpm_bonus: "+5%",
          analytics_history: "90 ngày",
          custom_slugs: "Tăng giới hạn",
          link_scheduling: null,
          csv_export: null,
          storage_bonus: null,
          custom_qr: null,
          priority_support: null,
        },
      },
      en: {
        name: "Diamond",
        description: "The highest tier in the current Loyalty catalog.",
        included: {
          cpm_bonus: "+5%",
          analytics_history: "90 days",
          custom_slugs: "Higher limit",
          link_scheduling: null,
          csv_export: null,
          storage_bonus: null,
          custom_qr: null,
          priority_support: null,
        },
      },
    },
  },
] as const;

async function main() {
  const demoPasswordHash = await hash("Demo123!", 12);

  await prisma.language.upsert({
    where: { locale: "vi" },
    update: {
      name: "Vietnamese",
      nativeName: "Tiếng Việt",
      code: "vi",
      regional: "vi-VN",
      flag: "VN",
      status: "published",
      sortOrder: 10,
      isRtl: false,
    },
    create: {
      name: "Vietnamese",
      nativeName: "Tiếng Việt",
      locale: "vi",
      code: "vi",
      regional: "vi-VN",
      flag: "VN",
      isDefault: true,
      status: "published",
      sortOrder: 10,
      isRtl: false,
    },
  });
  await prisma.language.upsert({
    where: { locale: "en" },
    update: {
      name: "English",
      nativeName: "English",
      code: "en",
      regional: "en-US",
      flag: "US",
      status: "published",
      sortOrder: 20,
      isRtl: false,
    },
    create: {
      name: "English",
      nativeName: "English",
      locale: "en",
      code: "en",
      regional: "en-US",
      flag: "US",
      status: "published",
      sortOrder: 20,
      isRtl: false,
    },
  });
  await prisma.language.upsert({
    where: { locale: "id" },
    update: {
      name: "Indonesian",
      nativeName: "Bahasa Indonesia",
      code: "id",
      regional: "id-ID",
      flag: "ID",
      status: "published",
      sortOrder: 30,
      isRtl: false,
    },
    create: {
      name: "Indonesian",
      nativeName: "Bahasa Indonesia",
      locale: "id",
      code: "id",
      regional: "id-ID",
      flag: "ID",
      status: "published",
      sortOrder: 30,
      isRtl: false,
    },
  });

  const legalPagesPublishedAt = new Date("2026-08-15T00:00:00.000Z");
  for (const page of [
    ...defaultCookiePages,
    ...defaultPrivacyPages,
    ...defaultTermsPages,
  ]) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        excerpt: page.excerpt,
        contentJson: page.contentJson,
        contentHtml: page.contentHtml,
        status: "PUBLISHED",
        featuredImageId: null,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: page.seoKeywords,
        canonicalUrl: null,
        robotsIndex: true,
        robotsFollow: true,
        sortOrder: 900,
        publishedAt: legalPagesPublishedAt,
        deletedAt: null,
      },
      create: {
        ...page,
        status: "PUBLISHED",
        robotsIndex: true,
        robotsFollow: true,
        sortOrder: 900,
        publishedAt: legalPagesPublishedAt,
      },
    });
  }

  await seedLocalizedLegalMenu();
  await seedLandingFooterMenus();

  for (const definition of defaultPaymentMethods) {
    const method = await prisma.paymentMethod.upsert({
      where: { id: definition.id },
      update: {
        withdrawFee: new Prisma.Decimal(definition.withdrawFee),
        minWithdrawAmount: new Prisma.Decimal(definition.minWithdrawAmount),
        status: definition.status,
      },
      create: {
        id: definition.id,
        withdrawFee: new Prisma.Decimal(definition.withdrawFee),
        minWithdrawAmount: new Prisma.Decimal(definition.minWithdrawAmount),
        status: definition.status,
      },
    });
    for (const translation of definition.translations) {
      const fieldsJson = JSON.stringify(translation.fields);
      await prisma.paymentMethodTranslation.upsert({
        where: {
          paymentMethodId_locale: {
            paymentMethodId: method.id,
            locale: translation.locale,
          },
        },
        update: { name: translation.name, fieldsJson },
        create: {
          paymentMethodId: method.id,
          locale: translation.locale,
          name: translation.name,
          fieldsJson,
        },
      });
    }
  }

  for (const permission of permissionCatalog) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: permission,
      create: permission,
    });
  }
  const adminRole = await prisma.role.upsert({
    where: { key: "admin" },
    update: { isSystem: true },
    create: {
      key: "admin",
      name: "Administrator",
      description: "Toàn quyền quản trị hệ thống.",
      isSystem: true,
    },
  });
  const memberRole = await prisma.role.upsert({
    where: { key: "member" },
    update: { isSystem: true },
    create: {
      key: "member",
      name: "Member",
      description: "Tài khoản thành viên mặc định.",
      isSystem: true,
    },
  });
  const permissions = await prisma.permission.findMany({
    select: { id: true },
  });
  for (const permission of permissions) {
    await prisma.roleHasPermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  await prisma.emailSettings.upsert({
    where: { id: 1 },
    update: { awsRegion: process.env.AWS_REGION || null },
    create: {
      id: 1,
      provider: "amazon_ses",
      providerStatus: "incomplete",
      awsRegion: process.env.AWS_REGION || null,
      defaultLocale: "vi",
      transactionalEnabled: true,
      marketingEnabled: false,
      trackingEnabled: false,
      openTrackingEnabled: false,
      clickTrackingEnabled: false,
    },
  });

  for (const topic of defaultEmailPreferenceTopics) {
    await prisma.emailPreferenceTopic.upsert({
      where: { code: topic.code },
      update: {
        name: topic.name,
        description: topic.description,
        category: topic.category,
        isRequired: topic.isRequired,
        displayOrder: topic.displayOrder,
      },
      create: topic,
    });
  }

  for (const definition of defaultEmailTemplates) {
    const template = await prisma.emailTemplate.upsert({
      where: { code: definition.code },
      update: {},
      create: {
        ...definition,
        variables: definition.variables as unknown as Prisma.InputJsonValue,
        version: 1,
        lastPublishedAt:
          definition.status === "active" ? new Date() : null,
      },
    });
    if (
      template.status === "active" &&
      (await prisma.emailTemplateVersion.count({
        where: { templateId: template.id },
      })) === 0
    ) {
      await prisma.emailTemplateVersion.create({
        data: {
          templateId: template.id,
          version: template.version,
          name: template.name,
          description: template.description,
          category: template.category,
          subject: template.subject,
          preheader: template.preheader,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
          variables: template.variables as Prisma.InputJsonValue,
          senderId: template.senderId,
        },
      });
    }
  }

  const monetizationLevelCount = await prisma.monetizationLevel.count();
  if (monetizationLevelCount === 0) {
    for (const level of defaultMonetizationLevels) {
      await prisma.monetizationLevel.create({
        data: {
          key: level.key,
          status: level.status,
          isDefault: level.isDefault,
          sortOrder: level.sortOrder,
          routesJson: "[]",
          ratesJson: "[]",
          metaDataJson: JSON.stringify({
            version: 1,
            profitBps: level.profitBps,
            stepCount: level.stepCount,
            visitorExperience: level.densities,
          }),
          translations: {
            create: Object.entries(level.translations).map(
              ([locale, translation]) => ({
                locale,
                ...translation,
              }),
            ),
          },
        },
      });
    }
  }

  for (const tier of defaultLoyaltyTiers) {
    const loyaltyTier = await prisma.loyaltyTier.upsert({
      where: { key: tier.key },
      update: {
        minimumValidViews: tier.minimumValidViews,
        sortOrder: tier.sortOrder,
        iconKey: tier.iconKey,
        status: "published",
      },
      create: {
        key: tier.key,
        minimumValidViews: tier.minimumValidViews,
        sortOrder: tier.sortOrder,
        iconKey: tier.iconKey,
        status: "published",
      },
    });

    for (const locale of ["vi", "en"] as const) {
      const translation = tier.translations[locale];
      await prisma.loyaltyTierTranslation.upsert({
        where: {
          tierId_locale: { tierId: loyaltyTier.id, locale },
        },
        update: {
          name: translation.name,
          description: translation.description,
          benefitsJson: JSON.stringify(
            loyaltyBenefits(locale, translation.included),
          ),
        },
        create: {
          tierId: loyaltyTier.id,
          locale,
          name: translation.name,
          description: translation.description,
          benefitsJson: JSON.stringify(
            loyaltyBenefits(locale, translation.included),
          ),
        },
      });
    }
  }

  const defaultMonetizationLevel = await prisma.monetizationLevel.findFirst({
    where: { isDefault: true, status: "published" },
    select: { id: true },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@linkicom.local" },
    update: {
      name: "Linkicom Demo",
      passwordHash: demoPasswordHash,
      status: "active",
    },
    create: {
      name: "Linkicom Demo",
      email: "demo@linkicom.local",
      passwordHash: demoPasswordHash,
      emailVerifiedAt: new Date(),
      status: "active",
      monetizationLevelId: defaultMonetizationLevel?.id,
    },
  });
  if (demoUser.monetizationLevelId === null && defaultMonetizationLevel) {
    await prisma.user.update({
      where: { id: demoUser.id },
      data: { monetizationLevelId: defaultMonetizationLevel.id },
    });
  }
  await prisma.userHasRole.upsert({
    where: {
      roleId_userId: { roleId: memberRole.id, userId: demoUser.id },
    },
    update: {},
    create: { roleId: memberRole.id, userId: demoUser.id },
  });

  const demoSnippetIds = new Map<string, number>();
  for (const snippet of demoSnippets) {
    const existing = await prisma.snippet.findFirst({
      where: { userId: demoUser.id, name: snippet.name },
      orderBy: { id: "asc" },
    });
    const record = existing
      ? await prisma.snippet.update({
          where: { id: existing.id },
          data: {
            name: snippet.name,
            content: snippet.content,
            deletedAt: null,
          },
        })
      : await prisma.snippet.create({
          data: {
            userId: demoUser.id,
            name: snippet.name,
            content: snippet.content,
          },
        });
    demoSnippetIds.set(snippet.id, record.id);
  }

  for (const link of demoLinks) {
    const { actions } = link;
    const appearanceJson = JSON.stringify({
      coverImageUrl:
        "coverImageUrl" in link ? (link.coverImageUrl ?? null) : null,
      backgroundSettings: {
        selectedBackgroundId: link.selectedBackgroundId ?? null,
        selectedBackgroundName: link.selectedBackgroundName ?? null,
        backgroundMediaType: link.backgroundMediaType ?? null,
        backgroundMediaUrl: link.backgroundMediaUrl ?? null,
        sameAsCoverImage: false,
        effects: {
          opacity: 100,
          blur: 0,
          saturation: 100,
          contrast: 100,
          grayscale: 0,
        },
      },
    });
    const destinationSnippetKey =
      link.inputType === "snippet" && "selectedSnippet" in link
        ? link.selectedSnippet
        : null;
    const destinationSnippetId = destinationSnippetKey
      ? demoSnippetIds.get(destinationSnippetKey) ?? null
      : null;
    const expiresAt =
      "expiryEnabled" in link &&
      link.expiryEnabled &&
      link.expiryType === "date"
        ? link.expiryDate
        : null;
    const maxClicks =
      "expiryEnabled" in link &&
      link.expiryEnabled &&
      link.expiryType === "clicks"
        ? link.maxClicks
        : null;
    const data = {
      userId: demoUser.id,
      slug: link.slug,
      title: link.title,
      subtitle: link.subtitle,
      destinationType: link.inputType,
      destinationUrl:
        link.inputType === "snippet" && destinationSnippetId
          ? null
          : link.destinationUrl,
      destinationFileId: null,
      destinationSnippetId,
      destinationSnippetContent:
        link.inputType === "snippet" && destinationSnippetKey
          ? demoSnippets.find((snippet) => snippet.id === destinationSnippetKey)
              ?.content ?? null
          : null,
      appearanceJson,
      expiresAt,
      maxClicks,
      views: link.clicks,
      status: link.status,
    };

    await prisma.link.upsert({
      where: {
        slug: link.slug,
      },
      update: {
        ...data,
        actions: {
          deleteMany: {},
          create: actions.map((action, position) => ({ ...action, position })),
        },
      },
      create: {
        ...data,
        actions: {
          create: actions.map((action, position) => ({ ...action, position })),
        },
      },
    });
  }
}

async function seedLocalizedLegalMenu() {
  const menu = await prisma.websiteMenu.findUnique({
    where: { key: "footer-legal" },
    include: { items: true },
  });
  if (!menu) return;

  await prisma.websiteMenuTranslation.upsert({
    where: { menuId_locale: { menuId: menu.id, locale: "id" } },
    update: { title: "Legal" },
    create: { menuId: menu.id, locale: "id", title: "Legal" },
  });

  const currentCookieItem = menu.items.find(
    ({ url }) => url === "/cookies",
  );
  const cookieItem = currentCookieItem
    ? await prisma.websiteMenuItem.update({
        where: { id: currentCookieItem.id },
        data: {
          parentId: null,
          pageId: null,
          type: "CUSTOM_URL",
          url: "/cookies",
          target: "SELF",
          rel: null,
          iconKey: null,
          isEnabled: true,
          sortOrder: 2,
          deletedAt: null,
        },
      })
    : await prisma.websiteMenuItem.create({
        data: {
          menuId: menu.id,
          type: "CUSTOM_URL",
          url: "/cookies",
          target: "SELF",
          isEnabled: true,
          sortOrder: 2,
        },
      });

  const localizedItems = [
    {
      item: menu.items.find(({ url }) => url === "/privacy"),
      locale: "vi",
      label: "Quyền riêng tư",
      urlOverride: "/privacy",
    },
    {
      item: menu.items.find(({ url }) => url === "/privacy"),
      locale: "en",
      label: "Privacy",
      urlOverride: "/privacy-en",
    },
    {
      item: menu.items.find(({ url }) => url === "/privacy"),
      locale: "id",
      label: "Privasi",
      urlOverride: "/privacy-id",
    },
    {
      item: menu.items.find(({ url }) => url === "/terms"),
      locale: "vi",
      label: "Điều khoản",
      urlOverride: "/terms",
    },
    {
      item: menu.items.find(({ url }) => url === "/terms"),
      locale: "en",
      label: "Terms",
      urlOverride: "/terms-en",
    },
    {
      item: menu.items.find(({ url }) => url === "/terms"),
      locale: "id",
      label: "Ketentuan",
      urlOverride: "/terms-id",
    },
    {
      item: cookieItem,
      locale: "vi",
      label: "Cookie",
      urlOverride: "/cookies",
    },
    {
      item: cookieItem,
      locale: "en",
      label: "Cookies",
      urlOverride: "/cookies-en",
    },
    {
      item: cookieItem,
      locale: "id",
      label: "Cookie",
      urlOverride: "/cookies-id",
    },
  ] as const;

  for (const definition of localizedItems) {
    if (!definition.item) continue;
    await prisma.websiteMenuItemTranslation.upsert({
      where: {
        menuItemId_locale: {
          menuItemId: definition.item.id,
          locale: definition.locale,
        },
      },
      update: {
        label: definition.label,
        urlOverride: definition.urlOverride,
      },
      create: {
        menuItemId: definition.item.id,
        locale: definition.locale,
        label: definition.label,
        urlOverride: definition.urlOverride,
      },
    });
  }

  if (menu.publishedSnapshotJson) {
    await prisma.websiteMenu.update({
      where: { id: menu.id },
      data: {
        publishedSnapshotJson: localizeLegalMenuSnapshot(
          menu.publishedSnapshotJson,
          cookieItem.id,
        ),
      },
    });
  }
}

function localizeLegalMenuSnapshot(value: string, cookieItemId: number) {
  type SnapshotTranslation = {
    label?: string;
    title?: string | null;
    ariaLabel?: string | null;
    urlOverride?: string | null;
  };
  type SnapshotItem = {
    id?: number;
    type?: string;
    pageId?: number | null;
    url?: string | null;
    pageUrl?: string | null;
    target?: string;
    rel?: string | null;
    iconKey?: string | null;
    translations?: Record<string, SnapshotTranslation>;
    children?: SnapshotItem[];
  };
  type Snapshot = {
    translations?: Record<string, { title?: string | null }>;
    items?: SnapshotItem[];
  };

  try {
    const snapshot = JSON.parse(value) as Snapshot;
    snapshot.translations = {
      ...snapshot.translations,
      id: { title: "Legal" },
    };
    snapshot.items ??= [];
    if (!snapshot.items.some((item) => item.url === "/cookies")) {
      snapshot.items.push({
        id: cookieItemId,
        type: "CUSTOM_URL",
        pageId: null,
        url: "/cookies",
        pageUrl: null,
        target: "SELF",
        rel: null,
        iconKey: null,
        translations: {},
        children: [],
      });
    }
    const patchItems = (items: SnapshotItem[] = []) => {
      for (const item of items) {
        if (item.url === "/privacy") {
          item.translations = {
            ...item.translations,
            vi: {
              label: "Quyền riêng tư",
              title: null,
              ariaLabel: null,
              urlOverride: "/privacy",
            },
            en: {
              label: "Privacy",
              title: null,
              ariaLabel: null,
              urlOverride: "/privacy-en",
            },
            id: {
              label: "Privasi",
              title: null,
              ariaLabel: null,
              urlOverride: "/privacy-id",
            },
          };
        }
        if (item.url === "/terms") {
          item.translations = {
            ...item.translations,
            vi: {
              label: "Điều khoản",
              title: null,
              ariaLabel: null,
              urlOverride: "/terms",
            },
            en: {
              label: "Terms",
              title: null,
              ariaLabel: null,
              urlOverride: "/terms-en",
            },
            id: {
              label: "Ketentuan",
              title: null,
              ariaLabel: null,
              urlOverride: "/terms-id",
            },
          };
        }
        if (item.url === "/cookies") {
          item.translations = {
            ...item.translations,
            vi: {
              label: "Cookie",
              title: null,
              ariaLabel: null,
              urlOverride: "/cookies",
            },
            en: {
              label: "Cookies",
              title: null,
              ariaLabel: null,
              urlOverride: "/cookies-en",
            },
            id: {
              label: "Cookie",
              title: null,
              ariaLabel: null,
              urlOverride: "/cookies-id",
            },
          };
        }
        patchItems(item.children);
      }
    };
    patchItems(snapshot.items);
    return JSON.stringify(snapshot);
  } catch {
    return value;
  }
}

type FooterSeedLocale = "vi" | "en" | "id";

type FooterSeedItem = {
  type: "CUSTOM_URL" | "ANCHOR" | "GROUP";
  url: string | null;
  target?: "SELF" | "BLANK";
  rel?: string | null;
  iconKey?: string | null;
  translations: Record<FooterSeedLocale, {
    label: string;
    urlOverride?: string | null;
  }>;
  children?: FooterSeedItem[];
};

async function seedLandingFooterMenus() {
  const settings = await prisma.websiteSettings.findUnique({
    where: { id: 1 },
    select: {
      contactEmail: true,
      socialLinksJson: true,
    },
  });
  const socialLinks = parseSeedSocialLinks(settings?.socialLinksJson);
  const discordUrl = socialLinks.find(({ platform }) => platform === "discord")?.url;
  const contactUrl = settings?.contactEmail
    ? `mailto:${settings.contactEmail}`
    : "/member/support";

  await seedPublishedFooterMenu({
    key: "footer-navigation",
    name: "Điều hướng footer",
    description: "Hai nhóm Product và Company trên footer công khai.",
    location: "footer-primary",
    titles: { vi: "Footer", en: "Footer", id: "Footer" },
    items: [
      {
        type: "GROUP",
        url: null,
        translations: {
          vi: { label: "Sản phẩm" },
          en: { label: "Product" },
          id: { label: "Produk" },
        },
        children: [
          {
            type: "ANCHOR",
            url: "#link-flow",
            translations: {
              vi: { label: "Cách hoạt động" },
              en: { label: "How it works" },
              id: { label: "Cara kerja" },
            },
          },
          {
            type: "CUSTOM_URL",
            url: "/payout-rates",
            translations: {
              vi: { label: "Bảng giá" },
              en: { label: "Pricing" },
              id: { label: "Harga" },
            },
          },
          {
            type: "CUSTOM_URL",
            url: "/member/create",
            translations: {
              vi: { label: "Tạo liên kết" },
              en: { label: "Create a link" },
              id: { label: "Buat tautan" },
            },
          },
        ],
      },
      {
        type: "GROUP",
        url: null,
        translations: {
          vi: { label: "Công ty" },
          en: { label: "Company" },
          id: { label: "Perusahaan" },
        },
        children: [
          {
            type: "CUSTOM_URL",
            url: contactUrl,
            translations: {
              vi: { label: "Liên hệ" },
              en: { label: "Contact" },
              id: { label: "Kontak" },
            },
          },
          {
            type: "CUSTOM_URL",
            url: discordUrl ?? "/register",
            target: discordUrl ? "BLANK" : "SELF",
            rel: discordUrl ? "noopener noreferrer" : null,
            translations: {
              vi: { label: "Cộng đồng" },
              en: { label: "Community" },
              id: { label: "Komunitas" },
            },
          },
        ],
      },
    ],
  });

  await seedPublishedFooterMenu({
    key: "footer-legal",
    name: "Pháp lý footer",
    description: "Điều khoản, quyền riêng tư và cookie trên footer công khai.",
    location: "footer-legal",
    titles: { vi: "Pháp lý", en: "Legal", id: "Legal" },
    items: [
      footerLegalItem("/terms", {
        vi: ["Điều khoản", "/terms"],
        en: ["Terms", "/terms-en"],
        id: ["Ketentuan", "/terms-id"],
      }),
      footerLegalItem("/privacy", {
        vi: ["Quyền riêng tư", "/privacy"],
        en: ["Privacy", "/privacy-en"],
        id: ["Privasi", "/privacy-id"],
      }),
      footerLegalItem("/cookies", {
        vi: ["Cookie", "/cookies"],
        en: ["Cookies", "/cookies-en"],
        id: ["Cookie", "/cookies-id"],
      }),
    ],
  });

  await seedPublishedFooterMenu({
    key: "footer-social",
    name: "Mạng xã hội footer",
    description: "Các biểu tượng mạng xã hội hiển thị cạnh thương hiệu ở footer.",
    location: "footer-social",
    titles: {
      vi: "Mạng xã hội",
      en: "Social media",
      id: "Media sosial",
    },
    items: socialLinks.map(({ platform, url }) => ({
      type: "CUSTOM_URL",
      url,
      target: "BLANK",
      rel: "noopener noreferrer",
      iconKey: platform,
      translations: {
        vi: { label: socialPlatformSeedLabel(platform) },
        en: { label: socialPlatformSeedLabel(platform) },
        id: { label: socialPlatformSeedLabel(platform) },
      },
    })),
  });
}

function footerLegalItem(
  url: string,
  values: Record<FooterSeedLocale, readonly [string, string]>,
): FooterSeedItem {
  return {
    type: "CUSTOM_URL",
    url,
    translations: {
      vi: { label: values.vi[0], urlOverride: values.vi[1] },
      en: { label: values.en[0], urlOverride: values.en[1] },
      id: { label: values.id[0], urlOverride: values.id[1] },
    },
  };
}

function parseSeedSocialLinks(value?: string) {
  const supported = new Set([
    "facebook",
    "youtube",
    "instagram",
    "tiktok",
    "x",
    "linkedin",
    "github",
    "discord",
    "telegram",
    "zalo",
  ]);
  try {
    const parsed = JSON.parse(value ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const social = item as Record<string, unknown>;
      return typeof social.platform === "string" &&
        supported.has(social.platform) &&
        typeof social.url === "string" &&
        social.url.startsWith("https://") &&
        social.isActive === true
        ? [{ platform: social.platform, url: social.url }]
        : [];
    });
  } catch {
    return [];
  }
}

function socialPlatformSeedLabel(platform: string) {
  const labels: Record<string, string> = {
    facebook: "Facebook",
    youtube: "YouTube",
    instagram: "Instagram",
    tiktok: "TikTok",
    x: "X",
    linkedin: "LinkedIn",
    github: "GitHub",
    discord: "Discord",
    telegram: "Telegram",
    zalo: "Zalo",
  };
  return labels[platform] ?? platform;
}

async function seedPublishedFooterMenu(definition: {
  key: string;
  name: string;
  description: string;
  location: "footer-primary" | "footer-legal" | "footer-social";
  titles: Record<FooterSeedLocale, string>;
  items: FooterSeedItem[];
}) {
  const menu = await prisma.websiteMenu.upsert({
    where: { key: definition.key },
    update: {
      name: definition.name,
      description: definition.description,
      status: "published",
      deletedAt: null,
    },
    create: {
      key: definition.key,
      name: definition.name,
      description: definition.description,
      status: "published",
    },
  });

  await prisma.websiteMenuTranslation.deleteMany({ where: { menuId: menu.id } });
  await prisma.websiteMenuTranslation.createMany({
    data: (Object.entries(definition.titles) as Array<[FooterSeedLocale, string]>).map(
      ([locale, title]) => ({ menuId: menu.id, locale, title }),
    ),
  });
  await prisma.websiteMenuItem.deleteMany({ where: { menuId: menu.id } });

  const createItems = async (
    items: FooterSeedItem[],
    parentId: number | null,
  ): Promise<Array<Record<string, unknown>>> => {
    const snapshots: Array<Record<string, unknown>> = [];
    for (const [sortOrder, item] of items.entries()) {
      const created = await prisma.websiteMenuItem.create({
        data: {
          menuId: menu.id,
          parentId,
          pageId: null,
          type: item.type,
          url: item.url,
          target: item.target ?? "SELF",
          rel: item.rel ?? null,
          iconKey: item.iconKey ?? null,
          isEnabled: true,
          sortOrder,
          translations: {
            create: (Object.entries(item.translations) as Array<[
              FooterSeedLocale,
              FooterSeedItem["translations"][FooterSeedLocale],
            ]>).map(([locale, translation]) => ({
              locale,
              label: translation.label,
              title: null,
              ariaLabel: null,
              urlOverride: translation.urlOverride ?? null,
            })),
          },
        },
      });
      snapshots.push({
        id: created.id,
        type: item.type,
        pageId: null,
        url: item.url,
        pageUrl: null,
        target: item.target ?? "SELF",
        rel: item.rel ?? null,
        iconKey: item.iconKey ?? null,
        translations: Object.fromEntries(
          Object.entries(item.translations).map(([locale, translation]) => [
            locale,
            {
              label: translation.label,
              title: null,
              ariaLabel: null,
              urlOverride: translation.urlOverride ?? null,
            },
          ]),
        ),
        children: await createItems(item.children ?? [], created.id),
      });
    }
    return snapshots;
  };

  const snapshot = {
    schemaVersion: 1,
    menuId: menu.id,
    key: definition.key,
    version: 1,
    defaultLocale: "vi",
    translations: Object.fromEntries(
      Object.entries(definition.titles).map(([locale, title]) => [locale, { title }]),
    ),
    items: await createItems(definition.items, null),
  };

  await prisma.websiteMenu.update({
    where: { id: menu.id },
    data: {
      status: "published",
      draftVersion: 1,
      publishedVersion: 1,
      publishedSnapshotJson: JSON.stringify(snapshot),
      publishedAt: new Date(),
    },
  });
  await prisma.websiteMenuLocation.upsert({
    where: { location: definition.location },
    update: { menuId: menu.id },
    create: { location: definition.location, menuId: menu.id },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    throw error;
  });
