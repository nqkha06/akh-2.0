<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Link4Sub_Safe_Redirect
{
    private const COOKIE_NAME = 'link4sub_safe_context';

    private Link4Sub_Settings $settings;
    private Link4Sub_API_Client $api;
    private Link4Sub_Visit_Store $visits;
    private Link4Sub_Public_Controller $renderer;
    private ?array $overlay = null;
    private bool $rendered = false;

    public function __construct(
        Link4Sub_Settings $settings,
        Link4Sub_API_Client $api,
        Link4Sub_Visit_Store $visits,
        Link4Sub_Public_Controller $renderer
    ) {
        $this->settings = $settings;
        $this->api = $api;
        $this->visits = $visits;
        $this->renderer = $renderer;
    }

    public function register(): void
    {
        add_action('template_redirect', array($this, 'handle_safe_entry'), -20);
        add_action('template_redirect', array($this, 'prepare_article_overlay'), -10);
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_filter('body_class', array($this, 'body_class'));
        add_action('wp_body_open', array($this, 'render_overlay'), 0);
        add_action('wp_footer', array($this, 'render_overlay'), 1);
    }

    public function handle_safe_entry(): void
    {
        if (!$this->is_safe_request()) return;

        $parameter = (string) $this->settings->get('safe_alias_parameter', 'alias');
        $alias = isset($_GET[$parameter]) ? trim((string) wp_unslash($_GET[$parameter])) : '';
        if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/', $alias)) {
            wp_die(
                esc_html__('Alias không hợp lệ hoặc bị thiếu.', 'link4sub'),
                esc_html__('Link4Sub Safe Redirect', 'link4sub'),
                array('response' => 400)
            );
        }

        nocache_headers();
        if ($this->settings->get('delivery_mode', 'original') !== 'random_post') {
            $target = home_url('/' . trim((string) $this->settings->get('route_prefix', 'l'), '/') . '/' . rawurlencode($alias));
            wp_safe_redirect($target, 302, 'Link4Sub Original Renderer');
            exit;
        }

        $post_id = $this->random_post_id();
        if (!$post_id) {
            wp_die(
                esc_html__('Không có bài viết publish phù hợp với cấu hình Safe Redirect.', 'link4sub'),
                esc_html__('Link4Sub Safe Redirect', 'link4sub'),
                array('response' => 503)
            );
        }

        $this->set_context_cookie($alias, $post_id);
        wp_safe_redirect((string) get_permalink($post_id), 302, 'Link4Sub Random Post');
        exit;
    }

    public function prepare_article_overlay(): void
    {
        if ($this->settings->get('delivery_mode', 'original') !== 'random_post' || !is_singular()) {
            return;
        }

        $context = $this->read_context_cookie();
        if (!$context || (int) $context['post_id'] !== (int) get_queried_object_id()) {
            return;
        }

        if (!defined('DONOTCACHEPAGE')) define('DONOTCACHEPAGE', true);
        nocache_headers();
        $alias = (string) $context['alias'];
        $link = $this->api->record_visit($alias);
        if (is_wp_error($link)) {
            $status = (int) (($link->get_error_data()['status'] ?? 502));
            $this->overlay = $this->error_overlay($status === 404 ? 'not_found' : 'api_error');
            return;
        }

        if (!$this->valid_payload($link)) {
            $this->overlay = $this->error_overlay('api_error');
            return;
        }

        $link = $this->api->normalize_public_payload($link);
        $status = strtolower((string) $link['status']);
        if (!in_array($status, array('active', 'published'), true)) {
            $this->overlay = $this->error_overlay('unavailable');
            return;
        }

        $reference = $this->visits->create($alias, $link['visitToken'] ?? null);
        unset($link['visitToken']);
        $complete_url = rest_url('link4sub/v1/links/' . rawurlencode($alias) . '/complete');
        $view = $this->renderer->prepare_view($link, $alias, $reference, $complete_url);
        $this->overlay = array(
            'kind' => 'active',
            'view' => $view,
            'render_style' => (string) $this->settings->get('safe_render_style', 'fullscreen'),
            'render_delay' => (int) $this->settings->get('safe_render_delay', 0),
            'allow_close' => (bool) $this->settings->get('safe_allow_close', false),
        );
    }

    public function enqueue_assets(): void
    {
        if ($this->overlay === null) return;
        wp_enqueue_style(
            'link4sub-safe-overlay',
            LINK4SUB_PLUGIN_URL . 'assets/css/safe-overlay.css',
            array(),
            LINK4SUB_PLUGIN_VERSION
        );
        wp_enqueue_script(
            'link4sub-safe-overlay',
            LINK4SUB_PLUGIN_URL . 'assets/js/safe-overlay.js',
            array(),
            LINK4SUB_PLUGIN_VERSION,
            true
        );
    }

    public function body_class(array $classes): array
    {
        if ($this->overlay !== null) $classes[] = 'l4s-safe-capable';
        return $classes;
    }

    public function render_overlay(): void
    {
        if ($this->rendered || $this->overlay === null) return;
        $this->rendered = true;
        $overlay = $this->overlay;
        include LINK4SUB_PLUGIN_DIR . 'templates/safe-overlay.php';
    }

    private function is_safe_request(): bool
    {
        $request_path = wp_parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
        $safe_path = wp_parse_url(home_url('/' . trim((string) $this->settings->get('safe_route', 'safe'), '/') . '/'), PHP_URL_PATH);
        return untrailingslashit((string) $request_path) === untrailingslashit((string) $safe_path);
    }

    private function random_post_id(): ?int
    {
        $settings = $this->settings->all();
        $post_types = preg_split('/[\s,]+/', (string) $settings['safe_post_types'], -1, PREG_SPLIT_NO_EMPTY) ?: array('post');
        $include = array_values(array_filter(array_map('absint', preg_split('/[\s,]+/', (string) $settings['safe_include_categories'], -1, PREG_SPLIT_NO_EMPTY) ?: array())));
        $exclude = array_values(array_filter(array_map('absint', preg_split('/[\s,]+/', (string) $settings['safe_exclude_categories'], -1, PREG_SPLIT_NO_EMPTY) ?: array())));
        $cache_key = 'l4s_safe_pool_' . substr(hash('sha256', wp_json_encode(array($post_types, $include, $exclude, $settings['safe_pool_size']))), 0, 20);
        $ids = get_transient($cache_key);

        if (!is_array($ids)) {
            $query = array(
                'post_type' => $post_types,
                'post_status' => 'publish',
                'posts_per_page' => (int) $settings['safe_pool_size'],
                'orderby' => 'date',
                'order' => 'DESC',
                'fields' => 'ids',
                'no_found_rows' => true,
                'ignore_sticky_posts' => true,
                'suppress_filters' => false,
            );
            if ($include) $query['category__in'] = $include;
            if ($exclude) $query['category__not_in'] = $exclude;
            $ids = array_values(array_map('absint', get_posts($query)));
            set_transient($cache_key, $ids, ((int) $settings['safe_pool_cache_minutes']) * MINUTE_IN_SECONDS);
        }

        if (!$ids) return null;
        return (int) $ids[random_int(0, count($ids) - 1)];
    }

    private function set_context_cookie(string $alias, int $post_id): void
    {
        $ttl = ((int) $this->settings->get('safe_cookie_ttl_minutes', 60)) * MINUTE_IN_SECONDS;
        $payload = array(
            'alias' => $alias,
            'post_id' => $post_id,
            'exp' => time() + $ttl,
            'nonce' => wp_generate_password(16, false, false),
        );
        $encoded = $this->base64url_encode((string) wp_json_encode($payload));
        $value = $encoded . '.' . hash_hmac('sha256', $encoded, wp_salt('auth'));
        setcookie(self::COOKIE_NAME, $value, array(
            'expires' => time() + $ttl,
            'path' => COOKIEPATH ?: '/',
            'domain' => COOKIE_DOMAIN ?: '',
            'secure' => is_ssl(),
            'httponly' => true,
            'samesite' => 'Lax',
        ));
    }

    private function read_context_cookie(): ?array
    {
        $value = isset($_COOKIE[self::COOKIE_NAME]) ? (string) wp_unslash($_COOKIE[self::COOKIE_NAME]) : '';
        $parts = explode('.', $value, 2);
        if (count($parts) !== 2) return null;
        $expected = hash_hmac('sha256', $parts[0], wp_salt('auth'));
        if (!hash_equals($expected, $parts[1])) return null;
        $decoded = json_decode($this->base64url_decode($parts[0]), true);
        if (!is_array($decoded) || !isset($decoded['alias'], $decoded['post_id'], $decoded['exp'])) return null;
        if ((int) $decoded['exp'] < time() || !preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/', (string) $decoded['alias'])) return null;
        return $decoded;
    }

    private function base64url_encode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64url_decode(string $value): string
    {
        $padding = strlen($value) % 4;
        if ($padding) $value .= str_repeat('=', 4 - $padding);
        return (string) base64_decode(strtr($value, '-_', '+/'), true);
    }

    private function valid_payload($link): bool
    {
        return is_array($link)
            && isset($link['slug'], $link['title'], $link['status'], $link['actions'])
            && is_string($link['title'])
            && is_string($link['status'])
            && is_array($link['actions']);
    }

    private function error_overlay(string $kind): array
    {
        return array(
            'kind' => $kind,
            'view' => array(
                'brand' => (string) $this->settings->get('brand_name', 'Link4Sub'),
                'appearance' => $this->settings->appearance(),
            ),
            'render_style' => (string) $this->settings->get('safe_render_style', 'fullscreen'),
            'render_delay' => (int) $this->settings->get('safe_render_delay', 0),
            'allow_close' => (bool) $this->settings->get('safe_allow_close', false),
        );
    }
}
