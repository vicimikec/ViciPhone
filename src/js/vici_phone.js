/*
*******************************************************************************
*
*       HTML File for the Vicidial WebRTC Phone
*
*       Copyright (C) 2016  Michael Cargile
*
*       This program is free software: you can redistribute it and/or modify
*       it under the terms of the GNU Affero General Public License as
*       published by the Free Software Foundation, either version 3 of the
*       License, or (at your option) any later version.
*
*       This program is distributed in the hope that it will be useful,
*       but WITHOUT ANY WARRANTY; without even the implied warranty of
*       MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*       GNU Affero General Public License for more details.
*
*       You should have received a copy of the GNU Affero General Public License
*       along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*******************************************************************************
*/
var debug = debug_enabled;

var myUserAgent = false;
var myRegisterer = false;
var mySession = false;
var myMediaStream = false;
var myRegUri = false;
var myCallUri = false;
var mySipServer = false;

var incall = false;
var ringing = false;
var progress = false;
var muted = false;
var caller = '';

const dtmfVolume = 0.15;

// Array of the various UI elements
var uiElements = {
	container:		document.getElementById('container'),
	main:			document.getElementById('main'),
	audio:			document.getElementById('audio'),
	logo:			document.getElementById('logo'),
	controls:		document.getElementById('controls'),
	registration_control:   document.getElementById('registration_control'),
	reg_status:		document.getElementById('reg_status'),
	register:		document.getElementById('register'),
	unregister:		document.getElementById('unregister'),
	dial_control:		document.getElementById('dial_control'),
	digits:			document.getElementById('digits'),
	dial:			document.getElementById('dial'),
	audio_control:		document.getElementById('audio_control'),
	mic_mute:		document.getElementById('mic_mute'),
	vol_up  :		document.getElementById('vol_up'),
	vol_down:		document.getElementById('vol_down'),
	dialpad:		document.getElementById('dialpad'),
	one:			document.getElementById('one'),
	two:			document.getElementById('two'),
	three:			document.getElementById('three'),
	four:			document.getElementById('four'),
	five:			document.getElementById('five'),
	six:			document.getElementById('six'),
	seven:			document.getElementById('seven'),
	eight:			document.getElementById('eight'),
	nine:			document.getElementById('nine'),
	star:			document.getElementById('star'),
	zero:			document.getElementById('zero'),
	pound:			document.getElementById('pound'),
	dial_dtmf:		document.getElementById('dial_dtmf'),
	dtmf_digits:		document.getElementById('dtmf_digits'),
	send_dtmf:		document.getElementById('send_dtmf'),
	debug:			document.getElementById('debug'),
	reg_icon:		document.getElementById('reg_icon'),
	unreg_icon:		document.getElementById('unreg_icon'),
	dial_icon:		document.getElementById('dial_icon'),
	hangup_icon:		document.getElementById('hangup_icon'),
	mute_icon:		document.getElementById('mute_icon'),
	vol_up_icon:		document.getElementById('vol_up_icon'),
	vol_down_icon:		document.getElementById('vol_down_icon')
};

// Array of DTMF audio tones
var audioPlayback = {
	dtmfZero	: new Audio('sounds/0.wav'),
	dtmfOne	 	: new Audio('sounds/1.wav'),
	dtmfTwo	 	: new Audio('sounds/2.wav'),
	dtmfThree       : new Audio('sounds/3.wav'),
	dtmfFour	: new Audio('sounds/4.wav'),
	dtmfFive	: new Audio('sounds/5.wav'),
	dtmfSeven       : new Audio('sounds/7.wav'),
	dtmfEight       : new Audio('sounds/8.wav'),
	dtmfNine	: new Audio('sounds/9.wav'),
	dtmfSix	 	: new Audio('sounds/6.wav'),
	dtmfHash	: new Audio('sounds/hash.wav'),
	dtmfStar	: new Audio('sounds/star.wav'),
	ring	    	: new Audio('sounds/ringing.mp3'),
	progress	: new Audio('sounds/progress-na.mp3'),
};

// Array of default phrases used when a phrase is not initialized
var defaultPhrases = {
};


var nav = window.navigator;

window.addEventListener("unload",handleUnload);

// get the Registration URI object
myRegUri = SIP.UserAgent.makeURI("sip:" + sip_uri);

var myUserAgentConfig = {
	autostart: false,
	autostop: true,
	contactName: '',
	contactParams: {
		transport: "wss",
	},
	allowLegacyNotifications: true,
	authorizationUsername: auth_user,
	authorizationPassword: password,
	displayName: cid_name,
	delegate: {
		onInvite,
		onConnect,
		onDisconnect
	},
	forceRport: false,
	hackIpInContact: true,
	hackAllowUnregisteredOptionTags: false,
	hackViaTcp: true,
	logBuiltinEnabled: true,
	logConfiguration: true,
	logLevel: "debug",
	noAnswerTimeout: 60,
	transportOptions: {
		traceSip: true,
		server: ws_server,
	},
	uri: myRegUri,
	userAgentString: 'VICIphone 3.0.0',
};

