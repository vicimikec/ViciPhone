<?php

// default VICIphone variables
$layout = "css/default.css";
$cid_name = "100";
$sip_uri = "100@192.168.0.100";
$auth_user = "100";
$password = "1234";
$ws_server = "wss://yourdialerurl.com:8089/ws";
$debug_enabled = false;
$hide_dialpad = false;
$hide_dialbox = false;
$hide_mute = false;
$hide_volume = false;
$auto_answer= false;
$dial_number = '';
$auto_dial_out = false;
$auto_login = false;
$debug_enabled = false;
$language = 'en';

// get / post data retrieval
$layout 		= get_post( "layout", $layout );
$cid_name 		= get_post( "cid_name", $cid_name ) ;
$sip_uri 		= get_post( "sip_uri", $sip_uri ) ;
$auth_user 		= get_post( "auth_user", $auth_user ) ;
$password 		= get_post( "password", $password ) ;
$ws_server 		= get_post( "ws_server", $ws_server ) ;
$debug_enabled 	= get_post( "debug_enabled", $debug_enabled ) ;
$hide_dialpad 	= get_post( "hide_dialpad", $hide_dialpad) ;
$hide_dialbox 	= get_post( "hide_dialbox", $hide_dialbox ) ;
$hide_mute 		= get_post( "hide_mute", $hide_mute ) ;
$hide_volume 	= get_post( "hide_volume", $hide_volume ) ;
$auto_answer	= get_post( "auto_answer", $auto_answer ) ;
$auto_dial_out	= get_post( "auto_dial_out", $auto_dial_out ) ;
$auto_login		= get_post( "auto_login", $auto_login ) ;
$dial_number	= get_post( "dial_number", $dial_number ) ;
$language		= get_post( "language", $language ) ;


// call the template
require_once('vp_template.php');

function get_post( $string, $variable ) {
	if (isset($_GET[$string])) {
		$variable = $_GET[$string];
	} elseif (isset($_POST[$string])) {
		$variable = $_POST[$string];
	}

	return $variable;
}
?>