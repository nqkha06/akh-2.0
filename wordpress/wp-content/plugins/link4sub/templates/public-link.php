<?php
if (!defined('ABSPATH')) exit;

$page_count = max(1, (int) ($view['show_page_count'] ?? 1));
$first_page_actions = count(array_filter($view['actions'], static fn($action) => (int) ($action['page'] ?? 0) === 0));
$initially_unlocked = $first_page_actions === 0;
$create_url = $view['app_url'] . '/member/create';
$report_url = add_query_arg(
    'url',
    '/' . $view['route_prefix'] . '/' . $view['slug'],
    $view['app_url'] . '/report-link'
);
$appearance = $view['appearance'];
$language_bundle = $view['i18n'];
$recommendations = $view['recommendations'] ?? array();
$banner = $view['banner'];
$monetization_ads = $view['monetization_ads'];
$configuration = array(
    'slug' => $view['slug'],
    'visitRef' => $view['visit_reference'],
    'completeUrl' => $view['complete_url'],
    'actionDelaySeconds' => 6,
    'pageCount' => $page_count,
    'bannerId' => $banner['id'] ?? null,
    'smartlinkUrl' => $view['unlock_smartlink']['url'] ?? null,
    'smartlinkId' => $view['unlock_smartlink']['id'] ?? null,
    'smartlinkDelaySeconds' => $view['unlock_smartlink']['delay_seconds'] ?? null,
    'popunderUrl' => $view['popunder_smartlink']['url'] ?? null,
    'popunderId' => $view['popunder_smartlink']['id'] ?? null,
);
$render_banner = static function (array $item): void {
    $target = !empty($item['new_tab']) ? ' target="_blank" rel="noopener noreferrer"' : '';
    ?>
    <aside class="l4s-public-banner is-<?php echo esc_attr($item['style']); ?> align-<?php echo esc_attr($item['alignment']); ?><?php echo empty($item['show_mobile']) ? ' is-desktop-only' : ''; ?>" data-l4s-banner="<?php echo esc_attr($item['id']); ?>">
        <?php if (!empty($item['image_url'])) : ?><img src="<?php echo esc_url($item['image_url']); ?>" alt=""><?php endif; ?>
        <div class="l4s-banner-copy">
            <?php if ($item['eyebrow'] !== '') : ?><small><?php echo esc_html($item['eyebrow']); ?></small><?php endif; ?>
            <?php if ($item['title'] !== '') : ?><strong><?php echo esc_html($item['title']); ?></strong><?php endif; ?>
            <?php if ($item['description'] !== '') : ?><p><?php echo esc_html($item['description']); ?></p><?php endif; ?>
            <?php if ($item['primary_url'] !== '' || $item['secondary_url'] !== '') : ?>
                <div class="l4s-banner-actions">
                    <?php if ($item['primary_url'] !== '' && $item['primary_label'] !== '') : ?><a class="is-primary" href="<?php echo esc_url($item['primary_url']); ?>"<?php echo $target; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>><?php echo esc_html($item['primary_label']); ?></a><?php endif; ?>
                    <?php if ($item['secondary_url'] !== '' && $item['secondary_label'] !== '') : ?><a href="<?php echo esc_url($item['secondary_url']); ?>"<?php echo $target; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>><?php echo esc_html($item['secondary_label']); ?></a><?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
        <?php if (!empty($item['dismissible'])) : ?><button type="button" class="l4s-banner-dismiss" aria-label="Đóng banner" data-l4s-dismiss-banner>×</button><?php endif; ?>
    </aside>
    <?php
};
$render_monetization_ad = static function (array $ad): void {
    if ($ad['format'] === 'banner') {
        $target = !empty($ad['new_tab']) ? ' target="_blank" rel="noopener noreferrer"' : '';
        ?>
        <aside class="l4s-ad-banner" data-l4s-ad="<?php echo esc_attr($ad['id']); ?>">
            <img src="<?php echo esc_url($ad['image_url']); ?>" alt="">
            <div><?php if ($ad['title'] !== '') : ?><strong><?php echo esc_html($ad['title']); ?></strong><?php endif; ?><?php if ($ad['description'] !== '') : ?><p><?php echo esc_html($ad['description']); ?></p><?php endif; ?></div>
            <a href="<?php echo esc_url($ad['click_url']); ?>"<?php echo $target; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>><?php echo esc_html($ad['cta_label'] ?: 'Tìm hiểu thêm'); ?></a>
        </aside>
        <?php
    } elseif ($ad['format'] === 'script') {
        ?><div class="l4s-ad-script" data-l4s-script-ad data-script-url="<?php echo esc_url($ad['script_url']); ?>" data-zone-id="<?php echo esc_attr($ad['zone_id']); ?>"></div><?php
    }
};
?><!doctype html>
<html <?php language_attributes(); ?> class="l4s-loading">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="robots" content="noindex, follow">
    <title><?php echo esc_html($view['title'] . ' — ' . $view['brand']); ?></title>
    <link rel="stylesheet" href="<?php echo esc_url(LINK4SUB_PLUGIN_URL . 'assets/css/public-link.css?ver=' . LINK4SUB_PLUGIN_VERSION); ?>">
    <link rel="stylesheet" href="<?php echo esc_url(LINK4SUB_PLUGIN_URL . 'assets/css/monetization-ads.css?ver=' . LINK4SUB_PLUGIN_VERSION); ?>">
    <link rel="stylesheet" href="<?php echo esc_url(LINK4SUB_PLUGIN_URL . 'assets/css/language-switcher.css?ver=' . LINK4SUB_PLUGIN_VERSION); ?>">
    <link rel="stylesheet" href="<?php echo esc_url(LINK4SUB_PLUGIN_URL . 'assets/css/recommendations.css?ver=' . LINK4SUB_PLUGIN_VERSION); ?>">
    <style id="l4s-custom-appearance">:root{--l4s-purple:<?php echo esc_html($appearance['accent']); ?>;--l4s-purple-hover:<?php echo esc_html($appearance['accent_hover']); ?>;--l4s-success:<?php echo esc_html($appearance['success']); ?>;--l4s-bg:<?php echo esc_html($appearance['background_light']); ?>;--l4s-surface:<?php echo esc_html($appearance['surface_light']); ?>;--l4s-overlay-light:<?php echo esc_html($appearance['overlay_light']); ?>;--l4s-card-radius:<?php echo esc_html((string) $appearance['card_radius']); ?>px;--l4s-content-width:<?php echo esc_html((string) $appearance['content_width']); ?>px}.l4s-dark{--l4s-bg:<?php echo esc_html($appearance['background_dark']); ?>;--l4s-surface:<?php echo esc_html($appearance['surface_dark']); ?>;--l4s-overlay-dark:<?php echo esc_html($appearance['overlay_dark']); ?>}</style>
    <script>try{var l4st=localStorage.getItem('link4sub:theme');var l4sd=l4st||<?php echo wp_json_encode($appearance['default_theme']); ?>;if(l4sd==='dark'||(l4sd==='system'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('l4s-dark')}}catch(e){}setTimeout(function(){document.documentElement.classList.remove('l4s-loading')},4000);</script>
    <script defer src="<?php echo esc_url(LINK4SUB_PLUGIN_URL . 'assets/js/language-switcher.js?ver=' . LINK4SUB_PLUGIN_VERSION); ?>"></script>
    <script defer src="<?php echo esc_url(LINK4SUB_PLUGIN_URL . 'assets/js/public-link.js?ver=' . LINK4SUB_PLUGIN_VERSION); ?>"></script>
</head>
<body class="l4s-font-<?php echo esc_attr($appearance['font']); ?><?php echo !empty($appearance['compact_actions']) ? ' l4s-compact-actions' : ''; ?>">
<div class="l4s-hydration" role="status" aria-live="polite" aria-label="Đang tải">
    <span class="l4s-spinner"></span>
</div>

<main class="l4s-page">
    <div class="l4s-fallback-bg" aria-hidden="true"></div>
    <?php if ($view['background_url'] !== '' || $view['youtube_embed_url'] !== '') : ?>
        <div class="l4s-background" aria-hidden="true">
            <?php if ($view['background_type'] === 'image') : ?>
                <div class="l4s-background-image" style="background-image:url('<?php echo esc_url($view['background_url']); ?>');filter:<?php echo esc_attr($view['background_filter']); ?>"></div>
            <?php elseif ($view['background_type'] === 'video') : ?>
                <video class="l4s-background-video" src="<?php echo esc_url($view['background_url']); ?>" autoplay muted loop playsinline style="filter:<?php echo esc_attr($view['background_filter']); ?>"></video>
            <?php elseif ($view['youtube_embed_url'] !== '') : ?>
                <iframe id="l4s-youtube-background" class="l4s-background-youtube" src="<?php echo esc_url($view['youtube_embed_url']); ?>" title="Video nền" allow="autoplay; encrypted-media; picture-in-picture" style="filter:<?php echo esc_attr($view['background_filter']); ?>"></iframe>
            <?php endif; ?>
            <div class="l4s-background-overlay"></div>
        </div>
    <?php endif; ?>

    <?php if (!empty($appearance['show_header'])) : ?><header class="l4s-header">
        <div class="l4s-header-inner">
            <a class="l4s-brand" href="<?php echo esc_url($view['app_url']); ?>" aria-label="<?php echo esc_attr($view['brand']); ?> — Trang chủ">
                <span class="l4s-brand-mark" aria-hidden="true"><?php if ($appearance['logo_url'] !== '') : ?><img src="<?php echo esc_url($appearance['logo_url']); ?>" alt=""><?php else : ?><?php echo esc_html(mb_strtoupper(mb_substr($view['brand'], 0, 1))); ?><?php endif; ?></span>
                <span><?php echo esc_html($view['brand']); ?></span>
            </a>
            <div class="l4s-header-actions">
                <div class="l4s-language-switcher" data-l4s-language-root>
                    <button class="l4s-icon-button l4s-language-button" type="button" data-l4s-language-toggle aria-haspopup="menu" aria-expanded="false" aria-label="Ngôn ngữ"><span><?php $this->icon('globe'); ?></span><small data-l4s-language-code>VI</small></button>
                    <div class="l4s-language-menu" data-l4s-language-menu role="menu" hidden></div>
                </div>
                <button id="l4s-theme" class="l4s-icon-button" type="button" aria-label="Chuyển sang giao diện tối" title="Chuyển sang giao diện tối" data-l4s-i18n-aria="theme_dark">
                    <span class="l4s-theme-light"><?php $this->icon('sun'); ?></span>
                    <span class="l4s-theme-dark"><?php $this->icon('moon'); ?></span>
                </button>
                <button id="l4s-share" class="l4s-icon-button" type="button" aria-label="Chia sẻ trang này" title="Chia sẻ trang này" data-l4s-i18n-aria="share"><?php $this->icon('share'); ?></button>
                <a class="l4s-create-header" href="<?php echo esc_url($create_url); ?>"><span data-l4s-i18n="create_link">Tạo link của bạn</span> <?php $this->icon('external'); ?></a>
            </div>
        </div>
    </header><?php endif; ?>

    <?php if (empty($appearance['show_header'])) : ?>
        <div class="l4s-language-switcher l4s-language-floating" data-l4s-language-root>
            <button class="l4s-icon-button l4s-language-button" type="button" data-l4s-language-toggle aria-haspopup="menu" aria-expanded="false" aria-label="Ngôn ngữ"><span><?php $this->icon('globe'); ?></span><small data-l4s-language-code>VI</small></button>
            <div class="l4s-language-menu" data-l4s-language-menu role="menu" hidden></div>
        </div>
    <?php endif; ?>

    <?php if ($view['youtube_embed_url'] !== '') : ?>
        <button id="l4s-audio" class="l4s-audio-button" type="button" aria-label="Bật âm thanh nền" title="Bật âm thanh nền" data-l4s-i18n-aria="audio_enable">
            <span aria-hidden="true">♪</span>
        </button>
    <?php endif; ?>

    <section class="l4s-content">
        <div class="l4s-shell" data-testid="public-link-shell">
            <?php if (isset($monetization_ads['stu_before'])) $render_monetization_ad($monetization_ads['stu_before']); ?>
            <?php if (is_array($banner) && $banner['position'] === 'before_card') $render_banner($banner); ?>
            <section class="l4s-card">
                <?php if ($view['cover_url'] !== '') : ?>
                    <img class="l4s-cover" src="<?php echo esc_url($view['cover_url']); ?>" alt="<?php echo esc_attr($view['title']); ?>">
                <?php endif; ?>

                <div class="l4s-title<?php echo $view['cover_url'] !== '' ? ' has-cover' : ''; ?>">
                    <h1><?php echo esc_html($view['title']); ?></h1>
                    <p<?php echo $view['subtitle'] === '' ? ' data-l4s-i18n="default_subtitle"' : ''; ?>><?php echo esc_html($view['subtitle'] !== '' ? $view['subtitle'] : 'Hoàn thành các hành động bên cạnh để mở khóa nội dung này.'); ?></p>
                </div>

                <div class="l4s-actions" id="l4s-actions">
                    <?php foreach ($view['actions'] as $index => $action) : ?>
                        <a class="l4s-action" href="<?php echo esc_url($action['url']); ?>" target="_blank" rel="noopener noreferrer" data-action-id="<?php echo esc_attr($action['id']); ?>" data-l4s-page="<?php echo esc_attr((string) ($action['page'] ?? 0)); ?>"<?php echo (int) ($action['page'] ?? 0) > 0 ? ' hidden' : ''; ?> data-platform="<?php echo esc_attr(strtolower($action['platform'])); ?>" data-testid="public-action-<?php echo esc_attr((string) $index); ?>">
                            <span class="l4s-action-progress"><span></span></span>
                            <span class="l4s-action-icon"><?php $this->icon($action['icon']); ?></span>
                            <span class="l4s-action-label" data-label="<?php echo esc_attr($action['label']); ?>" data-l4s-i18n="<?php echo esc_attr($action['label_key']); ?>"><?php echo esc_html($action['label']); ?></span>
                            <span class="l4s-action-state l4s-action-arrow"><?php $this->icon('arrow'); ?></span>
                            <span class="l4s-action-state l4s-action-check"><?php $this->icon('check'); ?></span>
                            <span class="l4s-action-state l4s-action-loader"></span>
                        </a>
                    <?php endforeach; ?>
                </div>

                <div class="l4s-unlock-progress">
                    <div class="l4s-progress-copy">
                        <div><p id="l4s-progress-title" data-l4s-i18n="<?php echo $initially_unlocked ? 'content_ready' : 'unlock_progress'; ?>"><?php echo $initially_unlocked ? 'Nội dung đã sẵn sàng' : 'Tiến độ mở khóa'; ?></p><?php if ($page_count > 1) : ?><small id="l4s-page-indicator">Page 1/<?php echo esc_html((string) $page_count); ?></small><?php endif; ?></div>
                        <span><b id="l4s-completed-count">0</b>/<span id="l4s-page-action-count"><?php echo esc_html((string) $first_page_actions); ?></span></span>
                    </div>
                    <div class="l4s-progress-track" data-testid="unlock-progress"><span id="l4s-progress-bar" style="width:<?php echo $initially_unlocked ? '100' : '0'; ?>%"></span></div>
                </div>

                <div class="l4s-destination">
                    <?php if ($view['input_type'] === 'snippet') : ?>
                        <button id="l4s-unlock" class="l4s-unlock-button" type="button"<?php echo $initially_unlocked ? '' : ' disabled'; ?> data-type="snippet" data-testid="unlock-cta">
                            <span class="l4s-unlock-locked"><?php $this->icon('lock'); ?></span>
                            <span class="l4s-unlock-ready"><?php $this->icon('file'); ?></span>
                            <span class="l4s-unlock-label" data-l4s-i18n="<?php echo $initially_unlocked ? 'open_content' : 'unlock_content'; ?>"><?php echo $initially_unlocked ? 'Mở nội dung' : 'Mở khóa nội dung'; ?></span>
                        </button>
                        <pre id="l4s-snippet" class="l4s-snippet" hidden><?php echo esc_html($view['destination_url']); ?></pre>
                    <?php else : ?>
                        <a id="l4s-unlock" class="l4s-unlock-button<?php echo $initially_unlocked ? ' is-ready' : ''; ?>"<?php echo $initially_unlocked ? ' href="' . esc_url($view['destination_url']) . '"' : ''; ?> data-href="<?php echo esc_url($view['destination_url']); ?>" data-type="<?php echo esc_attr($view['input_type']); ?>" target="_blank" rel="noopener noreferrer" aria-disabled="<?php echo $initially_unlocked ? 'false' : 'true'; ?>" data-testid="unlock-cta">
                            <span class="l4s-unlock-locked"><?php $this->icon('lock'); ?></span>
                            <span class="l4s-unlock-ready"><?php $this->icon('external'); ?></span>
                            <span class="l4s-unlock-label" data-l4s-i18n="<?php echo $initially_unlocked ? ($view['input_type'] === 'file' ? 'open_file' : 'continue_link') : 'complete_requirements'; ?>"><?php echo $initially_unlocked ? ($view['input_type'] === 'file' ? 'Mở file' : 'Tiếp tục đến liên kết') : 'Hoàn thành yêu cầu để mở khóa'; ?></span>
                        </a>
                    <?php endif; ?>
                </div>
            </section>

            <?php if (isset($monetization_ads['stu_after'])) $render_monetization_ad($monetization_ads['stu_after']); ?>

            <?php if (is_array($banner) && $banner['position'] === 'after_card') $render_banner($banner); ?>

            <?php include LINK4SUB_PLUGIN_DIR . 'templates/recommendations.php'; ?>

            <?php if (!empty($appearance['show_footer'])) : ?><div class="l4s-footer-links">
                <a href="<?php echo esc_url($create_url); ?>" data-l4s-i18n="create_social_link">Tạo Social Link của bạn</a>
                <span aria-hidden="true">·</span>
                <a href="<?php echo esc_url($report_url); ?>" data-l4s-i18n="report_link">Báo cáo liên kết</a>
            </div><?php endif; ?>
        </div>
    </section>
</main>

<div id="l4s-toast" class="l4s-toast" role="status" aria-live="polite"></div>
<script id="l4s-i18n-config" type="application/json"><?php echo wp_json_encode($language_bundle, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?></script>
<script id="l4s-config" type="application/json"><?php echo wp_json_encode($configuration, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?></script>
<noscript><style>.l4s-hydration{display:none!important}.l4s-page{visibility:visible!important}</style></noscript>
</body>
</html>