var lang = {
	attempting:'Attempting',
	connected:'WS Connected',
	disconnected:'WS Disconnected',
	exten:'Extension',
	incall:'Incall',
	init:'Initializing...',
	redirect:'Redirect',
	regFailed:'Reg. Failed',
	registering:'Registering',
	registered:'Registered',
	reject:'Rejected',
	ringing:'Ringing',
	send:'Send',
	trying:'Trying',
	unregFailed:'Unreg. Failed',
	unregistered:'Unregistered',
	unregistering:'Unregistering',
	webrtcError:'Something went wrong with WebRTC. Either your browser does not support the necessary WebRTC functions, you did not allow your browser to access the microphone, or there is a configuration issue. Please check your browsers error console for more details. For a list of compatible browsers please vist http://webrtc.org/',
};

initialize();



function initialize() {
	// Initialization
	debugOut ( '<br />&nbsp;&nbsp;displayName: ' + cid_name + "<br />&nbsp;&nbsp;uri: " + sip_uri + "<br />&nbsp;&nbsp;authorizationUser: " + auth_user + "<br />&nbsp;&nbsp;authorizationPassword: " + password + "<br />&nbsp;&nbsp;wsServers: " + ws_server );

	// initialize the language translation
	initLanguage();

	// report which microphone and speakers are available
	reportMediaDevices();

	// configure the audio playbacks
	configureAudio();

	// adjust the display settings
	processDisplaySettings();


	// set the mySipServer variable based off the sip_uri sent in
	mySipServer = sip_uri.replace(/^.*@/,'');

	// add event listeners for the various buttons
	addListeners();

	// set the reg status variable
	uiElements.reg_status.value = lang.init;

	myUserAgent = new SIP.UserAgent(myUserAgentConfig);
	myUserAgent.start()
		.then(() => {
			console.log("myUserAgent started");

			myRegisterer = new SIP.Registerer(myUserAgent);

			// Setup myRegisterer state change handler
			myRegisterer.stateChange.addListener((newState) => {
				switch (newState) {
					case SIP.RegistererState.Registered:
						handleRegRegistered();
						break;
					case SIP.RegistererState.Unregistered:
						handleRegUnregistered();
						break;
					case SIP.RegistererState.Terminated:
						handleRegTerminated();
						break;
				}
			});

			// Send REGISTER
			myRegisterer.register()
				.then((request) => {
					handleRegRegistering(request);
				})
				.catch((error) => {
					handleRegFailed(error);
				});

		})
		.catch((error) => {
			console.error("Failed to start myUserAgent " + error.message);
		});
};

function initLanguage() {
	if ( langAttempting != '' ) { lang.attempting = langAttempting ; }
	if ( langConnected != '' ) { lang.connected = langConnected ; }
	if ( langDisconnected != '' ) { lang.disconnected = langDisconnected ; }
	if ( langExten != '' ) { lang.exten = langExten ; }
	if ( langIncall != '' ) { lang.incall = langIncall ; }
	if ( langInit != '' ) { lang.init = langInit ; }
	if ( langRedirect != '' ) { lang.redirect = langRedirect ; }
	if ( langRegFailed != '' ) { lang.regFailed = langRegFailed ; }
	if ( langRegistering != '' ) { lang.registering = langRegistering ; }
	if ( langRegistered != '' ) { lang.registered = langRegistered ; }
	if ( langReject != '' ) { lang.reject = langReject ; }
	if ( langRinging != '' ) { lang.ringing = langRinging ; }
	if ( langSend != '' ) { lang.send = langSend ; }
	if ( langTrying != '' ) { lang.trying = langTrying ; }
	if ( langUnregFailed != '' ) { lang.unregFailed = langUnregFailed ; }
	if ( langUnregistered != '' ) { lang.unregistered = langUnregistered ; }
	if ( langUnregistering != '' ) { lang.unregistering = langUnregistering ; }
	if ( langWebrtcError != '' ) { lang.webrtcError = langWebrtcError ; }
}


function onConnect() {
	uiElements.reg_status.value = lang.connected;
	uiElements.reg_icon.src = 'images/wp_register_inactive.gif';
	uiElements.unreg_icon.src = 'images/wp_unregister_active.gif';
}

