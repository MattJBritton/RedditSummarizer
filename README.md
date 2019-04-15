# Topical for Reddit

## About

Topical for Reddit is a browser plugin that works with Reddit posts. It generates a summary of the various topics discussed in the comments, and allows easy navigation to comments of interest. Users can easily see if there are topics they've missed while casually browsing.

## Supported Environments

Topical for Reddit is only supported for Mac OSX at the moment. Windows support is coming soon. Linux is untested but may work. Chrome and Firefox are supported. 

## Work in Progress

This is a research grade tool and so some local configuration is currently necessary. Full requirements are listed in the *requirements.txt* file, but broadly you will need Python 2.7 installed and several machine learning libraries. 

Add-ons currently must be loaded in developer mode, but signed versions are coming to the Mozilla Add-On Store/Chrome Webstore soon. In addition, we are working on an API endpoint for the python code so that client-side installation won't be necessary.

## Installing Topical for Reddit

* Clone or download this repository into the desired location
* You'll first need to install the native messaging manifests, the local application, and required dependencies. This allows the topic-modeling python script to run in the background.
* Open a terminal window. Navigate to the top-level folder (Topical) using 'cd'.
* Run `sh install/install-chrome.sh` for Chrome, and `sh install/install-firefox.sh` for Firefox.
* Install dependencies using `pip install -r install/requirements.txt`.
* Now, load up your browser of choice.
* For Firefox, navigate to the *about:debugging* page. Click *Load Temporary Add-on*, then select the *manifest.json* file. 
* For Chrome, navigate to the *chrome://extensions/* page. Make sure *Developer mode* is selected. Click *Load Unpacked*, then select the *add-on* folder.
* You're ready to go! Navigate to any Reddit page to start.

## Uninstalling Topical for Reddit

* Open a terminal window. Navigate to the top-level folder (Topical) using 'cd'.
* Run `sh install/uninstall-chrome.sh` for Chrome, and `sh install/uninstall-firefox.sh` for Firefox.
* For Firefox, navigate to the *about:debugging* page. Click *Delete* next to the extension. 
* For Chrome, navigate to the *chrome://extensions/* page. Click *Remove* next to the extension. 

## Made Using

Built using [D3.js](https://d3js.org/), [jQuery](https://jquery.com/) and [jquery-popup-overlay](https://github.com/vast-engineering/jquery-popup-overlay) for the front-end. The back-end uses [Numpy](https://www.numpy.org/), [Scipy](https://www.scipy.org/), [Scikit-learn](https://scikit-learn.org/stable/), and [SpaCy](https://spacy.io/). Reddit data pulled using [Praw](https://praw.readthedocs.io/en/latest/index.html).