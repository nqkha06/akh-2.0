# Link4Sub Public Renderer

Custom WordPress plugin that renders the current Link4Sub/STU public-link experience at:

```text
/l/{slug}
```

The plugin does not contain link business rules. It calls the existing Link4Sub public APIs from PHP:

- `POST /api/links/{slug}/visit`
- `POST /api/links/{slug}/visit/{visitToken}/complete`
- `GET /api/files/link/{slug}/download`
- `GET /api/files/link/{slug}/cover`
- `GET /api/files/link/{slug}/background`

The first two endpoints and their response fields are the endpoints already consumed by the Next.js public page. The media endpoints are narrow adapters for appearance media that was previously returned as an authenticated member preview URL.

## Local configuration

Set these constants in `wp-config.php`, or use the included Docker Compose file:

```php
define('LINK4SUB_API_BASE_URL', 'http://host.docker.internal:4000/api');
define('LINK4SUB_PUBLIC_API_BASE_URL', 'http://localhost:4000/api');
define('LINK4SUB_APP_BASE_URL', 'http://localhost:3000');
define('LINK4SUB_BRAND_NAME', 'Link4Sub');
```

`LINK4SUB_API_BASE_URL` is server-only. `LINK4SUB_PUBLIC_API_BASE_URL` is the browser-reachable Public API and media base URL. The public visit endpoint requires no application credential; never put a private API token in this setting. In random-post mode the browser receives only the Public API's one-time `visitToken`, immediately exchanges it through the signed WordPress flow, and uses the resulting random `visit_ref` for completion and Smartlink callbacks.

The API CORS allowlist must include the WordPress origin. For local development: `FRONTEND_ORIGIN="http://localhost:3000,http://localhost:3100"`.

## Run locally

The repository contains the official WordPress 7.1 stable source in `wordpress/`.

```bash
docker compose -f docker-compose.wordpress.yml up -d wordpress
docker compose -f docker-compose.wordpress.yml --profile tools run --rm wpcli \
  core install --url=http://localhost:3100 --title=Link4Sub \
  --admin_user=link4sub-admin --admin_password='<local-password>' \
  --admin_email=dev@example.test --skip-email
docker compose -f docker-compose.wordpress.yml --profile tools run --rm wpcli \
  plugin activate link4sub
docker compose -f docker-compose.wordpress.yml --profile tools run --rm wpcli \
  rewrite structure '/%postname%/' --hard
```

WordPress defaults to port `3100`; the Link4Sub Next.js app remains on port `3000` and the API remains on port `4000`.

## Admin configuration

Open **WP Admin → Link4Sub** (or `/wp-admin/admin.php?page=link4sub-settings`). The plugin provides four tabs:

- **Cấu hình chung:** server-side API URL, public media URL, app URL, API timeout, brand name and dynamic route prefix.
- **Kiểu hiển thị:** chọn renderer STU gốc hoặc Safe Redirect qua bài viết WordPress ngẫu nhiên; cấu hình post pool, category, cache, cookie, delay và fullscreen/modal.
- **Banner:** content, image, two CTAs, four display styles, placement, dismiss behavior, mobile visibility, slug include/exclude targeting and start/end scheduling.
- **Appearance:** brand colors, light/dark backgrounds, card radius, content width, surface/background opacity, logo, default theme, font, header/footer visibility and compact actions.

Quảng cáo kiếm tiền được cấu hình tập trung trong **Link4Sub Admin → Monetization Levels → Ads**. WordPress gửi ngữ cảnh trang (site key, kiểu hiển thị, post type, category/ngách và locale) trong request server-to-server; API chọn smartlink, banner hoặc script adapter theo country, device, OS, browser và ngữ cảnh nội dung. WordPress chỉ render kết quả đã chọn, không lưu rule kinh doanh và không ghi lịch sử quảng cáo đã xuất hiện.

Smartlink hỗ trợ hai placement độc lập: `Unlock redirect` và `Popunder`. Với Unlock redirect, khi visitor bấm destination ở bước cuối, destination thật vẫn mở bằng tab mới (`target="_blank"`); tab STU cũ đếm ngược rồi chuyển tới Smartlink. Với Popunder, Smartlink được mở từ tương tác hợp lệ đầu tiên và frontend cố gắng giữ focus ở trang STU. Cả hai placement dùng chung weight, cap, cooldown, lịch chạy, targeting và callback monetization hiện tại.

Có thể cấu hình nhiều campaign quảng cáo trong cùng một Monetization Level và nhiều Smartlink bên trong từng campaign. Resolver giữ nguyên targeting/priority ở campaign, sau đó loại từng Smartlink bị tắt, ngoài lịch, đạt cap hoặc cooldown trước khi weighted rotation. Mỗi Smartlink có URL, trạng thái, weight, thứ tự và có thể override riêng redirect/frequency/lịch chạy; dữ liệu `targetUrl` một-link cũ vẫn được hỗ trợ để tương thích ngược.

