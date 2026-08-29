<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Link4Sub_API_Client
{
    private Link4Sub_Settings $settings;

    public function __construct(Link4Sub_Settings $settings)
    {
        $this->settings = $settings;
    }

    public function record_visit(string $slug)
    {
        return $this->request(
            'POST',
            '/links/' . rawurlencode($slug) . '/visit',
            $this->visitor_headers()
        );
    }

    public function complete_visit(string $slug, string $visit_token)
    {
        return $this->request(
            'POST',
            '/links/' . rawurlencode($slug) . '/visit/' . rawurlencode($visit_token) . '/complete'
        );
    }

    public function api_base_url(): string
    {
        return untrailingslashit((string) apply_filters(
            'link4sub_api_base_url',
            $this->settings->get('api_base_url', 'http://localhost:4000/api')
        ));
    }

    public function app_base_url(): string
    {
        return untrailingslashit((string) apply_filters(
            'link4sub_app_base_url',
            $this->settings->get('app_base_url', 'http://localhost:3000')
        ));
    }

    public function public_api_base_url(): string
    {
        return untrailingslashit((string) apply_filters(
            'link4sub_public_api_base_url',
            $this->settings->get('public_api_base_url', $this->api_base_url())
        ));
    }

    public function public_url($value, string $slug = ''): ?string
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $value = trim($value);
        if (preg_match('#^https?://#i', $value)) {
            return esc_url_raw($value, array('http', 'https')) ?: null;
        }

        if (str_starts_with($value, '/api/backend/')) {
            return $this->public_api_base_url() . substr($value, strlen('/api/backend'));
        }

        if (
            $slug !== '' &&
            preg_match('#^/api/public/files/[^/?]+/?$#', $value)
        ) {
            return $this->public_api_base_url()
                . '/files/link/' . rawurlencode($slug) . '/download';
        }

        if (str_starts_with($value, '/')) {
            return $this->app_base_url() . $value;
        }

        return null;
    }

    public function normalize_public_payload(array $payload): array
    {
        $slug = isset($payload['slug']) && is_string($payload['slug'])
            ? $payload['slug']
            : '';

        if (
            array_key_exists('destinationUrl', $payload) &&
            ($payload['inputType'] ?? null) !== 'snippet'
        ) {
            $payload['destinationUrl'] = $this->public_url(
                $payload['destinationUrl'],
                $slug
            );
        }

        if (array_key_exists('coverImageUrl', $payload)) {
            $payload['coverImageUrl'] = $this->public_url(
                $payload['coverImageUrl'],
                $slug
            );
        }

        if (
            isset($payload['backgroundSettings']) &&
            is_array($payload['backgroundSettings']) &&
            array_key_exists('backgroundMediaUrl', $payload['backgroundSettings'])
        ) {
            $payload['backgroundSettings']['backgroundMediaUrl'] = $this->public_url(
                $payload['backgroundSettings']['backgroundMediaUrl'],
                $slug
            );
        }

        return $payload;
    }

    private function request(string $method, string $path, array $headers = array())
    {
        $base_url = $this->api_base_url();
        if (!$this->is_http_url($base_url)) {
            return new WP_Error(
                'link4sub_api_configuration',
                __('Link4Sub API URL is not a valid HTTP(S) URL.', 'link4sub'),
                array('status' => 500)
            );
        }

        $response = wp_remote_request($base_url . $path, array(
            'method'      => $method,
            'timeout'     => (int) $this->settings->get('request_timeout', 10),
            'redirection' => 0,
            'headers'     => array_merge(array(
                'Accept' => 'application/json',
            ), $headers),
        ));

        if (is_wp_error($response)) {
            return new WP_Error(
                'link4sub_api_unavailable',
                __('The Link4Sub API could not be reached.', 'link4sub'),
                array(
                    'status' => 502,
                    'cause'  => $response->get_error_message(),
                )
            );
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($status === 404) {
            return new WP_Error(
                'link4sub_not_found',
                __('Link not found.', 'link4sub'),
                array('status' => 404)
            );
        }

        if ($status < 200 || $status >= 300) {
            return new WP_Error(
                'link4sub_api_error',
                __('The Link4Sub API returned an error.', 'link4sub'),
                array('status' => 502, 'upstream_status' => $status)
            );
        }

        if (!is_array($data)) {
            return new WP_Error(
                'link4sub_invalid_response',
                __('The Link4Sub API returned an invalid response.', 'link4sub'),
                array('status' => 502)
            );
        }

        return $data;
    }

    private function visitor_headers(): array
    {
        $headers = array();
        $country = $this->server_value(array(
            'HTTP_CF_IPCOUNTRY',
            'HTTP_X_VERCEL_IP_COUNTRY',
            'HTTP_CLOUDFRONT_VIEWER_COUNTRY',
            'HTTP_X_COUNTRY_CODE',
        ));
        $ip = $this->server_value(array(
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ));
        $user_agent = $this->server_value(array('HTTP_USER_AGENT'));
        $referrer = $this->server_value(array('HTTP_REFERER'));

        if ($country !== '') {
            $headers['x-visitor-country'] = substr($country, 0, 8);
        }
        if ($ip !== '' && filter_var($ip, FILTER_VALIDATE_IP)) {
            $headers['x-visitor-ip'] = $ip;
        }
        if ($user_agent !== '') {
            $headers['user-agent'] = substr($user_agent, 0, 512);
        }
        if ($referrer !== '') {
            $safe_referrer = esc_url_raw($referrer, array('http', 'https'));
            if ($safe_referrer) {
                $headers['referer'] = $safe_referrer;
            }
        }

        return $headers;
    }

    private function server_value(array $keys): string
    {
        foreach ($keys as $key) {
            if (isset($_SERVER[$key]) && is_string($_SERVER[$key])) {
                return sanitize_text_field(wp_unslash($_SERVER[$key]));
            }
        }

        return '';
    }

    private function is_http_url(string $value): bool
    {
        $parts = wp_parse_url($value);
        if (!is_array($parts)) {
            return false;
        }
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = (string) ($parts['host'] ?? '');
        $port = isset($parts['port']) ? (int) $parts['port'] : null;

        return in_array($scheme, array('http', 'https'), true)
            && $host !== ''
            && ($port === null || ($port >= 1 && $port <= 65535));
    }
}
