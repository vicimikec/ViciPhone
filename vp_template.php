<!DOCTYPE html>
<!--
*******************************************************************************
*
*	HTML File for the Vicidial WebRTC Phone
*
*	Copyright (C) 2016  Michael Cargile
*
*	This program is free software: you can redistribute it and/or modify
*	it under the terms of the GNU Affero General Public License as
*	published by the Free Software Foundation, either version 3 of the
*	License, or (at your option) any later version.
*
*	This program is distributed in the hope that it will be useful,
*	but WITHOUT ANY WARRANTY; without even the implied warranty of
*	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*	GNU Affero General Public License for more details.
*
*	You should have received a copy of the GNU Affero General Public License
*	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*******************************************************************************
-->
<html>
	<head>
		<title>Vicidial Web Phone</title>
		<link rel="stylesheet" href="<?php echo $layout; ?>" />
		<meta http-equiv="Pragma" content="no-cache">
		<meta http-equiv="Expires" content="-1″>
		<meta http-equiv="CACHE-CONTROL" content="NO-CACHE">
	</head>
	<body>
		<!-- Container -->
		<div id="container">

			<!-- Main -->
			<div id="main">
				<!-- Video element to handle audio -->
				<audio autoplay width='0' height='0' id="audio"></audio>

				<!-- Logo -->
				<section id="logo">
					<img id="logo_img" src="images/wp_logo.png">
				</section>
				<!-- End Logo -->

				<!-- Controls -->
				<section id="controls">
					<section id="registration_control">
						<input type="text" value="" id="reg_status" readonly>
						<button class="button" id="register"><img id="reg_icon" src="images/wp_register_inactive.gif" alt="register"></button>
						<button class="button" id="unregister"><img id="unreg_icon" src="images/wp_unregister_inactive.gif" alt="register"></button>
					</section>
					<section id="dial_control">
						<input type="text" name="digits" value="<?php echo $dial_number?>" id="digits"/>
						<button class="button" id="dial"><img id="dial_icon" src="images/wp_dial.gif" alt="register"></button>
					</section>
					<section id="audio_control">
						<button class="button" id="mic_mute"><img id="mute_icon" src="images/wp_mic_on.gif" alt="mute"></button>
						<button class="button" id="vol_up"><img id="vol_up_icon" src="images/wp_speaker_up.gif" alt="register"></button>
						<button class="button" id="vol_down"><img id="vol_down_icon" src="images/wp_speaker_down.gif" alt="register"></button>
					</section>
				</section>
				<!-- End Controls -->

				<!-- Dialpad -->
				<section id="dialpad">
					<section id="dial_row1">
						<button class="dialpad_button" id="one">1</button>
						<button class="dialpad_button" id="two">2</button>
						<button class="dialpad_button" id="three">3</button>
					</section>
					<section id="dial_row2">
						<button class="dialpad_button" id="four">4</button>
						<button class="dialpad_button" id="five">5</button>
						<button class="dialpad_button" id="six">6</button>
					</section>
					<section id="dial_row3">
						<button class="dialpad_button" id="seven">7</button>
						<button class="dialpad_button" id="eight">8</button>
						<button class="dialpad_button" id="nine">9</button>
					</section>
					<section id="dial_row4">
						<button class="dialpad_button" id="star">*</button>
						<button class="dialpad_button" id="zero">0</button>
						<button class="dialpad_button" id="pound">#</button>
					</section>
					<section id="dial_dtmf">
						<input type="text" name="dtmf_digits" value="" id="dtmf_digits"/>
						<button class="button" id="send_dtmf">Send</button>
					</section>
				</section>
				<!-- End Dialpad -->

			</div>
			<!-- End Main -->

		</div>
		<!-- End Container -->

		<!-- Debug Output -->
		<pre id="debug"></pre>

		<!-- variables to pass vici_phone.js -->
		<script>

		// SIP configuration variables
		var cid_name = '<?php echo $cid_name; ?>';
		var sip_uri = '<?php echo $sip_uri; ?>';
		var auth_user = '<?php echo $auth_user; ?>';
		var password = '<?php echo $password; ?>';
		var ws_server = '<?php echo $ws_server; ?>';

		// whether debug should be enabled
		var debug_enabled = '<?php echo $debug_enabled; ?>';

		// display restriction options
		var hide_dialpad = '<?php echo $hide_dialpad; ?>';
		var hide_dialbox = '<?php echo $hide_dialbox; ?>';
		var hide_mute = '<?php echo $hide_mute; ?>';
		var hide_volume = '<?php echo $hide_volume; ?>';

		// behavior options
		var auto_answer = '<?php echo $auto_answer; ?>';
		var auto_dial_out = '<?php echo $auto_dial_out; ?>';
		var auto_login = '<?php echo $auto_login; ?>';

		// language support
		var language = '<?php echo $language; ?>';
		</script>

		<!-- WebRTC adapter -->
		<!--<script src="js/adapter.js"></script>-->
		<script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>

		<!-- SIP.js library, included from CDN. If you need it offline, uncomment the next line -->
		<script src="https://cdn.jsdelivr.net/npm/sip.js@0.15.11/dist/sip-0.15.11.min.js"></script-->

		<!-- SIP.js library offline version-->
		<!--script src="js/sip-0.15.11.min.js"></script-->

		<!-- Translations file -->
		<script src="js/translations.js"></script>

		<!-- Our Java Script Code -->
		<script src="js/vici_phone.js"></script>

	</body>
</html>