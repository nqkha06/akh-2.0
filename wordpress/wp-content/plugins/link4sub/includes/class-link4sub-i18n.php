<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Link4Sub_I18n
{
    private const BUILTIN_CODES = array('vi', 'en');
    private const MAX_LANGUAGES = 20;

    public static function default_config(): array
    {
        return array(
            'default' => 'vi',
            'disabled' => array(),
            'overrides' => array(),
            'custom' => array(),
        );
    }

    public static function builtins(): array
    {
        static $languages = null;
        if ($languages !== null) return $languages;
        $languages = array();
        foreach (self::BUILTIN_CODES as $code) {
            $path = LINK4SUB_PLUGIN_DIR . 'languages/' . $code . '.php';
            $language = is_readable($path) ? require $path : null;
            if (is_array($language) && isset($language['code'], $language['name'], $language['texts'])) {
                $languages[$code] = $language;
            }
        }
        return $languages;
    }

    public static function text_schema(): array
    {
        $builtins = self::builtins();
        return isset($builtins['vi']['texts']) && is_array($builtins['vi']['texts'])
            ? $builtins['vi']['texts']
            : array();
    }

    public static function effective($raw_config): array
    {
        $config = self::normalize_config($raw_config);
        $languages = array();
        foreach (self::builtins() as $code => $builtin) {
            $override = isset($config['overrides'][$code]) && is_array($config['overrides'][$code])
                ? $config['overrides'][$code]
                : array();
            $languages[$code] = array(
                'code' => $code,
                'name' => (string) ($override['name'] ?? $builtin['name']),
                'enabled' => !in_array($code, $config['disabled'], true),
                'source' => 'builtin',
                'texts' => array_replace($builtin['texts'], is_array($override['texts'] ?? null) ? $override['texts'] : array()),
            );
        }
        foreach ($config['custom'] as $custom) {
            $languages[$custom['code']] = array(
                'code' => $custom['code'],
                'name' => $custom['name'],
                'enabled' => !empty($custom['enabled']),
                'source' => 'custom',
                'texts' => array_replace(self::text_schema(), $custom['texts']),
            );
        }
        $enabled = array_values(array_filter($languages, static fn($language) => !empty($language['enabled'])));
        if (!$enabled && isset($languages['vi'])) {
            $languages['vi']['enabled'] = true;
            $enabled = array($languages['vi']);
        }
        $default = $config['default'];
        if (!isset($languages[$default]) || empty($languages[$default]['enabled'])) {
            $default = (string) ($enabled[0]['code'] ?? 'vi');
        }
        return array('default' => $default, 'languages' => array_values($languages));
    }

    public static function public_bundle($raw_config): array
    {
        $effective = self::effective($raw_config);
        $effective['languages'] = array_values(array_map(static function ($language) {
            return array(
                'code' => $language['code'],
                'name' => $language['name'],
                'texts' => $language['texts'],
            );
        }, array_filter($effective['languages'], static fn($language) => !empty($language['enabled']))));
        return $effective;
    }

    public static function sanitize_payload($payload): array
    {
        if (is_string($payload)) $payload = json_decode($payload, true);
        if (!is_array($payload) || !isset($payload['languages']) || !is_array($payload['languages'])) {
            return self::default_config();
        }
        $schema = self::text_schema();
        $builtins = self::builtins();
        $config = self::default_config();
        $seen = array();
        foreach (array_slice($payload['languages'], 0, self::MAX_LANGUAGES) as $language) {
            if (!is_array($language)) continue;
            $code = strtolower(trim((string) ($language['code'] ?? '')));
            if (!preg_match('/^[a-z][a-z0-9-]{1,11}$/', $code) || isset($seen[$code])) continue;
            $seen[$code] = true;
            $name = self::clean_text($language['name'] ?? '', 60);
            if ($name === '') $name = strtoupper($code);
            $enabled = !empty($language['enabled']);
            $texts = self::sanitize_texts($language['texts'] ?? array(), $schema);
            if (isset($builtins[$code])) {
                if (!$enabled) $config['disabled'][] = $code;
                $changed = array();
                foreach ($texts as $key => $value) {
                    if ($value !== (string) ($builtins[$code]['texts'][$key] ?? '')) $changed[$key] = $value;
                }
                if ($name !== $builtins[$code]['name'] || $changed) {
                    $config['overrides'][$code] = array('name' => $name, 'texts' => $changed);
                }
            } else {
                $config['custom'][] = array('code' => $code, 'name' => $name, 'enabled' => $enabled, 'texts' => $texts);
            }
        }
        foreach (self::BUILTIN_CODES as $code) {
            if (!isset($seen[$code]) && !in_array($code, $config['disabled'], true)) $config['disabled'][] = $code;
        }
        $effective = self::effective($config);
        $requested_default = strtolower((string) ($payload['default'] ?? 'vi'));
        $enabled_codes = array_map(static fn($language) => $language['code'], array_filter(
            $effective['languages'],
            static fn($language) => !empty($language['enabled'])
        ));
        $config['default'] = in_array($requested_default, $enabled_codes, true)
            ? $requested_default
            : (string) ($enabled_codes[0] ?? 'vi');
        return $config;
    }

    private static function normalize_config($raw): array
    {
        $raw = is_array($raw) ? $raw : array();
        $default = self::default_config();
        return array(
            'default' => preg_match('/^[a-z][a-z0-9-]{1,11}$/', (string) ($raw['default'] ?? '')) ? (string) $raw['default'] : $default['default'],
            'disabled' => is_array($raw['disabled'] ?? null) ? array_values(array_unique(array_map('sanitize_key', $raw['disabled']))) : array(),
            'overrides' => is_array($raw['overrides'] ?? null) ? $raw['overrides'] : array(),
            'custom' => is_array($raw['custom'] ?? null) ? array_slice($raw['custom'], 0, self::MAX_LANGUAGES) : array(),
        );
    }

    private static function sanitize_texts($raw, array $schema): array
    {
        $raw = is_array($raw) ? $raw : array();
        $texts = array();
        foreach ($schema as $key => $fallback) {
            $value = self::clean_text($raw[$key] ?? $fallback, 500);
            $texts[$key] = $value !== '' ? $value : (string) $fallback;
        }
        return $texts;
    }

    private static function clean_text($value, int $limit): string
    {
        return mb_substr(sanitize_text_field((string) $value), 0, $limit);
    }
}
