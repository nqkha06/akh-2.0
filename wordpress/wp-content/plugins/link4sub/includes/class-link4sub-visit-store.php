<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Link4Sub_Visit_Store
{
    private const TTL = 30 * MINUTE_IN_SECONDS;
    private const KEY_PREFIX = 'link4sub_visit_';

    public function create(string $slug, $visit_token): ?string
    {
        if (!is_string($visit_token) || $visit_token === '') {
            return null;
        }

        try {
            $reference = bin2hex(random_bytes(24));
        } catch (Throwable $error) {
            return null;
        }

        $stored = set_transient(
            $this->key($reference),
            array('slug' => $slug, 'visit_token' => $visit_token),
            self::TTL
        );

        return $stored ? $reference : null;
    }

    public function get(string $reference, string $slug)
    {
        if (!preg_match('/^[a-f0-9]{48}$/', $reference)) {
            return new WP_Error(
                'link4sub_invalid_visit_reference',
                __('Invalid visit reference.', 'link4sub'),
                array('status' => 400)
            );
        }

        $visit = get_transient($this->key($reference));
        if (
            !is_array($visit) ||
            !isset($visit['slug'], $visit['visit_token']) ||
            !is_string($visit['slug']) ||
            !is_string($visit['visit_token']) ||
            !hash_equals($visit['slug'], $slug)
        ) {
            return new WP_Error(
                'link4sub_visit_expired',
                __('The visit reference has expired.', 'link4sub'),
                array('status' => 410)
            );
        }

        return $visit;
    }

    public function delete(string $reference): void
    {
        if (preg_match('/^[a-f0-9]{48}$/', $reference)) {
            delete_transient($this->key($reference));
        }
    }

    private function key(string $reference): string
    {
        return self::KEY_PREFIX . hash('sha256', $reference);
    }
}
