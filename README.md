# Viciphone Version 3.0

With this release comes the following improvements:
* A complete rewrite of the core Viciphone code to support SIP.js v0.20.1
   - This does require 'rtcp_mux=yes' be set in the template you are using for your webphone
* Support for passing a settings container from Vicidial to Viciphone to allow additional settings to be added in the future without Vicidial changes
   - To take advantage of this feature an upgrade to Vicidial is required.
   - Viciphone will still work without the Vicidial upgrade, but some features will not be accessible.
* Added the ability to enable/disable various browser audio processing like Echo Cancellation and Automatic Gain Control
   - Does require the Viciphone settings container support in Vicidial
* Auto call agent conference on successful registration. This is similar to a feature that was added to some forks of Viciphone but it will work even if Viciphone and Vicidial are hosted on different domains.
   - Does require the Viciphone settings container support in Vicidial
* Dynamic translation support. This is a frequent request that has been implemented in several of the forks of Viciphone.
   - Does require the Viciphone settings container support in Vicidial
   - If you create a new translation, please share the values from your settings container
* Play progress audio instead of ringing when placing a call
   - The audio file can be changed in the Viciphone Settings Container by adjusting the region setting.
   - Currently supported regions include North America, Europe, and the UK.


## Note:
If you already have Viciphone working on your cluster, make sure that:
```
rtcp_mux=yes
```
is set in the template you are using for your webphones before switching to this version.
