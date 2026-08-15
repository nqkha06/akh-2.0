type TermsSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type TermsPageCopy = {
  slug: string;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  updatedLabel: string;
  updatedDate: string;
  introduction: string[];
  sections: TermsSection[];
};

const termsPages: TermsPageCopy[] = [
  {
    slug: "terms",
    title: "Điều khoản dịch vụ",
    excerpt:
      "Các quy tắc áp dụng khi truy cập và sử dụng nền tảng quản lý, chia sẻ và tối ưu liên kết Link4Sub.",
    seoTitle: "Điều khoản dịch vụ | Link4Sub",
    seoDescription:
      "Tìm hiểu quyền, nghĩa vụ và các quy tắc sử dụng nền tảng Link4Sub.",
    updatedLabel: "Cập nhật lần cuối",
    updatedDate: "15 tháng 8 năm 2026",
    introduction: [
      "Chào mừng bạn đến với Link4Sub. Các Điều khoản dịch vụ này điều chỉnh việc bạn truy cập và sử dụng website, ứng dụng, trang công khai và các tính năng do Link4Sub cung cấp.",
      "Bằng việc tạo tài khoản, truy cập hoặc tiếp tục sử dụng Link4Sub, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ.",
      "Tóm tắt: bạn chịu trách nhiệm về liên kết, nội dung và thông tin tài khoản mình cung cấp; không được sử dụng Link4Sub cho hành vi trái pháp luật, gây hại hoặc gian lận; Link4Sub có thể xử lý nội dung vi phạm và bảo vệ tính an toàn của nền tảng. Bản đầy đủ dưới đây là nội dung có hiệu lực.",
    ],
    sections: [
      {
        heading: "1. Giới thiệu về Link4Sub",
        paragraphs: [
          "Link4Sub là nền tảng giúp người dùng tạo, quản lý, chia sẻ và theo dõi liên kết; xây dựng trang hồ sơ liên kết; cấu hình hành động mở khóa nội dung; quản lý tệp và xem dữ liệu phân tích được cung cấp trong tài khoản.",
          "Một số tính năng có thể phụ thuộc vào loại tài khoản, cấu hình hệ thống, khu vực hoặc dịch vụ của bên thứ ba. Giao diện tại thời điểm bạn sử dụng thể hiện phạm vi tính năng hiện có.",
        ],
      },
      {
        heading: "2. Tài khoản và điều kiện sử dụng",
        bullets: [
          "Bạn phải có năng lực pháp lý cần thiết để chấp nhận các điều khoản này. Nếu sử dụng dịch vụ thay mặt tổ chức, bạn xác nhận mình có quyền ràng buộc tổ chức đó.",
          "Bạn phải cung cấp thông tin chính xác, cập nhật và bảo mật mật khẩu, phiên đăng nhập cùng phương thức xác thực của mình.",
          "Bạn chịu trách nhiệm về hoạt động phát sinh từ tài khoản, trừ trường hợp pháp luật quy định khác hoặc sự cố do lỗi của Link4Sub.",
          "Hãy thông báo ngay qua kênh hỗ trợ nếu nghi ngờ tài khoản bị truy cập trái phép.",
        ],
      },
      {
        heading: "3. Liên kết, trang công khai và dịch vụ bên thứ ba",
        paragraphs: [
          "Bạn có thể tạo liên kết đích, trang hồ sơ, liên kết chứa nhiều hành động và nội dung công khai khác. Bạn phải có quyền chia sẻ mọi URL, tệp, hình ảnh, văn bản và tài nguyên được sử dụng.",
          "Các liên kết có thể dẫn tới website, mạng xã hội hoặc dịch vụ do bên thứ ba vận hành. Link4Sub không sở hữu, kiểm soát hay xác nhận nội dung, tính sẵn sàng hoặc chính sách của các dịch vụ đó. Việc bạn sử dụng dịch vụ bên thứ ba chịu điều khoản riêng của họ.",
          "Tính năng hành động mở khóa hỗ trợ hướng dẫn và ghi nhận thao tác của khách truy cập theo cơ chế hiển thị trên sản phẩm. Trừ khi được nêu rõ, Link4Sub không bảo đảm một nền tảng bên thứ ba đã xác minh độc lập mọi hành động.",
        ],
      },
      {
        heading: "4. Nội dung của người dùng",
        paragraphs: [
          "Bạn giữ quyền sở hữu đối với nội dung mình cung cấp. Bạn cấp cho Link4Sub giấy phép không độc quyền, có phạm vi toàn cầu và miễn phí bản quyền để lưu trữ, sao chép, xử lý, hiển thị và truyền nội dung đó trong phạm vi cần thiết nhằm vận hành, bảo mật và cải thiện dịch vụ.",
          "Giấy phép này chấm dứt khi nội dung được xóa khỏi hệ thống, ngoại trừ bản sao lưu có thời hạn hợp lý, dữ liệu cần lưu để tuân thủ pháp luật hoặc nội dung đã được chia sẻ lại hợp pháp bởi người khác.",
          "Bạn cam kết nội dung không xâm phạm quyền sở hữu trí tuệ, quyền riêng tư, quyền hình ảnh hoặc quyền hợp pháp khác của bất kỳ bên nào.",
        ],
      },
      {
        heading: "5. Sử dụng được chấp nhận",
        paragraphs: ["Bạn không được sử dụng Link4Sub để thực hiện hoặc hỗ trợ:"],
        bullets: [
          "Nội dung hoặc hoạt động trái pháp luật, lừa đảo, giả mạo, phỉ báng, đe dọa, quấy rối, thù ghét, bóc lột hoặc xâm phạm quyền của người khác.",
          "Phần mềm độc hại, đánh cắp thông tin, spam, phishing, chuyển hướng gây hiểu nhầm hoặc nội dung cố che giấu đích đến nguy hiểm.",
          "Xâm nhập, dò quét, phá hoại, vượt giới hạn truy cập, né tránh biện pháp bảo mật hoặc gây quá tải hệ thống.",
          "Tạo lượt truy cập, lượt hoàn thành, thu nhập hoặc chỉ số giả; sử dụng bot, click farm, tự động hóa không được phép hoặc thao túng hệ thống chống gian lận.",
          "Thu thập hoặc công khai dữ liệu cá nhân khi không có cơ sở hợp pháp và thông báo phù hợp.",
          "Mạo danh Link4Sub, ngụ ý tài trợ hoặc chứng thực không tồn tại, hay sử dụng thương hiệu của chúng tôi theo cách gây nhầm lẫn.",
        ],
      },
      {
        heading: "6. Tệp và nội dung được bảo vệ",
        paragraphs: [
          "Bạn chỉ được tải lên tệp hợp pháp, an toàn và thuộc quyền sử dụng của mình. Giới hạn dung lượng, loại tệp và thời gian lưu giữ được thể hiện trong sản phẩm hoặc cấu hình tài khoản.",
          "Bạn chịu trách nhiệm sao lưu nội dung quan trọng. Link4Sub có thể cách ly, vô hiệu hóa hoặc xóa tệp bị phát hiện là độc hại, vi phạm pháp luật, vi phạm quyền của bên thứ ba hoặc đe dọa an toàn hệ thống.",
        ],
      },
      {
        heading: "7. Dữ liệu phân tích",
        paragraphs: [
          "Các số liệu như lượt xem, lượt nhấp, lượt hoàn thành, thiết bị, quốc gia hoặc nguồn truy cập được cung cấp để tham khảo và có thể được lọc, trì hoãn, tổng hợp hoặc điều chỉnh nhằm loại bỏ lưu lượng không hợp lệ.",
          "Link4Sub không cam kết dữ liệu phân tích không có sai số và bạn không nên dùng dữ liệu này làm căn cứ duy nhất cho quyết định tài chính, pháp lý hoặc kinh doanh quan trọng.",
        ],
      },
      {
        heading: "8. Số dư, thu nhập và rút tiền",
        paragraphs: [
          "Khi tài khoản có quyền truy cập tính năng kiếm thu nhập hoặc rút tiền, chỉ lưu lượng và sự kiện được Link4Sub xác định là hợp lệ mới đủ điều kiện ghi nhận. Mức chi trả, đơn vị tiền tệ, số tiền tối thiểu và phương thức khả dụng được hiển thị trong sản phẩm và có thể thay đổi cho các giao dịch tương lai sau khi được thông báo phù hợp.",
          "Bạn phải cung cấp chính xác thông tin người nhận và tự chịu trách nhiệm về thuế hoặc nghĩa vụ kê khai của mình. Phí rút tiền được hiển thị theo phương thức đã chọn trước khi gửi yêu cầu.",
          "Link4Sub có thể tạm giữ để kiểm tra hoặc từ chối khoản liên quan đến gian lận, lưu lượng không hợp lệ, tranh chấp, vi phạm điều khoản hoặc yêu cầu của cơ quan có thẩm quyền. Link4Sub không phải ngân hàng, tổ chức nhận tiền gửi hay ví lưu ký tài sản của người dùng.",
        ],
      },
      {
        heading: "9. Quyền riêng tư và cookie",
        paragraphs: [
          "Việc xử lý dữ liệu cá nhân được mô tả trong Chính sách quyền riêng tư của Link4Sub. Dịch vụ sử dụng cookie hoặc công nghệ tương tự cần thiết cho đăng nhập, bảo mật, ghi nhớ ngôn ngữ và vận hành tính năng. Cookie không thiết yếu, nếu có, sẽ được quản lý theo thông báo và lựa chọn áp dụng trên website.",
          "Bạn chịu trách nhiệm cung cấp thông báo và cơ sở pháp lý phù hợp nếu dùng Link4Sub để thu thập dữ liệu từ khách truy cập của mình.",
        ],
      },
      {
        heading: "10. Báo cáo vi phạm và kiểm duyệt",
        paragraphs: [
          "Người dùng có thể báo cáo liên kết hoặc nội dung đáng ngờ qua công cụ báo cáo của Link4Sub. Chúng tôi có thể xem xét, hạn chế hiển thị, vô hiệu hóa liên kết, xóa nội dung hoặc áp dụng biện pháp đối với tài khoản khi có căn cứ hợp lý cho rằng nội dung vi phạm pháp luật, điều khoản này hoặc gây rủi ro cho người dùng và hệ thống.",
          "Khi hợp lý và không bị pháp luật hoặc yêu cầu an toàn ngăn cấm, Link4Sub sẽ cung cấp thông tin về biện pháp đã áp dụng và kênh để người dùng gửi giải trình hoặc khiếu nại.",
        ],
      },
      {
        heading: "11. Quyền sở hữu trí tuệ của Link4Sub",
        paragraphs: [
          "Phần mềm, giao diện, thiết kế, tài liệu, nhãn hiệu, logo và nội dung do Link4Sub tạo ra thuộc Link4Sub hoặc bên cấp phép. Bạn được cấp quyền giới hạn, có thể thu hồi, không chuyển nhượng để sử dụng dịch vụ theo các điều khoản này.",
          "Bạn không được sao chép, bán, cho thuê, cấp phép lại, dịch ngược, khai thác mã nguồn hoặc sử dụng tài sản của Link4Sub ngoài phạm vi pháp luật cho phép hay khi chưa có chấp thuận bằng văn bản.",
        ],
      },
      {
        heading: "12. Tạm ngừng và chấm dứt",
        paragraphs: [
          "Bạn có thể ngừng sử dụng dịch vụ hoặc yêu cầu xử lý tài khoản theo các công cụ được cung cấp. Link4Sub có thể hạn chế hoặc chấm dứt quyền truy cập khi bạn vi phạm nghiêm trọng hoặc lặp lại các điều khoản này, gây rủi ro bảo mật, có hoạt động gian lận, không tuân thủ pháp luật hoặc khi việc tiếp tục cung cấp dịch vụ không còn khả thi.",
          "Các nghĩa vụ về quyền sở hữu, trách nhiệm đối với nội dung, thanh toán còn tồn đọng, giới hạn trách nhiệm và giải quyết tranh chấp vẫn tiếp tục có hiệu lực khi phù hợp sau khi tài khoản chấm dứt.",
        ],
      },
      {
        heading: "13. Tính sẵn sàng và bảo đảm",
        paragraphs: [
          "Link4Sub nỗ lực duy trì dịch vụ an toàn và ổn định nhưng không bảo đảm dịch vụ luôn liên tục, không có lỗi hoặc phù hợp với mọi mục đích cụ thể. Dịch vụ có thể tạm gián đoạn để bảo trì, khắc phục sự cố hoặc do yếu tố ngoài khả năng kiểm soát hợp lý.",
          "Trong phạm vi pháp luật cho phép, dịch vụ được cung cấp theo hiện trạng và theo khả năng sẵn có. Không nội dung nào trong điều khoản này loại trừ quyền bắt buộc của người tiêu dùng hoặc trách nhiệm không thể bị giới hạn theo pháp luật áp dụng.",
        ],
      },
      {
        heading: "14. Giới hạn trách nhiệm",
        paragraphs: [
          "Trong phạm vi pháp luật cho phép, Link4Sub không chịu trách nhiệm đối với thiệt hại gián tiếp, ngẫu nhiên, đặc biệt hoặc hệ quả; mất lợi nhuận, dữ liệu, uy tín hoặc cơ hội phát sinh từ việc sử dụng dịch vụ, nội dung của người dùng hay dịch vụ bên thứ ba.",
          "Mọi giới hạn được áp dụng phù hợp với pháp luật và không giới hạn trách nhiệm đối với gian lận, hành vi cố ý, thương tích, tử vong hoặc quyền và trách nhiệm khác mà pháp luật không cho phép loại trừ hay giới hạn.",
        ],
      },
      {
        heading: "15. Thay đổi điều khoản",
        paragraphs: [
          "Link4Sub có thể cập nhật các điều khoản này để phản ánh thay đổi của dịch vụ, pháp luật hoặc yêu cầu an toàn. Khi thay đổi có ảnh hưởng đáng kể, chúng tôi sẽ thông báo bằng phương thức phù hợp và nêu ngày có hiệu lực. Việc tiếp tục sử dụng sau ngày hiệu lực đồng nghĩa bạn chấp nhận bản cập nhật, trừ khi pháp luật yêu cầu hình thức đồng ý khác.",
        ],
      },
      {
        heading: "16. Pháp luật áp dụng, tranh chấp và liên hệ",
        paragraphs: [
          "Các điều khoản này được giải thích theo pháp luật áp dụng đối với đơn vị vận hành Link4Sub và người dùng, đồng thời tôn trọng các quyền bảo vệ người tiêu dùng bắt buộc tại nơi bạn cư trú. Các bên nên ưu tiên giải quyết tranh chấp thiện chí qua kênh hỗ trợ trước khi sử dụng biện pháp pháp lý khác.",
          "Nếu có câu hỏi, yêu cầu pháp lý hoặc khiếu nại về các điều khoản này, vui lòng dùng trang Liên hệ hoặc kênh Hỗ trợ được công bố trên Link4Sub.",
        ],
      },
    ],
  },
  {
    slug: "terms-en",
    title: "Terms of Service",
    excerpt:
      "The rules that apply when accessing and using Link4Sub's link management, sharing and optimization platform.",
    seoTitle: "Terms of Service | Link4Sub",
    seoDescription:
      "Learn about your rights, responsibilities and the rules for using Link4Sub.",
    updatedLabel: "Last updated",
    updatedDate: "August 15, 2026",
    introduction: [
      "Welcome to Link4Sub. These Terms of Service govern your access to and use of the websites, applications, public pages and features provided by Link4Sub.",
      "By creating an account, accessing or continuing to use Link4Sub, you confirm that you have read, understood and agreed to these Terms. If you do not agree, do not use the Service.",
      "Plain-language summary: you are responsible for the links, content and account information you provide; you may not use Link4Sub for unlawful, harmful or fraudulent activity; and Link4Sub may act on violating content to protect users and the platform. The complete terms below are controlling.",
    ],
    sections: [
      {
        heading: "1. About Link4Sub",
        paragraphs: [
          "Link4Sub helps users create, manage, share and track links; build link profile pages; configure content-unlock actions; manage files; and view analytics made available in their accounts.",
          "Some features may depend on account eligibility, system configuration, region or third-party services. The product interface shows the functionality available to you at the time of use.",
        ],
      },
      {
        heading: "2. Accounts and eligibility",
        bullets: [
          "You must have the legal capacity required to accept these Terms. If you use the Service for an organization, you confirm that you can bind that organization.",
          "You must provide accurate, current information and protect your password, sessions and authentication methods.",
          "You are responsible for activity through your account, except where applicable law provides otherwise or an incident results from Link4Sub's fault.",
          "Contact Support promptly if you suspect unauthorized access.",
        ],
      },
      {
        heading: "3. Links, public pages and third-party services",
        paragraphs: [
          "You may create destination links, profile pages, multi-action links and other public content. You must have the right to share every URL, file, image, text and resource you use.",
          "Links may lead to websites, social networks or services operated by third parties. Link4Sub does not own, control or endorse their content, availability or policies. Your use of a third-party service is subject to its own terms.",
          "Unlock actions help present instructions and record visitor interactions according to the product flow. Unless expressly stated, Link4Sub does not guarantee that a third-party platform independently verified every action.",
        ],
      },
      {
        heading: "4. User content",
        paragraphs: [
          "You retain ownership of content you provide. You grant Link4Sub a worldwide, royalty-free, non-exclusive license to host, copy, process, display and transmit that content only as needed to operate, secure and improve the Service.",
          "This license ends when content is removed, except for time-limited backups, records retained to comply with law, or content lawfully reshared by others.",
          "You represent that your content does not infringe intellectual property, privacy, publicity or other legal rights.",
        ],
      },
      {
        heading: "5. Acceptable use",
        paragraphs: ["You may not use Link4Sub to carry out or facilitate:"],
        bullets: [
          "Unlawful, fraudulent, impersonating, defamatory, threatening, harassing, hateful, exploitative or rights-infringing content or conduct.",
          "Malware, credential theft, spam, phishing, deceptive redirects or content intended to conceal a harmful destination.",
          "Unauthorized access, scanning, disruption, circumvention of access or security controls, or unreasonable load on the Service.",
          "Fake visits, completions, revenue or metrics, including bots, click farms, unauthorized automation or manipulation of fraud controls.",
          "Collection or disclosure of personal data without an appropriate legal basis and notice.",
          "Impersonating Link4Sub, suggesting nonexistent sponsorship or endorsement, or using our branding deceptively.",
        ],
      },
      {
        heading: "6. Files and protected content",
        paragraphs: [
          "You may upload only lawful, safe files that you have the right to use. Storage limits, supported file types and retention behavior are shown in the product or account configuration.",
          "You are responsible for keeping backups of important content. Link4Sub may quarantine, disable or remove files reasonably believed to be malicious, unlawful, rights-infringing or a threat to the Service.",
        ],
      },
      {
        heading: "7. Analytics",
        paragraphs: [
          "Metrics such as views, clicks, completions, device, country or referrer are provided for informational purposes and may be filtered, delayed, aggregated or adjusted to remove invalid traffic.",
          "Link4Sub does not promise that analytics are error-free, and you should not use them as the sole basis for important financial, legal or business decisions.",
        ],
      },
      {
        heading: "8. Balance, earnings and withdrawals",
        paragraphs: [
          "Where an account can access earning or withdrawal features, only traffic and events Link4Sub determines to be valid are eligible. Payout rates, currencies, minimums and available methods are shown in the product and may change for future transactions after appropriate notice.",
          "You must provide accurate recipient details and remain responsible for your own taxes and reporting duties. Any withdrawal fee is displayed for the selected method before a request is submitted.",
          "Link4Sub may hold for review or reject amounts connected to fraud, invalid traffic, disputes, violations or lawful authority requests. Link4Sub is not a bank, deposit-taking institution or custodial wallet for user assets.",
        ],
      },
      {
        heading: "9. Privacy and cookies",
        paragraphs: [
          "Link4Sub's Privacy Policy describes how personal data is handled. The Service uses cookies or similar technologies needed for login, security, language preferences and feature operation. Non-essential cookies, if used, will be managed through the notices and choices applicable on the website.",
          "You are responsible for providing an appropriate notice and legal basis when you use Link4Sub to collect data from your visitors.",
        ],
      },
      {
        heading: "10. Reports and moderation",
        paragraphs: [
          "Users may report suspicious links or content through Link4Sub's reporting tools. We may review, limit visibility, disable links, remove content or act on an account where we reasonably believe it violates law or these Terms, or threatens users or the Service.",
          "Where reasonable and not prohibited by law or safety needs, Link4Sub will provide information about the action and a way for the affected user to submit an explanation or appeal.",
        ],
      },
      {
        heading: "11. Link4Sub intellectual property",
        paragraphs: [
          "The software, interface, design, documentation, trademarks, logos and content created by Link4Sub belong to Link4Sub or its licensors. You receive a limited, revocable and non-transferable right to use the Service under these Terms.",
          "You may not copy, sell, rent, sublicense, reverse engineer, extract source code from or otherwise exploit Link4Sub property except where permitted by law or approved in writing.",
        ],
      },
      {
        heading: "12. Suspension and termination",
        paragraphs: [
          "You may stop using the Service or request account handling through available controls. Link4Sub may restrict or terminate access for serious or repeated violations, security risks, fraud, legal requirements, or where continuing the Service is no longer reasonably feasible.",
          "Obligations concerning ownership, responsibility for content, outstanding payments, liability limits and disputes survive termination where their nature requires it.",
        ],
      },
      {
        heading: "13. Availability and warranties",
        paragraphs: [
          "Link4Sub works to keep the Service safe and reliable but does not guarantee uninterrupted, error-free operation or suitability for every purpose. Maintenance, incidents and circumstances outside reasonable control may cause temporary interruption.",
          "To the extent permitted by law, the Service is provided as is and as available. Nothing in these Terms excludes mandatory consumer rights or liability that cannot lawfully be excluded or limited.",
        ],
      },
      {
        heading: "14. Limitation of liability",
        paragraphs: [
          "To the extent permitted by law, Link4Sub is not liable for indirect, incidental, special or consequential loss, or loss of profits, data, reputation or opportunity arising from the Service, user content or third-party services.",
          "All limitations apply only as allowed by law and do not limit liability for fraud, willful misconduct, personal injury, death or any right or liability that cannot legally be excluded or limited.",
        ],
      },
      {
        heading: "15. Changes to these Terms",
        paragraphs: [
          "Link4Sub may update these Terms to reflect changes to the Service, law or safety requirements. For material changes, we will give appropriate notice and identify the effective date. Continued use after that date means you accept the update unless applicable law requires another form of consent.",
        ],
      },
      {
        heading: "16. Applicable law, disputes and contact",
        paragraphs: [
          "These Terms are interpreted under the laws applicable to the Link4Sub operator and the user, while preserving mandatory consumer rights in your place of residence. The parties should first try to resolve disputes in good faith through Support before pursuing other remedies.",
          "For questions, legal requests or complaints about these Terms, use the Contact page or the Support channel published on Link4Sub.",
        ],
      },
    ],
  },
  {
    slug: "terms-id",
    title: "Ketentuan Layanan",
    excerpt:
      "Aturan yang berlaku saat mengakses dan menggunakan platform pengelolaan, berbagi, dan pengoptimalan tautan Link4Sub.",
    seoTitle: "Ketentuan Layanan | Link4Sub",
    seoDescription:
      "Pelajari hak, kewajiban, dan aturan penggunaan Link4Sub.",
    updatedLabel: "Terakhir diperbarui",
    updatedDate: "15 Agustus 2026",
    introduction: [
      "Selamat datang di Link4Sub. Ketentuan Layanan ini mengatur akses dan penggunaan situs web, aplikasi, halaman publik, serta fitur yang disediakan oleh Link4Sub.",
      "Dengan membuat akun, mengakses, atau terus menggunakan Link4Sub, Anda menyatakan telah membaca, memahami, dan menyetujui Ketentuan ini. Jika tidak setuju, jangan gunakan Layanan.",
      "Ringkasan sederhana: Anda bertanggung jawab atas tautan, konten, dan informasi akun yang diberikan; Link4Sub tidak boleh digunakan untuk kegiatan melanggar hukum, berbahaya, atau curang; dan Link4Sub dapat menindak konten yang melanggar demi melindungi pengguna dan platform. Ketentuan lengkap di bawah ini tetap berlaku.",
    ],
    sections: [
      {
        heading: "1. Tentang Link4Sub",
        paragraphs: [
          "Link4Sub membantu pengguna membuat, mengelola, membagikan, dan melacak tautan; membuat halaman profil tautan; mengatur tindakan untuk membuka konten; mengelola berkas; serta melihat analitik yang tersedia di akun.",
          "Sebagian fitur dapat bergantung pada kelayakan akun, konfigurasi sistem, wilayah, atau layanan pihak ketiga. Antarmuka produk menunjukkan fungsi yang tersedia pada saat digunakan.",
        ],
      },
      {
        heading: "2. Akun dan kelayakan",
        bullets: [
          "Anda harus memiliki kapasitas hukum untuk menerima Ketentuan ini. Jika menggunakan Layanan untuk organisasi, Anda menyatakan berwenang mengikat organisasi tersebut.",
          "Anda wajib memberikan informasi yang akurat dan terkini serta melindungi kata sandi, sesi, dan metode autentikasi.",
          "Anda bertanggung jawab atas aktivitas melalui akun, kecuali hukum yang berlaku menentukan lain atau insiden terjadi karena kesalahan Link4Sub.",
          "Segera hubungi Dukungan jika Anda mencurigai akses tanpa izin.",
        ],
      },
      {
        heading: "3. Tautan, halaman publik, dan layanan pihak ketiga",
        paragraphs: [
          "Anda dapat membuat tautan tujuan, halaman profil, tautan multi-tindakan, dan konten publik lainnya. Anda harus memiliki hak untuk membagikan setiap URL, berkas, gambar, teks, dan sumber daya yang digunakan.",
          "Tautan dapat mengarah ke situs web, jejaring sosial, atau layanan pihak ketiga. Link4Sub tidak memiliki, mengendalikan, atau mendukung konten, ketersediaan, maupun kebijakan mereka. Penggunaan layanan pihak ketiga tunduk pada ketentuannya sendiri.",
          "Tindakan buka kunci membantu menampilkan petunjuk dan mencatat interaksi pengunjung sesuai alur produk. Kecuali dinyatakan secara tegas, Link4Sub tidak menjamin bahwa platform pihak ketiga memverifikasi setiap tindakan secara independen.",
        ],
      },
      {
        heading: "4. Konten pengguna",
        paragraphs: [
          "Anda tetap memiliki konten yang diberikan. Anda memberikan Link4Sub lisensi non-eksklusif, berlaku di seluruh dunia, dan bebas royalti untuk menyimpan, menyalin, memproses, menampilkan, serta mengirimkan konten hanya sejauh diperlukan untuk mengoperasikan, mengamankan, dan meningkatkan Layanan.",
          "Lisensi ini berakhir saat konten dihapus, kecuali untuk cadangan berjangka waktu wajar, catatan yang wajib disimpan berdasarkan hukum, atau konten yang telah dibagikan ulang secara sah oleh pihak lain.",
          "Anda menyatakan bahwa konten tidak melanggar kekayaan intelektual, privasi, hak publisitas, atau hak hukum pihak lain.",
        ],
      },
      {
        heading: "5. Penggunaan yang dapat diterima",
        paragraphs: ["Anda tidak boleh menggunakan Link4Sub untuk melakukan atau memfasilitasi:"],
        bullets: [
          "Konten atau tindakan yang melanggar hukum, curang, menyamar, memfitnah, mengancam, melecehkan, penuh kebencian, eksploitatif, atau melanggar hak.",
          "Malware, pencurian kredensial, spam, phishing, pengalihan menipu, atau konten yang menyembunyikan tujuan berbahaya.",
          "Akses, pemindaian, gangguan, penghindaran kontrol keamanan, atau beban tidak wajar tanpa izin.",
          "Kunjungan, penyelesaian, pendapatan, atau metrik palsu melalui bot, click farm, otomatisasi tanpa izin, atau manipulasi kontrol antipenipuan.",
          "Pengumpulan atau pengungkapan data pribadi tanpa dasar hukum dan pemberitahuan yang sesuai.",
          "Penyamaran sebagai Link4Sub, klaim sponsor atau dukungan yang tidak ada, atau penggunaan merek kami secara menyesatkan.",
        ],
      },
      {
        heading: "6. Berkas dan konten terlindungi",
        paragraphs: [
          "Anda hanya boleh mengunggah berkas yang sah, aman, dan berhak Anda gunakan. Batas penyimpanan, jenis berkas, dan masa retensi ditampilkan dalam produk atau konfigurasi akun.",
          "Anda bertanggung jawab membuat cadangan konten penting. Link4Sub dapat mengarantina, menonaktifkan, atau menghapus berkas yang secara wajar dianggap berbahaya, melanggar hukum atau hak, maupun mengancam Layanan.",
        ],
      },
      {
        heading: "7. Analitik",
        paragraphs: [
          "Metrik seperti tayangan, klik, penyelesaian, perangkat, negara, atau perujuk disediakan sebagai informasi dan dapat difilter, ditunda, diagregasi, atau disesuaikan untuk menghapus lalu lintas tidak valid.",
          "Link4Sub tidak menjamin analitik bebas kesalahan. Jangan menjadikannya satu-satunya dasar keputusan keuangan, hukum, atau bisnis yang penting.",
        ],
      },
      {
        heading: "8. Saldo, penghasilan, dan penarikan",
        paragraphs: [
          "Jika akun dapat mengakses fitur penghasilan atau penarikan, hanya lalu lintas dan peristiwa yang dinilai valid oleh Link4Sub yang memenuhi syarat. Tarif, mata uang, minimum, dan metode yang tersedia ditampilkan dalam produk dan dapat berubah untuk transaksi mendatang setelah pemberitahuan yang sesuai.",
          "Anda wajib memberikan data penerima yang akurat dan bertanggung jawab atas pajak serta pelaporan sendiri. Biaya penarikan ditampilkan untuk metode yang dipilih sebelum permintaan dikirim.",
          "Link4Sub dapat menahan untuk pemeriksaan atau menolak jumlah yang terkait penipuan, lalu lintas tidak valid, sengketa, pelanggaran, atau permintaan sah pihak berwenang. Link4Sub bukan bank, lembaga penerima simpanan, atau dompet kustodian aset pengguna.",
        ],
      },
      {
        heading: "9. Privasi dan cookie",
        paragraphs: [
          "Kebijakan Privasi Link4Sub menjelaskan pemrosesan data pribadi. Layanan menggunakan cookie atau teknologi serupa yang diperlukan untuk login, keamanan, preferensi bahasa, dan pengoperasian fitur. Cookie non-esensial, jika digunakan, akan dikelola melalui pemberitahuan dan pilihan yang berlaku di situs.",
          "Anda bertanggung jawab menyediakan pemberitahuan dan dasar hukum yang sesuai saat menggunakan Link4Sub untuk mengumpulkan data pengunjung.",
        ],
      },
      {
        heading: "10. Pelaporan dan moderasi",
        paragraphs: [
          "Pengguna dapat melaporkan tautan atau konten mencurigakan melalui alat pelaporan Link4Sub. Kami dapat meninjau, membatasi visibilitas, menonaktifkan tautan, menghapus konten, atau menindak akun jika secara wajar diyakini melanggar hukum atau Ketentuan ini, atau mengancam pengguna maupun Layanan.",
          "Jika wajar dan tidak dilarang hukum atau kebutuhan keamanan, Link4Sub akan memberikan informasi tentang tindakan tersebut dan cara bagi pengguna terdampak untuk menyampaikan penjelasan atau banding.",
        ],
      },
      {
        heading: "11. Kekayaan intelektual Link4Sub",
        paragraphs: [
          "Perangkat lunak, antarmuka, desain, dokumentasi, merek dagang, logo, dan konten buatan Link4Sub dimiliki oleh Link4Sub atau pemberi lisensinya. Anda memperoleh hak terbatas, dapat dicabut, dan tidak dapat dialihkan untuk menggunakan Layanan berdasarkan Ketentuan ini.",
          "Anda tidak boleh menyalin, menjual, menyewakan, mensublisensikan, merekayasa balik, mengambil kode sumber, atau mengeksploitasi milik Link4Sub kecuali diizinkan hukum atau disetujui tertulis.",
        ],
      },
      {
        heading: "12. Penangguhan dan penghentian",
        paragraphs: [
          "Anda dapat berhenti menggunakan Layanan atau meminta penanganan akun melalui kontrol yang tersedia. Link4Sub dapat membatasi atau menghentikan akses karena pelanggaran serius atau berulang, risiko keamanan, penipuan, kewajiban hukum, atau ketika kelanjutan Layanan tidak lagi layak secara wajar.",
          "Kewajiban mengenai kepemilikan, tanggung jawab konten, pembayaran tertunda, batas tanggung jawab, dan sengketa tetap berlaku setelah penghentian jika sifatnya mengharuskan demikian.",
        ],
      },
      {
        heading: "13. Ketersediaan dan jaminan",
        paragraphs: [
          "Link4Sub berupaya menjaga Layanan tetap aman dan andal, tetapi tidak menjamin operasi tanpa gangguan atau kesalahan maupun kesesuaian untuk setiap tujuan. Pemeliharaan, insiden, dan keadaan di luar kendali wajar dapat menyebabkan gangguan sementara.",
          "Sejauh diizinkan hukum, Layanan disediakan apa adanya dan sebagaimana tersedia. Ketentuan ini tidak menghapus hak konsumen wajib atau tanggung jawab yang secara hukum tidak dapat dikecualikan maupun dibatasi.",
        ],
      },
      {
        heading: "14. Batas tanggung jawab",
        paragraphs: [
          "Sejauh diizinkan hukum, Link4Sub tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, atau konsekuensial, maupun hilangnya keuntungan, data, reputasi, atau peluang akibat Layanan, konten pengguna, atau layanan pihak ketiga.",
          "Semua batas hanya berlaku sejauh diizinkan hukum dan tidak membatasi tanggung jawab atas penipuan, kesengajaan, cedera pribadi, kematian, atau hak dan tanggung jawab yang tidak dapat dikecualikan atau dibatasi.",
        ],
      },
      {
        heading: "15. Perubahan Ketentuan",
        paragraphs: [
          "Link4Sub dapat memperbarui Ketentuan ini untuk mencerminkan perubahan Layanan, hukum, atau kebutuhan keamanan. Untuk perubahan material, kami akan memberikan pemberitahuan yang sesuai dan menyebutkan tanggal berlaku. Penggunaan berkelanjutan setelah tanggal tersebut berarti Anda menerima pembaruan, kecuali hukum mewajibkan bentuk persetujuan lain.",
        ],
      },
      {
        heading: "16. Hukum yang berlaku, sengketa, dan kontak",
        paragraphs: [
          "Ketentuan ini ditafsirkan berdasarkan hukum yang berlaku bagi operator Link4Sub dan pengguna, dengan tetap mempertahankan hak konsumen wajib di tempat tinggal Anda. Para pihak sebaiknya terlebih dahulu mencoba menyelesaikan sengketa dengan itikad baik melalui Dukungan sebelum menempuh upaya lain.",
          "Untuk pertanyaan, permintaan hukum, atau keluhan tentang Ketentuan ini, gunakan halaman Kontak atau kanal Dukungan yang dipublikasikan di Link4Sub.",
        ],
      },
    ],
  },
];

export const defaultTermsPages = termsPages.map((page) => ({
  slug: page.slug,
  title: page.title,
  excerpt: page.excerpt,
  seoTitle: page.seoTitle,
  seoDescription: page.seoDescription,
  seoKeywords: "Link4Sub, terms of service, terms and conditions, acceptable use",
  contentJson: JSON.stringify(toTiptapDocument(page)),
  contentHtml: toHtml(page),
}));

function toTiptapDocument(page: TermsPageCopy) {
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

function toHtml(page: TermsPageCopy) {
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