function onDisconnect(error) {
	uiElements.reg_status.value = lang.disconnected;
	uiElements.reg_icon.src = 'images/wp_register_inactive.gif';
	uiElements.unreg_icon.src = 'images/wp_unregister_active.gif';
	if (!error) { debugOut( "User agent stopped" ); }
	else { debugOut( error.message ); }
}

// function called when a SIP INVITE is recieved
function onInvite(invitation) {
	debugOut( "INVITE Recieved" );

	// check if we are in a call already
	if ( incall ) {
		// we are so reject it
		debugOut( 'Recieved INVITE while in a call. Rejecting.' );
		var options = {
			statusCode: 486,
			reasonPhrase: "Busy Here"
		};
		invitation.reject(options);
	} else {
		mySession = invitation;

		// Setup session state change handler
		mySession.stateChange.addListener((state) => {
			switch (state) {
				case SIP.SessionState.Initial:
					handleSessionInitial();
					break;
				case SIP.SessionState.Establishing:
					handleSessionEstablishing();
					break;
				case SIP.SessionState.Established:
					handleSessionEstablished();
					break;
				case SIP.SessionState.Terminating:
				case SIP.SessionState.Terminated:
					handleSessionTerminated();
					break;
				default:
					debugOut("Unknown session state.");
			}
		});


		// we are now so good to process it

		var remoteUri = mySession.remoteIdentity.uri.toString();
		var displayName = mySession.remoteIdentity.displayName;
		var regEx1 = /sip:/;
		var regEx2 = /@.*$/;
		var extension = remoteUri.replace( regEx1 , '' );
		extension = extension.replace( regEx2 , '' );
		caller = extension;

		debugOut( 'Got Invite from <' + extension + '> "' + displayName + '"');
		uiElements.reg_status.value = extension + ' - ' + displayName;

		debugOut( 'Audio Settings: autoGainControl=' + auto_gain + ' echoCancellation=' + echo_can + ' noiseSuppression=' + noise_sup );
		// if auto answer is set answer the call
		if ( auto_answer ) {
			//incall = true;
			debugOut( 'Auto-Answered Call' );
			uiElements.dial_icon.src = 'images/wp_hangup.gif';

			options =  {
				sessionDescriptionHandlerOptions: {
					constraints: {
						audio: {
							autoGainControl: auto_gain,
							echoCancellation: echo_can,
							noiseSuppression: noise_sup,
						},
						video: false
					}
				}
			};

			mySession.accept(options);
		} else {
			// auto answer not enabled
			// ring the phone
			ringing = true;

			// start ringing
			audioPlayback.ring.play();
			startBlink();
		}
	}
}


// function called to place an outbound call
function dialNumber() {
	// check if currently in a call
	if ( incall ) {
		debugOut( 'Already in a call' );
	} else {
		myCallUri = SIP.UserAgent.makeURI( 'sip:' + uiElements.digits.value + '@' + mySipServer );

		mySession = new SIP.Inviter(myUserAgent, myCallUri);

		// Setup session state change handler
		mySession.stateChange.addListener((state) => {
			switch (state) {
				case SIP.SessionState.Initial:
					handleSessionInitial();
					break;
				case SIP.SessionState.Establishing:
					handleSessionEstablishing();
					break;
				case SIP.SessionState.Established:
					handleSessionEstablished();
					break;
				case SIP.SessionState.Terminating:
				case SIP.SessionState.Terminated:
					handleSessionTerminated();
					break;
				default:
					debugOut("Unknown session state.");
			}
		});

		debugOut( 'Audio Settings: autoGainControl=' + auto_gain + ' echoCancellation=' + echo_can + ' noiseSuppression=' + noise_sup );
		// Options including delegate to capture response messages
		const inviteOptions = {
			requestDelegate: {
				onAccept: (response) => {
					handleInviteAccept(response);
				}
				,
				onProgress: (response) => {
					handleInviteProgress(response);
				},
				onRedirect: (response) => {
					handleInviteRedirect(response);
				},
				onReject: (response) => {
					handleInviteReject(response);
				},
				onTrying: (response) => {
					handleInviteTrying(response);
				}
			},
			sessionDescriptionHandlerOptions: {
				constraints: {
					audio: {
						autoGainControl: auto_gain,
						echoCancellation: echo_can,
						noiseSuppression: noise_sup,
					},
					video: false
				}
			}
		};

		mySession.invite(inviteOptions);

		incall = true;
		uiElements.reg_status.value = lang.attempting + ' - ' + uiElements.digits.value;

		caller = uiElements.digits.value;

		uiElements.digits.value = '';
	}

	return true;
}

