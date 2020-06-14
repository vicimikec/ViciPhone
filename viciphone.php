<?php

// Required default values. This can be overrided by using $_GET and $_POST variables
$language 		= 'en';
$dial_number 	= '';		// The number to pre-fill in the phone
$debug_enabled	= false;


// Default display values
$hide_dialpad 	= false;		// Show the dialplan
$hide_dialbox 	= false;		// Show the dialbox
$hide_volume 	= false;		// Display volume controls
$hide_mute 		= false;		// Display mute button
$auto_answer 	= false;		// Auto answer incoming calls
$auto_dial_out 	= true;			// Auto dial out after loading (only works if a dial_number is specified)
$auto_login		= true;			// Auto login agent as soon as webphone gets loaded

// Enable to enable the debug access log
$debug_access_log = true;

// GET / POST Options
// the phone login used as the auth_user
if (isset($_GET["phone_login"])) {
	$phone_login=$_GET["phone_login"];
} elseif (isset($_POST["phone_login"])) {
	$phone_login=$_POST["phone_login"];
}

// the phone registration password
if (isset($_GET["phone_pass"])) {
	$phone_pass=$_GET["phone_pass"];
} elseif (isset($_POST["phone_pass"])) {
	$phone_pass=$_POST["phone_pass"];
}

// the server IP to register to
if (isset($_GET["server_ip"])) {
	$server_ip=$_GET["server_ip"];
} elseif (isset($_POST["server_ip"])) {
	$server_ip=$_POST["server_ip"];
}

// the pre-filled dial number
if (isset($_GET["dial_number"])) {
	$dial_number=$_GET["dial_number"];
} elseif (isset($_POST["dial_number"])) {
	$dial_number=$_POST["dial_number"];
}

// the audio codecs to use ( currently not supported )
if (isset($_GET["codecs"])) {
	$codecs=$_GET["codecs"];
} elseif (isset($_POST["codecs"])) {
	$codecs=$_POST["codecs"];
}

// additional webphone options
if (isset($_GET["options"])) {
	$options=$_GET["options"];
} elseif (isset($_POST["options"])) {
	$options=$_POST["options"];
}

// decode the GET/POST data
$phone_login 	= base64_decode($phone_login);
$phone_pass 	= base64_decode($phone_pass);
$server_ip 		= base64_decode($server_ip);
$codecs 		= base64_decode($codecs);
$options 		= base64_decode($options);

// Encryption check
// Get remote address
$referring_url = "https://viciphone.com";
if (!empty($_SERVER['HTTP_REFERER'])) {
	$referring_url = $_SERVER['HTTP_REFERER'];
}
$ref_url_array = parse_url( $referring_url );

// Do not include
// user / pass / port / get / post
// data in the URL that is logged or displayed
$base_referring_url = $ref_url_array['scheme'] . "://" . $ref_url_array['host'] . $ref_url_array['path'];

// Create the debug log string
$log_string = date("Y-m-d H:i:s");
$log_string .= "\t";
if (!empty($_SERVER['REMOTE_ADDR'])) {
	$log_string .= $_SERVER['REMOTE_ADDR'];
}
$log_string .= "\t";
$log_string .= $base_referring_url;
$log_string .= "\t";
if (!empty($_SERVER['HTTP_USER_AGENT'])) {
	$log_string .= $_SERVER['HTTP_USER_AGENT'];
}
$log_string .= "\t";
$log_string .= get_browser(null,true);
$log_string .= "\n";

if ( $debug_access_log ) {
	// log it
	file_put_contents( "debug/viciphone_access.log",$log_string,FILE_APPEND );
}

// Encryption Check
if ( $ref_url_array['scheme'] != 'https' ) {
	// Remote address is not https
	// Throw and Alert and exit
	echo "<script language='javascript'>";
	echo "alert('Referring URL ( $base_referring_url ) is not encrypted. VICIphone cannot load without encryption. Please make sure you are using the correct URL.')";
	echo "</script>";
	exit;
}


// whether debug should be enabled
$debug_enabled = false;

// sip connection info
$cid_name = "$phone_login";
$sip_uri = "$phone_login@$server_ip";
$auth_user = "$phone_login";
$password = "$phone_pass";

// process options
$options_array = explode("--", $options);

// DEBUG options
if ( in_array( "DEBUG" , $options_array ) ) {
	$debug_enabled = true;
}

// display restriction options
if ( in_array( "DIALPAD_N" , $options_array ) ) {
	$hide_dialpad = true;
}

// whether to disable the dial box
if ( in_array( "DIALBOX_N" , $options_array ) ) {
	$hide_dialbox = true;
}

// whether to disable the mute button
if ( in_array( "MUTE_N" , $options_array ) ) {
	$hide_mute = true;
}

// whether to disable the volume buttons
if ( in_array( "VOLUME_N" , $options_array ) ) {
	$hide_volume = true;
}

// behavior options
// whether to enable auto answer
if ( in_array( "AUTOANSWER_Y" , $options_array ) ) {
	$auto_answer = true;
}
// whether to enable auto dial out
if ( in_array( "AUTODIAL_Y" , $options_array ) ) {
	$auto_dial_out = true;
}
// whether to enable auto dial out
if ( in_array( "AUTOLOGIN_N" , $options_array ) ) {
	$auto_login = false;
}



// WEBSOCKET url
$ws_server = '';
foreach( $options_array as $value ) {
	if ( strpos( $value, 'WEBSOCKETURL' ) !== false ) {
		$ws_server = $value;
		$ws_server = str_replace( 'WEBSOCKETURL', '', $ws_server );
	}
}

// Layout file handling
$layout = '';
foreach( $options_array as $value ) {
	if ( strpos( $value, 'WEBPHONELAYOUT' ) !== false ) {
		$layout = $value;
		$layout = str_replace( 'WEBPHONELAYOUT', '', $layout );
	}
}
if ( $layout == '' ) {
	# layout is blank use the default
	$layout = 'css/default.css';
} elseif ( preg_match('#^https?://#i', $layout) === 1 ) {
	# layout begins with http:// or https:// so it is a link
	# do nothing
} elseif ( preg_match('#^css/#i', $layout) === 1 ) {
	# layout begins with css/
	if ( preg_match('#\.css$#i', $layout) === 1 ) {
		# layout ends in .css
		# do nothing
	} else {
		# append .css to the layout
		$layout .= ".css";
	}
} elseif ( preg_match('#\.css$#i', $layout) === 1 ) {
	# layout ends in .css
	$layout = "css/" . $layout;
} else {
	$layout = "css/" . $layout . ".css";
}
# sanitize the layout to try to prevent XSS
$layout = filter_var($layout, FILTER_SANITIZE_URL );

// call the template
require_once('vp_template.php');
