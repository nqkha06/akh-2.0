import type { AppLocale } from "@/i18n/config";

type TestimonialCopy = {
  quote: string;
  role: string;
};

export type LandingTestimonial = {
  id: string;
  initials: string;
  name: string;
  platform: string;
  copy: Record<AppLocale, TestimonialCopy>;
};

export const landingTestimonials = [
  {
    id: "mai-a",
    initials: "MA",
    name: "Mai A.",
    platform: "YouTube",
    copy: {
      vi: {
        quote:
          "Mình gom video, tài liệu và các đường dẫn cần chia sẻ vào một chỗ nên người xem dễ theo dõi hơn.",
        role: "Nhà sáng tạo video",
      },
      en: {
        quote:
          "I can keep videos, resources and the links I need to share in one place, so everything is easier to follow.",
        role: "Video creator",
      },
      id: {
        quote:
          "Saya dapat menyatukan video, materi, dan tautan yang perlu dibagikan sehingga semuanya lebih mudah diikuti.",
        role: "Kreator video",
      },
    },
  },
  {
    id: "bao-n",
    initials: "BN",
    name: "Bảo N.",
    platform: "Spotify",
    copy: {
      vi: {
        quote:
          "Luồng tạo link rõ ràng, vừa đủ tùy chọn và không khiến mình phải mất thời gian tìm hiểu quá lâu.",
        role: "Podcaster",
      },
      en: {
        quote:
          "The link-building flow is clear, gives me the options I need and does not take long to understand.",
        role: "Podcaster",
      },
      id: {
        quote:
          "Alur pembuatan tautannya jelas, opsinya cukup, dan tidak membutuhkan waktu lama untuk dipahami.",
        role: "Podcaster",
      },
    },
  },
  {
    id: "linh-c",
    initials: "LC",
    name: "Linh C.",
    platform: "Instagram",
    copy: {
      vi: {
        quote:
          "Khi cần cập nhật tài nguyên mới, mình chỉ sửa đích đến thay vì phải gửi lại một đường link khác.",
        role: "Họa sĩ minh họa tự do",
      },
      en: {
        quote:
          "When a resource changes, I can update the destination instead of sending everyone a different link.",
        role: "Freelance illustrator",
      },
      id: {
        quote:
          "Saat materi berubah, saya cukup memperbarui tujuannya tanpa perlu membagikan tautan baru kepada semua orang.",
        role: "Ilustrator lepas",
      },
    },
  },
  {
    id: "khoa-m",
    initials: "KM",
    name: "Khoa M.",
    platform: "YouTube",
    copy: {
      vi: {
        quote:
          "Các bước hành động giúp mình hướng người xem đi đúng luồng trước khi họ mở tài liệu cuối cùng.",
        role: "Nhà sáng tạo khóa học",
      },
      en: {
        quote:
          "Action steps help me guide viewers through the right flow before they open the final resource.",
        role: "Course creator",
      },
      id: {
        quote:
          "Langkah tindakan membantu saya mengarahkan audiens melalui alur yang tepat sebelum membuka materi akhir.",
        role: "Kreator kursus",
      },
    },
  },
  {
    id: "ha-p",
    initials: "HP",
    name: "Hà P.",
    platform: "Website",
    copy: {
      vi: {
        quote:
          "Phần analytics gọn và dễ đọc, đủ để mình biết liên kết nào đang được quan tâm nhiều hơn.",
        role: "Blogger",
      },
      en: {
        quote:
          "The analytics are concise and easy to read, so I can see which links are getting more attention.",
        role: "Blogger",
      },
      id: {
        quote:
          "Analitiknya ringkas dan mudah dibaca, jadi saya dapat melihat tautan mana yang lebih banyak diperhatikan.",
        role: "Blogger",
      },
    },
  },
  {
    id: "huy-t",
    initials: "HT",
    name: "Huy T.",
    platform: "Twitch",
    copy: {
      vi: {
        quote:
          "Mình có thể tạm dừng một link cũ rồi bật lại khi cần mà không phải xóa và làm lại từ đầu.",
        role: "Streamer",
      },
      en: {
        quote:
          "I can pause an older link and turn it back on when needed without deleting it and starting over.",
        role: "Streamer",
      },
      id: {
        quote:
          "Saya dapat menjeda tautan lama lalu mengaktifkannya kembali tanpa menghapus dan membuatnya dari awal.",
        role: "Streamer",
      },
    },
  },
  {
    id: "trang-v",
    initials: "TV",
    name: "Trang V.",
    platform: "Instagram",
    copy: {
      vi: {
        quote:
          "Trang bio giúp mình trình bày portfolio và các kênh đang hoạt động theo cách gọn gàng, dễ cập nhật.",
        role: "Nhiếp ảnh gia",
      },
      en: {
        quote:
          "The bio page gives me a tidy, easy-to-update place for my portfolio and active channels.",
        role: "Photographer",
      },
      id: {
        quote:
          "Halaman bio memberi saya tempat yang rapi dan mudah diperbarui untuk portofolio serta kanal aktif.",
        role: "Fotografer",
      },
    },
  },
  {
    id: "duc-l",
    initials: "ĐL",
    name: "Đức L.",
    platform: "Discord",
    copy: {
      vi: {
        quote:
          "Mã QR tải xuống nhanh và tiện khi mình muốn đưa cùng một liên kết lên bài đăng lẫn tài liệu offline.",
        role: "Người xây dựng cộng đồng",
      },
      en: {
        quote:
          "The downloadable QR code is handy when I want the same link in a post and in offline material.",
        role: "Community builder",
      },
      id: {
        quote:
          "Kode QR yang dapat diunduh praktis saat saya ingin memakai tautan yang sama di postingan dan materi offline.",
        role: "Pengelola komunitas",
      },
    },
  },
  {
    id: "raka-p",
    initials: "RP",
    name: "Raka P.",
    platform: "SoundCloud",
    copy: {
      vi: {
        quote:
          "Thư viện tệp giúp mình tái sử dụng tài nguyên cho nhiều liên kết mà không phải tải lên lại mỗi lần.",
        role: "Nhà sản xuất âm nhạc",
      },
      en: {
        quote:
          "The file library lets me reuse resources across links instead of uploading them again each time.",
        role: "Music producer",
      },
      id: {
        quote:
          "Pustaka file membantu saya memakai kembali materi di beberapa tautan tanpa mengunggah ulang setiap kali.",
        role: "Produser musik",
      },
    },
  },
  {
    id: "alya-n",
    initials: "AN",
    name: "Alya N.",
    platform: "TikTok",
    copy: {
      vi: {
        quote:
          "Mọi liên kết đều nằm trong một dashboard nên mình biết cần chỉnh sửa hoặc kiểm tra ở đâu.",
        role: "Nhà sáng tạo nội dung số",
      },
      en: {
        quote:
          "All my links live in one dashboard, so I always know where to edit or check them.",
        role: "Digital creator",
      },
      id: {
        quote:
          "Semua tautan saya berada dalam satu dasbor, jadi saya selalu tahu tempat untuk mengedit atau memeriksanya.",
        role: "Kreator digital",
      },
    },
  },
] as const satisfies readonly LandingTestimonial[];