// called when we get a 2XX message for our outgoing call
function handleInviteAccept(response){
	if (mySession != false) {
		debugOut( 'Called party accepted - ' + response.message.statusCode + ":" + response.message.reasonPhrase );

		incall = true;

		uiElements.reg_status.value = lang.incall + ' - ' + caller;

		// They answered stop ringing
		audioPlayback.progress.pause();
		audioPlayback.progress.currentTime = 0;
		stopBlink();
	} else {
		debugOut( 'Called party accepted but the session has already been terminated - ' + response.message.statusCode + ":" + response.message.reasonPhrase );
		debugOut( 'Is RTCP-MUX set for this phone account?' );

		incall = false

		uiElements.reg_status.value = lang.registered;
	}

	// They answered stop ringing
	audioPlayback.progress.pause();
	audioPlayback.progress.currentTime = 0;
	stopBlink();

}

// called when we get a 1XX message for our outgoing call
// excludes 100 responses
function handleInviteProgress(response){
	debugOut( 'Called party is ringing - ' + response.message.statusCode + ":" + response.message.reasonPhrase );

	uiElements.reg_status.value = lang.ringing + ' - ' + caller;

	// start the progress audio
	audioPlayback.progress.play();
	startBlink();
}

// called when we get a 3XX message for our outgoing call
function handleInviteRedirect(response){
	debugOut( 'Called party redirected the call - ' + response.message.statusCode + ":" + response.message.reasonPhrase );

	incall = false;

	uiElements.reg_status.value = lang.redirect + ' - ' + caller;

	// stop the progress audio
	audioPlayback.progress.pause();
	audioPlayback.progress.currentTime = 0;
	stopBlink();
}

// called when we get a 4XX, 5XX, 6XX message for our outgoing call
function handleInviteReject(response) {
	debugOut( 'Called party rejected the call - ' + response.message.statusCode + ":" + response.message.reasonPhrase );

	incall = false;

	if (( uiElements.reg_status.value != lang.registered ) && (uiElements.reg_status.value != lang.unregistered)) {
		uiElements.reg_status.value = lang.reject + ' (' + response.message.statusCode + " - " + response.message.reasonPhrase + ')';
	}

	// stop the progress audio
	audioPlayback.progress.pause();
	audioPlayback.progress.currentTime = 0;
	stopBlink();
}

// called when we get a 100 message for our outgoing call
function handleInviteTrying(response) {
	debugOut( 'Called party is trying the call - ' + response.message.statusCode + ":" + response.message.reasonPhrase );

	uiElements.reg_status.value = lang.trying + ' - ' + caller;
}

function handleInviteFailed(error) {
	debugOut( "Invite Failed : " + error.message );
}


function handleSessionInitial() {
	debugOut( 'Session Initializing' );
}

function handleSessionEstablishing() {
	debugOut( 'Session Establishing' );
}

function handleSessionEstablished() {
	debugOut( 'Session Established' );

	// we are in a call
	incall = true;

	// We need to check the peer connection to determine which track was added
	var pc = mySession.sessionDescriptionHandler.peerConnection;

	// Gets remote tracks
	var remoteStream = new MediaStream();
	pc.getReceivers().forEach(function(receiver) {
		if( receiver.track ) {
			remoteStream.addTrack(receiver.track);
		}
	});

	uiElements.audio.srcObject = remoteStream;
	uiElements.audio.play();
}

function handleSessionTerminated() {
	debugOut( 'Session Terminated' );

	mySession = false;

	// remove the audio tracks
	uiElements.audio.srcObject = null;
	uiElements.audio.pause();

//	if ( myRegisterer.state == "Registered" ) {
//		uiElements.reg_status.value = lang.registered;
//		uiElements.reg_icon.src = 'images/wp_register_active.gif';
//		uiElements.unreg_icon.src = 'images/wp_unregister_inactive.gif';
//		uiElements.dial_icon.src = 'images/wp_dial.gif';
//	} else {
//		uiElements.reg_status.value = lang.unregistered;
//		uiElements.reg_icon.src = 'images/wp_register_inactive.gif';
//		uiElements.unreg_icon.src = 'images/wp_unregister_active.gif';
//		uiElements.dial_icon.src = 'images/wp_dial.gif';
//	}

	if ( ringing ) {
		// stop ringing
		ringing = false;
		audioPlayback.ring.pause();
		audioPlayback.ring.currentTime = 0;
	}

	stopBlink();

	// call has ended
	incall = false;
}

function handleUnload() {
	// check if in a call
	if ( incall ) {
		mySession.bye();
		mySession = false;
		incall = false;
		audioPlayback.ring.pause();
		audioPlayback.ring.currentTime = 0;
	}

	return true;
}



// function called when a SIP MESSAGE is recieved
// NOT IMPLEMENTED IN VICIPHONE
function handleMessage(message) {
	debugOut( "MESSAGE Recieved. NOT IMPLEMENTED IN VICIPHONE!" );
}

