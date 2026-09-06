<?php
if (!defined('ABSPATH') || empty($recommendations) || !is_array($recommendations)) return;
?>
<section class="l4s-recommendations" aria-labelledby="l4s-recommendations-title">
    <div class="l4s-recommendations-heading">
        <h2 id="l4s-recommendations-title" data-l4s-i18n="recommendations_title">Bạn có thể thích</h2>
        <p data-l4s-i18n="recommendations_description">Các liên kết khác từ cùng người tạo.</p>
    </div>
    <div class="l4s-recommendations-grid">
        <?php foreach (array_slice($recommendations, 0, 3) as $recommendation) : ?>
            <?php if (!is_array($recommendation) || empty($recommendation['url']) || empty($recommendation['title'])) continue; ?>
            <a class="l4s-recommendation-card" href="<?php echo esc_url($recommendation['url']); ?>" data-l4s-recommendation="<?php echo esc_attr((string) ($recommendation['id'] ?? 'item')); ?>">
                <span class="l4s-recommendation-media">
                    <?php if (!empty($recommendation['cover_url'])) : ?>
                        <img src="<?php echo esc_url((string) $recommendation['cover_url']); ?>" alt="" loading="lazy" decoding="async">
                    <?php else : ?>
                        <span class="l4s-recommendation-placeholder" aria-hidden="true"><?php echo esc_html(mb_strtoupper(mb_substr((string) $recommendation['title'], 0, 1))); ?></span>
                    <?php endif; ?>
                    <span class="l4s-recommendation-type" data-l4s-i18n="<?php echo esc_attr((string) ($recommendation['type_key'] ?? 'related_type_url')); ?>"><?php echo esc_html((string) ($recommendation['input_type'] ?? 'url')); ?></span>
                </span>
                <span class="l4s-recommendation-copy">
                    <strong><?php echo esc_html((string) $recommendation['title']); ?></strong>
                    <?php if (!empty($recommendation['description'])) : ?><small><?php echo esc_html((string) $recommendation['description']); ?></small><?php endif; ?>
                    <span class="l4s-recommendation-footer">
                        <span><b><?php echo esc_html(number_format_i18n((int) ($recommendation['views'] ?? 0))); ?></b> <span data-l4s-i18n="related_views">lượt xem</span></span>
                        <em><span data-l4s-i18n="<?php echo esc_attr((string) ($recommendation['action_key'] ?? 'recommend_open_action')); ?>"><?php echo esc_html((string) ($recommendation['action'] ?? 'Xem link')); ?></span><i aria-hidden="true">→</i></em>
                    </span>
                </span>
            </a>
        <?php endforeach; ?>
    </div>
</section>
