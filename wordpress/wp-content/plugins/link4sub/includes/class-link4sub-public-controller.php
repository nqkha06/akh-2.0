<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Link4Sub_Public_Controller
{
    private Link4Sub_API_Client $api;
    private Link4Sub_Visit_Store $visits;
    private Link4Sub_Settings $settings;

    public function __construct(
        Link4Sub_API_Client $api,
        Link4Sub_Visit_Store $visits,
        Link4Sub_Settings $settings
    )
    {
        $this->api = $api;
        $this->visits = $visits;
        $this->settings = $settings;
    }

    public function register(): void
    {
        add_action('init', array($this, 'register_rewrite_rule'));
        add_filter('query_vars', array($this, 'register_query_var'));
        add_action('template_redirect', array($this, 'render_public_link'), 0);
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }

    public function register_rewrite_rule(): void
    {
        $prefix = preg_quote((string) $this->settings->get('route_prefix', 'l'), '#');
        add_rewrite_rule(
            '^' . $prefix . '/([a-z0-9][a-z0-9-]{0,127})/?$',
            'index.php?link4sub_slug=$matches[1]',
            'top'
        );
    }

    public function register_query_var(array $query_vars): array
    {
        $query_vars[] = 'link4sub_slug';
        return $query_vars;
    }

    public function register_rest_routes(): void
    {
        register_rest_route('link4sub/v1', '/links/(?P<slug>[a-z0-9][a-z0-9-]{0,127})/complete', array(
            'methods'             => array('GET', 'POST'),
            'callback'            => array($this, 'complete_visit'),
            'permission_callback' => '__return_true',
            'args'                => array(
                'slug' => array(
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_key',
                ),
                'visit_ref' => array(
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));
    }

    public function complete_visit(WP_REST_Request $request)
    {
        $slug = (string) $request->get_param('slug');
        $reference = (string) $request->get_param('visit_ref');
        $visit = $this->visits->get($reference, $slug);
        if (is_wp_error($visit)) {
            return $visit;
        }

        $result = $this->api->complete_visit($slug, $visit['visit_token']);
        if (is_wp_error($result)) {
            return $result;
        }

        $this->visits->delete($reference);
        $response = rest_ensure_response($this->api->normalize_public_payload($result));
        $response->header('Cache-Control', 'no-store, max-age=0');
        return $response;
    }

    public function render_public_link(): void
    {
        $slug = (string) get_query_var('link4sub_slug');
        if ($slug === '') {
            return;
        }

        if (!preg_match('/^[a-z0-9][a-z0-9-]{0,127}$/', $slug)) {
            $this->render_status('not_found', 404);
        }

        if ($this->settings->get('delivery_mode', 'original') === 'random_post') {
            $safe_url = add_query_arg(
                (string) $this->settings->get('safe_alias_parameter', 'alias'),
                $slug,
                home_url('/' . trim((string) $this->settings->get('safe_route', 'safe'), '/') . '/')
            );
            wp_safe_redirect($safe_url, 302, 'Link4Sub Safe Redirect');
            exit;
        }

        nocache_headers();
        $link = $this->api->record_visit($slug, array(
            'siteKey' => (string) $this->settings->get('site_key', 'wordpress-main'),
            'deliveryMode' => 'original',
            'locale' => determine_locale(),
            'placements' => array('unlock_redirect', 'popunder', 'stu_before', 'stu_after'),
        ));
        if (is_wp_error($link)) {
            $status = (int) ($link->get_error_data()['status'] ?? 502);
            $this->render_status($status === 404 ? 'not_found' : 'api_error', $status);
        }

        if (!$this->is_valid_link_payload($link)) {
            $this->render_status('api_error', 502);
        }

        $link = $this->api->normalize_public_payload($link);
        $status = strtolower((string) $link['status']);
        if (in_array($status, array('violated', 'violation', 'blocked', 'suspended'), true)) {
            $this->render_status('violation', 403);
        }
        if (in_array($status, array('deleted', 'removed'), true)) {
            $this->render_status('deleted', 410);
        }
        if (in_array($status, array('inactive', 'paused', 'expired'), true)) {
            $this->render_status('unavailable', 410);
        }

        $visit_reference = $this->visits->create(
            $slug,
            $link['visitToken'] ?? null
        );
        unset($link['visitToken']);

        $complete_url = rest_url(
            'link4sub/v1/links/' . rawurlencode($slug) . '/complete'
        );
        $monetization_url = $this->monetization_redirect_url(
            $link['monetizationRedirectUrl'] ?? null,
            $slug,
            $visit_reference,
            $complete_url
        );
        $unlock_smartlink = $this->prepare_unlock_smartlink(
            $link['monetizationAds'] ?? array(),
            $slug,
            $visit_reference,
            $complete_url
        );
        $popunder_smartlink = $this->prepare_popunder_smartlink(
            $link['monetizationAds'] ?? array(),
            $slug,
            $visit_reference,
            $complete_url
        );
        unset($link['monetizationRedirectUrl']);

        if ($unlock_smartlink === null && $popunder_smartlink === null && $monetization_url !== null) {
            wp_redirect($monetization_url, 302, 'Link4Sub');
            exit;
        }

        $view = $this->prepare_view(
            $link,
            $slug,
            $visit_reference,
            $complete_url,
            $unlock_smartlink,
            $popunder_smartlink
        );
        status_header(200);
        include LINK4SUB_PLUGIN_DIR . 'templates/public-link.php';
        exit;
    }

    public function icon(string $name, string $class = ''): void
    {
        $paths = array(
            'arrow' => '<path d="m9 18 6-6-6-6"/><path d="m15 18 6-6-6-6"/>',
            'check' => '<path d="M20 6 9 17l-5-5"/>',
            'external' => '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
            'eye' => '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
            'file' => '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
            'globe' => '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
            'lock' => '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
            'message' => '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>',
            'moon' => '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
            'share' => '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
            'sun' => '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
            'user' => '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
            'users' => '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
        );
        $path = $paths[$name] ?? $paths['globe'];
        printf(
            '<svg class="%s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>',
            esc_attr($class),
            $path // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        );
    }

    private function is_valid_link_payload($link): bool
    {
        return is_array($link)
            && isset($link['slug'], $link['title'], $link['status'], $link['actions'])
            && is_string($link['slug'])
            && is_string($link['title'])
            && is_string($link['status'])
            && is_array($link['actions']);
    }

    public function prepare_view(
        array $link,
        string $slug,
        ?string $visit_reference,
        string $complete_url,
        ?array $unlock_smartlink = null,
        ?array $popunder_smartlink = null
    ): array {
        $background = isset($link['backgroundSettings']) && is_array($link['backgroundSettings'])
            ? $link['backgroundSettings']
            : array();
        $effects = isset($background['effects']) && is_array($background['effects'])
            ? $background['effects']
            : array();
        $actions = array();

        foreach ($link['actions'] as $index => $action) {
            if (!is_array($action) || !isset($action['url']) || !is_string($action['url'])) {
                continue;
            }
            $action_url = esc_url_raw($action['url'], array('http', 'https'));
            if (!$action_url) {
                continue;
            }
            $action_name = isset($action['action']) && is_string($action['action'])
                ? $action['action']
                : '';
            $platform = isset($action['platform']) && is_string($action['platform'])
                ? $action['platform']
                : 'other';
            $actions[] = array(
                'id'       => isset($action['id']) ? (string) $action['id'] : (string) $index,
                'url'      => $action_url,
                'action'   => $action_name,
                'platform' => $platform,
                'label'    => $this->action_label($action_name),
                'label_key' => 'action_' . str_replace('-', '_', sanitize_key($action_name)),
                'icon'     => $this->action_icon($action_name),
            );
        }

        $requested_page_count = isset($link['showConfig']['pageCount'])
            ? (int) $link['showConfig']['pageCount']
            : 1;
        $page_count = max(1, min(20, $requested_page_count));
        $page_count = min($page_count, max(1, count($actions)));
        $base_size = intdiv(count($actions), $page_count);
        $remainder = count($actions) % $page_count;
        $offset = 0;
        for ($page = 0; $page < $page_count; $page++) {
            $page_size = $base_size + ($page < $remainder ? 1 : 0);
            for ($position = 0; $position < $page_size; $position++) {
                $actions[$offset + $position]['page'] = $page;
            }
            $offset += $page_size;
        }

        $same_as_cover = !empty($background['sameAsCoverImage']);
        $background_url = $same_as_cover
            ? ($link['coverImageUrl'] ?? null)
            : ($background['backgroundMediaUrl'] ?? null);
        $background_type = $same_as_cover
            ? 'image'
            : (isset($background['backgroundMediaType']) ? (string) $background['backgroundMediaType'] : '');

        return array(
            'slug'              => $slug,
            'title'             => (string) $link['title'],
            'subtitle'          => isset($link['subtitle']) && is_string($link['subtitle']) ? $link['subtitle'] : '',
            'input_type'        => isset($link['inputType']) && is_string($link['inputType']) ? $link['inputType'] : 'url',
            'destination_url'   => isset($link['destinationUrl']) && is_string($link['destinationUrl']) ? $link['destinationUrl'] : '',
            'cover_url'         => isset($link['coverImageUrl']) && is_string($link['coverImageUrl']) ? $link['coverImageUrl'] : '',
            'background_url'    => is_string($background_url) ? $background_url : '',
            'background_type'   => in_array($background_type, array('image', 'video', 'youtube'), true) ? $background_type : '',
            'background_filter' => sprintf(
                'opacity(%s) blur(%spx) saturate(%s) contrast(%s) grayscale(%s)',
                $this->range($effects['opacity'] ?? 100, 0, 100) / 100,
                $this->range($effects['blur'] ?? 0, 0, 30),
                $this->range($effects['saturation'] ?? 100, 0, 200) / 100,
                $this->range($effects['contrast'] ?? 100, 0, 200) / 100,
                $this->range($effects['grayscale'] ?? 0, 0, 100) / 100
            ),
            'youtube_embed_url' => $background_type === 'youtube' ? $this->youtube_embed_url($background_url) : '',
            'actions'           => $actions,
            'show_page_count'   => $page_count,
            'brand'             => (string) $this->settings->get('brand_name', 'Link4Sub'),
            'app_url'           => $this->api->app_base_url(),
            'visit_reference'   => $visit_reference,
            'complete_url'      => $complete_url,
            'route_prefix'      => (string) $this->settings->get('route_prefix', 'l'),
            'banner'            => $this->settings->banner_for_slug($slug),
            'appearance'        => $this->settings->appearance(),
            'monetization_ads'  => $this->prepare_monetization_ads($link['monetizationAds'] ?? array()),
            'unlock_smartlink'  => $unlock_smartlink,
            'popunder_smartlink' => $popunder_smartlink,
            'i18n'              => $this->settings->language_bundle(),
            'recommendations'   => Link4Sub_Recommendations::from_api(
                $link['relatedLinks'] ?? array(),
                $slug,
                (string) $this->settings->get('route_prefix', 'l')
            ),
        );
    }

    public function prepare_unlock_smartlink(
        $items,
        string $slug,
        ?string $reference,
        string $complete_url
    ): ?array {
        return $this->prepare_smartlink(
            $items,
            'unlock_redirect',
            $slug,
            $reference,
            $complete_url
        );
    }

    public function prepare_popunder_smartlink(
        $items,
        string $slug,
        ?string $reference,
        string $complete_url
    ): ?array {
        return $this->prepare_smartlink(
            $items,
            'popunder',
            $slug,
            $reference,
            $complete_url
        );
    }

    private function prepare_smartlink(
        $items,
        string $placement,
        string $slug,
        ?string $reference,
        string $complete_url
    ): ?array {
        if (!is_array($items)) return null;
        foreach ($items as $item) {
            if (!is_array($item) || ($item['format'] ?? null) !== 'smartlink' || ($item['placement'] ?? null) !== $placement) {
                continue;
            }
            $content = isset($item['content']) && is_array($item['content']) ? $item['content'] : array();
            $url = $this->monetization_redirect_url(
                $content['targetUrl'] ?? null,
                $slug,
                $reference,
                $complete_url
            );
            if ($url === null) return null;
            return array(
                'id' => sanitize_key((string) ($item['id'] ?? 'smartlink')),
                'url' => $url,
                'delay_seconds' => max(0, min(300, (int) ($content['redirectDelaySeconds'] ?? 5))),
            );
        }
        return null;
    }

    private function prepare_monetization_ads($items): array
    {
        if (!is_array($items)) return array();
        $result = array();
        $placements = array('stu_before', 'stu_after', 'safe_overlay_top', 'safe_overlay_bottom');
        foreach ($items as $item) {
            if (!is_array($item)) continue;
            $format = isset($item['format']) ? sanitize_key((string) $item['format']) : '';
            $placement = isset($item['placement']) ? sanitize_key((string) $item['placement']) : '';
            $content = isset($item['content']) && is_array($item['content']) ? $item['content'] : array();
            if (!in_array($format, array('banner', 'script'), true) || !in_array($placement, $placements, true)) continue;
            $normalized = array(
                'id' => sanitize_key((string) ($item['id'] ?? '')),
                'format' => $format,
                'placement' => $placement,
                'title' => sanitize_text_field((string) ($content['title'] ?? '')),
                'description' => sanitize_textarea_field((string) ($content['description'] ?? '')),
                'cta_label' => sanitize_text_field((string) ($content['ctaLabel'] ?? 'Tìm hiểu thêm')),
                'new_tab' => !empty($content['newTab']),
                'image_url' => esc_url_raw((string) ($content['imageUrl'] ?? ''), array('http', 'https')),
                'click_url' => esc_url_raw((string) ($content['clickUrl'] ?? ''), array('http', 'https')),
                'adapter' => sanitize_key((string) ($content['adapter'] ?? '')),
                'script_url' => esc_url_raw((string) ($content['scriptUrl'] ?? ''), array('http', 'https')),
                'zone_id' => sanitize_text_field((string) ($content['zoneId'] ?? '')),
            );
            if ($format === 'banner' && (!$normalized['image_url'] || !$normalized['click_url'])) continue;
            if ($format === 'script' && ($normalized['adapter'] !== 'external-script-v1' || !$normalized['script_url'])) continue;
            $result[$placement] = $normalized;
        }
        return $result;
    }

    private function render_status(string $kind, int $http_status): void
    {
        status_header($http_status);
        nocache_headers();
        $view = array(
            'kind'    => $kind,
            'brand'   => (string) $this->settings->get('brand_name', 'Link4Sub'),
            'app_url' => $this->api->app_base_url(),
            'appearance' => $this->settings->appearance(),
        );
        include LINK4SUB_PLUGIN_DIR . 'templates/status.php';
        exit;
    }

    public function monetization_redirect_url($target, string $slug, ?string $reference, string $complete_url): ?string
    {
        if (!is_string($target) || !$reference) {
            return null;
        }
        if (substr($target, -2) === '/.') {
            $target = substr($target, 0, -1) . rawurlencode($slug);
        }
        $target = esc_url_raw($target, array('http', 'https'));
        if (!$target) {
            return null;
        }

        return add_query_arg(array(
            'slug'    => $slug,
            'dataUrl' => add_query_arg('visit_ref', $reference, $complete_url),
        ), $target);
    }

    private function action_label(string $action): string
    {
        $labels = array(
            'subscribe' => 'Đăng ký kênh', 'subscribe-notifications' => 'Đăng ký và bật thông báo',
            'other-visit' => 'Truy cập website', 'visit-page' => 'Truy cập trang',
            'like' => 'Like video', 'comment' => 'Bình luận video',
            'like-comment' => 'Like và bình luận video', 'watch' => 'Xem video',
            'tiktok-follow' => 'Theo dõi người dùng', 'follow' => 'Theo dõi người dùng',
            'reply' => 'Trả lời bài đăng', 'repost' => 'Đăng lại',
            'like-page' => 'Like trang', 'like-post' => 'Like bài đăng',
            'share' => 'Chia sẻ bài đăng', 'join-server' => 'Tham gia server',
            'join-channel' => 'Tham gia kênh', 'follow-artist' => 'Theo dõi nghệ sĩ',
            'like-song' => 'Like bài hát', 'follow-streamer' => 'Theo dõi streamer',
            'follow-creator' => 'Theo dõi nhà sáng tạo', 'connect' => 'Kết nối',
            'follow-company' => 'Theo dõi công ty', 'add-user' => 'Thêm người dùng',
            'upvote' => 'Upvote bài đăng', 'upvote-product' => 'Upvote sản phẩm',
            'join-group' => 'Tham gia nhóm',
        );
        if (isset($labels[$action])) {
            return $labels[$action];
        }
        return ucwords(str_replace(array('-', '_'), ' ', $action ?: 'visit'));
    }

    private function action_icon(string $action): string
    {
        if (str_contains($action, 'join')) return 'users';
        if (str_contains($action, 'comment') || $action === 'reply') return 'message';
        if ($action === 'watch') return 'eye';
        if (str_contains($action, 'follow') || str_contains($action, 'subscribe')) return 'user';
        return 'globe';
    }

    private function youtube_embed_url($value): string
    {
        if (!is_string($value) || !wp_http_validate_url($value)) return '';
        $parts = wp_parse_url($value);
        $host = preg_replace('/^www\./', '', strtolower($parts['host'] ?? ''));
        $video_id = '';
        if ($host === 'youtu.be') {
            $video_id = trim($parts['path'] ?? '', '/');
        } elseif (in_array($host, array('youtube.com', 'm.youtube.com', 'music.youtube.com'), true)) {
            $path = trim($parts['path'] ?? '', '/');
            if (str_starts_with($path, 'shorts/') || str_starts_with($path, 'embed/')) {
                $video_id = explode('/', $path)[1] ?? '';
            } else {
                parse_str($parts['query'] ?? '', $query);
                $video_id = isset($query['v']) ? (string) $query['v'] : '';
            }
        }
        if (!preg_match('/^[A-Za-z0-9_-]{11}$/', $video_id)) return '';
        return 'https://www.youtube.com/embed/' . rawurlencode($video_id)
            . '?autoplay=1&mute=1&controls=0&loop=1&playlist=' . rawurlencode($video_id)
            . '&playsinline=1&modestbranding=1&rel=0&enablejsapi=1';
    }

    private function range($value, float $minimum, float $maximum): float
    {
        $number = is_numeric($value) ? (float) $value : $minimum;
        return max($minimum, min($maximum, $number));
    }
}