// function called when a SIP MESSAGE is recieved
// NOT IMPLEMENTED IN VICIPHONE
function handleNotify(notification) {
	debugOut( "NOTIFY Recieved. NOT IMPLEMENTED IN VICIPHONE!" );
}

// function called when a SIP MESSAGE is recieved
// NOT IMPLEMENTED IN VICIPHONE
function handleRefer(referral) {
	debugOut( "REFER Recieved. NOT IMPLEMENTED IN VICIPHONE!" );
}

// function called when a SIP MESSAGE is recieved
// NOT IMPLEMENTED IN VICIPHONE
function handleSubscription(subscription) {
	debugOut( "SUBSCRIBE Recieved. NOT IMPLEMENTED IN VICIPHONE!" );
}

// called when RegistererState changes to Registered
function handleRegRegistered() {
	if ( incall == false ) {
		uiElements.reg_status.value = lang.registered;
		uiElements.reg_icon.src = 'images/wp_register_active.gif';
		uiElements.unreg_icon.src = 'images/wp_unregister_inactive.gif';
	
		// check if we should call an extension upon registration
		if (( dial_reg_exten == 1 ) && ( reg_exten != '' )) {
			uiElements.digits.value = reg_exten;
			dialNumber();
		}
	}
}

// called when RegistererState changes to Unregistered
function handleRegUnregistered() {
	uiElements.reg_status.value = lang.unregistered;
	uiElements.reg_icon.src = 'images/wp_register_inactive.gif';
	uiElements.unreg_icon.src = 'images/wp_unregister_active.gif';
}

// called when RegistererState changes to Terminated
function handleRegTerminated() {
	uiElements.reg_status.value = lang.unregistered;
	uiElements.reg_icon.src = 'images/wp_register_inactive.gif';
	uiElements.unreg_icon.src = 'images/wp_unregister_active.gif';
	debugOut( "Registration Terminated" );
}

// called when a registration request is sent
function handleRegRegistering(request) {
	uiElements.reg_status.value = lang.registering;
	uiElements.reg_icon.src = 'images/wp_register_inactive.gif';
	uiElements.unreg_icon.src = 'images/wp_unregister_active.gif';
	debugOut( "Register Request Sent: <br />&nbsp;&nbsp;" + request.message );
}

// called when a registration request fails
function handleRegFailed(error) {
	uiElements.reg_status.value = lang.regFailed;
	uiElements.reg_icon.src = 'images/wp_register_inactive.gif';
	uiElements.unreg_icon.src = 'images/wp_unregister_active.gif';
	debugOut( "Got Registration Error: " + error.message );
}

// called when a registration request is sent
function handleRegUnregistering(request) {
	uiElements.reg_status.value = lang.unregistering;
	uiElements.reg_icon.src = 'images/wp_register_inactive.gif';
	uiElements.unreg_icon.src = 'images/wp_unregister_active.gif';
	debugOut( "Un-Register Request Sent: <br />&nbsp;&nbsp;" + request.message );
}

// called when a registration request fails
function handleRegUnregFailed(error) {
	uiElements.reg_status.value = lang.unregFailed;
	uiElements.reg_icon.src = 'images/wp_register_inactive.gif';
	uiElements.unreg_icon.src = 'images/wp_unregister_active.gif';
	debugOut( "Got Un-Registration Error: " + error.message );
}

// called when the registrer button is pressed
function registerButton( ) {
	debugOut( 'Register Button Pressed' );

	// Send REGISTER
	myRegisterer.register()
		.then((request) => {
			handleRegRegistering(request);
		})
		.catch((error) => {
			handleRegFailed(error);
		});

	return true;
}

// called when the unregistrer button is pressed
function unregisterButton() {
	debugOut( 'Un-Register Button Pressed' );

	// Send un-REGISTER
	myRegisterer.unregister()
		.then((request) => {
			handleRegUnregistering(request);
		})
		.catch((error) => {
			handleRegUnregFailed(error);
		});

	return true;
}

// called to configure the various audio playbacks
function configureAudio( ) {
	// adjust the dtmf tone volume
	audioPlayback.dtmfZero.volume = dtmfVolume;
	audioPlayback.dtmfOne.volume = dtmfVolume;
	audioPlayback.dtmfTwo.volume = dtmfVolume;
	audioPlayback.dtmfThree.volume = dtmfVolume;
	audioPlayback.dtmfFour.volume = dtmfVolume;
	audioPlayback.dtmfFive.volume = dtmfVolume;
	audioPlayback.dtmfSix.volume = dtmfVolume;
	audioPlayback.dtmfSeven.volume = dtmfVolume;
	audioPlayback.dtmfEight.volume = dtmfVolume;
	audioPlayback.dtmfNine.volume = dtmfVolume;
	audioPlayback.dtmfHash.volume = dtmfVolume;
	audioPlayback.dtmfStar.volume = dtmfVolume;

	// make the ringing audio loop
	audioPlayback.ring.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	}, false);

	if ( region ) {
		var progressFile = 'sounds/progress-' + region + '.mp3';
		debugOut( 'progress audio = ' + progressFile );
		audioPlayback.progress = new Audio(progressFile);
	}

	// make the progress audio loop
	audioPlayback.progress.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	}, false)

	return true;
}

