<?php
    error_reporting(E_ERROR | E_PARSE);
    $token = "bot token";
    $path = "/" . $_GET['l'];
    $url = "https://api.telegram.org/file/bot" . $token . $path;
    $extension = substr($path, strrpos($path,"."));

    header("Content-type: image/jpeg");
    echo file_get_contents($url);
?>
