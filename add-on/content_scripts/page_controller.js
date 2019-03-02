(function() {
	/**
	* Check and set a global guard variable.
	* If this content script is injected into the same page again,
	* it will do nothing next time.
	*/

	
	if (window.hasRun) {
		return;
	}
	window.hasRun = true;	

	function get_id_from_comment(ele){

		cls = ele._groups[0][0]["className"];
		comment_id = cls.substring(cls.indexOf("t1")+3, cls.indexOf("t1")+10);
		console.log(comment_id);
		return comment_id;
	}

	function mark_comments_by_topic(model) {	

		var topic_colors = d3.scaleOrdinal()
							.domain(Object.keys(model.topics))
							.range(d3.schemePastel2);		

		comments = d3.selectAll("div .Comment");
		comments.style("background-color", function()
			{
				return topic_colors(model.posts[
					get_id_from_comment(d3.select(this))
					]);
			}
		);
	}

	chrome.runtime.sendMessage({message:"abc"});

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {

			console.log(request);
			mark_comments_by_topic(request);
		}
	);	

}) ();