// called to make the reg_status element blink
function startBlink( ) {
	uiElements.reg_status.style.backgroundImage = "url('images/reg_status_blink.gif')";
	return true;
}

// called to make the reg_status element stop blinking
function stopBlink( ) {
	uiElements.reg_status.style.backgroundImage = "";
	return true;
}

// called when one of the dial pad buttons is pressed
function dialPadPressed( digit, mySession ) {
	// if the dialpad is hidden do nothing
	if ( hide_dialpad ) {
		return false;
	}

	// play the appropriate dtmf audio sound
	switch( digit ) {
		case "0":
			audioPlayback.dtmfZero.play();
			break;
		case "1":
			audioPlayback.dtmfOne.play();
			break;
		case "2":
			audioPlayback.dtmfTwo.play();
			break;
		case "3":
			audioPlayback.dtmfThree.play();
			break;
		case "4":
			audioPlayback.dtmfFour.play();
			break;
		case "5":
			audioPlayback.dtmfFive.play();
			break;
		case "6":
			audioPlayback.dtmfSix.play();
			break;
		case "7":
			audioPlayback.dtmfSeven.play();
			break;
		case "8":
			audioPlayback.dtmfEight.play();
			break;
		case "9":
			audioPlayback.dtmfNine.play();
			break;
		case "*":
			audioPlayback.dtmfStar.play();
			break;
		case "#":
			audioPlayback.dtmfHash.play();
			break;
	}

	// check if the mySession is not there
	if ( mySession == false ) {
		debugOut( 'Adding key press ' + digit + ' to dial digits' );
		uiElements.digits.value = uiElements.digits.value + digit;
	} else {
		debugOut( 'Sending DTMF ' +  digit );
		var options = {
			requestOptions: {
				body: {
					contentDisposition: "render",
					contentType: "application/dtmf-relay",
					content: "Signal=" + digit + "\r\nDuration=100"
				}
			}
		};
		mySession.info(options);
	}

	return true;
}

async function sendButton( mySession ) {
	// if the dialpad is hidden do nothing
	if ( hide_dialpad ) {
		return false;
	}

	// check if the mySession is not there
	if ( mySession == false ) {
		// TODO give some type of error
	} else {
		var digits = uiElements.dtmf_digits.value;
		for (var i = 0; i < digits.length; i++) {
			var digit = digits[i];
			debugOut( 'Sending DTMF ' +  digit );
			var options = {
				requestOptions: {
					body: {
						contentDisposition: "render",
						contentType: "application/dtmf-relay",
						content: "Signal=" + digit + "\r\nDuration=250"
					}
				}
			};
			mySession.info(options);

			// sleep 250ms
			await new Promise(r => setTimeout(r, 250));

			// play the appropriate dtmf audio sound
			switch( digit ) {
			case "0":
				audioPlayback.dtmfZero.play();
				break;
			case "1":
				audioPlayback.dtmfOne.play();
				break;
			case "2":
				audioPlayback.dtmfTwo.play();
				break;
			case "3":
				audioPlayback.dtmfThree.play();
				break;
			case "4":
				audioPlayback.dtmfFour.play();
				break;
			case "5":
				audioPlayback.dtmfFive.play();
				break;
			case "6":
				audioPlayback.dtmfSix.play();
				break;
			case "7":
				audioPlayback.dtmfSeven.play();
				break;
			case "8":
				audioPlayback.dtmfEight.play();
				break;
			case "9":
				audioPlayback.dtmfNine.play();
				break;
			case "*":
				audioPlayback.dtmfStar.play();
				break;
			case "#":
				audioPlayback.dtmfHash.play();
				break;
			}

		}

		uiElements.dtmf_digits.value = '';
	}

	return true;
}



