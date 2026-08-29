<?php
if (!defined('ABSPATH')) exit;

$view = $overlay['view'];
$appearance = $view['appearance'];
$active = $overlay['kind'] === 'active';
$errors = array(
    'not_found' => array('404', 'Không tìm thấy link', 'Alias này không tồn tại hoặc đã đổi địa chỉ.'),
    'unavailable' => array('410', 'Link không khả dụng', 'Link đã tạm dừng, hết hạn hoặc bị vô hiệu hoá.'),
    'api_error' => array('502', 'Chưa thể tải STU', 'Link4Sub API đang tạm gián đoạn. Vui lòng thử lại.'),
);
$error = $errors[$overlay['kind']] ?? $errors['api_error'];
$total = $active ? count($view['actions']) : 0;
$configuration = array(
    'slug' => $active ? $view['slug'] : '',
    'visitRef' => $active ? $view['visit_reference'] : null,
    'completeUrl' => $active ? $view['complete_url'] : '',
    'actionDelaySeconds' => 6,
    'renderDelaySeconds' => $overlay['render_delay'],
    'renderStyle' => $overlay['render_style'],
);
?>
<div id="l4s-safe-overlay" class="l4s-safe-overlay is-<?php echo esc_attr($overlay['render_style']); ?> l4s-safe-font-<?php echo esc_attr($appearance['font']); ?>" hidden style="--l4s-safe-accent:<?php echo esc_attr($appearance['accent']); ?>;--l4s-safe-hover:<?php echo esc_attr($appearance['accent_hover']); ?>;--l4s-safe-success:<?php echo esc_attr($appearance['success']); ?>;--l4s-safe-radius:<?php echo esc_attr((string) $appearance['card_radius']); ?>px">
    <div class="l4s-safe-backdrop" aria-hidden="true"></div>
    <section class="l4s-safe-panel" role="dialog" aria-modal="true" aria-label="Link4Sub STU">
        <header class="l4s-safe-header">
            <a href="<?php echo esc_url($this->api->app_base_url()); ?>" target="_blank" rel="noopener noreferrer">
                <span class="l4s-safe-logo"><?php if ($appearance['logo_url'] !== '') : ?><img src="<?php echo esc_url($appearance['logo_url']); ?>" alt=""><?php else : ?><?php echo esc_html(mb_strtoupper(mb_substr($view['brand'], 0, 1))); ?><?php endif; ?></span>
                <strong><?php echo esc_html($view['brand']); ?></strong>
            </a>
            <span class="l4s-safe-random-label">Bài viết ngẫu nhiên · Safe Redirect</span>
            <?php if ($overlay['allow_close']) : ?><button type="button" class="l4s-safe-close" data-l4s-safe-close aria-label="Đóng STU">×</button><?php endif; ?>
        </header>

        <div class="l4s-safe-scroll">
            <?php if (!$active) : ?>
                <div class="l4s-safe-error"><span><?php echo esc_html($error[0]); ?></span><h2><?php echo esc_html($error[1]); ?></h2><p><?php echo esc_html($error[2]); ?></p><button type="button" onclick="location.reload()">Thử lại</button></div>
            <?php else : ?>
                <div class="l4s-safe-content">
                    <?php if (is_array($view['banner'])) : ?>
                        <aside class="l4s-safe-banner is-<?php echo esc_attr($view['banner']['style']); ?>">
                            <?php if ($view['banner']['image_url'] !== '') : ?><img src="<?php echo esc_url($view['banner']['image_url']); ?>" alt=""><?php endif; ?>
                            <div><?php if ($view['banner']['eyebrow'] !== '') : ?><small><?php echo esc_html($view['banner']['eyebrow']); ?></small><?php endif; ?><strong><?php echo esc_html($view['banner']['title']); ?></strong><?php if ($view['banner']['description'] !== '') : ?><p><?php echo esc_html($view['banner']['description']); ?></p><?php endif; ?></div>
                        </aside>
                    <?php endif; ?>

                    <article class="l4s-safe-card">
                        <?php if ($view['cover_url'] !== '') : ?><img class="l4s-safe-cover" src="<?php echo esc_url($view['cover_url']); ?>" alt="<?php echo esc_attr($view['title']); ?>"><?php endif; ?>
                        <div class="l4s-safe-title"><h2><?php echo esc_html($view['title']); ?></h2><p><?php echo esc_html($view['subtitle'] !== '' ? $view['subtitle'] : 'Hoàn thành các hành động để mở khóa nội dung này.'); ?></p></div>

                        <div class="l4s-safe-actions">
                            <?php foreach ($view['actions'] as $index => $action) : ?>
                                <a href="<?php echo esc_url($action['url']); ?>" target="_blank" rel="noopener noreferrer" class="l4s-safe-action" data-l4s-safe-action="<?php echo esc_attr($action['id']); ?>" data-platform="<?php echo esc_attr(strtolower($action['platform'])); ?>">
                                    <span class="l4s-safe-action-icon"><?php $this->renderer->icon($action['icon']); ?></span>
                                    <span class="l4s-safe-action-label" data-label="<?php echo esc_attr($action['label']); ?>"><?php echo esc_html($action['label']); ?></span>
                                    <span class="l4s-safe-action-state">→</span>
                                    <i><b></b></i>
                                </a>
                            <?php endforeach; ?>
                        </div>

                        <div class="l4s-safe-progress"><div><span data-l4s-safe-progress-title><?php echo $total === 0 ? 'Nội dung đã sẵn sàng' : 'Tiến độ mở khóa'; ?></span><small><b data-l4s-safe-completed>0</b>/<?php echo esc_html((string) $total); ?></small></div><i><b data-l4s-safe-progress-bar style="width:<?php echo $total === 0 ? '100' : '0'; ?>%"></b></i></div>

                        <?php if ($view['input_type'] === 'snippet') : ?>
                            <button type="button" class="l4s-safe-unlock<?php echo $total === 0 ? ' is-ready' : ''; ?>" data-l4s-safe-unlock data-type="snippet" <?php disabled($total > 0); ?>>Mở khóa nội dung</button>
                            <pre class="l4s-safe-snippet" data-l4s-safe-snippet hidden><?php echo esc_html($view['destination_url']); ?></pre>
                        <?php else : ?>
                            <a class="l4s-safe-unlock<?php echo $total === 0 ? ' is-ready' : ''; ?>" data-l4s-safe-unlock data-type="<?php echo esc_attr($view['input_type']); ?>" data-href="<?php echo esc_url($view['destination_url']); ?>"<?php echo $total === 0 ? ' href="' . esc_url($view['destination_url']) . '"' : ''; ?> target="_blank" rel="noopener noreferrer"><?php echo $total === 0 ? 'Tiếp tục đến liên kết' : 'Hoàn thành yêu cầu để mở khóa'; ?></a>
                        <?php endif; ?>
                    </article>
                </div>
            <?php endif; ?>
        </div>
    </section>
    <script type="application/json" id="l4s-safe-config"><?php echo wp_json_encode($configuration, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?></script>
</div>
