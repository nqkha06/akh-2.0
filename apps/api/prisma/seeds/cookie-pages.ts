type CookieSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type CookiePageCopy = {
  slug: string;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  updatedLabel: string;
  updatedDate: string;
  introduction: string[];
  sections: CookieSection[];
};

const cookiePages: CookiePageCopy[] = [
  {
    slug: "cookies",
    title: "Chính sách cookie",
    excerpt:
      "Tìm hiểu các cookie Link4Sub sử dụng để duy trì đăng nhập, bảo mật và ghi nhớ lựa chọn giao diện của bạn.",
    seoTitle: "Chính sách cookie | Link4Sub",
    seoDescription:
      "Thông tin về cookie đăng nhập, ngôn ngữ và tùy chọn giao diện được Link4Sub sử dụng.",
    updatedLabel: "Cập nhật lần cuối",
    updatedDate: "15 tháng 8 năm 2026",
    introduction: [
      "Chính sách cookie này giải thích cách Link4Sub sử dụng cookie và công nghệ lưu trữ tương tự trên website, ứng dụng và các trang công khai của chúng tôi.",
      "Tóm tắt: Link4Sub hiện chỉ đặt cookie cần thiết cho đăng nhập, bảo mật và các cookie chức năng do bạn chủ động chọn để ghi nhớ ngôn ngữ hoặc trạng thái giao diện. Analytics lượt truy cập liên kết được xử lý phía máy chủ và không dựa trên Google Analytics hay cookie quảng cáo.",
    ],
    sections: [
      {
        heading: "1. Cookie là gì?",
        paragraphs: [
          "Cookie là tệp văn bản nhỏ được website lưu trong trình duyệt của bạn. Cookie có thể tồn tại đến khi bạn đóng trình duyệt hoặc trong một khoảng thời gian xác định. Chúng giúp website duy trì phiên đăng nhập và ghi nhớ một số lựa chọn giữa các lần truy cập.",
          "Link4Sub cũng có thể dùng cơ chế lưu trữ tương tự trong trình duyệt khi một tính năng cần giữ trạng thái cục bộ. Trong chính sách này, từ “cookie” bao gồm các công nghệ có chức năng tương đương khi phù hợp.",
        ],
      },
      {
        heading: "2. Cookie Link4Sub đang sử dụng",
        bullets: [
          "stu_access_token — cookie thiết yếu dùng để xác thực yêu cầu và cho phép bạn truy cập khu vực thành viên hoặc quản trị. Cookie này là HttpOnly, được bảo vệ bằng Secure trong môi trường production và dùng SameSite theo cấu hình triển khai, mặc định là Lax.",
          "stu_refresh_token — cookie thiết yếu dùng để làm mới phiên đăng nhập an toàn mà không yêu cầu bạn đăng nhập lại trên mỗi trang. Cookie có cùng biện pháp bảo vệ HttpOnly, Secure trong production và SameSite như cookie truy cập.",
          "NEXT_LOCALE — cookie chức năng lưu ngôn ngữ bạn chọn để Link4Sub hiển thị đúng bản tiếng Việt, tiếng Anh hoặc Bahasa Indonesia. Thời hạn hiện tại là tối đa 1 năm kể từ lần thiết lập.",
          "sidebar_state — cookie chức năng lưu trạng thái mở hoặc thu gọn của sidebar trong giao diện dashboard. Thời hạn hiện tại là tối đa 7 ngày.",
        ],
      },
      {
        heading: "3. Thời hạn cookie đăng nhập",
        paragraphs: [
          "Nếu bạn không chọn ghi nhớ đăng nhập, cookie xác thực được đặt dưới dạng cookie phiên và thường được trình duyệt xóa khi phiên kết thúc. Nếu bạn chọn ghi nhớ đăng nhập, cookie có thời hạn tương ứng với thời gian sống của access token và refresh token được cấu hình trên hệ thống.",
          "Khi bạn đăng xuất, Link4Sub gửi yêu cầu xóa cookie xác thực. Phiên cũng có thể hết hạn hoặc bị thu hồi vì lý do bảo mật, thay đổi mật khẩu hoặc thao tác quản trị.",
          "Tên mặc định của hai cookie xác thực được nêu ở trên có thể được đơn vị vận hành thay đổi theo cấu hình triển khai mà không làm thay đổi mục đích sử dụng.",
        ],
      },
      {
        heading: "4. Analytics và cookie bên thứ ba",
        paragraphs: [
          "Link4Sub ghi nhận analytics của liên kết bằng dữ liệu yêu cầu phía máy chủ, chẳng hạn thời điểm, địa chỉ IP, quốc gia suy ra từ kết nối, thiết bị, trình duyệt, hệ điều hành và nguồn truy cập. Hoạt động này được giải thích chi tiết hơn trong Chính sách quyền riêng tư và không yêu cầu Google Analytics hoặc cookie quảng cáo.",
          "Sản phẩm hiện tại không đặt cookie Google Analytics, Google AdSense, DoubleClick/DART hay cookie plugin mạng xã hội trên miền Link4Sub. Việc hiển thị một liên kết tới YouTube, Facebook, TikTok hoặc dịch vụ khác không đồng nghĩa Link4Sub đặt cookie của dịch vụ đó.",
          "Khi bạn chủ động mở dịch vụ bên thứ ba hoặc chọn đăng nhập bằng Google, bạn rời sang luồng hoặc miền do bên đó kiểm soát. Bên thứ ba có thể dùng cookie theo chính sách riêng của họ; Link4Sub không kiểm soát các cookie được đặt trực tiếp trên miền của bên thứ ba.",
        ],
      },
      {
        heading: "5. Vì sao chúng tôi sử dụng cookie",
        bullets: [
          "Xác thực tài khoản, duy trì và làm mới phiên đăng nhập.",
          "Bảo vệ khu vực hạn chế và giảm nguy cơ sử dụng phiên trái phép.",
          "Ghi nhớ ngôn ngữ do bạn chọn trên landing page, footer hoặc menu tài khoản.",
          "Duy trì trạng thái sidebar để dashboard nhất quán giữa các lần mở trang.",
        ],
      },
      {
        heading: "6. Cơ sở sử dụng và sự đồng ý",
        paragraphs: [
          "Cookie xác thực là cần thiết để cung cấp tính năng đăng nhập và bảo vệ tài khoản. Cookie ngôn ngữ và sidebar được đặt khi bạn chủ động thay đổi lựa chọn tương ứng để cung cấp trải nghiệm bạn yêu cầu.",
          "Nếu Link4Sub bổ sung cookie không thiết yếu trong tương lai, chẳng hạn cookie đo lường của bên thứ ba hoặc quảng cáo, chúng tôi sẽ cập nhật chính sách và cung cấp cơ chế thông báo, đồng ý hoặc từ chối khi pháp luật áp dụng yêu cầu.",
        ],
      },
      {
        heading: "7. Cách quản lý hoặc xóa cookie",
        paragraphs: [
          "Bạn có thể xem, chặn hoặc xóa cookie trong phần quyền riêng tư hay dữ liệu website của trình duyệt. Bạn cũng có thể dùng chế độ riêng tư hoặc cấu hình trình duyệt xóa cookie khi đóng. Tên và vị trí cài đặt khác nhau tùy trình duyệt và thiết bị.",
          "Để kết thúc phiên Link4Sub an toàn, hãy dùng chức năng Đăng xuất trước khi xóa cookie. Bạn có thể thay đổi lại ngôn ngữ hoặc trạng thái sidebar bất cứ lúc nào; lựa chọn mới sẽ thay thế giá trị cookie trước đó.",
        ],
      },
      {
        heading: "8. Điều gì xảy ra khi chặn cookie?",
        paragraphs: [
          "Nếu chặn cookie xác thực, bạn không thể duy trì đăng nhập hoặc truy cập ổn định vào khu vực thành viên và quản trị. Nếu chặn cookie chức năng, Link4Sub vẫn có thể hoạt động nhưng có thể trở về ngôn ngữ mặc định hoặc không ghi nhớ trạng thái sidebar.",
          "Các trang và liên kết công khai thường vẫn truy cập được khi cookie chức năng bị chặn, trừ khi một tính năng cụ thể cần lưu trạng thái để hoàn thành yêu cầu của bạn.",
        ],
      },
      {
        heading: "9. Thay đổi và liên hệ",
        paragraphs: [
          "Chúng tôi có thể cập nhật chính sách này khi thay đổi cookie, tính năng, cấu hình bảo mật hoặc yêu cầu pháp luật. Bản mới sẽ hiển thị ngày cập nhật và thay đổi quan trọng sẽ được thông báo theo cách phù hợp.",
          "Nếu có câu hỏi về cookie hoặc cách Link4Sub xử lý dữ liệu, vui lòng dùng trang Liên hệ hoặc kênh Hỗ trợ được công bố trên Link4Sub. Bạn cũng có thể đọc Chính sách quyền riêng tư để biết thêm về dữ liệu, mục đích xử lý, thời gian lưu giữ và quyền của mình.",
        ],
      },
    ],
  },
  {
    slug: "cookies-en",
    title: "Cookie Policy",
    excerpt:
      "Learn about the cookies Link4Sub uses to maintain sign-in, security and your interface choices.",
    seoTitle: "Cookie Policy | Link4Sub",
    seoDescription:
      "Information about the sign-in, language and interface-preference cookies used by Link4Sub.",
    updatedLabel: "Last updated",
    updatedDate: "August 15, 2026",
    introduction: [
      "This Cookie Policy explains how Link4Sub uses cookies and similar storage technologies across our websites, applications and public pages.",
      "Plain-language summary: Link4Sub currently sets cookies needed for sign-in and security, plus functional cookies that remember the language or interface state you actively select. Link-visit analytics is processed server-side and does not rely on Google Analytics or advertising cookies.",
    ],
    sections: [
      {
        heading: "1. What are cookies?",
        paragraphs: [
          "Cookies are small text files a website stores in your browser. A cookie may last until you close the browser or for a defined period. Cookies help a website maintain a signed-in session and remember certain choices between visits.",
          "Link4Sub may also use similar browser storage when a feature needs to keep local state. In this Policy, “cookies” includes technologies with an equivalent function where appropriate.",
        ],
      },
      {
        heading: "2. Cookies currently used by Link4Sub",
        bullets: [
          "stu_access_token — an essential cookie used to authenticate requests and let you access member or administration areas. It is HttpOnly, protected with Secure in production and uses the deployment's SameSite setting, which defaults to Lax.",
          "stu_refresh_token — an essential cookie used to refresh a signed-in session securely without asking you to sign in again on every page. It uses the same HttpOnly, production Secure and SameSite protections as the access cookie.",
          "NEXT_LOCALE — a functional cookie that remembers your selected language so Link4Sub can display Vietnamese, English or Bahasa Indonesia. Its current maximum duration is one year from the time it is set.",
          "sidebar_state — a functional cookie that remembers whether the dashboard sidebar is expanded or collapsed. Its current maximum duration is seven days.",
        ],
      },
      {
        heading: "3. Sign-in cookie duration",
        paragraphs: [
          "If you do not select remember me, authentication cookies are set as session cookies and are normally removed by the browser when the session ends. If you select remember me, they last for the configured lifetimes of the access and refresh tokens.",
          "When you sign out, Link4Sub instructs the browser to clear the authentication cookies. A session may also expire or be revoked for security, after a password change or by an authorized administrator.",
          "The default authentication-cookie names listed above may be changed by the operator's deployment configuration without changing their purposes.",
        ],
      },
      {
        heading: "4. Analytics and third-party cookies",
        paragraphs: [
          "Link4Sub records link analytics from server-side request data, such as time, IP address, country inferred from the connection, device, browser, operating system and referrer. This processing is explained further in the Privacy Policy and does not require Google Analytics or advertising cookies.",
          "The current product does not set Google Analytics, Google AdSense, DoubleClick/DART or social-media plugin cookies on the Link4Sub domain. Displaying a link to YouTube, Facebook, TikTok or another service does not itself mean Link4Sub sets that service's cookies.",
          "When you choose to open a third-party service or sign in with Google, you move into a flow or domain controlled by that provider. The third party may use cookies under its own policy; Link4Sub does not control cookies set directly on a third party's domain.",
        ],
      },
      {
        heading: "5. Why we use cookies",
        bullets: [
          "Authenticate accounts and maintain or refresh signed-in sessions.",
          "Protect restricted areas and reduce the risk of unauthorized session use.",
          "Remember the language you select on the landing page, footer or account menu.",
          "Retain sidebar state so the dashboard remains consistent between page visits.",
        ],
      },
      {
        heading: "6. Basis for use and consent",
        paragraphs: [
          "Authentication cookies are necessary to provide sign-in functionality and protect accounts. Language and sidebar cookies are set when you actively make the corresponding choice so we can provide the experience you request.",
          "If Link4Sub introduces non-essential cookies in the future, such as third-party measurement or advertising cookies, we will update this Policy and provide notice, consent or refusal controls where required by applicable law.",
        ],
      },
      {
        heading: "7. How to manage or delete cookies",
        paragraphs: [
          "You can inspect, block or delete cookies in your browser's privacy or website-data settings. You can also use private browsing or configure the browser to clear cookies when it closes. Names and settings locations differ between browsers and devices.",
          "To end a Link4Sub session safely, use Sign out before deleting cookies. You can change your language or sidebar state again at any time; the new choice replaces the earlier cookie value.",
        ],
      },
      {
        heading: "8. What happens if cookies are blocked?",
        paragraphs: [
          "If you block authentication cookies, you cannot remain signed in or reliably access member and administration areas. If you block functional cookies, Link4Sub may still work but can return to the default language or stop remembering sidebar state.",
          "Public pages and links generally remain available when functional cookies are blocked, unless a specific feature needs to store state to complete your request.",
        ],
      },
      {
        heading: "9. Changes and contact",
        paragraphs: [
          "We may update this Policy when cookies, features, security configuration or legal requirements change. The new version will show its updated date, and material changes will be communicated appropriately.",
          "For questions about cookies or how Link4Sub handles data, use the Contact page or Support channel published on Link4Sub. You can also read the Privacy Policy for more information about data, processing purposes, retention and your rights.",
        ],
      },
    ],
  },
  {
    slug: "cookies-id",
    title: "Kebijakan Cookie",
    excerpt:
      "Pelajari cookie yang digunakan Link4Sub untuk mempertahankan login, keamanan, dan pilihan antarmuka Anda.",
    seoTitle: "Kebijakan Cookie | Link4Sub",
    seoDescription:
      "Informasi tentang cookie login, bahasa, dan preferensi antarmuka yang digunakan Link4Sub.",
    updatedLabel: "Terakhir diperbarui",
    updatedDate: "15 Agustus 2026",
    introduction: [
      "Kebijakan Cookie ini menjelaskan cara Link4Sub menggunakan cookie dan teknologi penyimpanan serupa di situs web, aplikasi, dan halaman publik kami.",
      "Ringkasan sederhana: Link4Sub saat ini menetapkan cookie yang diperlukan untuk login dan keamanan, serta cookie fungsional yang mengingat bahasa atau keadaan antarmuka yang Anda pilih. Analitik kunjungan tautan diproses di sisi server dan tidak bergantung pada Google Analytics maupun cookie iklan.",
    ],
    sections: [
      {
        heading: "1. Apa itu cookie?",
        paragraphs: [
          "Cookie adalah file teks kecil yang disimpan situs web di browser Anda. Cookie dapat bertahan sampai browser ditutup atau selama jangka waktu tertentu. Cookie membantu situs mempertahankan sesi login dan mengingat pilihan tertentu di antara kunjungan.",
          "Link4Sub juga dapat menggunakan penyimpanan browser serupa ketika suatu fitur perlu mempertahankan keadaan lokal. Dalam Kebijakan ini, “cookie” mencakup teknologi dengan fungsi yang setara jika sesuai.",
        ],
      },
      {
        heading: "2. Cookie yang saat ini digunakan Link4Sub",
        bullets: [
          "stu_access_token — cookie esensial untuk mengautentikasi permintaan dan memberi akses ke area anggota atau administrasi. Cookie ini bersifat HttpOnly, dilindungi dengan Secure di production, dan memakai pengaturan SameSite deployment yang secara default adalah Lax.",
          "stu_refresh_token — cookie esensial untuk memperbarui sesi login secara aman tanpa meminta Anda masuk lagi di setiap halaman. Cookie ini memakai perlindungan HttpOnly, Secure di production, dan SameSite yang sama dengan cookie akses.",
          "NEXT_LOCALE — cookie fungsional yang mengingat bahasa pilihan agar Link4Sub dapat menampilkan bahasa Vietnam, Inggris, atau Bahasa Indonesia. Durasi maksimum saat ini adalah satu tahun sejak ditetapkan.",
          "sidebar_state — cookie fungsional yang mengingat apakah sidebar dasbor terbuka atau tertutup. Durasi maksimum saat ini adalah tujuh hari.",
        ],
      },
      {
        heading: "3. Durasi cookie login",
        paragraphs: [
          "Jika Anda tidak memilih ingat saya, cookie autentikasi ditetapkan sebagai cookie sesi dan biasanya dihapus browser ketika sesi berakhir. Jika Anda memilih ingat saya, cookie berlaku selama masa hidup access token dan refresh token yang dikonfigurasi.",
          "Saat Anda keluar, Link4Sub meminta browser menghapus cookie autentikasi. Sesi juga dapat kedaluwarsa atau dicabut demi keamanan, setelah perubahan kata sandi, atau oleh administrator berwenang.",
          "Nama default cookie autentikasi di atas dapat diubah melalui konfigurasi deployment pengelola tanpa mengubah tujuannya.",
        ],
      },
      {
        heading: "4. Analitik dan cookie pihak ketiga",
        paragraphs: [
          "Link4Sub mencatat analitik tautan dari data permintaan sisi server, seperti waktu, alamat IP, negara yang diperkirakan dari koneksi, perangkat, browser, sistem operasi, dan perujuk. Pemrosesan ini dijelaskan lebih lanjut dalam Kebijakan Privasi dan tidak memerlukan Google Analytics maupun cookie iklan.",
          "Produk saat ini tidak menetapkan cookie Google Analytics, Google AdSense, DoubleClick/DART, atau plugin media sosial pada domain Link4Sub. Menampilkan tautan ke YouTube, Facebook, TikTok, atau layanan lain tidak dengan sendirinya berarti Link4Sub menetapkan cookie layanan tersebut.",
          "Saat Anda memilih membuka layanan pihak ketiga atau masuk dengan Google, Anda berpindah ke alur atau domain yang dikendalikan penyedia tersebut. Pihak ketiga dapat menggunakan cookie berdasarkan kebijakannya sendiri; Link4Sub tidak mengendalikan cookie yang ditetapkan langsung pada domain pihak ketiga.",
        ],
      },
      {
        heading: "5. Mengapa kami menggunakan cookie",
        bullets: [
          "Mengautentikasi akun serta mempertahankan atau memperbarui sesi login.",
          "Melindungi area terbatas dan mengurangi risiko penggunaan sesi tanpa izin.",
          "Mengingat bahasa yang Anda pilih di landing page, footer, atau menu akun.",
          "Mempertahankan keadaan sidebar agar dasbor konsisten di antara kunjungan halaman.",
        ],
      },
      {
        heading: "6. Dasar penggunaan dan persetujuan",
        paragraphs: [
          "Cookie autentikasi diperlukan untuk menyediakan fungsi login dan melindungi akun. Cookie bahasa dan sidebar ditetapkan ketika Anda secara aktif membuat pilihan terkait agar kami dapat memberikan pengalaman yang Anda minta.",
          "Jika Link4Sub menambahkan cookie non-esensial di masa mendatang, seperti cookie pengukuran pihak ketiga atau iklan, kami akan memperbarui Kebijakan ini dan menyediakan pemberitahuan, persetujuan, atau kontrol penolakan jika diwajibkan hukum yang berlaku.",
        ],
      },
      {
        heading: "7. Cara mengelola atau menghapus cookie",
        paragraphs: [
          "Anda dapat memeriksa, memblokir, atau menghapus cookie melalui pengaturan privasi atau data situs di browser. Anda juga dapat memakai penjelajahan privat atau mengatur browser untuk menghapus cookie saat ditutup. Nama dan lokasi pengaturan berbeda di setiap browser dan perangkat.",
          "Untuk mengakhiri sesi Link4Sub dengan aman, gunakan Keluar sebelum menghapus cookie. Anda dapat mengubah kembali bahasa atau keadaan sidebar kapan saja; pilihan baru akan menggantikan nilai cookie sebelumnya.",
        ],
      },
      {
        heading: "8. Apa yang terjadi jika cookie diblokir?",
        paragraphs: [
          "Jika Anda memblokir cookie autentikasi, Anda tidak dapat tetap masuk atau mengakses area anggota dan administrasi dengan andal. Jika cookie fungsional diblokir, Link4Sub mungkin tetap berfungsi tetapi dapat kembali ke bahasa default atau berhenti mengingat keadaan sidebar.",
          "Halaman dan tautan publik umumnya tetap dapat diakses ketika cookie fungsional diblokir, kecuali fitur tertentu perlu menyimpan keadaan untuk menyelesaikan permintaan Anda.",
        ],
      },
      {
        heading: "9. Perubahan dan kontak",
        paragraphs: [
          "Kami dapat memperbarui Kebijakan ini ketika cookie, fitur, konfigurasi keamanan, atau persyaratan hukum berubah. Versi baru akan menampilkan tanggal pembaruan dan perubahan material akan diberitahukan secara semestinya.",
          "Untuk pertanyaan tentang cookie atau cara Link4Sub menangani data, gunakan halaman Kontak atau kanal Dukungan yang dipublikasikan di Link4Sub. Anda juga dapat membaca Kebijakan Privasi untuk informasi lebih lanjut mengenai data, tujuan pemrosesan, retensi, dan hak Anda.",
        ],
      },
    ],
  },
];