function dialButton() {
	// check if in a call
	if ( incall ) {
		// we are so they hung up the call
		debugOut( 'Hangup Button Pressed' );
		uiElements.dial_icon.src = 'images/wp_dial.gif';
		hangupCall();
	} else {
		// we are not

		// check if ringing
		if ( ringing ) {
			// we are ringing
			// stop the ringing
			ringing = false;
			stopBlink();
			audioPlayback.ring.pause();
			audioPlayback.ring.currentTime = 0;

			//incall = true;
			debugOut( 'Answered Call' );
			uiElements.dial_icon.src = 'images/wp_hangup.gif';

			options =  {
				sessionDescriptionHandlerOptions: {
					constraints: {
						audio: {
							autoGainControl: true,
							echoCancellation: true,
							noiseSuppression: true,
						},
						video: false
					}
				}
			};

			mySession.accept(options);

		} else {
			// not in a call and the phone is not ringing
			debugOut( 'Dial Button Pressed' );
			// make sure the dial box is not hidden
			if ( !hide_dialbox ) {
				uiElements.dial_icon.src = 'images/wp_hangup.gif';
				dialNumber();
			}
		}
	}

	return true;
}

function muteButton() {
	// if the button is hidden do nothing
	if ( hide_mute ) {
		return false;
	}

	// check if in a call
	if ( incall ) {
		if ( muted ) {
			// call is currently muted
			// unmute it
			muted = false;
			debugOut( 'Un-Mute Button Pressed' );
			uiElements.mute_icon.src = 'images/wp_mic_on.gif';
		} else {
			// call is not muted
			// mute it
			muted = true;
			debugOut( 'Mute Button Pressed' );
			uiElements.mute_icon.src = 'images/wp_mic_off.gif';
		}

		// find all the tracks and toggle them.
		var pc = mySession.sessionDescriptionHandler.peerConnection;

		if (pc.getSenders) {
			pc.getSenders().forEach(function (sender) {
				if (sender.track) {
					console.log( sender.track.getCapabilities() );

					sender.track.enabled = !muted;
				}
			});
		} else {
			pc.getLocalStreams().forEach(function (stream) {
				stream.getAudioTracks().forEach(function (track) {
					console.log( track.getCapabilities() );

					track.enabled = !muted;
				});
				stream.getVideoTracks().forEach(function (track) {
					console.log( track.getCapabilities() );

					track.enabled = !muted;
				});
			});
		}

	} else {
		debugOut( 'Mute Button Pressed But Not In Call' );
		uiElements.mute_icon.src = 'images/wp_mic_on.gif';
		muted = false;
	}

	return true;
}

function volumeUpButton() {
	// if the volume buttons are hidden do nothing
	if ( hide_volume ) {
		return false;
	}

	debugOut( 'Volume Up Button Pressed' );
	adjustVolume(0.1);

	return true;
}

function volumeDownButton() {
	// if the volume buttons are hidden do nothing
	if ( hide_volume ) {
		return false;
	}
	debugOut( 'Volume Down Button Pressed' );
	adjustVolume(-0.1);

	return true;
}

function adjustVolume( value ) {
	volume = uiElements.audio.volume;
	debugOut( 'Current Volume = ' + Math.round(volume * 100) + '%');
	new_volume = volume + value;
	if ( new_volume > 1 ) {
		debugOut( 'Volume is maxed' );
	} else if ( new_volume < 0 ) {
		debugOut( 'Volume is already 0' );
	} else {
		volume = new_volume;
	}
	if ( volume < 0 ) { volume = 0; }
	if ( volume > 1 ) { volume = 1; }
	debugOut( 'New Volume = ' + Math.round(volume * 100) + '%' );
	uiElements.audio.volume = volume;

	return true;
}

function hangupCall() {
	// check if in a call
	if ( incall ) {
		if ( mySession != false ) {
			if ( mySession.state == SIP.SessionState.Established ) {
				mySession.bye();
			} else if ( mySession.state == SIP.SessionState.Establishing ) {
				mySession.cancel();
			}
		}
		mySession = false;
		incall = false;
		audioPlayback.ring.pause();
		audioPlayback.ring.currentTime = 0;
		audioPlayback.progress.pause();
		audioPlayback.progress.currentTime = 0;
		if ( myRegisterer.state == "Registered" ) {
			uiElements.reg_status.value = lang.registered;
			uiElements.reg_icon.src = 'images/wp_register_active.gif';
			uiElements.unreg_icon.src = 'images/wp_unregister_inactive.gif';
			uiElements.dial_icon.src = 'images/wp_dial.gif';
		} else {
			uiElements.reg_status.value = lang.unregistered;
			uiElements.reg_icon.src = 'images/wp_register_inactive.gif';
			uiElements.unreg_icon.src = 'images/wp_unregister_active.gif';
			uiElements.dial_icon.src = 'images/wp_dial.gif';
		}
	} else {
		debugOut( 'Attempt to hang up non-existant call' );
	}

	return true;
}

function handleInboundRefer() {
	debugOut( 'Session Refer Event Fired' );
}

