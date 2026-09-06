<?php
if (!defined('ABSPATH')) exit;

$view = $overlay['view'];
$appearance = $view['appearance'];
$active = $overlay['kind'] === 'active';
$language_bundle = $active && isset($view['i18n']) && is_array($view['i18n'])
    ? $view['i18n']
    : $this->settings->language_bundle();
$errors = array(
    'not_found' => array('404', 'Không tìm thấy link', 'Alias này không tồn tại hoặc đã đổi địa chỉ.', 'error_not_found_title', 'error_not_found_description'),
    'unavailable' => array('410', 'Link không khả dụng', 'Link đã tạm dừng, hết hạn hoặc bị vô hiệu hoá.', 'error_unavailable_title', 'error_unavailable_description'),
    'api_error' => array('502', 'Chưa thể tải STU', 'Link4Sub API đang tạm gián đoạn. Vui lòng thử lại.', 'error_api_title', 'error_api_description'),
);
$error = $errors[$overlay['kind']] ?? $errors['api_error'];
$page_count = $active ? max(1, (int) ($view['show_page_count'] ?? 1)) : 1;
$current_page = $active ? max(0, min($page_count - 1, (int) ($overlay['current_page'] ?? 0))) : 0;
$final_page = $current_page >= $page_count - 1;
$total = $active ? count(array_filter($view['actions'], static fn($action) => (int) ($action['page'] ?? 0) === $current_page)) : 0;
$monetization_ads = $active ? $view['monetization_ads'] : array();
$recommendations = $active && isset($view['recommendations']) && is_array($view['recommendations'])
    ? $view['recommendations']
    : array();
