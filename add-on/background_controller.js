//from https://github.com/mdn/webextensions-examples/tree/master/native-messaging

/*
When the plugin loads, send the app the page URL.
*/

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		generate_topics(sender.url, sender.tab.id);
	}
);

function generate_topics(url, tab_id) {

	var port = chrome.runtime.connectNative("com.reddit.topic");

	port.onMessage.addListener((response) => {
	  chrome.tabs.sendMessage(tab_id, response);
	});

 	port.onDisconnect.addListener((response) => {
		console.log(response);
 	});

 	comments_index = url.indexOf("comments")
 	post_id = url.substring(
 		comments_index+9,
 		url.indexOf("/", comments_index+9)
 		);
 	console.log(post_id);
	port.postMessage({post_id: post_id});
	/*
	chrome.runtime.sendNativeMessage("com.reddit.topic", 
									{post_id: post_id},
									function(response){
										console.log(response)
									});*/
}