Tab `Cấu hình Show` của Monetization Level dùng `metaData.stepCount` làm số page STU. Public API chỉ trả `showConfig.pageCount`; renderer chia action cân bằng và ưu tiên phần dư cho page trước (5 action / 2 page thành 3 + 2). Nút destination ở các page trung gian chỉ chuyển page, không complete visit và không chạy Smartlink; destination/Smartlink chỉ hoạt động ở page cuối.

Trong chế độ `random_post`, mỗi page STU được hiển thị trên một bài viết WordPress khác với page ngay trước đó. Flow page được ký trong cookie HttpOnly và chỉ cho phép đi tuần tự. Bài viết render trước mà không chờ API; loader phía client mới gọi Public API, sau đó hydrate STU qua REST nội bộ. Payload được giữ trong `sessionStorage` theo flow và view/visit reference được giữ trong transient để không tạo visit mới cho từng page.

Header của Safe Overlay có nút chuyển Light/Dark thay cho nhãn Safe Redirect. Lựa chọn được lưu chung trong `localStorage` với renderer gốc và ưu tiên hơn `Theme mặc định` trong tab Appearance.

Tab **Ngôn ngữ** quản lý bộ text cho cả renderer STU gốc và Safe Overlay. Plugin cung cấp sẵn `languages/vi.php` và `languages/en.php`, không phụ thuộc locale/translation của WordPress. Admin có thể sửa bản dịch, chọn mặc định, bật/tắt, xoá hoặc thêm ngôn ngữ; ngôn ngữ mới tự nhận toàn bộ schema text tiếng Việt. WordPress option chỉ lưu override, ngôn ngữ custom và trạng thái disabled. Visitor chọn ngôn ngữ từ button trên header; lựa chọn được giữ trong `localStorage` khi chuyển page hoặc đổi renderer.

Safe Overlay dùng chung cấu hình `Hiện liên kết footer` trong tab Appearance với renderer gốc. Footer gồm liên kết tạo Social Link và báo cáo link, hỗ trợ Light/Dark, mobile và bộ dịch đang được visitor chọn.

Khối **Bạn có thể thích** hiển thị sau STU và trước footer trên cả hai renderer. Danh sách lấy từ `relatedLinks` của Public API: tối đa ba link public còn hiệu lực thuộc cùng member, không dùng fixture WordPress. Card dẫn qua route WordPress `/l/{slug}` và tiếp tục tuân theo delivery mode hiện tại. Section hỗ trợ Light/Dark, mobile và toàn bộ hệ thống đa ngôn ngữ của plugin.

- `Priority`: tầng ưu tiên; link priority thấp hơn là fallback khi tầng cao không còn link hợp lệ.
- `Weight`: tỷ trọng traffic tương đối giữa các link cùng priority và cùng khớp targeting.
- Giới hạn mỗi phiên và mỗi visitor trong cửa sổ 1–720 giờ; đặt `0` để không giới hạn.
- Cooldown 0–10.080 phút giữa hai lần chuyển cùng Smartlink.
- Thời điểm bắt đầu/kết thúc và thời gian chờ trước redirect.

Frequency state chỉ lưu trong hai first-party cookie được giới hạn kích thước: một session cookie và một cookie lịch sử 31 ngày. Client loader gửi trạng thái này vào Public API khi tải STU. Hệ thống không tạo impression log hay model mới; visitor xoá/chặn cookie sẽ làm cap bắt đầu lại.

Mỗi WordPress site nên đặt một `Site key` ổn định trong tab **Cấu hình chung**. Giá trị mặc định là `wordpress-main` và có thể dùng để target hoặc loại trừ campaign theo từng site.

Banner dismissal is stored per banner version in the visitor's browser. Changing banner configuration generates a new version automatically, so a revised campaign can be shown again. Settings are sanitized by WordPress before storage and take effect on the next public request.

### Safe Redirect mode

When **Bài viết ngẫu nhiên** is selected, `/l/{slug}` redirects to `/safe/?alias={slug}`. The safe entry selects a random published post from a cached ID pool, stores the complete flow in an HMAC-signed, HttpOnly, SameSite cookie, adds a readable alias/flow/post marker, and returns a 302 to the clean post permalink. The post HTML is delivered without waiting for Link4Sub. After `DOMContentLoaded`, the lightweight client loader calls the main Public API, posts the response to the same-origin hydrate endpoint, and injects the complete STU plus related-member links. PHP validates the signed cookie before rendering or accepting a visit reference.

A tiny inline guard is emitted at the start of `<head>`. It activates only when the readable flow marker matches the current post, applies the saved Light/Dark preference, and displays a full-page branded boot screen before the theme can paint. The boot screen remains until the hydrated overlay and its assets are ready, respects the configured render delay, and has a 20-second fail-safe so an unavailable API never leaves the article permanently covered.

## Runtime states

- Active: full STU renderer with cover/background, actions, countdown, persisted progress, destination unlock, theme and share controls.
- Missing: HTTP 404 status page.
- Blocked/violated: HTTP 403 status page.
- Deleted/expired/inactive: HTTP 410 status page.
- Timeout, invalid JSON or upstream failure: HTTP 502 status page.
- Page initialization and action completion have explicit loading indicators.