$create_url = $active ? $view['app_url'] . '/member/create' : '';
$report_url = $active ? add_query_arg(
    'url',
    '/' . $view['route_prefix'] . '/' . $view['slug'],
    $view['app_url'] . '/report-link'
) : '';
$render_monetization_ad = static function (array $ad): void {
    if ($ad['format'] === 'banner') {
        $target = !empty($ad['new_tab']) ? ' target="_blank" rel="noopener noreferrer"' : '';
        ?><aside class="l4s-ad-banner" data-l4s-ad="<?php echo esc_attr($ad['id']); ?>"><img src="<?php echo esc_url($ad['image_url']); ?>" alt=""><div><?php if ($ad['title'] !== '') : ?><strong><?php echo esc_html($ad['title']); ?></strong><?php endif; ?><?php if ($ad['description'] !== '') : ?><p><?php echo esc_html($ad['description']); ?></p><?php endif; ?></div><a href="<?php echo esc_url($ad['click_url']); ?>"<?php echo $target; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>><?php echo esc_html($ad['cta_label'] ?: 'Tìm hiểu thêm'); ?></a></aside><?php
    } elseif ($ad['format'] === 'script') {
        ?><div class="l4s-ad-script" data-l4s-script-ad data-script-url="<?php echo esc_url($ad['script_url']); ?>" data-zone-id="<?php echo esc_attr($ad['zone_id']); ?>"></div><?php
    }
};
$configuration = array(
    'slug' => $active ? $view['slug'] : '',
    'visitRef' => $active ? $view['visit_reference'] : null,
    'completeUrl' => $active ? $view['complete_url'] : '',
    'actionDelaySeconds' => 6,
    'pageCount' => $page_count,
    'currentPage' => $current_page,
    'nextPageUrl' => $active ? ($overlay['next_page_url'] ?? null) : null,
    'defaultTheme' => $appearance['default_theme'],
    'renderDelaySeconds' => $overlay['render_delay'],
    'renderStyle' => $overlay['render_style'],
    'smartlinkUrl' => $active ? ($view['unlock_smartlink']['url'] ?? null) : null,
    'smartlinkId' => $active ? ($view['unlock_smartlink']['id'] ?? null) : null,
    'smartlinkDelaySeconds' => $active ? ($view['unlock_smartlink']['delay_seconds'] ?? null) : null,
    'popunderUrl' => $active ? ($view['popunder_smartlink']['url'] ?? null) : null,
    'popunderId' => $active ? ($view['popunder_smartlink']['id'] ?? null) : null,
);
?>
<div id="l4s-safe-overlay" class="l4s-safe-overlay is-<?php echo esc_attr($overlay['render_style']); ?> l4s-safe-font-<?php echo esc_attr($appearance['font']); ?>" hidden style="--l4s-safe-accent:<?php echo esc_attr($appearance['accent']); ?>;--l4s-safe-hover:<?php echo esc_attr($appearance['accent_hover']); ?>;--l4s-safe-success:<?php echo esc_attr($appearance['success']); ?>;--l4s-safe-background-light:<?php echo esc_attr($appearance['background_light']); ?>;--l4s-safe-background-dark:<?php echo esc_attr($appearance['background_dark']); ?>;--l4s-safe-surface-light:<?php echo esc_attr($appearance['surface_light']); ?>;--l4s-safe-surface-dark:<?php echo esc_attr($appearance['surface_dark']); ?>;--l4s-safe-radius:<?php echo esc_attr((string) $appearance['card_radius']); ?>px">
    <div class="l4s-safe-backdrop" aria-hidden="true"></div>
    <section class="l4s-safe-panel" role="dialog" aria-modal="true" aria-label="Link4Sub STU">
        <header class="l4s-safe-header">
            <a href="<?php echo esc_url($this->api->app_base_url()); ?>" target="_blank" rel="noopener noreferrer">
                <span class="l4s-safe-logo"><?php if ($appearance['logo_url'] !== '') : ?><img src="<?php echo esc_url($appearance['logo_url']); ?>" alt=""><?php else : ?><?php echo esc_html(mb_strtoupper(mb_substr($view['brand'], 0, 1))); ?><?php endif; ?></span>
                <strong><?php echo esc_html($view['brand']); ?></strong>
            </a>
            <div class="l4s-language-switcher l4s-safe-language" data-l4s-language-root>
                <button class="l4s-language-button l4s-safe-language-button" type="button" data-l4s-language-toggle aria-haspopup="menu" aria-expanded="false" aria-label="Ngôn ngữ"><span><?php $this->renderer->icon('globe'); ?></span><small data-l4s-language-code>VI</small></button>
                <div class="l4s-language-menu" data-l4s-language-menu role="menu" hidden></div>
            </div>
            <button type="button" class="l4s-safe-theme" data-l4s-safe-theme aria-label="Chuyển sang giao diện tối" title="Chuyển sang giao diện tối" aria-pressed="false">
                <span class="l4s-safe-theme-light" aria-hidden="true"><?php $this->renderer->icon('sun'); ?></span>
                <span class="l4s-safe-theme-dark" aria-hidden="true"><?php $this->renderer->icon('moon'); ?></span>
            </button>
            <?php if ($overlay['allow_close']) : ?><button type="button" class="l4s-safe-close" data-l4s-safe-close aria-label="Đóng STU" data-l4s-i18n-aria="close">×</button><?php endif; ?>
        </header>

        <div class="l4s-safe-scroll">
            <?php if (!$active) : ?>
                <div class="l4s-safe-error"><span><?php echo esc_html($error[0]); ?></span><h2 data-l4s-i18n="<?php echo esc_attr($error[3]); ?>"><?php echo esc_html($error[1]); ?></h2><p data-l4s-i18n="<?php echo esc_attr($error[4]); ?>"><?php echo esc_html($error[2]); ?></p><button type="button" onclick="location.reload()" data-l4s-i18n="retry">Thử lại</button></div>
            <?php else : ?>
                <div class="l4s-safe-content">
                    <?php if (isset($monetization_ads['safe_overlay_top'])) $render_monetization_ad($monetization_ads['safe_overlay_top']); ?>
                    <?php if (is_array($view['banner'])) : ?>
                        <aside class="l4s-safe-banner is-<?php echo esc_attr($view['banner']['style']); ?>">
                            <?php if ($view['banner']['image_url'] !== '') : ?><img src="<?php echo esc_url($view['banner']['image_url']); ?>" alt=""><?php endif; ?>
                            <div><?php if ($view['banner']['eyebrow'] !== '') : ?><small><?php echo esc_html($view['banner']['eyebrow']); ?></small><?php endif; ?><strong><?php echo esc_html($view['banner']['title']); ?></strong><?php if ($view['banner']['description'] !== '') : ?><p><?php echo esc_html($view['banner']['description']); ?></p><?php endif; ?></div>
                        </aside>
                    <?php endif; ?>

                    <article class="l4s-safe-card">
                        <?php if ($view['cover_url'] !== '') : ?><img class="l4s-safe-cover" src="<?php echo esc_url($view['cover_url']); ?>" alt="<?php echo esc_attr($view['title']); ?>"><?php endif; ?>
                        <div class="l4s-safe-title"><h2><?php echo esc_html($view['title']); ?></h2><p<?php echo $view['subtitle'] === '' ? ' data-l4s-i18n="safe_default_subtitle"' : ''; ?>><?php echo esc_html($view['subtitle'] !== '' ? $view['subtitle'] : 'Hoàn thành các hành động để mở khóa nội dung này.'); ?></p></div>

                        <div class="l4s-safe-actions">
                            <?php foreach ($view['actions'] as $index => $action) : ?>
                                <a href="<?php echo esc_url($action['url']); ?>" target="_blank" rel="noopener noreferrer" class="l4s-safe-action" data-l4s-safe-action="<?php echo esc_attr($action['id']); ?>" data-l4s-page="<?php echo esc_attr((string) ($action['page'] ?? 0)); ?>"<?php echo (int) ($action['page'] ?? 0) !== $current_page ? ' hidden' : ''; ?> data-platform="<?php echo esc_attr(strtolower($action['platform'])); ?>">
                                    <span class="l4s-safe-action-icon"><?php $this->renderer->icon($action['icon']); ?></span>
                                    <span class="l4s-safe-action-label" data-label="<?php echo esc_attr($action['label']); ?>" data-l4s-i18n="<?php echo esc_attr($action['label_key']); ?>"><?php echo esc_html($action['label']); ?></span>
                                    <span class="l4s-safe-action-state">→</span>
                                    <i><b></b></i>
                                </a>
                            <?php endforeach; ?>
                        </div>

                        <div class="l4s-safe-progress"><div><span data-l4s-safe-progress-title><?php echo $total === 0 ? 'Nội dung đã sẵn sàng' : 'Tiến độ mở khóa'; ?></span><?php if ($page_count > 1) : ?><small data-l4s-safe-page>Page <?php echo esc_html((string) ($current_page + 1)); ?>/<?php echo esc_html((string) $page_count); ?></small><?php endif; ?><small><b data-l4s-safe-completed>0</b>/<span data-l4s-safe-total><?php echo esc_html((string) $total); ?></span></small></div><i><b data-l4s-safe-progress-bar style="width:<?php echo $total === 0 ? '100' : '0'; ?>%"></b></i></div>

                        <?php if ($view['input_type'] === 'snippet') : ?>
                            <button type="button" class="l4s-safe-unlock<?php echo $total === 0 ? ' is-ready' : ''; ?>" data-l4s-safe-unlock data-type="snippet" <?php disabled($total > 0); ?>><?php echo esc_html($final_page ? 'Mở khóa nội dung' : 'Tiếp tục Page ' . ($current_page + 2)); ?></button>
                            <pre class="l4s-safe-snippet" data-l4s-safe-snippet hidden><?php echo esc_html($view['destination_url']); ?></pre>
                        <?php else : ?>
                            <a class="l4s-safe-unlock<?php echo $total === 0 ? ' is-ready' : ''; ?>" data-l4s-safe-unlock data-type="<?php echo esc_attr($view['input_type']); ?>" data-href="<?php echo esc_url($view['destination_url']); ?>"<?php echo $total === 0 && $final_page ? ' href="' . esc_url($view['destination_url']) . '"' : ''; ?> target="_blank" rel="noopener noreferrer"><?php echo esc_html($total === 0 ? ($final_page ? 'Tiếp tục đến liên kết' : 'Tiếp tục Page ' . ($current_page + 2)) : 'Hoàn thành yêu cầu để mở khóa'); ?></a>
                        <?php endif; ?>
                    </article>
                    <?php if (isset($monetization_ads['safe_overlay_bottom'])) $render_monetization_ad($monetization_ads['safe_overlay_bottom']); ?>
                    <?php include LINK4SUB_PLUGIN_DIR . 'templates/recommendations.php'; ?>
                    <?php if (!empty($appearance['show_footer'])) : ?>
                        <footer class="l4s-safe-footer">
                            <a href="<?php echo esc_url($create_url); ?>" target="_blank" rel="noopener noreferrer" data-l4s-i18n="create_social_link">Tạo Social Link của bạn</a>
                            <span aria-hidden="true">·</span>
                            <a href="<?php echo esc_url($report_url); ?>" target="_blank" rel="noopener noreferrer" data-l4s-i18n="report_link">Báo cáo liên kết</a>
                        </footer>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
    </section>
    <script id="l4s-i18n-config" type="application/json"><?php echo wp_json_encode($language_bundle, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?></script>
    <script type="application/json" id="l4s-safe-config"><?php echo wp_json_encode($configuration, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?></script>
</div>
