//from https://github.com/mdn/webextensions-examples/tree/master/native-messaging

reddit_regex = new RegExp("https:\/\/www.reddit.com\/r\/[^\/]*\/comments\/([^\/]*)\/.*");

reddit_tabs = {}

chrome.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => {

	if(changeInfo.status == "complete") {

		if(reddit_tabs.hasOwnProperty(tabId) && reddit_tabs[tabId]["status"] == "active") {

			chrome.tabs.sendMessage(tabId, {"action":"leave"});
			reddit_tabs[tabId]["status"] = "inactive";
		} else if(reddit_regex.test(tab.url)) {

			if(!reddit_tabs.hasOwnProperty(tabId)) {
				chrome.tabs.executeScript(tabId, {"file":"lib/d3.min.js"}, function() {
					chrome.tabs.executeScript(tabId, {"file":"lib/jquery-3.3.1.min.js"}, function() {
						chrome.tabs.executeScript(tabId, {"file":"lib/jquery.popupoverlay.js"}, function() {
							chrome.tabs.executeScript(tabId, {"file":"page_controller.js"});

						})
					})
				})
			}
			generate_topics(tab.url, tabId);
			reddit_tabs[tabId] = {"status":"active"}
		}
	}
});

function generate_topics(url, tab_id) {

	var port = chrome.runtime.connectNative("com.reddit.topic");

	port.onMessage.addListener((response) => {

		response["action"] = "build topics";
		chrome.tabs.sendMessage(tab_id, response);
	});

 	port.onDisconnect.addListener((response) => {
		console.log(response);
 	});

 	url_check = reddit_regex.exec(url);

 	if(url_check != null) {
	 	post_id = url_check[1];
	 	console.log(post_id);
		port.postMessage({post_id: post_id});
	}
}