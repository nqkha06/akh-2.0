import type { LucideIcon } from "lucide-react";
import {
  GalleryHorizontal,
  Headphones,
  Images,
  Camera,
  Landmark,
  Link2,
  Music2,
  Share2,
  Radio,
  SeparatorHorizontal,
  Video,
} from "lucide-react";

export type ContentBlockCategory = "links" | "content" | "media" | "business" | "other";

export type ContentBlockPickerType =
  | "link"
  | "gallery"
  | "social"
  | "divider"
  | "bank-details"
  | "audio-preview"
  | "youtube-video"
  | "spotify-track"
  | "instagram-post"
  | "tiktok-video"
  | "twitch-stream";

export interface ContentBlockDefinition {
  type: ContentBlockPickerType;
  title: string;
  description: string;
  category: ContentBlockCategory;
  icon: LucideIcon;
  keywords: string[];
  isPopular?: boolean;
  isNew?: boolean;
  isAdvanced?: boolean;
  enabled: boolean;
}

export const contentBlockCategoryLabels: Record<ContentBlockCategory, string> = {
  links: "Liên kết",
  content: "Nội dung",
  media: "Hình ảnh & Video",
  business: "Kinh doanh",
  other: "Khác",
};

export const contentBlockRegistry: ContentBlockDefinition[] = [
  {
    type: "link",
    title: "Liên kết",
    description: "Thêm nút dẫn đến website hoặc nội dung khác.",
    category: "links",
    icon: Link2,
    keywords: ["url", "website", "button", "nút", "link"],
    isPopular: true,
    enabled: true,
  },
  {
    type: "gallery",
    title: "Bộ sưu tập",
    description: "Hiển thị nhiều hình ảnh dưới dạng lưới hoặc thanh trượt.",
    category: "media",
    icon: Images,
    keywords: ["ảnh", "hình", "gallery", "slider", "album"],
    isPopular: true,
    isNew: true,
    enabled: true,
  },
  {
    type: "social",
    title: "Mạng xã hội",
    description: "Thêm các biểu tượng dẫn đến hồ sơ mạng xã hội của bạn.",
    category: "links",
    icon: Share2,
    keywords: ["social", "instagram", "facebook", "tiktok", "youtube"],
    isPopular: true,
    enabled: true,
  },
  {
    type: "divider",
    title: "Dấu phân cách",
    description: "Tạo khoảng ngắt trực quan giữa các nhóm nội dung.",
    category: "content",
    icon: SeparatorHorizontal,
    keywords: ["divider", "separator", "đường kẻ", "phân cách", "ngăn cách"],
    enabled: true,
  },
  {
    type: "bank-details",
    title: "Thông tin ngân hàng",
    description: "Hiển thị ngân hàng, chủ tài khoản và số tài khoản để nhận chuyển khoản.",
    category: "business",
    icon: Landmark,
    keywords: ["bank", "ngân hàng", "chuyển khoản", "số tài khoản", "thanh toán"],
    isNew: true,
    enabled: true,
  },
  {
    type: "youtube-video",
    title: "Video YouTube",
    description: "Nhúng video YouTube nổi bật vào trang.",
    category: "media",
    icon: Video,
    keywords: ["youtube", "video", "clip"],
    isPopular: true,
    enabled: true,
  },
  {
    type: "tiktok-video",
    title: "Video TikTok",
    description: "Hiển thị một video TikTok từ đường dẫn công khai.",
    category: "media",
    icon: GalleryHorizontal,
    keywords: ["tiktok", "video", "short"],
    enabled: true,
  },
  {
    type: "spotify-track",
    title: "Spotify",
    description: "Nhúng bài hát hoặc playlist Spotify.",
    category: "media",
    icon: Headphones,
    keywords: ["spotify", "music", "nhạc", "playlist"],
    enabled: true,
  },
  {
    type: "audio-preview",
    title: "Audio",
    description: "Thêm bản nghe thử từ một đường dẫn âm thanh.",
    category: "media",
    icon: Music2,
    keywords: ["audio", "music", "nhạc", "podcast"],
    enabled: true,
  },
  {
    type: "instagram-post",
    title: "Bài đăng Instagram",
    description: "Hiển thị bài đăng Instagram công khai.",
    category: "media",
    icon: Camera,
    keywords: ["instagram", "post", "reel"],
    enabled: true,
  },
  {
    type: "twitch-stream",
    title: "Twitch",
    description: "Nhúng kênh hoặc nội dung phát trực tiếp Twitch.",
    category: "media",
    icon: Radio,
    keywords: ["twitch", "stream", "live"],
    enabled: true,
  },
];

export function getContentBlockDefinition(type: ContentBlockPickerType) {
  return contentBlockRegistry.find((definition) => definition.type === type);
}

export function normalizeContentBlockSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
    .trim();
}
