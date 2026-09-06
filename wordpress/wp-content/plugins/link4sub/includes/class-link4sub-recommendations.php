<?php

if (!defined('ABSPATH')) {
    exit;
}

/** Normalize the Public API's same-member links for the WordPress renderer. */
final class Link4Sub_Recommendations
{
    public static function from_api($items, string $current_slug, string $route_prefix): array
    {
        if (!is_array($items)) return array();
        $route = trim($route_prefix, '/');
        $result = array();
        $seen = array();

        foreach ($items as $item) {
            if (!is_array($item)) continue;
            $slug = isset($item['slug']) && is_string($item['slug'])
                ? sanitize_key($item['slug'])
                : '';
            $title = isset($item['title']) && is_string($item['title'])
                ? sanitize_text_field($item['title'])
                : '';
            if (
                $slug === '' ||
                $slug === $current_slug ||
                isset($seen[$slug]) ||
                !preg_match('/^[a-z0-9][a-z0-9-]{0,127}$/', $slug) ||
                $title === ''
            ) {
                continue;
            }

            $type = isset($item['inputType']) && is_string($item['inputType'])
                ? sanitize_key($item['inputType'])
                : 'url';
            if (!in_array($type, array('url', 'file', 'snippet'), true)) {
                $type = 'url';
            }
            $cover_url = isset($item['coverImageUrl']) && is_string($item['coverImageUrl'])
                ? esc_url_raw($item['coverImageUrl'], array('http', 'https'))
                : '';
            $description = isset($item['subtitle']) && is_string($item['subtitle'])
                ? sanitize_text_field($item['subtitle'])
                : '';

            $seen[$slug] = true;
            $result[] = array(
                'id' => isset($item['id']) ? sanitize_text_field((string) $item['id']) : $slug,
                'slug' => $slug,
                'title' => $title,
                'description' => $description,
                'input_type' => $type,
                'type_key' => 'related_type_' . $type,
                'cover_url' => $cover_url ?: '',
                'views' => max(0, (int) ($item['views'] ?? 0)),
                'action_key' => 'recommend_open_action',
                'action' => 'Xem link',
                'url' => home_url('/' . $route . '/' . rawurlencode($slug)),
            );
            if (count($result) >= 3) break;
        }

        return $result;
    }
}
