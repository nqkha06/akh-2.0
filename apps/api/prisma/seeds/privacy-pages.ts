type PrivacySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type PrivacyPageCopy = {
  slug: string;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  updatedLabel: string;
  updatedDate: string;
  introduction: string[];
  sections: PrivacySection[];
};

const privacyPages: PrivacyPageCopy[] = [
  {
    slug: "privacy",
    title: "Chính sách quyền riêng tư",
    excerpt:
      "Cách Link4Sub thu thập, sử dụng, chia sẻ và bảo vệ dữ liệu khi bạn quản lý, chia sẻ hoặc truy cập liên kết.",
    seoTitle: "Chính sách quyền riêng tư | Link4Sub",
    seoDescription:
      "Tìm hiểu cách Link4Sub xử lý dữ liệu tài khoản, nội dung, lượt truy cập, thanh toán và yêu cầu hỗ trợ.",
    updatedLabel: "Cập nhật lần cuối",
    updatedDate: "15 tháng 8 năm 2026",
    introduction: [
      "Chính sách quyền riêng tư này giải thích cách Link4Sub thu thập, sử dụng, lưu trữ và chia sẻ dữ liệu cá nhân khi bạn sử dụng website, ứng dụng, trang liên kết công khai và các tính năng liên quan.",
      "Trong chính sách này, “Link4Sub”, “chúng tôi” và “của chúng tôi” chỉ đơn vị vận hành dịch vụ Link4Sub; “bạn” gồm chủ tài khoản, khách truy cập liên kết công khai và người liên hệ với chúng tôi.",
      "Tóm tắt: Link4Sub xử lý dữ liệu cần thiết để vận hành tài khoản và liên kết, cung cấp analytics, bảo vệ nền tảng, hỗ trợ người dùng và xử lý rút tiền khi bạn sử dụng tính năng đó. Chúng tôi không bán dữ liệu cá nhân để đổi lấy tiền.",
    ],
    sections: [
      {
        heading: "1. Phạm vi và vai trò",
        paragraphs: [
          "Chính sách này áp dụng cho dữ liệu do Link4Sub xử lý trong quá trình cung cấp dịch vụ. Khi Link4Sub quyết định mục đích và phương thức xử lý, Link4Sub đóng vai trò bên kiểm soát dữ liệu theo pháp luật áp dụng.",
          "Nếu bạn dùng Link4Sub để đưa người khác tới website, mạng xã hội hoặc biểu mẫu do bạn hay bên thứ ba kiểm soát, bạn chịu trách nhiệm về thông báo quyền riêng tư và cơ sở pháp lý của hoạt động xử lý diễn ra ngoài Link4Sub.",
        ],
      },
      {
        heading: "2. Dữ liệu chúng tôi thu thập",
        bullets: [
          "Dữ liệu tài khoản và hồ sơ: tên, địa chỉ email, ảnh đại diện, trạng thái xác minh email, mã giới thiệu, vai trò, quyền và tùy chọn tài khoản.",
          "Dữ liệu xác thực và bảo mật: mật khẩu đã băm, phương thức đăng nhập, mã định danh tài khoản đăng nhập xã hội, phiên đăng nhập, địa chỉ IP, chuỗi user-agent, mã đặt lại mật khẩu và mã xác minh email.",
          "Nội dung và cấu hình: slug, tiêu đề, mô tả, URL đích, hành động xã hội, trang hồ sơ liên kết, đoạn nội dung, tệp tải lên, hình ảnh, giao diện, ngày hết hạn và trạng thái liên kết.",
          "Dữ liệu sử dụng và analytics: thời điểm truy cập, liên kết được mở, lượt xem hoặc hoàn thành, nguồn giới thiệu, quốc gia suy ra từ kết nối, loại thiết bị, trình duyệt, hệ điều hành và tín hiệu phát hiện lưu lượng không hợp lệ.",
          "Dữ liệu tài chính và chi trả: số dư, thu nhập, loại tiền tệ, lịch sử rút tiền, phí, trạng thái giao dịch và thông tin người nhận bạn lưu cho phương thức rút tiền như ngân hàng, tên tài khoản, số tài khoản, số ví hoặc mạng blockchain.",
          "Dữ liệu hỗ trợ và kiểm duyệt: nội dung ticket, tin nhắn, tệp đính kèm, thông tin kỹ thuật bạn gửi; địa chỉ email, URL, lý do và chi tiết trong báo cáo liên kết.",
          "Dữ liệu liên lạc: tùy chọn email, email giao dịch hoặc cập nhật được gửi, cùng trạng thái gửi, nhận, mở, nhấp, trả lại hoặc khiếu nại do hạ tầng email cung cấp.",
        ],
      },
      {
        heading: "3. Nguồn dữ liệu",
        paragraphs: [
          "Chúng tôi nhận dữ liệu trực tiếp từ bạn khi bạn đăng ký, tạo hoặc chỉnh sửa nội dung, tải tệp, cấu hình nhận tiền, gửi yêu cầu hỗ trợ hay báo cáo liên kết. Chúng tôi cũng tự động nhận dữ liệu kỹ thuật khi trình duyệt hoặc thiết bị tương tác với dịch vụ.",
          "Nếu bạn đăng nhập bằng Google, chúng tôi nhận các thông tin cần thiết cho đăng nhập mà bạn cho phép Google cung cấp, chẳng hạn mã định danh tài khoản, email đã xác minh, tên và ảnh đại diện. Google xử lý dữ liệu theo chính sách riêng của họ.",
          "Một số dữ liệu có thể đến từ nhà cung cấp hạ tầng, email, lưu trữ, bảo mật hoặc từ chủ tài khoản đã mời hay giới thiệu bạn, trong phạm vi cần thiết để cung cấp tính năng tương ứng.",
        ],
      },
      {
        heading: "4. Cách chúng tôi sử dụng dữ liệu",
        bullets: [
          "Tạo và quản lý tài khoản, xác thực đăng nhập, duy trì phiên và khôi phục quyền truy cập.",
          "Tạo, lưu trữ, xuất bản, chuyển hướng và quản lý liên kết, trang hồ sơ, hành động mở khóa, đoạn nội dung và tệp.",
          "Ghi nhận lượt truy cập, cung cấp analytics và tính toán các chỉ số hiển thị cho chủ tài khoản.",
          "Phát hiện bot, spam, lừa đảo, truy cập bất thường, lưu lượng không hợp lệ và hành vi vi phạm; điều tra báo cáo và bảo vệ người dùng.",
          "Quản lý số dư, hoa hồng, thông tin nhận tiền và yêu cầu rút tiền khi các tính năng này được sử dụng.",
          "Trả lời yêu cầu hỗ trợ, gửi thông báo bảo mật, xác minh, giao dịch và các cập nhật bạn đã chọn nhận.",
          "Vận hành, khắc phục lỗi, kiểm tra, đo lường và cải thiện độ tin cậy, khả năng sử dụng và hiệu suất của Link4Sub.",
          "Tuân thủ nghĩa vụ pháp lý, yêu cầu hợp lệ của cơ quan có thẩm quyền và bảo vệ quyền, tài sản hoặc lợi ích hợp pháp của Link4Sub và người khác.",
        ],
      },
      {
        heading: "5. Cơ sở xử lý",
        paragraphs: [
          "Tùy nơi bạn sinh sống và hoạt động cụ thể, chúng tôi xử lý dữ liệu để thực hiện thỏa thuận cung cấp dịch vụ; theo sự đồng ý của bạn; để tuân thủ nghĩa vụ pháp lý; hoặc vì lợi ích hợp pháp như bảo mật, phòng chống gian lận, hỗ trợ và cải thiện sản phẩm, sau khi cân nhắc quyền của bạn.",
          "Khi việc xử lý dựa trên sự đồng ý, bạn có thể rút lại sự đồng ý cho tương lai. Việc rút lại không làm cho hoạt động xử lý hợp pháp trước đó trở thành bất hợp pháp và có thể khiến một tính năng không còn hoạt động.",
        ],
      },
      {
        heading: "6. Nội dung công khai và analytics dành cho chủ liên kết",
        paragraphs: [
          "Nội dung bạn xuất bản, gồm tên hiển thị, ảnh, mô tả, liên kết, trang hồ sơ và tài nguyên được chia sẻ, có thể được bất kỳ ai có URL truy cập và có thể được công cụ tìm kiếm lập chỉ mục tùy cấu hình. Không đưa thông tin nhạy cảm lên trang công khai nếu bạn không muốn người khác thấy hoặc chia sẻ lại.",
          "Chủ liên kết có thể xem analytics tổng hợp về lượt truy cập như số lượt xem hoặc hoàn thành, quốc gia, thiết bị, trình duyệt và nguồn truy cập. Link4Sub dùng định danh mạng và thiết bị chi tiết hơn trong hệ thống nội bộ để bảo mật, khử trùng lặp và đánh giá lưu lượng; các dữ liệu này chỉ được hiển thị cho người có quyền khi tính năng quản trị hoặc điều tra yêu cầu.",
        ],
      },
      {
        heading: "7. Cookie và lưu trữ trên thiết bị",
        paragraphs: [
          "Link4Sub sử dụng cookie và công nghệ lưu trữ tương tự cần thiết để duy trì đăng nhập, làm mới phiên, bảo vệ yêu cầu, ghi nhớ ngôn ngữ và lưu trạng thái giao diện. Bạn có thể chặn hoặc xóa cookie trong trình duyệt, nhưng đăng nhập và một số tùy chọn có thể không hoạt động đúng.",
          "Nếu Link4Sub bổ sung cookie không thiết yếu trong tương lai, chúng tôi sẽ cập nhật thông báo và cung cấp lựa chọn khi pháp luật yêu cầu.",
        ],
      },
      {
        heading: "8. Khi nào dữ liệu được chia sẻ",
        paragraphs: [
          "Chúng tôi chỉ chia sẻ dữ liệu trong phạm vi cần thiết với nhà cung cấp hỗ trợ vận hành như lưu trữ, hạ tầng đám mây, gửi email, xác thực, bảo mật, giám sát lỗi và xử lý tệp. Các nhà cung cấp này chỉ được xử lý dữ liệu theo chỉ dẫn và nghĩa vụ bảo mật phù hợp với vai trò của họ.",
          "Dữ liệu cũng có thể được chia sẻ với quản trị viên hoặc nhân sự được ủy quyền; với cơ quan nhà nước khi có yêu cầu hợp lệ; để điều tra gian lận, lạm dụng hoặc sự cố; để bảo vệ quyền và an toàn; hoặc trong giao dịch tái cấu trúc, sáp nhập hay chuyển giao dịch vụ, kèm biện pháp bảo vệ phù hợp.",
          "Khi bạn chủ động mở một liên kết bên thứ ba, đăng nhập bằng nhà cung cấp khác hoặc gửi tài sản tới địa chỉ ngân hàng hay blockchain, dữ liệu cần thiết sẽ được chuyển tới bên đó và chịu chính sách riêng của họ.",
        ],
      },
      {
        heading: "9. Chuyển dữ liệu qua biên giới",
        paragraphs: [
          "Link4Sub và các nhà cung cấp dịch vụ có thể xử lý dữ liệu tại quốc gia khác nơi bạn sinh sống. Khi pháp luật yêu cầu, chúng tôi áp dụng cơ chế chuyển dữ liệu, hợp đồng và biện pháp bảo vệ thích hợp, đồng thời thực hiện các nghĩa vụ liên quan đến dữ liệu được chuyển qua biên giới.",
        ],
      },
      {
        heading: "10. Thời gian lưu giữ",
        paragraphs: [
          "Chúng tôi lưu dữ liệu trong thời gian cần thiết để cung cấp dịch vụ và đáp ứng mục đích mô tả trong chính sách này. Thời gian cụ thể phụ thuộc loại dữ liệu, trạng thái tài khoản, yêu cầu bảo mật, chu kỳ sao lưu, tranh chấp và nghĩa vụ pháp lý, kế toán hoặc chống gian lận.",
          "Khi dữ liệu không còn cần thiết, chúng tôi sẽ xóa, ẩn danh hoặc cô lập dữ liệu theo quy trình phù hợp. Một số bản ghi có thể được giữ lâu hơn khi pháp luật yêu cầu, để bảo vệ quyền hợp pháp, xử lý khiếu nại hoặc ngăn lạm dụng lặp lại. Bản sao trong hệ thống sao lưu sẽ được loại bỏ theo chu kỳ sao lưu thông thường.",
        ],
      },
      {
        heading: "11. Bảo mật dữ liệu",
        paragraphs: [
          "Chúng tôi sử dụng các biện pháp kỹ thuật và tổ chức phù hợp với rủi ro, gồm kiểm soát truy cập theo quyền, băm mật khẩu và token, cookie xác thực được bảo vệ, ghi nhật ký, giới hạn truy cập, kiểm tra tệp và giám sát hành vi bất thường.",
          "Không phương thức truyền hoặc lưu trữ nào an toàn tuyệt đối. Bạn nên dùng mật khẩu riêng và mạnh, bảo vệ thiết bị, đăng xuất khỏi thiết bị dùng chung và thông báo ngay cho bộ phận Hỗ trợ khi nghi ngờ tài khoản hoặc dữ liệu bị xâm phạm.",
        ],
      },
      {
        heading: "12. Quyền và lựa chọn của bạn",
        paragraphs: [
          "Tùy pháp luật áp dụng, bạn có thể yêu cầu biết hoặc truy cập dữ liệu; sửa dữ liệu không chính xác; xóa dữ liệu; hạn chế hoặc phản đối một số hoạt động xử lý; nhận bản sao có thể chuyển; rút lại sự đồng ý; quản lý liên lạc không bắt buộc; và khiếu nại với cơ quan bảo vệ dữ liệu có thẩm quyền.",
          "Bạn có thể tự cập nhật một số thông tin và tùy chọn trong tài khoản. Với yêu cầu khác, hãy dùng trang Liên hệ hoặc kênh Hỗ trợ được công bố trên Link4Sub. Chúng tôi có thể cần xác minh danh tính, làm rõ phạm vi yêu cầu và sẽ phản hồi trong thời hạn luật áp dụng quy định. Một số quyền có ngoại lệ để bảo vệ người khác, tuân thủ pháp luật hoặc giải quyết khiếu nại.",
          "Link4Sub không phân biệt đối xử vì bạn thực hiện quyền riêng tư hợp pháp. Bạn có thể chỉ định người đại diện khi pháp luật cho phép và chúng tôi có thể yêu cầu bằng chứng về thẩm quyền đại diện.",
        ],
      },
      {
        heading: "13. Phân tích tự động và chống gian lận",
        paragraphs: [
          "Link4Sub có thể tự động phân tích địa chỉ IP, thiết bị, tần suất, nguồn truy cập và mẫu tương tác để nhận diện bot, lượt truy cập trùng lặp hoặc lưu lượng không hợp lệ. Kết quả có thể ảnh hưởng tới việc ghi nhận analytics, doanh thu, quyền truy cập hoặc yêu cầu xem xét.",
          "Khi pháp luật áp dụng trao cho bạn quyền liên quan đến quyết định tự động có ảnh hưởng đáng kể, bạn có thể liên hệ Hỗ trợ để yêu cầu thông tin, trình bày ý kiến hoặc đề nghị xem xét bởi con người, tùy các giới hạn hợp pháp.",
        ],
      },
      {
        heading: "14. Trẻ em",
        paragraphs: [
          "Link4Sub không hướng tới trẻ em chưa đủ độ tuổi tự mình đồng ý sử dụng dịch vụ số theo pháp luật nơi các em sinh sống. Người giám hộ phải giám sát và cung cấp chấp thuận khi cần. Nếu bạn tin rằng một trẻ em đã cung cấp dữ liệu không phù hợp, hãy liên hệ Hỗ trợ để chúng tôi xem xét và thực hiện biện pháp cần thiết.",
        ],
      },
      {
        heading: "15. Dịch vụ và liên kết bên thứ ba",
        paragraphs: [
          "Link4Sub cho phép người dùng tạo liên kết tới website, mạng xã hội, tệp và dịch vụ bên ngoài. Chúng tôi không kiểm soát cách các bên đó thu thập hoặc sử dụng dữ liệu. Hãy xem chính sách quyền riêng tư của họ trước khi cung cấp thông tin hoặc hoàn thành một hành động.",
        ],
      },
      {
        heading: "16. Thay đổi và liên hệ",
        paragraphs: [
          "Chúng tôi có thể cập nhật chính sách này để phản ánh thay đổi của sản phẩm, nhà cung cấp hoặc pháp luật. Bản mới sẽ hiển thị ngày cập nhật; thay đổi quan trọng sẽ được thông báo bằng phương thức phù hợp trước hoặc khi có hiệu lực theo yêu cầu pháp luật.",
          "Nếu có câu hỏi, yêu cầu thực hiện quyền, khiếu nại hoặc thông báo sự cố quyền riêng tư, vui lòng dùng trang Liên hệ hoặc kênh Hỗ trợ được công bố trên Link4Sub. Thông tin pháp lý và liên hệ hiện hành của đơn vị vận hành được thể hiện tại các kênh đó.",
        ],
      },
    ],
  },
  {
    slug: "privacy-en",
    title: "Privacy Policy",
    excerpt:
      "How Link4Sub collects, uses, shares and protects data when you manage, share or visit links.",
    seoTitle: "Privacy Policy | Link4Sub",
    seoDescription:
      "Learn how Link4Sub handles account, content, visit, payout and support data.",
    updatedLabel: "Last updated",
    updatedDate: "August 15, 2026",
    introduction: [
      "This Privacy Policy explains how Link4Sub collects, uses, stores and shares personal data when you use our websites, applications, public link pages and related features.",
      "In this Policy, “Link4Sub,” “we,” “us” and “our” refer to the operator of the Link4Sub service. “You” includes account holders, visitors to public links and people who contact us.",
      "Plain-language summary: Link4Sub processes data needed to operate accounts and links, provide analytics, protect the platform, support users and process withdrawals when you use that feature. We do not sell personal data for money.",
    ],
    sections: [
      {
        heading: "1. Scope and roles",
        paragraphs: [
          "This Policy applies to data Link4Sub processes while providing the Service. When Link4Sub determines why and how data is processed, Link4Sub acts as the data controller or equivalent responsible party under applicable law.",
          "If you use Link4Sub to send people to a website, social network or form controlled by you or a third party, you are responsible for the privacy notice and legal basis for processing that occurs outside Link4Sub.",
        ],
      },
      {
        heading: "2. Data we collect",
        bullets: [
          "Account and profile data: name, email address, avatar, email-verification status, referral code, roles, permissions and account preferences.",
          "Authentication and security data: hashed password, sign-in method, social sign-in account identifier, sessions, IP address, user-agent string, password-reset tokens and email-verification tokens.",
          "Content and configuration: slugs, titles, descriptions, destination URLs, social actions, link profile pages, snippets, uploaded files, images, appearance settings, expiration dates and link status.",
          "Usage and analytics data: access time, link visited, views or completions, referrer, country inferred from the connection, device type, browser, operating system and signals used to detect invalid traffic.",
          "Financial and payout data: balance, earnings, currency, withdrawal history, fees, transaction status and recipient details you save for a payout method, such as bank, account name, account number, wallet number or blockchain network.",
          "Support and moderation data: ticket content, messages, attachments and technical information you submit; and the email address, URL, reason and details in a link report.",
          "Communications data: email preferences, transactional or update emails sent to you, and delivery, opening, click, bounce or complaint events returned by email infrastructure.",
        ],
      },
      {
        heading: "3. Sources of data",
        paragraphs: [
          "We receive data directly from you when you register, create or edit content, upload files, configure payout details, request support or report a link. We also automatically receive technical data when a browser or device interacts with the Service.",
          "If you sign in with Google, we receive the information needed for sign-in that you authorize Google to provide, such as an account identifier, verified email address, name and avatar. Google handles data under its own policies.",
          "Some data may come from infrastructure, email, storage or security providers, or from an account holder who invited or referred you, only as needed to provide the relevant feature.",
        ],
      },
      {
        heading: "4. How we use data",
        bullets: [
          "Create and administer accounts, authenticate sign-ins, maintain sessions and restore access.",
          "Create, store, publish, redirect and manage links, profile pages, unlock actions, snippets and files.",
          "Record visits, provide analytics and calculate metrics displayed to account holders.",
          "Detect bots, spam, fraud, unusual access, invalid traffic and violations; investigate reports and protect users.",
          "Administer balances, commissions, recipient information and withdrawal requests when those features are used.",
          "Respond to support requests and send security, verification, transactional and opted-in update messages.",
          "Operate, troubleshoot, test, measure and improve Link4Sub's reliability, usability and performance.",
          "Comply with legal duties and valid authority requests, and protect the rights, property or legitimate interests of Link4Sub and others.",
        ],
      },
      {
        heading: "5. Legal bases",
        paragraphs: [
          "Depending on where you live and the activity involved, we process data to perform our agreement with you; with your consent; to comply with legal obligations; or for legitimate interests such as security, fraud prevention, support and product improvement after considering your rights.",
          "Where processing relies on consent, you may withdraw consent for the future. Withdrawal does not make earlier lawful processing unlawful and may prevent a feature from working.",
        ],
      },
      {
        heading: "6. Public content and creator analytics",
        paragraphs: [
          "Content you publish—including your display name, image, description, links, profile pages and shared resources—may be available to anyone with the URL and may be indexed by search engines depending on configuration. Do not publish sensitive information you do not want others to view or reshare.",
          "Link owners may receive aggregated visit analytics such as view or completion counts, country, device, browser and referrer. Link4Sub uses more detailed network and device identifiers internally for security, deduplication and traffic assessment; they are available only to authorized people where administration or an investigation requires them.",
        ],
      },
      {
        heading: "7. Cookies and device storage",
        paragraphs: [
          "Link4Sub uses cookies and similar storage needed to maintain sign-in, refresh sessions, protect requests, remember language and retain interface state. You can block or delete cookies in your browser, but sign-in and some preferences may stop working correctly.",
          "If Link4Sub introduces non-essential cookies in the future, we will update our notice and provide choices where required by law.",
        ],
      },
      {
        heading: "8. When data is shared",
        paragraphs: [
          "We share data only as needed with providers that help operate hosting, cloud infrastructure, email delivery, authentication, security, error monitoring and file handling. Those providers may process data only under appropriate instructions and confidentiality duties for their role.",
          "Data may also be shared with authorized administrators or personnel; with authorities in response to a valid request; to investigate fraud, abuse or incidents; to protect rights and safety; or during a reorganization, merger or transfer of the Service, with suitable safeguards.",
          "When you choose to open a third-party link, use another provider to sign in, or send assets to a bank or blockchain address, necessary data goes to that party and is governed by its own policy.",
        ],
      },
      {
        heading: "9. International data transfers",
        paragraphs: [
          "Link4Sub and its providers may process data in countries other than where you live. Where required, we use appropriate transfer mechanisms, contractual commitments and safeguards and fulfill duties that apply to cross-border data transfers.",
        ],
      },
      {
        heading: "10. Retention",
        paragraphs: [
          "We retain data for as long as needed to provide the Service and meet the purposes described in this Policy. The specific period depends on the data category, account status, security requirements, backup cycles, disputes and legal, accounting or fraud-prevention obligations.",
          "When data is no longer needed, we delete, anonymize or isolate it under an appropriate process. Some records may be kept longer where required by law, to protect legal rights, resolve claims or prevent repeated abuse. Backup copies are removed under normal backup cycles.",
        ],
      },
      {
        heading: "11. Data security",
        paragraphs: [
          "We use technical and organizational safeguards appropriate to risk, including role-based access controls, hashed passwords and tokens, protected authentication cookies, logging, access limits, file checks and monitoring for unusual behavior.",
          "No transmission or storage method is completely secure. Use a strong, unique password, protect your devices, sign out of shared devices and contact Support promptly if you suspect compromise of your account or data.",
        ],
      },
      {
        heading: "12. Your rights and choices",
        paragraphs: [
          "Depending on applicable law, you may request information about or access to data; correction of inaccurate data; deletion; restriction of or objection to certain processing; a portable copy; withdrawal of consent; management of optional communications; and the ability to complain to a competent data protection authority.",
          "You can update some information and preferences in your account. For other requests, use the Contact page or Support channel published on Link4Sub. We may need to verify your identity and clarify the scope, and we will respond within the period required by applicable law. Exceptions may apply to protect others, comply with law or resolve claims.",
          "Link4Sub will not discriminate against you for exercising a lawful privacy right. You may use an authorized agent where the law permits, and we may request proof of that authority.",
        ],
      },
      {
        heading: "13. Automated analysis and fraud prevention",
        paragraphs: [
          "Link4Sub may automatically analyze IP address, device, frequency, referrer and interaction patterns to identify bots, duplicate visits or invalid traffic. Results may affect analytics attribution, earnings, access or whether an event is sent for review.",
          "Where applicable law gives you rights concerning a solely automated decision with significant effects, you may contact Support to request information, express your view or seek human review, subject to lawful limitations.",
        ],
      },
      {
        heading: "14. Children",
        paragraphs: [
          "Link4Sub is not directed to children below the age at which they may independently consent to a digital service under the law where they live. A guardian must supervise and provide authorization where required. If you believe a child provided data inappropriately, contact Support so we can review and take appropriate action.",
        ],
      },
      {
        heading: "15. Third-party services and links",
        paragraphs: [
          "Link4Sub lets users create links to external websites, social networks, files and services. We do not control how those parties collect or use data. Review their privacy policies before providing information or completing an action.",
        ],
      },
      {
        heading: "16. Changes and contact",
        paragraphs: [
          "We may update this Policy to reflect changes to the product, providers or law. The new version will show its updated date, and material changes will be communicated appropriately before or when they take effect as required by law.",
          "For questions, rights requests, complaints or notice of a privacy incident, use the Contact page or Support channel published on Link4Sub. Current legal and contact details for the operator are provided through those channels.",
        ],
      },
    ],
  },
  {
    slug: "privacy-id",
    title: "Kebijakan Privasi",
    excerpt:
      "Cara Link4Sub mengumpulkan, menggunakan, membagikan, dan melindungi data saat Anda mengelola, membagikan, atau mengunjungi tautan.",
    seoTitle: "Kebijakan Privasi | Link4Sub",
    seoDescription:
      "Pelajari cara Link4Sub menangani data akun, konten, kunjungan, pencairan, dan dukungan.",
    updatedLabel: "Terakhir diperbarui",
    updatedDate: "15 Agustus 2026",
    introduction: [
      "Kebijakan Privasi ini menjelaskan cara Link4Sub mengumpulkan, menggunakan, menyimpan, dan membagikan data pribadi saat Anda menggunakan situs web, aplikasi, halaman tautan publik, dan fitur terkait.",
      "Dalam Kebijakan ini, “Link4Sub”, “kami”, dan “milik kami” merujuk pada pengelola layanan Link4Sub. “Anda” mencakup pemilik akun, pengunjung tautan publik, dan orang yang menghubungi kami.",
      "Ringkasan sederhana: Link4Sub memproses data yang diperlukan untuk mengoperasikan akun dan tautan, menyediakan analitik, melindungi platform, mendukung pengguna, dan memproses pencairan saat Anda menggunakan fitur tersebut. Kami tidak menjual data pribadi untuk memperoleh uang.",
    ],
    sections: [
      {
        heading: "1. Cakupan dan peran",
        paragraphs: [
          "Kebijakan ini berlaku untuk data yang diproses Link4Sub saat menyediakan Layanan. Ketika Link4Sub menentukan alasan dan cara pemrosesan, Link4Sub bertindak sebagai pengendali data atau pihak bertanggung jawab yang setara menurut hukum yang berlaku.",
          "Jika Anda menggunakan Link4Sub untuk mengarahkan orang ke situs, jejaring sosial, atau formulir yang dikendalikan oleh Anda atau pihak ketiga, Anda bertanggung jawab atas pemberitahuan privasi dan dasar hukum pemrosesan yang berlangsung di luar Link4Sub.",
        ],
      },
      {
        heading: "2. Data yang kami kumpulkan",
        bullets: [
          "Data akun dan profil: nama, alamat email, avatar, status verifikasi email, kode rujukan, peran, izin, dan preferensi akun.",
          "Data autentikasi dan keamanan: kata sandi yang di-hash, metode masuk, pengenal akun login sosial, sesi, alamat IP, string user-agent, token pengaturan ulang kata sandi, dan token verifikasi email.",
          "Konten dan konfigurasi: slug, judul, deskripsi, URL tujuan, tindakan sosial, halaman profil tautan, cuplikan, file unggahan, gambar, pengaturan tampilan, tanggal kedaluwarsa, dan status tautan.",
          "Data penggunaan dan analitik: waktu akses, tautan yang dikunjungi, tayangan atau penyelesaian, perujuk, negara yang diperkirakan dari koneksi, jenis perangkat, browser, sistem operasi, dan sinyal untuk mendeteksi trafik tidak valid.",
          "Data keuangan dan pencairan: saldo, pendapatan, mata uang, riwayat pencairan, biaya, status transaksi, dan detail penerima yang Anda simpan untuk metode pencairan seperti bank, nama rekening, nomor rekening, nomor dompet, atau jaringan blockchain.",
          "Data dukungan dan moderasi: isi tiket, pesan, lampiran, dan informasi teknis yang Anda kirim; serta alamat email, URL, alasan, dan detail dalam laporan tautan.",
          "Data komunikasi: preferensi email, email transaksional atau pembaruan yang dikirim, serta peristiwa pengiriman, pembukaan, klik, pantulan, atau keluhan dari infrastruktur email.",
        ],
      },
      {
        heading: "3. Sumber data",
        paragraphs: [
          "Kami menerima data langsung dari Anda saat Anda mendaftar, membuat atau mengedit konten, mengunggah file, mengatur detail pencairan, meminta dukungan, atau melaporkan tautan. Kami juga otomatis menerima data teknis ketika browser atau perangkat berinteraksi dengan Layanan.",
          "Jika Anda masuk dengan Google, kami menerima informasi yang diperlukan untuk login dan Anda izinkan Google berikan, seperti pengenal akun, alamat email terverifikasi, nama, dan avatar. Google menangani data berdasarkan kebijakannya sendiri.",
          "Sebagian data dapat berasal dari penyedia infrastruktur, email, penyimpanan, atau keamanan, maupun dari pemilik akun yang mengundang atau merujuk Anda, sebatas yang diperlukan untuk menyediakan fitur terkait.",
        ],
      },
      {
        heading: "4. Cara kami menggunakan data",
        bullets: [
          "Membuat dan mengelola akun, mengautentikasi login, mempertahankan sesi, dan memulihkan akses.",
          "Membuat, menyimpan, menerbitkan, mengalihkan, dan mengelola tautan, halaman profil, tindakan pembuka, cuplikan, dan file.",
          "Mencatat kunjungan, menyediakan analitik, dan menghitung metrik yang ditampilkan kepada pemilik akun.",
          "Mendeteksi bot, spam, penipuan, akses tidak biasa, trafik tidak valid, dan pelanggaran; menyelidiki laporan dan melindungi pengguna.",
          "Mengelola saldo, komisi, informasi penerima, dan permintaan pencairan saat fitur tersebut digunakan.",
          "Menanggapi dukungan serta mengirim pesan keamanan, verifikasi, transaksi, dan pembaruan yang Anda pilih.",
          "Mengoperasikan, memecahkan masalah, menguji, mengukur, dan meningkatkan keandalan, kegunaan, serta kinerja Link4Sub.",
          "Mematuhi kewajiban hukum dan permintaan sah dari otoritas, serta melindungi hak, properti, atau kepentingan sah Link4Sub dan pihak lain.",
        ],
      },
      {
        heading: "5. Dasar hukum",
        paragraphs: [
          "Bergantung pada tempat tinggal dan aktivitas terkait, kami memproses data untuk melaksanakan perjanjian dengan Anda; berdasarkan persetujuan; untuk memenuhi kewajiban hukum; atau untuk kepentingan sah seperti keamanan, pencegahan penipuan, dukungan, dan peningkatan produk setelah mempertimbangkan hak Anda.",
          "Jika pemrosesan didasarkan pada persetujuan, Anda dapat menarik persetujuan untuk masa mendatang. Penarikan tidak membatalkan pemrosesan sah sebelumnya dan dapat menyebabkan suatu fitur tidak lagi berfungsi.",
        ],
      },
      {
        heading: "6. Konten publik dan analitik kreator",
        paragraphs: [
          "Konten yang Anda terbitkan—termasuk nama tampilan, gambar, deskripsi, tautan, halaman profil, dan sumber daya bersama—dapat diakses oleh siapa pun yang memiliki URL dan dapat diindeks mesin pencari tergantung konfigurasi. Jangan terbitkan informasi sensitif yang tidak ingin Anda lihat atau bagikan ulang oleh orang lain.",
          "Pemilik tautan dapat menerima analitik kunjungan teragregasi seperti jumlah tayangan atau penyelesaian, negara, perangkat, browser, dan perujuk. Link4Sub menggunakan pengenal jaringan dan perangkat yang lebih rinci secara internal untuk keamanan, deduplikasi, dan penilaian trafik; data tersebut hanya tersedia bagi pihak berwenang ketika administrasi atau penyelidikan memerlukannya.",
        ],
      },
      {
        heading: "7. Cookie dan penyimpanan perangkat",
        paragraphs: [
          "Link4Sub menggunakan cookie dan penyimpanan serupa yang diperlukan untuk mempertahankan login, memperbarui sesi, melindungi permintaan, mengingat bahasa, dan menyimpan keadaan antarmuka. Anda dapat memblokir atau menghapus cookie di browser, tetapi login dan beberapa preferensi mungkin tidak berfungsi dengan benar.",
          "Jika Link4Sub menambahkan cookie non-esensial di masa mendatang, kami akan memperbarui pemberitahuan dan menyediakan pilihan jika diwajibkan hukum.",
        ],
      },
      {
        heading: "8. Kapan data dibagikan",
        paragraphs: [
          "Kami hanya membagikan data jika diperlukan kepada penyedia yang membantu menjalankan hosting, infrastruktur cloud, pengiriman email, autentikasi, keamanan, pemantauan kesalahan, dan penanganan file. Penyedia tersebut hanya boleh memproses data berdasarkan instruksi dan kewajiban kerahasiaan yang sesuai dengan perannya.",
          "Data juga dapat dibagikan kepada administrator atau personel berwenang; kepada otoritas berdasarkan permintaan yang sah; untuk menyelidiki penipuan, penyalahgunaan, atau insiden; untuk melindungi hak dan keselamatan; atau dalam reorganisasi, merger, maupun pengalihan Layanan dengan perlindungan yang sesuai.",
          "Saat Anda memilih membuka tautan pihak ketiga, memakai penyedia lain untuk login, atau mengirim aset ke alamat bank maupun blockchain, data yang diperlukan akan diteruskan kepada pihak tersebut dan tunduk pada kebijakan mereka sendiri.",
        ],
      },
      {
        heading: "9. Transfer data internasional",
        paragraphs: [
          "Link4Sub dan penyedianya dapat memproses data di negara selain tempat tinggal Anda. Jika diwajibkan, kami menggunakan mekanisme transfer, komitmen kontraktual, dan perlindungan yang sesuai serta memenuhi kewajiban yang berlaku untuk transfer data lintas batas.",
        ],
      },
      {
        heading: "10. Retensi",
        paragraphs: [
          "Kami menyimpan data selama diperlukan untuk menyediakan Layanan dan memenuhi tujuan dalam Kebijakan ini. Jangka waktu tertentu bergantung pada kategori data, status akun, kebutuhan keamanan, siklus cadangan, sengketa, serta kewajiban hukum, akuntansi, atau pencegahan penipuan.",
          "Ketika data tidak lagi diperlukan, kami menghapus, menganonimkan, atau mengisolasinya melalui proses yang sesuai. Catatan tertentu dapat disimpan lebih lama jika diwajibkan hukum, untuk melindungi hak hukum, menyelesaikan klaim, atau mencegah penyalahgunaan berulang. Salinan cadangan dihapus sesuai siklus cadangan normal.",
        ],
      },
      {
        heading: "11. Keamanan data",
        paragraphs: [
          "Kami menerapkan perlindungan teknis dan organisasi yang sesuai dengan risiko, termasuk kontrol akses berbasis peran, kata sandi dan token yang di-hash, cookie autentikasi terlindungi, pencatatan, pembatasan akses, pemeriksaan file, dan pemantauan perilaku tidak biasa.",
          "Tidak ada metode transmisi atau penyimpanan yang sepenuhnya aman. Gunakan kata sandi yang kuat dan unik, lindungi perangkat Anda, keluar dari perangkat bersama, dan segera hubungi Dukungan jika mencurigai akun atau data telah disusupi.",
        ],
      },
      {
        heading: "12. Hak dan pilihan Anda",
        paragraphs: [
          "Bergantung pada hukum yang berlaku, Anda dapat meminta informasi atau akses data; koreksi data tidak akurat; penghapusan; pembatasan atau keberatan terhadap pemrosesan tertentu; salinan portabel; penarikan persetujuan; pengelolaan komunikasi opsional; dan mengajukan keluhan kepada otoritas perlindungan data yang berwenang.",
          "Anda dapat memperbarui sebagian informasi dan preferensi di akun. Untuk permintaan lain, gunakan halaman Kontak atau kanal Dukungan yang dipublikasikan di Link4Sub. Kami mungkin perlu memverifikasi identitas dan memperjelas cakupan, lalu akan merespons dalam batas waktu hukum yang berlaku. Pengecualian dapat berlaku untuk melindungi pihak lain, mematuhi hukum, atau menyelesaikan klaim.",
          "Link4Sub tidak akan mendiskriminasi Anda karena menggunakan hak privasi yang sah. Anda dapat menunjuk agen berwenang jika hukum mengizinkan, dan kami dapat meminta bukti kewenangan tersebut.",
        ],
      },
      {
        heading: "13. Analisis otomatis dan pencegahan penipuan",
        paragraphs: [
          "Link4Sub dapat secara otomatis menganalisis alamat IP, perangkat, frekuensi, perujuk, dan pola interaksi untuk mengenali bot, kunjungan ganda, atau trafik tidak valid. Hasilnya dapat memengaruhi atribusi analitik, pendapatan, akses, atau apakah suatu peristiwa dikirim untuk ditinjau.",
          "Jika hukum yang berlaku memberi Anda hak terkait keputusan otomatis yang berdampak signifikan, Anda dapat menghubungi Dukungan untuk meminta informasi, menyampaikan pandangan, atau meminta peninjauan manusia, dengan tunduk pada batasan hukum.",
        ],
      },
      {
        heading: "14. Anak-anak",
        paragraphs: [
          "Link4Sub tidak ditujukan kepada anak di bawah usia yang dapat memberikan persetujuan mandiri untuk layanan digital berdasarkan hukum tempat tinggal mereka. Wali harus mengawasi dan memberi izin jika diperlukan. Jika Anda yakin seorang anak memberikan data secara tidak semestinya, hubungi Dukungan agar kami dapat meninjau dan mengambil tindakan yang tepat.",
        ],
      },
      {
        heading: "15. Layanan dan tautan pihak ketiga",
        paragraphs: [
          "Link4Sub memungkinkan pengguna membuat tautan ke situs web, jejaring sosial, file, dan layanan eksternal. Kami tidak mengendalikan cara pihak tersebut mengumpulkan atau menggunakan data. Tinjau kebijakan privasi mereka sebelum memberikan informasi atau menyelesaikan suatu tindakan.",
        ],
      },
      {
        heading: "16. Perubahan dan kontak",
        paragraphs: [
          "Kami dapat memperbarui Kebijakan ini untuk mencerminkan perubahan produk, penyedia, atau hukum. Versi baru akan menampilkan tanggal pembaruan, dan perubahan material akan diberitahukan secara semestinya sebelum atau saat berlaku sesuai kewajiban hukum.",
          "Untuk pertanyaan, permintaan hak, keluhan, atau pemberitahuan insiden privasi, gunakan halaman Kontak atau kanal Dukungan yang dipublikasikan di Link4Sub. Informasi hukum dan kontak terkini dari pengelola tersedia melalui kanal tersebut.",
        ],
      },
    ],
  },
];

export const defaultPrivacyPages = privacyPages.map((page) => ({
  slug: page.slug,
  title: page.title,
  excerpt: page.excerpt,
  seoTitle: page.seoTitle,
  seoDescription: page.seoDescription,
  seoKeywords: "Link4Sub, privacy policy, data protection, cookies, analytics",
  contentJson: JSON.stringify(toTiptapDocument(page)),
  contentHtml: toHtml(page),
}));

function toTiptapDocument(page: PrivacyPageCopy) {
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

function toHtml(page: PrivacyPageCopy) {
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
