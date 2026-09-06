<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Link4Sub_Safe_Redirect
{
    private const COOKIE_NAME = 'link4sub_safe_context';
    private const CLIENT_COOKIE_NAME = 'link4sub_safe_alias';

    private Link4Sub_Settings $settings;
    private Link4Sub_API_Client $api;
    private Link4Sub_Visit_Store $visits;
    private Link4Sub_Public_Controller $renderer;
    private ?array $overlay = null;

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
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('wp_head', array($this, 'render_critical_loader'), 0);
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
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

        $requested_page = 0;
        if (isset($_GET['l4s_page'])) {
            $page_number = filter_var(wp_unslash($_GET['l4s_page']), FILTER_VALIDATE_INT, array(
                'options' => array('min_range' => 1, 'max_range' => 20),
            ));
            if ($page_number === false) {
                wp_die(
                    esc_html__('Page STU không hợp lệ.', 'link4sub'),
                    esc_html__('Link4Sub Safe Redirect', 'link4sub'),
                    array('response' => 400)
                );
            }
            $requested_page = $page_number - 1;
        }
        $context = null;
        $excluded_post_ids = array();
        if ($requested_page > 0) {
            $context = $this->read_context_cookie();
            if (
                !$context ||
                !hash_equals((string) $context['alias'], $alias) ||
                $requested_page !== ((int) ($context['current_page'] ?? 0)) + 1 ||
                $requested_page >= (int) ($context['page_count'] ?? 1)
            ) {
                wp_die(
                    esc_html__('Page STU không hợp lệ hoặc flow đã hết hạn.', 'link4sub'),
                    esc_html__('Link4Sub Safe Redirect', 'link4sub'),
                    array('response' => 400)
                );
            }
            $excluded_post_ids = isset($context['used_post_ids']) && is_array($context['used_post_ids'])
                ? array_values(array_filter(array_map('absint', $context['used_post_ids'])))
                : array((int) $context['post_id']);
        }

        $post_id = $this->random_post_id($excluded_post_ids);
        if (!$post_id && $requested_page > 0 && $context) {
            $post_id = $this->random_post_id(array((int) $context['post_id']));
        }
        if (!$post_id) {
            wp_die(
                esc_html__('Không có bài viết publish khác phù hợp với cấu hình Safe Redirect.', 'link4sub'),
                esc_html__('Link4Sub Safe Redirect', 'link4sub'),
                array('response' => 503)
            );
        }

        if ($context) {
            $context['post_id'] = $post_id;
            $context['current_page'] = $requested_page;
            $context['used_post_ids'] = array_values(array_unique(array_merge($excluded_post_ids, array($post_id))));
            $this->write_context_cookie($context);
        } else {
            $this->set_context_cookie($alias, $post_id);
        }
        wp_safe_redirect((string) get_permalink($post_id), 302, 'Link4Sub Random Post');
        exit;
    }

    public function register_rest_routes(): void
    {
        register_rest_route('link4sub/v1', '/safe/hydrate', array(
            'methods' => 'POST',
            'callback' => array($this, 'hydrate_overlay'),
            'permission_callback' => '__return_true',
        ));
    }

    public function hydrate_overlay(WP_REST_Request $request)
    {
        $context = $this->read_context_cookie();
        $post_id = absint($request->get_param('post_id'));
        if (
            !$context ||
            $post_id < 1 ||
            (int) $context['post_id'] !== $post_id ||
            get_post_status($post_id) !== 'publish'
        ) {
            return new WP_Error(
                'link4sub_safe_context_invalid',
                __('Safe Redirect context is missing or expired.', 'link4sub'),
                array('status' => 409)
            );
        }

        $cached_view = $this->read_flow_view($context);
        if ($cached_view !== null) {
            $this->activate_overlay($cached_view, $context);
            return $this->overlay_response($this->overlay);
        }

        $alias = (string) $context['alias'];
        $client_error = sanitize_key((string) $request->get_param('error_kind'));
        if (in_array($client_error, array('not_found', 'api_error'), true)) {
            $this->overlay = $this->error_overlay($client_error);
            return $this->overlay_response($this->overlay);
        }

        $link = $request->get_param('link');
        if (!$this->valid_payload($link)) {
            $this->overlay = $this->error_overlay('api_error');
            return $this->overlay_response($this->overlay);
        }
        if (!hash_equals($alias, (string) $link['slug'])) {
            return new WP_Error(
                'link4sub_safe_alias_mismatch',
                __('The returned link does not match this Safe Redirect flow.', 'link4sub'),
                array('status' => 409)
            );
        }

        $link = $this->api->normalize_public_payload($link);
        $status = strtolower((string) $link['status']);
        if (!in_array($status, array('active', 'published'), true)) {
            $this->overlay = $this->error_overlay('unavailable');
            return $this->overlay_response($this->overlay);
        }

        $reference = $this->visits->create($alias, $link['visitToken'] ?? null);
        unset($link['visitToken']);
        $complete_url = rest_url('link4sub/v1/links/' . rawurlencode($alias) . '/complete');
        $smartlink_url = $this->renderer->monetization_redirect_url(
            $link['monetizationRedirectUrl'] ?? null,
            $alias,
            $reference,
            $complete_url
        );
        $unlock_smartlink = $this->renderer->prepare_unlock_smartlink(
            $link['monetizationAds'] ?? array(),
            $alias,
            $reference,
            $complete_url
        );
        $popunder_smartlink = $this->renderer->prepare_popunder_smartlink(
            $link['monetizationAds'] ?? array(),
            $alias,
            $reference,
            $complete_url
        );
        unset($link['monetizationRedirectUrl']);
        if ($unlock_smartlink === null && $popunder_smartlink === null && $smartlink_url !== null) {
            $link['destinationUrl'] = $smartlink_url;
            $link['inputType'] = 'url';
        }
        $view = $this->renderer->prepare_view(
            $link,
            $alias,
            $reference,
            $complete_url,
            $unlock_smartlink,
            $popunder_smartlink
        );
        $this->store_flow_view($context, $view);
        $this->activate_overlay($view, $context);
        return $this->overlay_response($this->overlay);
    }

    private function overlay_response(?array $overlay)
    {
        if (!$overlay) {
            return new WP_Error(
                'link4sub_safe_overlay_failed',
                __('Unable to prepare the STU overlay.', 'link4sub'),
                array('status' => 502)
            );
        }
        ob_start();
        include LINK4SUB_PLUGIN_DIR . 'templates/safe-overlay.php';
        $html = (string) ob_get_clean();
        $response = rest_ensure_response(array('html' => $html));
        $response->header('Cache-Control', 'no-store, max-age=0');
        return $response;
    }

    private function activate_overlay(array $view, array $context): void
    {
        $page_count = max(1, (int) ($view['show_page_count'] ?? 1));
        $current_page = max(0, min($page_count - 1, (int) ($context['current_page'] ?? 0)));
        $context['page_count'] = $page_count;
        $context['current_page'] = $current_page;
        $this->write_context_cookie($context);

        $next_page_url = null;
        if ($current_page < $page_count - 1) {
            $next_page_url = add_query_arg(array(
                (string) $this->settings->get('safe_alias_parameter', 'alias') => (string) $context['alias'],
                'l4s_page' => $current_page + 2,
            ), home_url('/' . trim((string) $this->settings->get('safe_route', 'safe'), '/') . '/'));
        }

        $this->overlay = array(
            'kind' => 'active',
            'view' => $view,
            'current_page' => $current_page,
            'next_page_url' => $next_page_url,
            'render_style' => (string) $this->settings->get('safe_render_style', 'fullscreen'),
            'render_delay' => (int) $this->settings->get('safe_render_delay', 0),
            'allow_close' => (bool) $this->settings->get('safe_allow_close', false),
        );
    }

    private function store_flow_view(array $context, array $view): void
    {
        $ttl = max(1, (int) ($context['exp'] ?? time()) - time());
        set_transient($this->flow_key((string) $context['nonce']), array(
            'alias' => (string) $context['alias'],
            'view' => $view,
        ), $ttl);
    }

    private function read_flow_view(array $context): ?array
    {
        $flow = get_transient($this->flow_key((string) $context['nonce']));
        if (
            !is_array($flow) ||
            !isset($flow['alias'], $flow['view']) ||
            !is_array($flow['view']) ||
            !hash_equals((string) $flow['alias'], (string) $context['alias'])
        ) {
            return null;
        }
        return $flow['view'];
    }

    private function flow_key(string $nonce): string
    {
        return 'link4sub_safe_flow_' . substr(hash('sha256', LINK4SUB_PLUGIN_VERSION . '|' . $nonce), 0, 32);
    }

    public function render_critical_loader(): void
    {
        if (
            $this->settings->get('delivery_mode', 'original') !== 'random_post' ||
            !is_singular()
        ) {
            return;
        }

        $appearance = $this->settings->appearance();
        $configuration = array(
            'cookie' => self::CLIENT_COOKIE_NAME,
            'postId' => (int) get_queried_object_id(),
            'defaultTheme' => (string) $appearance['default_theme'],
        );
        ?>
        <style id="l4s-safe-critical-loader">
            html.l4s-safe-booting{overflow:hidden!important}html.l4s-safe-booting::before{content:"";position:fixed;inset:0;z-index:2147483500;background:<?php echo esc_html((string) $appearance['background_light']); ?>}html.l4s-safe-booting.l4s-safe-boot-dark::before{background:<?php echo esc_html((string) $appearance['background_dark']); ?>}html.l4s-safe-booting::after{content:"";position:fixed;left:50%;top:50%;z-index:2147483600;width:34px;height:34px;margin:-19px 0 0 -19px;border:3px solid color-mix(in srgb,<?php echo esc_html((string) $appearance['accent']); ?> 18%,transparent);border-top-color:<?php echo esc_html((string) $appearance['accent']); ?>;border-radius:50%;animation:l4s-safe-boot-spin .72s linear infinite}html.l4s-safe-boot-ready::after{display:none}#l4s-safe-boot-screen{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;background:<?php echo esc_html((string) $appearance['background_light']); ?>;opacity:1;transition:opacity .18s ease}html.l4s-safe-boot-dark #l4s-safe-boot-screen{background:<?php echo esc_html((string) $appearance['background_dark']); ?>}#l4s-safe-boot-screen.is-leaving{opacity:0;pointer-events:none}.l4s-safe-boot-card{width:138px;padding:22px 18px 18px;display:grid;place-items:center;gap:14px;border:1px solid rgba(148,163,184,.24);border-radius:<?php echo esc_html((string) $appearance['card_radius']); ?>px;background:<?php echo esc_html((string) $appearance['surface_light']); ?>;box-shadow:0 22px 60px rgba(2,6,23,.12)}html.l4s-safe-boot-dark .l4s-safe-boot-card{border-color:rgba(148,163,184,.16);background:<?php echo esc_html((string) $appearance['surface_dark']); ?>;box-shadow:0 22px 60px rgba(0,0,0,.34)}.l4s-safe-boot-brand{width:42px;height:42px;display:grid;place-items:center;overflow:hidden;border-radius:11px;color:#fff;background:<?php echo esc_html((string) $appearance['accent']); ?>;font:800 18px/1 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.l4s-safe-boot-brand img{width:100%;height:100%;display:block;object-fit:contain;background:#fff}.l4s-safe-boot-progress{width:74px;height:4px;overflow:hidden;border-radius:999px;background:rgba(148,163,184,.22)}.l4s-safe-boot-progress::after{content:"";width:42%;height:100%;display:block;border-radius:inherit;background:<?php echo esc_html((string) $appearance['accent']); ?>;animation:l4s-safe-boot-slide 1s ease-in-out infinite}@keyframes l4s-safe-boot-spin{to{transform:rotate(360deg)}}@keyframes l4s-safe-boot-slide{0%{transform:translateX(-110%)}50%{transform:translateX(85%)}100%{transform:translateX(240%)}}@media(prefers-reduced-motion:reduce){html.l4s-safe-booting::after,.l4s-safe-boot-progress::after{animation-duration:1.8s}}
        </style>
        <script id="l4s-safe-critical-loader-script">
            (function(d,w,c){try{var p=c.cookie+"=",v=d.cookie.split("; ").find(function(i){return i.indexOf(p)===0});if(!v)return;var m=decodeURIComponent(v.slice(p.length)).match(/^([A-Za-z0-9][A-Za-z0-9_-]{0,127})\.([a-f0-9]{16})\.(\d+)$/);if(!m||Number(m[3])!==c.postId)return;var t="";try{t=w.localStorage.getItem("link4sub:theme")||""}catch(e){}if(t!=="light"&&t!=="dark")t=c.defaultTheme;if(t==="dark"||(t==="system"&&w.matchMedia&&w.matchMedia("(prefers-color-scheme: dark)").matches))d.documentElement.classList.add("l4s-safe-boot-dark");d.documentElement.classList.add("l4s-safe-booting");d.documentElement.setAttribute("aria-busy","true");w.Link4SubSafeExpected=true;w.Link4SubSafeBootTimer=w.setTimeout(function(){var s=d.getElementById("l4s-safe-boot-screen");if(s)s.remove();d.documentElement.classList.remove("l4s-safe-booting","l4s-safe-boot-dark","l4s-safe-boot-ready");d.documentElement.removeAttribute("aria-busy");w.Link4SubSafeBootTimedOut=true},20000)}catch(e){}})(document,window,<?php echo wp_json_encode($configuration, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>);
        </script>
        <?php
    }

    public function enqueue_assets(): void
    {
        if (
            $this->settings->get('delivery_mode', 'original') !== 'random_post' ||
            !is_singular()
        ) {
            return;
        }

        $post_id = (int) get_queried_object_id();
        $categories = get_the_category($post_id);
        $version = rawurlencode(LINK4SUB_PLUGIN_VERSION);
        $asset = static fn(string $path): string => LINK4SUB_PLUGIN_URL . $path . '?ver=' . $version;
        $configuration = array(
            'clientCookieName' => self::CLIENT_COOKIE_NAME,
            'apiVisitBaseUrl' => trailingslashit($this->api->public_api_base_url()) . 'links/',
            'hydrateUrl' => rest_url('link4sub/v1/safe/hydrate'),
            'postId' => $post_id,
            'requestTimeoutMs' => max(3000, min(30000, (int) $this->settings->get('request_timeout', 10) * 1000)),
            'pageContext' => array(
                'siteKey' => (string) $this->settings->get('site_key', 'wordpress-main'),
                'deliveryMode' => 'random_post',
                'postType' => (string) get_post_type($post_id),
                'categoryIds' => array_values(array_map(static fn($category) => (int) $category->term_id, $categories ?: array())),
                'niches' => array_values(array_map(static fn($category) => (string) $category->slug, $categories ?: array())),
                'locale' => determine_locale(),
                'placements' => array('unlock_redirect', 'popunder', 'safe_overlay_top', 'safe_overlay_bottom'),
            ),
            'styles' => array(
                $asset('assets/css/safe-overlay.css'),
                $asset('assets/css/safe-theme.css'),
                $asset('assets/css/language-switcher.css'),
                $asset('assets/css/recommendations.css'),
                $asset('assets/css/monetization-ads.css'),
            ),
            'scripts' => array(
                $asset('assets/js/language-switcher.js'),
                $asset('assets/js/safe-overlay.js'),
            ),
            'boot' => array(
                'brand' => (string) $this->settings->get('brand_name', 'Link4Sub'),
                'logoUrl' => (string) $this->settings->appearance()['logo_url'],
            ),
        );

        wp_enqueue_script(
            'link4sub-safe-client-loader',
            LINK4SUB_PLUGIN_URL . 'assets/js/safe-client-loader.js',
            array(),
            LINK4SUB_PLUGIN_VERSION,
            true
        );
        wp_add_inline_script(
            'link4sub-safe-client-loader',
            'window.Link4SubSafeClient=' . wp_json_encode($configuration, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . ';',
            'before'
        );
    }

    private function is_safe_request(): bool
    {
        $request_path = wp_parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
        $safe_path = wp_parse_url(home_url('/' . trim((string) $this->settings->get('safe_route', 'safe'), '/') . '/'), PHP_URL_PATH);
        return untrailingslashit((string) $request_path) === untrailingslashit((string) $safe_path);
    }

    private function random_post_id(array $excluded_post_ids = array()): ?int
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

        $excluded_post_ids = array_values(array_unique(array_filter(array_map('absint', $excluded_post_ids))));
        $candidates = array_values(array_diff($ids ?: array(), $excluded_post_ids));
        if (!$candidates) return null;
        return (int) $candidates[random_int(0, count($candidates) - 1)];
    }

    private function set_context_cookie(string $alias, int $post_id): void
    {
        $ttl = ((int) $this->settings->get('safe_cookie_ttl_minutes', 60)) * MINUTE_IN_SECONDS;
        $payload = array(
            'alias' => $alias,
            'post_id' => $post_id,
            'current_page' => 0,
            'page_count' => 1,
            'used_post_ids' => array($post_id),
            'exp' => time() + $ttl,
            'nonce' => wp_generate_password(16, false, false),
        );
        $this->write_context_cookie($payload);
    }

    private function write_context_cookie(array $payload): void
    {
        $ttl = max(1, (int) ($payload['exp'] ?? time()) - time());
        $encoded = $this->base64url_encode((string) wp_json_encode($payload));
        $value = $encoded . '.' . hash_hmac('sha256', $encoded, wp_salt('auth'));
        setcookie(self::COOKIE_NAME, $value, array(
            'expires' => (int) ($payload['exp'] ?? time() + $ttl),
            'path' => COOKIEPATH ?: '/',
            'domain' => COOKIE_DOMAIN ?: '',
            'secure' => is_ssl(),
            'httponly' => true,
            'samesite' => 'Lax',
        ));
        $client_value = (string) $payload['alias'] . '.' . substr(
            hash('sha256', (string) ($payload['nonce'] ?? '')),
            0,
            16
        ) . '.' . (int) ($payload['post_id'] ?? 0);
        setcookie(self::CLIENT_COOKIE_NAME, $client_value, array(
            'expires' => (int) ($payload['exp'] ?? time() + $ttl),
            'path' => COOKIEPATH ?: '/',
            'domain' => COOKIE_DOMAIN ?: '',
            'secure' => is_ssl(),
            'httponly' => false,
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
        if (!is_array($decoded) || !isset($decoded['alias'], $decoded['post_id'], $decoded['exp'], $decoded['nonce'])) return null;
        if ((int) $decoded['exp'] < time() || !preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/', (string) $decoded['alias'])) return null;
        if (!preg_match('/^[A-Za-z0-9]{8,64}$/', (string) $decoded['nonce'])) return null;
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
