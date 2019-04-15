# Topical for Reddit

## About

Topical for Reddit is a browser plugin that works with Reddit posts. It generates a summary of the various topics discussed in the comments, and allows easy navigation to comments of interest. Users can easily see if there are topics they've missed while casually browsing.

Topical for Reddit is only supported for Mac OSX at the moment. Windows support is coming soon. Linux is untested but may work. Chrome and Firefox are supported. Add-ons currently must be loaded in developer mode, but signed versions are coming to the Mozilla Add-On Store/Chrome Webstore soon.

## Installing Topical for Reddit

* Clone or download this repository into the desired location
* You'll first need to install the native messaging manifests and the local application. This allows the topic-modeling python script to run in the background.
* Open a terminal window. Navigate to the top-level folder (Topical) using 'cd'.
* Run `sh install/install-chrome.sh` for Chrome, and `sh install/install-firefox.sh` for Firefox.
* Now, load up your browser of choice.
* For Firefox, navigate to the *about:debugging* page. Click *Load Temporary Add-on*, then select the *manifest.json* file. 
* For Chrome, navigate to the *chrome://extensions/* page. Make sure *Developer mode* is selected. Click *Load Unpacked*, then select the *add-on* folder.
* You're ready to go! Navigate to any Reddit page to start.

## Uninstalling Topical for Reddit

* Open a terminal window. Navigate to the top-level folder (Topical) using 'cd'.
* Run `sh install/uninstall-chrome.sh` for Chrome, and `sh install/uninstall-firefox.sh` for Firefox.
* For Firefox, navigate to the *about:debugging* page. Click *Delete* next to the extension. 
* For Chrome, navigate to the *chrome://extensions/* page. Click *Remove* next to the extension. 