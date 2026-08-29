<?php
if (!defined('ABSPATH')) exit;

$states = array(
    'not_found' => array('code' => '404', 'eyebrow' => 'Link không khả dụng', 'title' => 'Không tìm thấy link này.', 'description' => 'Link có thể chưa được tạo, đã đổi địa chỉ hoặc URL bạn mở chưa chính xác.', 'label' => 'Link not found'),
    'violation' => array('code' => '403', 'eyebrow' => 'Nội dung bị hạn chế', 'title' => 'Link đã bị vô hiệu hoá.', 'description' => 'Link này không còn khả dụng vì vi phạm tiêu chuẩn cộng đồng hoặc chính sách sử dụng của hệ thống.', 'label' => 'Policy violation'),
    'deleted' => array('code' => '410', 'eyebrow' => 'Nội dung không còn tồn tại', 'title' => 'Link đã bị xoá.', 'description' => 'Chủ sở hữu đã xoá link này. Nội dung đích và các hành động liên quan không còn truy cập được.', 'label' => 'Link deleted'),
    'unavailable' => array('code' => '410', 'eyebrow' => 'Link tạm không khả dụng', 'title' => 'Link này hiện không thể mở.', 'description' => 'Link có thể đang tạm dừng, đã hết hạn hoặc đạt giới hạn lượt truy cập do chủ sở hữu thiết lập.', 'label' => 'Link unavailable'),
    'api_error' => array('code' => '502', 'eyebrow' => 'Dịch vụ tạm gián đoạn', 'title' => 'Chưa thể tải link lúc này.', 'description' => 'Link4Sub API đang không phản hồi hoặc trả về dữ liệu không hợp lệ. Vui lòng thử lại sau.', 'label' => 'API unavailable'),
);
$state = $states[$view['kind']] ?? $states['api_error'];
$appearance = $view['appearance'];
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="robots" content="noindex, nofollow">
    <title><?php echo esc_html($state['title'] . ' — ' . $view['brand']); ?></title>
    <link rel="stylesheet" href="<?php echo esc_url(LINK4SUB_PLUGIN_URL . 'assets/css/public-link.css?ver=' . LINK4SUB_PLUGIN_VERSION); ?>">
</head>
<body class="l4s-font-<?php echo esc_attr($appearance['font']); ?>">
<main class="l4s-status l4s-status-<?php echo esc_attr($view['kind']); ?>" style="--status-purple:<?php echo esc_attr($appearance['accent']); ?>">
    <header><a class="l4s-brand" href="<?php echo esc_url($view['app_url']); ?>"><span class="l4s-brand-mark"><?php if ($appearance['logo_url'] !== '') : ?><img src="<?php echo esc_url($appearance['logo_url']); ?>" alt=""><?php else : ?><?php echo esc_html(mb_strtoupper(mb_substr($view['brand'], 0, 1))); ?><?php endif; ?></span><span><?php echo esc_html($view['brand']); ?></span></a><a href="<?php echo esc_url($view['app_url'] . '/member/support'); ?>">Trợ giúp</a></header>
    <section class="l4s-status-content">
        <div class="l4s-status-copy">
            <span class="l4s-status-eyebrow"><?php echo esc_html($state['eyebrow']); ?></span>
            <span class="l4s-status-code" aria-hidden="true"><?php echo esc_html($state['code']); ?></span>
            <h1><?php echo esc_html($state['title']); ?></h1>
            <p><?php echo esc_html($state['description']); ?></p>
            <div><a class="l4s-status-primary" href="<?php echo esc_url($view['app_url']); ?>">Về trang chủ</a><button type="button" onclick="location.reload()">Thử lại</button></div>
        </div>
        <div class="l4s-status-visual" aria-label="<?php echo esc_attr($state['label']); ?>">
            <div class="l4s-status-orbit one"></div><div class="l4s-status-orbit two"></div>
            <div class="l4s-status-panel"><span class="l4s-status-icon">!</span><small><?php echo esc_html(mb_strtoupper($view['brand'])); ?> PUBLIC LINK</small><strong><?php echo esc_html($state['label']); ?></strong><div class="l4s-fake-url"><i></i><i></i></div><div class="l4s-fake-lines"><i></i><i></i><i></i></div></div>
        </div>
    </section>
    <footer><span>© <?php echo esc_html(wp_date('Y') . ' ' . $view['brand']); ?></span><span>Creator links, protected.</span></footer>
</main>
</body>
</html>
