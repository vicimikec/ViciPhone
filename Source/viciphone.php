<?php

// Enable to enable the debug access log 
$debug_access_log = true;

// GET / POST Options
// the phone login used as the auth_user
if (isset($_POST["phone_login"])) {
	$phone_login=$_POST["phone_login"];
} elseif (isset($_GET["phone_login"])) {
	$phone_login=$_GET["phone_login"];
}

// the phone registration password
if (isset($_POST["phone_pass"])) {
	$phone_pass=$_POST["phone_pass"];
} elseif (isset($_GET["phone_pass"])) {
	$phone_pass=$_GET["phone_pass"];
}

// the server IP to register to
if (isset($_POST["server_ip"])) {
	$server_ip=$_POST["server_ip"];
} elseif (isset($_GET["server_ip"])) {
	$server_ip=$_GET["server_ip"];
}

// the audio codecs to use ( currently not supported )
if (isset($_POST["codecs"])) {
	$codecs=$_POST["codecs"];
} elseif (isset($_GET["codecs"])) {
	$codecs=$_GET["codecs"];
}

// additional webphone options
if (isset($_POST["options"])) {
	$options=$_POST["options"];
} elseif (isset($_GET["options"])) { 
	$options=$_GET["options"];
}

// decode the GET/POST data
$phone_login =              base64_decode($phone_login);
$phone_pass =               base64_decode($phone_pass);
$server_ip =                base64_decode($server_ip);
$codecs =                   base64_decode($codecs);
$options =                  base64_decode($options);

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
} else {
        // default to enabled
        $debug_enabled = false;
}

// display restriction options
// whether to disable the dialpad
if ( in_array( "DIALPAD_N" , $options_array ) ) {
	$hide_dialpad = true;
} else {
	// default to enabled
	$hide_dialpad = false;
}
// whether to disable the dial box
if ( in_array( "DIALBOX_N" , $options_array ) ) {
	$hide_dialbox = true;
} else {
	// default to enabled
	$hide_dialbox = false;
}
// whether to disable the mute button
if ( in_array( "MUTE_N" , $options_array ) ) {
	$hide_mute = true;
} else {
	// default to enabled
	$hide_mute = false;
}
// whether to disable the volume buttons
if ( in_array( "VOLUME_N" , $options_array ) ) {
	$hide_volume = true;
} else {
	// default to enabled
	$hide_volume = false;
}

// behavior options
// whether to enable auto answer
if ( in_array( "AUTOANSWER_Y" , $options_array ) ) {
	$auto_answer = true;
} else {
	$auto_answer = false;
}

// WEBSOCKET url
$ws_server = '';

// Layout file handling
$layout = '';

// general settings
$settings = '';

// session id
$session_id = '';

foreach( $options_array as $value ) {
	if ( strpos( $value, 'WEBSOCKETURL' ) !== false ) {
		$ws_server = $value;
		$ws_server = str_replace( 'WEBSOCKETURL', '', $ws_server );
	}

	if ( strpos( $value, 'WEBPHONELAYOUT' ) !== false ) {
                $layout = $value;
                $layout = str_replace( 'WEBPHONELAYOUT', '', $layout );
	}

	if ( strpos( $value, 'SETTINGS' ) !== false ) {
                $settings = $value;
                $settings = str_replace( 'SETTINGS', '', $settings );
	}

	if ( strpos( $value, 'SESSION' ) !== false ) {
                $session_id = $value;
                $session_id = str_replace( 'SESSION', '', $session_id );
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

# build the settings array
$settings_array = explode('\n',$settings);
foreach( $settings_array as $line ) {
	$key = strstr( $line, ":", true );
	$value = strstr( $line, ":" );
	$value = preg_replace( '/:/', '', $value );
	$value = preg_replace( '/"/', '', $value );

	if ( $key == 'autoGain' ) { $auto_gain_control = $value; }
	if ( $key == 'echoCan' ) { $echo_cancellation = $value; }
	if ( $key == 'noiseSup' ) { $noise_suppression = $value; }
	if ( $key == 'dialRegExten' ) { $dial_reg_exten = $value; }
	if ( $key == 'progReg' ) { $progress_region = $value; }
	if ( $key == 'langAttempting' ) { $langAttempting = $value; }
	if ( $key == 'langConnected' ) { $langConnected = $value; }
	if ( $key == 'langDisconnected' ) { $langDisconnected = $value; }
	if ( $key == 'langExten' ) { $langExten = $value; }
	if ( $key == 'langIncall' ) { $langIncall = $value; }
	if ( $key == 'langInit' ) { $langInit = $value; }
	if ( $key == 'langRedirect' ) { $langRedirect = $value; }
	if ( $key == 'langRegFailed' ) { $langRegFailed = $value; }
	if ( $key == 'langRegistering' ) { $langRegistering = $value; }
	if ( $key == 'langRegistered' ) { $langRegistered = $value; }
	if ( $key == 'langReject' ) { $langReject = $value; }
	if ( $key == 'langRinging' ) { $langRinging = $value; }
	if ( $key == 'langSend' ) { $langSend = $value; }
	if ( $key == 'langTrying' ) { $langTrying = $value; }
	if ( $key == 'langUnregFailed' ) { $langUnregFailed = $value; }
	if ( $key == 'langUnregistered' ) { $langUnregistered = $value; }
	if ( $key == 'langUnregistering' ) { $langUnregistering = $value; }
	if ( $key == 'langWebrtcError' ) { $langWebrtcError = $value; }
}


// call the template
require_once('vp_template.php');
?>
