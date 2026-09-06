<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Link4Sub_Admin_Settings
{
    private Link4Sub_Settings $settings;

    public function __construct(Link4Sub_Settings $settings)
    {
        $this->settings = $settings;
    }

    public function register(): void
    {
        add_action('admin_menu', array($this, 'add_menu'));
        add_action('admin_init', array($this, 'register_setting'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('update_option_' . Link4Sub_Settings::OPTION_NAME, array($this, 'maybe_flush_rewrite'), 10, 2);
    }

    public function add_menu(): void
    {
        add_menu_page(
            'Link4Sub',
            'Link4Sub',
            'manage_options',
            'link4sub-settings',
            array($this, 'render_page'),
            'dashicons-admin-links',
            58
        );
    }

    public function register_setting(): void
    {
        register_setting('link4sub_settings_group', Link4Sub_Settings::OPTION_NAME, array(
            'type' => 'array',
            'sanitize_callback' => array($this->settings, 'sanitize'),
            'default' => $this->settings->defaults(),
        ));
    }

    public function enqueue_assets(string $hook): void
    {
        if ($hook !== 'toplevel_page_link4sub-settings') return;
        wp_enqueue_media();
        wp_enqueue_style(
            'link4sub-admin',
            LINK4SUB_PLUGIN_URL . 'assets/css/admin-settings.css',
            array(),
            LINK4SUB_PLUGIN_VERSION
        );
        wp_enqueue_style(
            'link4sub-admin-safe',
            LINK4SUB_PLUGIN_URL . 'assets/css/admin-safe.css',
            array('link4sub-admin'),
            LINK4SUB_PLUGIN_VERSION
        );
        wp_enqueue_style(
            'link4sub-admin-languages',
            LINK4SUB_PLUGIN_URL . 'assets/css/admin-languages.css',
            array('link4sub-admin'),
            LINK4SUB_PLUGIN_VERSION
        );
        wp_enqueue_script(
            'link4sub-admin',
            LINK4SUB_PLUGIN_URL . 'assets/js/admin-settings.js',
            array(),
            LINK4SUB_PLUGIN_VERSION,
            true
        );
    }

    public function maybe_flush_rewrite($old_value, $new_value): void
    {
        $old_prefix = is_array($old_value) ? ($old_value['route_prefix'] ?? 'l') : 'l';
        $new_prefix = is_array($new_value) ? ($new_value['route_prefix'] ?? 'l') : 'l';
        $old_safe = is_array($old_value) ? ($old_value['safe_route'] ?? 'safe') : 'safe';
        $new_safe = is_array($new_value) ? ($new_value['safe_route'] ?? 'safe') : 'safe';
        if ($old_prefix !== $new_prefix || $old_safe !== $new_safe) {
            flush_rewrite_rules(false);
        }
    }

    public function render_page(): void
    {
        if (!current_user_can('manage_options')) return;
        $tab = isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'general';
        if (!in_array($tab, array('general', 'safe', 'banner', 'appearance', 'languages'), true)) $tab = 'general';
        $values = $this->settings->all();
        ?>
        <div class="wrap l4s-admin">
            <div class="l4s-admin-hero">
                <div><span class="l4s-admin-mark">L</span></div>
                <div class="l4s-admin-hero-copy">
                    <p>LINK4SUB WORDPRESS CLIENT</p>
                    <h1>Cấu hình trang STU công khai</h1>
                    <span>Quản lý kết nối API, banner chiến dịch và giao diện cho mọi URL <code>/<?php echo esc_html($values['route_prefix']); ?>/{slug}</code>.</span>
                </div>
                <a class="button button-secondary" href="<?php echo esc_url(home_url('/' . $values['route_prefix'] . '/pkh4bd4t')); ?>" target="_blank" rel="noopener noreferrer">Mở trang mẫu ↗</a>
            </div>

            <?php settings_errors(); ?>
            <nav class="l4s-admin-tabs" aria-label="Link4Sub settings">
                <?php
                $tabs = array('general' => 'Cấu hình chung', 'safe' => 'Kiểu hiển thị', 'banner' => 'Banner', 'appearance' => 'Appearance', 'languages' => 'Ngôn ngữ');
                foreach ($tabs as $key => $label) {
                    printf(
                        '<a class="%s" href="%s">%s</a>',
                        esc_attr($tab === $key ? 'is-active' : ''),
                        esc_url(admin_url('admin.php?page=link4sub-settings&tab=' . $key)),
                        esc_html($label)
                    );
                }
                ?>
            </nav>

            <form action="options.php" method="post" class="l4s-settings-form" data-l4s-tab="<?php echo esc_attr($tab); ?>">
                <?php settings_fields('link4sub_settings_group'); ?>
                <input type="hidden" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[_tab]" value="<?php echo esc_attr($tab); ?>">
                <?php
                if ($tab === 'general') $this->render_general($values);
                if ($tab === 'safe') $this->render_safe($values);
                if ($tab === 'banner') $this->render_banner($values);
                if ($tab === 'appearance') $this->render_appearance($values);
                if ($tab === 'languages') $this->render_languages();
                ?>
                <div class="l4s-admin-savebar">
                    <span>Thay đổi được áp dụng cho lượt tải trang tiếp theo.</span>
                    <?php submit_button('Lưu cấu hình', 'primary', 'submit', false); ?>
                </div>
            </form>
        </div>
        <?php
    }

    private function render_general(array $v): void
    {
        ?>
        <div class="l4s-admin-grid">
            <section class="l4s-admin-card l4s-span-2">
                <div class="l4s-card-heading"><div><span>KẾT NỐI</span><h2>Link4Sub Public API</h2><p>PHP gọi server-to-server; URL nội bộ không được đưa vào JavaScript.</p></div><span class="l4s-status-pill">Server-side</span></div>
                <div class="l4s-fields l4s-fields-2">
                    <?php $this->url_field('api_base_url', 'API nội bộ', $v, 'Ví dụ: http://host.docker.internal:4000/api', 'Chỉ WordPress/PHP sử dụng.'); ?>
                    <?php $this->url_field('public_api_base_url', 'Public API cho trình duyệt', $v, 'Ví dụ: http://localhost:4000/api', 'Client loader dùng để lấy STU, ảnh và file. Origin WordPress phải có trong CORS của API.'); ?>
                    <?php $this->url_field('app_base_url', 'Link4Sub App URL', $v, 'Ví dụ: http://localhost:3000', 'Đích của logo, tạo link và báo cáo link.'); ?>
                    <label class="l4s-field"><span>Timeout API</span><div class="l4s-number"><input type="number" min="2" max="30" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[request_timeout]" value="<?php echo esc_attr((string) $v['request_timeout']); ?>"><em>giây</em></div><small>Giới hạn từ 2–30 giây.</small></label>
                </div>
            </section>
            <section class="l4s-admin-card">
                <div class="l4s-card-heading"><div><span>NHẬN DIỆN</span><h2>Thương hiệu</h2><p>Tên hiển thị trên header và trang trạng thái.</p></div></div>
                <label class="l4s-field"><span>Tên thương hiệu</span><input type="text" maxlength="80" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[brand_name]" value="<?php echo esc_attr($v['brand_name']); ?>"></label>
                <label class="l4s-field"><span>Site key</span><input type="text" maxlength="64" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[site_key]" value="<?php echo esc_attr($v['site_key']); ?>"><small>Dùng để match targeting theo website, ví dụ <code>wordpress-main</code>.</small></label>
            </section>
            <section class="l4s-admin-card">
                <div class="l4s-card-heading"><div><span>ROUTING</span><h2>Đường dẫn public</h2><p>Slug vẫn lấy động từ API, không hard-code từng link.</p></div></div>
                <label class="l4s-field"><span>Prefix</span><div class="l4s-prefix"><i><?php echo esc_html(home_url('/')); ?></i><input type="text" maxlength="32" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[route_prefix]" value="<?php echo esc_attr($v['route_prefix']); ?>"><b>/{slug}</b></div><small>Đổi prefix sẽ tự refresh WordPress rewrite rules.</small></label>
            </section>
        </div>
        <?php
    }

    private function render_banner(array $v): void
    {
        ?>
        <div class="l4s-admin-layout-preview">
            <div class="l4s-admin-grid">
                <section class="l4s-admin-card l4s-span-2">
                    <div class="l4s-card-heading"><div><span>TRẠNG THÁI</span><h2>Banner chiến dịch</h2><p>Hiển thị banner riêng của WordPress mà không thay đổi dữ liệu link trong Link4Sub.</p></div><?php $this->toggle('banner_enabled', 'Bật banner', $v); ?></div>
                    <div class="l4s-fields l4s-fields-3">
                        <?php $this->select('banner_style', 'Phong cách', $v, array('gradient' => 'Gradient nổi bật', 'accent' => 'Accent đậm', 'minimal' => 'Tối giản', 'glass' => 'Glass')); ?>
                        <?php $this->select('banner_position', 'Vị trí', $v, array('before_card' => 'Trước nội dung STU', 'after_card' => 'Sau nội dung STU')); ?>
                        <?php $this->select('banner_alignment', 'Căn nội dung', $v, array('left' => 'Căn trái', 'center' => 'Căn giữa')); ?>
                    </div>
                </section>
                <section class="l4s-admin-card l4s-span-2">
                    <div class="l4s-card-heading"><div><span>NỘI DUNG</span><h2>Thông điệp và CTA</h2></div></div>
                    <div class="l4s-fields l4s-fields-2">
                        <?php $this->text_field('banner_eyebrow', 'Nhãn nhỏ', $v, 60); ?>
                        <?php $this->text_field('banner_title', 'Tiêu đề', $v, 140); ?>
                        <label class="l4s-field l4s-span-2"><span>Mô tả</span><textarea rows="3" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[banner_description]"><?php echo esc_textarea($v['banner_description']); ?></textarea></label>
                        <?php $this->text_field('banner_primary_label', 'Primary CTA', $v, 60); ?>
                        <?php $this->url_field('banner_primary_url', 'Primary URL', $v, 'https://…'); ?>
                        <?php $this->text_field('banner_secondary_label', 'Secondary CTA', $v, 60); ?>
                        <?php $this->url_field('banner_secondary_url', 'Secondary URL', $v, 'https://…'); ?>
                        <label class="l4s-field l4s-span-2"><span>Ảnh banner</span><div class="l4s-media-field"><input id="l4s-banner-image" type="url" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[banner_image_url]" value="<?php echo esc_attr($v['banner_image_url']); ?>" placeholder="https://…"><button type="button" class="button" data-l4s-media-target="l4s-banner-image">Chọn từ Media</button></div></label>
                    </div>
                </section>
                <section class="l4s-admin-card">
                    <div class="l4s-card-heading"><div><span>HÀNH VI</span><h2>Trải nghiệm visitor</h2></div></div>
                    <div class="l4s-switch-list">
                        <?php $this->toggle('banner_dismissible', 'Cho phép đóng banner', $v); ?>
                        <?php $this->toggle('banner_new_tab', 'CTA mở tab mới', $v); ?>
                        <?php $this->toggle('banner_show_mobile', 'Hiển thị trên mobile', $v); ?>
                    </div>
                </section>
                <section class="l4s-admin-card">
                    <div class="l4s-card-heading"><div><span>TARGETING</span><h2>Phạm vi slug</h2></div></div>
                    <?php $this->select('banner_targeting', 'Điều kiện', $v, array('all' => 'Tất cả link', 'include' => 'Chỉ các slug này', 'exclude' => 'Trừ các slug này')); ?>
                    <label class="l4s-field"><span>Danh sách slug</span><textarea rows="3" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[banner_slugs]" placeholder="pkh4bd4t, demo-link"><?php echo esc_textarea($v['banner_slugs']); ?></textarea><small>Phân cách bằng dấu phẩy hoặc xuống dòng.</small></label>
                </section>
                <section class="l4s-admin-card l4s-span-2">
                    <div class="l4s-card-heading"><div><span>LỊCH HIỂN THỊ</span><h2>Tự động bắt đầu và kết thúc</h2><p>Để trống nếu banner luôn hoạt động.</p></div></div>
                    <div class="l4s-fields l4s-fields-2">
                        <label class="l4s-field"><span>Bắt đầu</span><input type="datetime-local" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[banner_start_at]" value="<?php echo esc_attr($v['banner_start_at']); ?>"></label>
                        <label class="l4s-field"><span>Kết thúc</span><input type="datetime-local" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[banner_end_at]" value="<?php echo esc_attr($v['banner_end_at']); ?>"></label>
                    </div>
                </section>
            </div>
            <?php $this->render_banner_preview($v); ?>
        </div>
        <?php
    }

    private function render_safe(array $v): void
    {
        $original_url = home_url('/' . $v['route_prefix'] . '/pkh4bd4t');
        $safe_url = add_query_arg($v['safe_alias_parameter'], 'pkh4bd4t', home_url('/' . $v['safe_route'] . '/'));
        ?>
        <div class="l4s-admin-grid">
            <section class="l4s-admin-card l4s-span-2">
                <div class="l4s-card-heading"><div><span>DELIVERY MODE</span><h2>Chọn cách hiển thị STU</h2><p>Link cũ <code>/<?php echo esc_html($v['route_prefix']); ?>/{slug}</code> vẫn giữ nguyên. Plugin tự định tuyến theo chế độ được chọn.</p></div></div>
                <div class="l4s-mode-grid">
                    <label class="l4s-mode-card"><input type="radio" name="<?php echo esc_attr($this->field_name('delivery_mode')); ?>" value="original" <?php checked($v['delivery_mode'], 'original'); ?>><span><b>1</b><strong>Trang STU gốc</strong><small>Render full page Link4Sub như hiện tại tại <code>/<?php echo esc_html($v['route_prefix']); ?>/{slug}</code>.</small><em><?php echo esc_html($original_url); ?></em></span></label>
                    <label class="l4s-mode-card"><input type="radio" name="<?php echo esc_attr($this->field_name('delivery_mode')); ?>" value="random_post" <?php checked($v['delivery_mode'], 'random_post'); ?>><span><b>2</b><strong>Bài viết ngẫu nhiên</strong><small>Đi qua Safe Redirect, chọn bài publish ngẫu nhiên rồi JavaScript dựng STU trên bài đó.</small><em><?php echo esc_html($safe_url); ?></em></span></label>
                </div>
            </section>

            <section class="l4s-admin-card">
                <div class="l4s-card-heading"><div><span>SAFE ENTRY</span><h2>Đường dẫn trung gian</h2><p>Alias được chuyển sang cookie ký HttpOnly trước khi URL bài viết được mở.</p></div><span class="l4s-status-pill">302 + HttpOnly</span></div>
                <div class="l4s-fields l4s-fields-2">
                    <?php $this->text_field('safe_route', 'Safe route', $v, 32); ?>
                    <?php $this->text_field('safe_alias_parameter', 'Query parameter', $v, 32); ?>
                </div>
                <label class="l4s-field"><span>URL mẫu</span><input type="text" readonly value="<?php echo esc_attr($safe_url); ?>"><small>URL bài viết đích sẽ sạch, không còn alias trên query string.</small></label>
            </section>

            <section class="l4s-admin-card">
                <div class="l4s-card-heading"><div><span>POST POOL</span><h2>Nguồn bài viết</h2><p>Pool được cache và chọn bằng random index để tránh truy vấn <code>ORDER BY RAND()</code> nặng database.</p></div></div>
                <div class="l4s-fields l4s-fields-2">
                    <?php $this->text_field('safe_post_types', 'Post types', $v, 160); ?>
                    <label class="l4s-field"><span>Số bài tối đa trong pool</span><input type="number" min="10" max="1000" name="<?php echo esc_attr($this->field_name('safe_pool_size')); ?>" value="<?php echo esc_attr((string) $v['safe_pool_size']); ?>"></label>
                    <?php $this->text_field('safe_include_categories', 'Chỉ category ID', $v, 500); ?>
                    <?php $this->text_field('safe_exclude_categories', 'Loại category ID', $v, 500); ?>
                    <label class="l4s-field"><span>Cache pool</span><div class="l4s-number"><input type="number" min="1" max="1440" name="<?php echo esc_attr($this->field_name('safe_pool_cache_minutes')); ?>" value="<?php echo esc_attr((string) $v['safe_pool_cache_minutes']); ?>"><em>phút</em></div></label>
                </div>
            </section>

            <section class="l4s-admin-card">
                <div class="l4s-card-heading"><div><span>RENDER</span><h2>Trải nghiệm trên bài viết</h2><p>API vẫn được PHP gọi server-to-server; JavaScript chỉ nhận dữ liệu đã chuẩn hoá để dựng UI.</p></div></div>
                <div class="l4s-fields l4s-fields-2">
                    <?php $this->select('safe_render_style', 'Kiểu hiển thị', $v, array('fullscreen' => 'Toàn màn hình', 'modal' => 'Modal trên bài viết')); ?>
                    <label class="l4s-field"><span>Delay trước khi hiện</span><div class="l4s-number"><input type="number" min="0" max="30" name="<?php echo esc_attr($this->field_name('safe_render_delay')); ?>" value="<?php echo esc_attr((string) $v['safe_render_delay']); ?>"><em>giây</em></div></label>
                    <label class="l4s-field"><span>Thời hạn cookie</span><div class="l4s-number"><input type="number" min="5" max="1440" name="<?php echo esc_attr($this->field_name('safe_cookie_ttl_minutes')); ?>" value="<?php echo esc_attr((string) $v['safe_cookie_ttl_minutes']); ?>"><em>phút</em></div></label>
                </div>
                <div class="l4s-switch-list"><?php $this->toggle('safe_allow_close', 'Cho phép visitor đóng STU để đọc bài', $v); ?></div>
            </section>

            <section class="l4s-admin-card">
                <div class="l4s-card-heading"><div><span>FLOW</span><h2>Luồng thực thi</h2></div></div>
                <ol class="l4s-flow-list"><li><b>1</b><span>Nhận alias từ <code>/safe/</code></span></li><li><b>2</b><span>Ký cookie HttpOnly và chọn bài publish</span></li><li><b>3</b><span>Redirect 302 tới permalink sạch</span></li><li><b>4</b><span>Bài viết render trước, JS gọi Public API và hydrate STU</span></li></ol>
            </section>
        </div>
        <?php
    }

    private function render_appearance(array $v): void
    {
        ?>
        <div class="l4s-admin-grid">
            <section class="l4s-admin-card l4s-span-2">
                <div class="l4s-card-heading"><div><span>BRAND TOKENS</span><h2>Màu sắc</h2><p>Các token này thay đổi button, progress và nền public page.</p></div></div>
                <div class="l4s-color-grid">
                    <?php $this->color_field('appearance_accent', 'Màu chính', $v); ?>
                    <?php $this->color_field('appearance_accent_hover', 'Hover', $v); ?>
                    <?php $this->color_field('appearance_success', 'Hoàn thành', $v); ?>
                    <?php $this->color_field('appearance_background_light', 'Nền sáng', $v); ?>
                    <?php $this->color_field('appearance_background_dark', 'Nền tối', $v); ?>
                </div>
            </section>
            <section class="l4s-admin-card">
                <div class="l4s-card-heading"><div><span>LAYOUT</span><h2>Kích thước giao diện</h2></div></div>
                <?php $this->range_field('appearance_content_width', 'Độ rộng nội dung', $v, 480, 960, 'px'); ?>
                <?php $this->range_field('appearance_card_radius', 'Bo góc card', $v, 6, 32, 'px'); ?>
                <?php $this->range_field('appearance_surface_opacity', 'Độ trong surface', $v, 70, 100, '%'); ?>
                <?php $this->range_field('appearance_overlay_opacity', 'Lớp phủ background', $v, 0, 100, '%'); ?>
            </section>
            <section class="l4s-admin-card">
                <div class="l4s-card-heading"><div><span>LOGO & THEME</span><h2>Nhận diện nâng cao</h2></div></div>
                <label class="l4s-field"><span>Logo URL</span><div class="l4s-media-field"><input id="l4s-logo-image" type="url" name="<?php echo esc_attr(Link4Sub_Settings::OPTION_NAME); ?>[appearance_logo_url]" value="<?php echo esc_attr($v['appearance_logo_url']); ?>" placeholder="https://…"><button type="button" class="button" data-l4s-media-target="l4s-logo-image">Chọn</button></div></label>
                <?php $this->select('appearance_default_theme', 'Theme mặc định', $v, array('light' => 'Sáng', 'dark' => 'Tối', 'system' => 'Theo hệ thống')); ?>
                <?php $this->select('appearance_font', 'Font', $v, array('system' => 'System UI', 'inter' => 'Inter', 'rounded' => 'Rounded', 'serif' => 'Serif editorial')); ?>
            </section>
            <section class="l4s-admin-card l4s-span-2">
                <div class="l4s-card-heading"><div><span>HIỂN THỊ</span><h2>Thành phần public page</h2></div></div>
                <div class="l4s-switch-grid">
                    <?php $this->toggle('appearance_show_header', 'Hiện header', $v); ?>
                    <?php $this->toggle('appearance_show_footer', 'Hiện liên kết footer', $v); ?>
                    <?php $this->toggle('appearance_compact_actions', 'Action dạng compact', $v); ?>
                </div>
            </section>
        </div>
        <?php
    }

    private function render_languages(): void
    {
        $data = $this->settings->language_admin_data();
        $payload_name = Link4Sub_Settings::OPTION_NAME . '[language_payload]';
        ?>
        <div class="l4s-language-admin" data-l4s-language-admin>
            <section class="l4s-admin-card l4s-language-summary">
                <div class="l4s-card-heading">
                    <div><span>PLUGIN I18N</span><h2>Ngôn ngữ trang STU</h2><p>Tiếng Việt và English nằm trong source plugin. WordPress chỉ lưu phần chỉnh sửa và ngôn ngữ bổ sung.</p></div>
                    <button type="button" class="button button-primary" data-l4s-language-add>+ Thêm ngôn ngữ</button>
                </div>
                <div class="l4s-language-stats"><span><b data-l4s-language-count>0</b> ngôn ngữ</span><span><b>2</b> bộ lang mặc định</span><span>Tối đa <b>20</b></span></div>
            </section>
            <div class="l4s-language-workspace">
                <aside class="l4s-admin-card l4s-language-list-panel">
                    <div class="l4s-language-list-heading"><strong>Danh sách</strong><small>Chọn để chỉnh sửa</small></div>
                    <div class="l4s-language-list" data-l4s-language-list></div>
                </aside>
                <section class="l4s-admin-card l4s-language-editor" data-l4s-language-editor></section>
            </div>
            <input type="hidden" name="<?php echo esc_attr($payload_name); ?>" data-l4s-language-payload value="">
            <script type="application/json" id="l4s-language-admin-data"><?php echo wp_json_encode(array(
                'default' => $data['default'],
                'languages' => $data['languages'],
                'schema' => Link4Sub_I18n::text_schema(),
            ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?></script>
        </div>
        <?php
    }

    private function render_banner_preview(array $v): void
    {
        ?>
        <aside class="l4s-preview-panel">
            <div class="l4s-preview-heading"><span>LIVE PREVIEW</span><small>Desktop</small></div>
            <div class="l4s-preview-canvas">
                <div class="l4s-preview-header"><i>L</i><span>Link4Sub</span><b></b><b></b></div>
                <div class="l4s-preview-banner is-<?php echo esc_attr($v['banner_style']); ?>" data-l4s-banner-preview>
                    <small data-preview="eyebrow"><?php echo esc_html($v['banner_eyebrow']); ?></small>
                    <strong data-preview="title"><?php echo esc_html($v['banner_title']); ?></strong>
                    <p data-preview="description"><?php echo esc_html($v['banner_description'] ?: 'Mô tả banner sẽ xuất hiện tại đây.'); ?></p>
                    <span data-preview="primary"><?php echo esc_html($v['banner_primary_label'] ?: 'Tìm hiểu thêm'); ?></span>
                </div>
                <div class="l4s-preview-card"><i></i><h3>Tiêu đề STU</h3><p></p><p></p><button></button></div>
            </div>
        </aside>
        <?php
    }

    private function field_name(string $key): string
    {
        return Link4Sub_Settings::OPTION_NAME . '[' . $key . ']';
    }

    private function text_field(string $key, string $label, array $v, int $maxlength): void
    {
        printf('<label class="l4s-field"><span>%s</span><input type="text" maxlength="%d" name="%s" value="%s"></label>', esc_html($label), $maxlength, esc_attr($this->field_name($key)), esc_attr($v[$key]));
    }

    private function url_field(string $key, string $label, array $v, string $placeholder = '', string $help = ''): void
    {
        printf('<label class="l4s-field"><span>%s</span><input type="url" name="%s" value="%s" placeholder="%s">%s</label>', esc_html($label), esc_attr($this->field_name($key)), esc_attr($v[$key]), esc_attr($placeholder), $help ? '<small>' . esc_html($help) . '</small>' : '');
    }

    private function select(string $key, string $label, array $v, array $options): void
    {
        echo '<label class="l4s-field"><span>' . esc_html($label) . '</span><select name="' . esc_attr($this->field_name($key)) . '">';
        foreach ($options as $value => $text) echo '<option value="' . esc_attr($value) . '" ' . selected($v[$key], $value, false) . '>' . esc_html($text) . '</option>';
        echo '</select></label>';
    }

    private function toggle(string $key, string $label, array $v): void
    {
        printf('<label class="l4s-toggle"><input type="checkbox" name="%s" value="1" %s><span aria-hidden="true"></span><b>%s</b></label>', esc_attr($this->field_name($key)), checked(!empty($v[$key]), true, false), esc_html($label));
    }

    private function color_field(string $key, string $label, array $v): void
    {
        printf('<label class="l4s-color-field"><span>%s</span><div><input type="color" name="%s" value="%s"><code>%s</code></div></label>', esc_html($label), esc_attr($this->field_name($key)), esc_attr($v[$key]), esc_html($v[$key]));
    }

    private function range_field(string $key, string $label, array $v, int $min, int $max, string $unit): void
    {
        printf('<label class="l4s-range-field"><span>%s <output>%s%s</output></span><input type="range" min="%d" max="%d" name="%s" value="%s" data-unit="%s"></label>', esc_html($label), esc_html((string) $v[$key]), esc_html($unit), $min, $max, esc_attr($this->field_name($key)), esc_attr((string) $v[$key]), esc_attr($unit));
    }
}
