<?php
/**
 * Plugin Name: Link4Sub Public Renderer
 * Description: Renders Link4Sub public STU links inside WordPress at /l/{slug}.
 * Version: 1.2.0
 * Requires at least: 7.0
 * Requires PHP: 8.1
 * Author: Link4Sub
 * License: GPL-2.0-or-later
 * Text Domain: link4sub
 */

if (!defined('ABSPATH')) {
    exit;
}

define('LINK4SUB_PLUGIN_VERSION', '1.2.0');
define('LINK4SUB_PLUGIN_FILE', __FILE__);
define('LINK4SUB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LINK4SUB_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once LINK4SUB_PLUGIN_DIR . 'includes/class-link4sub-settings.php';
require_once LINK4SUB_PLUGIN_DIR . 'includes/class-link4sub-api-client.php';
require_once LINK4SUB_PLUGIN_DIR . 'includes/class-link4sub-visit-store.php';
require_once LINK4SUB_PLUGIN_DIR . 'includes/class-link4sub-public-controller.php';
require_once LINK4SUB_PLUGIN_DIR . 'includes/class-link4sub-safe-redirect.php';
require_once LINK4SUB_PLUGIN_DIR . 'includes/class-link4sub-admin-settings.php';

function link4sub_settings(): Link4Sub_Settings
{
    static $settings = null;
    if ($settings === null) {
        $settings = new Link4Sub_Settings();
    }
    return $settings;
}

function link4sub_public_renderer(): Link4Sub_Public_Controller
{
    static $controller = null;

    if ($controller === null) {
        $settings = link4sub_settings();
        $controller = new Link4Sub_Public_Controller(
            link4sub_api_client(),
            link4sub_visit_store(),
            $settings
        );
    }

    return $controller;
}

function link4sub_api_client(): Link4Sub_API_Client
{
    static $api = null;
    if ($api === null) $api = new Link4Sub_API_Client(link4sub_settings());
    return $api;
}

function link4sub_visit_store(): Link4Sub_Visit_Store
{
    static $visits = null;
    if ($visits === null) $visits = new Link4Sub_Visit_Store();
    return $visits;
}

function link4sub_safe_redirect(): Link4Sub_Safe_Redirect
{
    static $safe = null;
    if ($safe === null) {
        $safe = new Link4Sub_Safe_Redirect(
            link4sub_settings(),
            link4sub_api_client(),
            link4sub_visit_store(),
            link4sub_public_renderer()
        );
    }
    return $safe;
}

add_action('plugins_loaded', static function (): void {
    link4sub_public_renderer()->register();
    link4sub_safe_redirect()->register();
    if (is_admin()) {
        (new Link4Sub_Admin_Settings(link4sub_settings()))->register();
    }
});

register_activation_hook(__FILE__, static function (): void {
    link4sub_settings()->install_defaults();
    link4sub_public_renderer()->register_rewrite_rule();
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, 'flush_rewrite_rules');
