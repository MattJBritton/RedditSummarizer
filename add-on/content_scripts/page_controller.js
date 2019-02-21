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
		return comment_id;
	}

	function mark_comments_by_topic(topics) {

		var topic_colors = d3.scaleOrdinal(d3.schemeCategory10);	

		comments = d3.selectAll("div .Comment");
		comments.style("background-color", function(d,i)
			{
				return topic_colors(topics[get_id_from_comment(d3.select(this))]);
			}
		);
	}

	browser.runtime.sendMessage({message:"abc"});

	browser.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {

			mark_comments_by_topic(request);
		}
	);	

}) ();