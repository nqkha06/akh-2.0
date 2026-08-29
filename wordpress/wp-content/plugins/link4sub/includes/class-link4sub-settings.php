<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Link4Sub_Settings
{
    public const OPTION_NAME = 'link4sub_settings';

    public function defaults(): array
    {
        return array(
            'api_base_url' => $this->environment_default(
                'LINK4SUB_API_BASE_URL',
                'http://localhost:4000/api'
            ),
            'public_api_base_url' => $this->environment_default(
                'LINK4SUB_PUBLIC_API_BASE_URL',
                'http://localhost:4000/api'
            ),
            'app_base_url' => $this->environment_default(
                'LINK4SUB_APP_BASE_URL',
                'http://localhost:3000'
            ),
            'brand_name' => defined('LINK4SUB_BRAND_NAME')
                ? (string) LINK4SUB_BRAND_NAME
                : 'Link4Sub',
            'route_prefix' => 'l',
            'request_timeout' => 10,

            'delivery_mode' => 'original',
            'safe_route' => 'safe',
            'safe_alias_parameter' => 'alias',
            'safe_post_types' => 'post',
            'safe_include_categories' => '',
            'safe_exclude_categories' => '',
            'safe_pool_size' => 200,
            'safe_pool_cache_minutes' => 10,
            'safe_cookie_ttl_minutes' => 60,
            'safe_render_style' => 'fullscreen',
            'safe_render_delay' => 0,
            'safe_allow_close' => false,

            'banner_enabled' => false,
            'banner_style' => 'gradient',
            'banner_position' => 'before_card',
            'banner_eyebrow' => 'THÔNG BÁO',
            'banner_title' => 'Khám phá thêm từ Link4Sub',
            'banner_description' => '',
            'banner_primary_label' => 'Tìm hiểu thêm',
            'banner_primary_url' => '',
            'banner_secondary_label' => '',
            'banner_secondary_url' => '',
            'banner_image_url' => '',
            'banner_alignment' => 'left',
            'banner_dismissible' => true,
            'banner_new_tab' => false,
            'banner_show_mobile' => true,
            'banner_targeting' => 'all',
            'banner_slugs' => '',
            'banner_start_at' => '',
            'banner_end_at' => '',

            'appearance_accent' => '#5e6ad2',
            'appearance_accent_hover' => '#828fff',
            'appearance_success' => '#27a644',
            'appearance_background_light' => '#f8fafc',
            'appearance_background_dark' => '#010102',
            'appearance_card_radius' => 12,
            'appearance_content_width' => 680,
            'appearance_surface_opacity' => 95,
            'appearance_overlay_opacity' => 75,
            'appearance_logo_url' => '',
            'appearance_default_theme' => 'light',
            'appearance_font' => 'system',
            'appearance_show_header' => true,
            'appearance_show_footer' => true,
            'appearance_compact_actions' => false,
        );
    }

    public function install_defaults(): void
    {
        if (get_option(self::OPTION_NAME, null) === null) {
            add_option(self::OPTION_NAME, $this->defaults(), '', false);
        }
    }

    public function all(): array
    {
        $stored = get_option(self::OPTION_NAME, array());
        return wp_parse_args(is_array($stored) ? $stored : array(), $this->defaults());
    }

    public function get(string $key, $fallback = null)
    {
        $settings = $this->all();
        return array_key_exists($key, $settings) ? $settings[$key] : $fallback;
    }

    public function sanitize($input): array
    {
        $input = is_array($input) ? wp_unslash($input) : array();
        $current = $this->all();
        $tab = isset($input['_tab']) ? sanitize_key($input['_tab']) : 'general';

        if ($tab === 'general') {
            foreach (array('api_base_url', 'public_api_base_url', 'app_base_url') as $key) {
                if (isset($input[$key])) {
                    $url = esc_url_raw(trim((string) $input[$key]), array('http', 'https'));
                    if ($url !== '') {
                        $current[$key] = untrailingslashit($url);
                    }
                }
            }
            $current['brand_name'] = $this->text($input['brand_name'] ?? '', 80, 'Link4Sub');
            $prefix = strtolower((string) ($input['route_prefix'] ?? 'l'));
            $prefix = trim(preg_replace('/[^a-z0-9-]+/', '-', $prefix), '-');
            $current['route_prefix'] = $prefix !== '' ? substr($prefix, 0, 32) : 'l';
            $current['request_timeout'] = $this->integer($input['request_timeout'] ?? 10, 2, 30);
        }

        if ($tab === 'banner') {
            $current['banner_enabled'] = !empty($input['banner_enabled']);
            $current['banner_style'] = $this->choice($input['banner_style'] ?? '', array('gradient', 'accent', 'minimal', 'glass'), 'gradient');
            $current['banner_position'] = $this->choice($input['banner_position'] ?? '', array('before_card', 'after_card'), 'before_card');
            $current['banner_alignment'] = $this->choice($input['banner_alignment'] ?? '', array('left', 'center'), 'left');
            $current['banner_eyebrow'] = $this->text($input['banner_eyebrow'] ?? '', 60);
            $current['banner_title'] = $this->text($input['banner_title'] ?? '', 140);
            $current['banner_description'] = sanitize_textarea_field((string) ($input['banner_description'] ?? ''));
            $current['banner_primary_label'] = $this->text($input['banner_primary_label'] ?? '', 60);
            $current['banner_primary_url'] = esc_url_raw((string) ($input['banner_primary_url'] ?? ''), array('http', 'https'));
            $current['banner_secondary_label'] = $this->text($input['banner_secondary_label'] ?? '', 60);
            $current['banner_secondary_url'] = esc_url_raw((string) ($input['banner_secondary_url'] ?? ''), array('http', 'https'));
            $current['banner_image_url'] = esc_url_raw((string) ($input['banner_image_url'] ?? ''), array('http', 'https'));
            $current['banner_dismissible'] = !empty($input['banner_dismissible']);
            $current['banner_new_tab'] = !empty($input['banner_new_tab']);
            $current['banner_show_mobile'] = !empty($input['banner_show_mobile']);
            $current['banner_targeting'] = $this->choice($input['banner_targeting'] ?? '', array('all', 'include', 'exclude'), 'all');
            $current['banner_slugs'] = $this->sanitize_slugs($input['banner_slugs'] ?? '');
            $current['banner_start_at'] = $this->datetime($input['banner_start_at'] ?? '');
            $current['banner_end_at'] = $this->datetime($input['banner_end_at'] ?? '');
        }

        if ($tab === 'safe') {
            $current['delivery_mode'] = $this->choice($input['delivery_mode'] ?? '', array('original', 'random_post'), 'original');
            $route = strtolower((string) ($input['safe_route'] ?? 'safe'));
            $route = trim(preg_replace('/[^a-z0-9-]+/', '-', $route), '-');
            $current['safe_route'] = $route !== '' ? substr($route, 0, 32) : 'safe';
            $parameter = sanitize_key((string) ($input['safe_alias_parameter'] ?? 'alias'));
            $current['safe_alias_parameter'] = $parameter !== '' ? substr($parameter, 0, 32) : 'alias';
            $current['safe_post_types'] = $this->sanitize_post_types($input['safe_post_types'] ?? 'post');
            $current['safe_include_categories'] = $this->sanitize_ids($input['safe_include_categories'] ?? '');
            $current['safe_exclude_categories'] = $this->sanitize_ids($input['safe_exclude_categories'] ?? '');
            $current['safe_pool_size'] = $this->integer($input['safe_pool_size'] ?? 200, 10, 1000);
            $current['safe_pool_cache_minutes'] = $this->integer($input['safe_pool_cache_minutes'] ?? 10, 1, 1440);
            $current['safe_cookie_ttl_minutes'] = $this->integer($input['safe_cookie_ttl_minutes'] ?? 60, 5, 1440);
            $current['safe_render_style'] = $this->choice($input['safe_render_style'] ?? '', array('fullscreen', 'modal'), 'fullscreen');
            $current['safe_render_delay'] = $this->integer($input['safe_render_delay'] ?? 0, 0, 30);
            $current['safe_allow_close'] = !empty($input['safe_allow_close']);
        }

        if ($tab === 'appearance') {
            foreach (array('accent', 'accent_hover', 'success', 'background_light', 'background_dark') as $color) {
                $key = 'appearance_' . $color;
                $current[$key] = $this->color($input[$key] ?? '', $current[$key]);
            }
            $current['appearance_card_radius'] = $this->integer($input['appearance_card_radius'] ?? 12, 6, 32);
            $current['appearance_content_width'] = $this->integer($input['appearance_content_width'] ?? 680, 480, 960);
            $current['appearance_surface_opacity'] = $this->integer($input['appearance_surface_opacity'] ?? 95, 70, 100);
            $current['appearance_overlay_opacity'] = $this->integer($input['appearance_overlay_opacity'] ?? 75, 0, 100);
            $current['appearance_logo_url'] = esc_url_raw((string) ($input['appearance_logo_url'] ?? ''), array('http', 'https'));
            $current['appearance_default_theme'] = $this->choice($input['appearance_default_theme'] ?? '', array('light', 'dark', 'system'), 'light');
            $current['appearance_font'] = $this->choice($input['appearance_font'] ?? '', array('system', 'inter', 'rounded', 'serif'), 'system');
            $current['appearance_show_header'] = !empty($input['appearance_show_header']);
            $current['appearance_show_footer'] = !empty($input['appearance_show_footer']);
            $current['appearance_compact_actions'] = !empty($input['appearance_compact_actions']);
        }

        return $current;
    }

    public function banner_for_slug(string $slug): ?array
    {
        $settings = $this->all();
        if (empty($settings['banner_enabled'])) {
            return null;
        }

        $now = current_datetime();
        foreach (array('start_at' => 'banner_start_at', 'end_at' => 'banner_end_at') as $type => $key) {
            if ($settings[$key] === '') continue;
            try {
                $boundary = new DateTimeImmutable($settings[$key], wp_timezone());
                if (($type === 'start_at' && $now < $boundary) || ($type === 'end_at' && $now > $boundary)) {
                    return null;
                }
            } catch (Exception $error) {
                return null;
            }
        }

        $slugs = preg_split('/[\s,]+/', strtolower((string) $settings['banner_slugs']), -1, PREG_SPLIT_NO_EMPTY);
        $matches = in_array(strtolower($slug), $slugs ?: array(), true);
        if ($settings['banner_targeting'] === 'include' && !$matches) return null;
        if ($settings['banner_targeting'] === 'exclude' && $matches) return null;

        return array(
            'id' => substr(hash('sha256', wp_json_encode($settings)), 0, 16),
            'style' => $settings['banner_style'],
            'position' => $settings['banner_position'],
            'alignment' => $settings['banner_alignment'],
            'eyebrow' => $settings['banner_eyebrow'],
            'title' => $settings['banner_title'],
            'description' => $settings['banner_description'],
            'primary_label' => $settings['banner_primary_label'],
            'primary_url' => $settings['banner_primary_url'],
            'secondary_label' => $settings['banner_secondary_label'],
            'secondary_url' => $settings['banner_secondary_url'],
            'image_url' => $settings['banner_image_url'],
            'dismissible' => (bool) $settings['banner_dismissible'],
            'new_tab' => (bool) $settings['banner_new_tab'],
            'show_mobile' => (bool) $settings['banner_show_mobile'],
        );
    }

    public function appearance(): array
    {
        $settings = $this->all();
        $opacity = ((int) $settings['appearance_surface_opacity']) / 100;
        $overlay = ((int) $settings['appearance_overlay_opacity']) / 100;
        return array(
            'accent' => $settings['appearance_accent'],
            'accent_hover' => $settings['appearance_accent_hover'],
            'success' => $settings['appearance_success'],
            'background_light' => $settings['appearance_background_light'],
            'background_dark' => $settings['appearance_background_dark'],
            'card_radius' => (int) $settings['appearance_card_radius'],
            'content_width' => (int) $settings['appearance_content_width'],
            'surface_light' => sprintf('rgba(255,255,255,%s)', $opacity),
            'surface_dark' => sprintf('rgba(15,16,17,%s)', $opacity),
            'overlay_light' => sprintf('rgba(255,255,255,%s)', $overlay),
            'overlay_dark' => sprintf('rgba(0,0,0,%s)', min(1, $overlay + 0.05)),
            'logo_url' => $settings['appearance_logo_url'],
            'default_theme' => $settings['appearance_default_theme'],
            'font' => $settings['appearance_font'],
            'show_header' => (bool) $settings['appearance_show_header'],
            'show_footer' => (bool) $settings['appearance_show_footer'],
            'compact_actions' => (bool) $settings['appearance_compact_actions'],
        );
    }

    private function environment_default(string $key, string $fallback): string
    {
        $environment = getenv($key);
        if (is_string($environment) && $environment !== '') return $environment;
        if (defined($key)) return (string) constant($key);
        return $fallback;
    }

    private function text($value, int $limit, string $fallback = ''): string
    {
        $value = sanitize_text_field((string) $value);
        if ($value === '') return $fallback;
        return mb_substr($value, 0, $limit);
    }

    private function choice($value, array $allowed, string $fallback): string
    {
        $value = sanitize_key((string) $value);
        return in_array($value, $allowed, true) ? $value : $fallback;
    }

    private function integer($value, int $minimum, int $maximum): int
    {
        return max($minimum, min($maximum, (int) $value));
    }

    private function color($value, string $fallback): string
    {
        $color = sanitize_hex_color((string) $value);
        return $color ?: $fallback;
    }

    private function datetime($value): string
    {
        $value = trim((string) $value);
        return preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $value) ? $value : '';
    }

    private function sanitize_slugs($value): string
    {
        $slugs = preg_split('/[\s,]+/', strtolower((string) $value), -1, PREG_SPLIT_NO_EMPTY);
        $slugs = array_values(array_unique(array_filter(array_map(static function ($slug) {
            return preg_match('/^[a-z0-9][a-z0-9-]{0,127}$/', $slug) ? $slug : null;
        }, $slugs ?: array()))));
        return implode(', ', array_slice($slugs, 0, 200));
    }

    private function sanitize_post_types($value): string
    {
        $requested = preg_split('/[\s,]+/', strtolower((string) $value), -1, PREG_SPLIT_NO_EMPTY);
        $public = get_post_types(array('public' => true), 'names');
        unset($public['attachment']);
        $allowed = array_values(array_intersect($requested ?: array(), array_keys($public)));
        return implode(', ', array_slice(array_unique($allowed ?: array('post')), 0, 20));
    }

    private function sanitize_ids($value): string
    {
        $ids = preg_split('/[\s,]+/', (string) $value, -1, PREG_SPLIT_NO_EMPTY);
        $ids = array_values(array_unique(array_filter(array_map('absint', $ids ?: array()))));
        return implode(', ', array_slice($ids, 0, 200));
    }
}
