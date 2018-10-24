<?php
    $url = $_GET['url'];
    if (!$url)
        die("no url given");
	$im = imagecreatefromwebp($url);
    header("Content-type: image/png");
    imagepng ($im);
    imagedestroy($im);
?>