export const defaultCookiePages = cookiePages.map((page) => ({
  slug: page.slug,
  title: page.title,
  excerpt: page.excerpt,
  seoTitle: page.seoTitle,
  seoDescription: page.seoDescription,
  seoKeywords: "Link4Sub, cookie policy, cookies, authentication, preferences",
  contentJson: JSON.stringify(toTiptapDocument(page)),
  contentHtml: toHtml(page),
}));

function toTiptapDocument(page: CookiePageCopy) {
  return {
    type: "doc",
    content: [
      paragraph(`${page.updatedLabel}: ${page.updatedDate}`, ["bold"]),
      ...page.introduction.map((text) => paragraph(text)),
      ...page.sections.flatMap((section) => [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: section.heading }],
        },
        ...(section.paragraphs ?? []).map((text) => paragraph(text)),
        ...(section.bullets?.length
          ? [
              {
                type: "bulletList",
                content: section.bullets.map((text) => ({
                  type: "listItem",
                  content: [paragraph(text)],
                })),
              },
            ]
          : []),
      ]),
    ],
  };
}

function paragraph(text: string, marks: string[] = []) {
  return {
    type: "paragraph",
    content: [
      {
        type: "text",
        text,
        ...(marks.length
          ? { marks: marks.map((type) => ({ type })) }
          : {}),
      },
    ],
  };
}

function toHtml(page: CookiePageCopy) {
  const sections = page.sections
    .map(
      (section) =>
        `<h2>${escapeHtml(section.heading)}</h2>` +
        (section.paragraphs ?? [])
          .map((text) => `<p>${escapeHtml(text)}</p>`)
          .join("") +
        (section.bullets?.length
          ? `<ul>${section.bullets
              .map((text) => `<li>${escapeHtml(text)}</li>`)
              .join("")}</ul>`
          : ""),
    )
    .join("");

  return [
    `<p><strong>${escapeHtml(page.updatedLabel)}: ${escapeHtml(page.updatedDate)}</strong></p>`,
    ...page.introduction.map((text) => `<p>${escapeHtml(text)}</p>`),
    sections,
  ].join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