function WebRTCError() {
	alert( 'Something went wrong with WebRTC. Either your browser does not support the necessary WebRTC functions, you did not allow your browser to access the microphone, or there is a configuration issue. Please check your browsers error console for more details. For a list of compatible browsers please vist http://webrtc.org/');
}



function processDisplaySettings() {
	if ( hide_dialpad ) {
		debugOut("Hiding Dialpad");
		uiElements.dialpad.setAttribute("hidden", true);
		uiElements.main.style.width = '265px';
	}
	if ( hide_dialbox ) {
		debugOut("Hiding Dialbox");
		uiElements.digits.setAttribute("hidden", true);
	}
	if ( hide_mute ) {
		debugOut("Hiding Mute Button");
		uiElements.mic_mute.setAttribute("hidden", true);
	}
	if ( hide_volume ) {
		debugOut("Hiding Volume Buttons");
		uiElements.vol_down.setAttribute("hidden", true);
		uiElements.vol_up.setAttribute("hidden", true);
	}
}

function debugOut( string ) {
	// chekc if debug is enabled
	if ( debug ) {
		// format the date string
		var date;
		date = new Date();
		date = date.getFullYear() + '-' +
			('00' + (date.getMonth()+1)).slice(-2) + '-' +
			('00' + date.getDate()).slice(-2) + ' ' +
			('00' + date.getHours()).slice(-2) + ':' +
			('00' + date.getMinutes()).slice(-2) + ':' +
			('00' + date.getSeconds()).slice(-2);

		// add the debug string to the debug element
		uiElements.debug.innerHTML = uiElements.debug.innerHTML + date + ' => ' + string + '<br>';
	} else {
		return false;
	}
}

async function reportMediaDevices() {
	let stream = null;
	try {
		stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
	} catch (err) {
		// TODO handle error
	}

	if (!nav.mediaDevices || !nav.mediaDevices.enumerateDevices) {
		debugOut ("enumerateDevices() not supported.");
	} else {
		var audioInDevices = "";
		var audioOutDevices = "";
		nav.mediaDevices.enumerateDevices()
		.then(function(devices) {
			devices.forEach(function(device) {
				if ( device.kind ==  'audioinput' ) {
					audioInDevices = audioInDevices + "<br />&nbsp;&nbsp;" + device.label + "(" + device.deviceId + ")" ;
				}
				if ( device.kind ==  'audiooutput' ) {
					audioOutDevices = audioOutDevices + "<br />&nbsp;&nbsp;" + device.label + "(" + device.deviceId + ")";
				}
				//debugOut(device.kind + ": " + device.label + " id = " + device.deviceId);
			});

			debugOut( "Audio Input Devices: " + audioInDevices );
			debugOut( "Audio Output Devices: " + audioOutDevices );
		})
		.catch(function(err) {
			debugOut(err.name + ": " + err.message);
		});
	}
}

function addListeners() {
	// Dial pad keys
	uiElements.one.addEventListener("click", function() { dialPadPressed('1',mySession) } );
	uiElements.two.addEventListener("click", function() { dialPadPressed('2',mySession) } );
	uiElements.three.addEventListener("click", function() { dialPadPressed('3',mySession) } );
	uiElements.four.addEventListener("click", function() { dialPadPressed('4',mySession) } );
	uiElements.five.addEventListener("click", function() { dialPadPressed('5',mySession) } );
	uiElements.six.addEventListener("click", function() { dialPadPressed('6',mySession) } );
	uiElements.seven.addEventListener("click", function() { dialPadPressed('7',mySession) } );
	uiElements.eight.addEventListener("click", function() { dialPadPressed('8',mySession) } );
	uiElements.nine.addEventListener("click", function() { dialPadPressed('9',mySession) } );
	uiElements.zero.addEventListener("click", function() { dialPadPressed('0',mySession) } );
	uiElements.star.addEventListener("click", function() { dialPadPressed('*',mySession) } );
	uiElements.pound.addEventListener("click", function() { dialPadPressed('#',mySession) } );

	// Send DTMF button
	uiElements.send_dtmf.addEventListener("click", function() { sendButton(mySession) } );

	// Dial Button
	uiElements.dial.addEventListener("click", function() { dialButton() } );

	// Mute  Button
	uiElements.mic_mute.addEventListener("click", function() { muteButton() } );

	// Volume Buttons
	uiElements.vol_up.addEventListener("click", function() { volumeUpButton() } );
	uiElements.vol_down.addEventListener("click", function() { volumeDownButton() } );

	// Register Button
	uiElements.register.addEventListener("click", function() { registerButton( ) } );

	// Unregister Button
	uiElements.unregister.addEventListener("click", function() { unregisterButton( ) } );
}
