(function() {

	var model = {};

	function initialize_from_data() {	

		TOPIC_SPACING = 70;
		NUM_TOPICS = model.topics.length;
		DIV_HEIGHT = TOPIC_SPACING * (NUM_TOPICS+1);
		DIV_WIDTH = 400;
		topic_margin = {top: 20, right: 50, bottom: 20, left: 20},
	    
	    topic_width = DIV_WIDTH - topic_margin.right - topic_margin.left,
	    topic_height = DIV_HEIGHT - topic_margin.top - topic_margin.bottom;				

		topic_colors = d3.scaleOrdinal()
							.domain(Object.values(model.topics)
								.map(d=>d.topic_num)
							)
							.range(d3.schemeSet3);

		topic_width_scale = d3.scaleLinear()
							.domain([0, d3.max(model.topics, d=> d.num_posts)])
							.range([12,topic_width])

		model.posts.forEach(function(d) {
			d.viewed = false;
		})

		model.topics.forEach(function(d) {
			d.num_viewed = 0;
		})
	}

	//from https://stackoverflow.com/questions/1586341/how-can-i-scroll-to-a-specific-location-on-the-page-using-jquery
	$.fn.scrollView = function () {
	    return this.each(function () {
	        $('html, body').animate({
	            scrollTop: $(this).offset().top
	        }, 100);
	    });
	}	

	function get_id_from_comment(ele){

		cls = ele._groups[0][0]["className"];
		return get_id_from_class(cls);
	}

	function get_id_from_class(cls) {

		return cls.substring(
			cls.indexOf("t1")+3,
			cls.indexOf("t1")+10
		);		
	}

	function get_next_post_with_topic(topic_num){
		
		unviewed_posts = model.posts
					.filter(d=> d.topic_num == topic_num)
					.filter(d=> !d.viewed)
		if(unviewed_posts.length == 0) {
			//let user know they've seen the whole topic
			return "complete"
		}
		for(let post of unviewed_posts) {
			if($("div.Comment.t1_" + post.id).find("p:first").length == 1) {
				return "div.Comment.t1_" + post.id;
			}
		}
		
		//return if there are remaining posts but they are not visible
		return "hidden"						
	}

	function mark_comments_by_topic() {			

		//delay this slightly so that reddit can pull new comments first
		setTimeout(function(){

			d3.selectAll("div.Comment")
				.append("svg")	
					.attr("width",10)
					.attr("height", function() {
						return d3.select(this.parentNode.parentNode).node().getBoundingClientRect()["height"]/2;
					})					
				.append("rect")
					.attr("class", "post_topic_color_rect")
					.attr("x", 0)
					.attr("y", 0)
					.attr("width",10)
					.attr("height", function() {
						return d3.select(this.parentNode.parentNode).node().getBoundingClientRect()["height"]/2;
					})
					.style("fill", function() {
						try {
							return topic_colors(
								model.posts.filter(
									d=> d.id == get_id_from_comment(d3.select(this.parentNode.parentNode))
								)[0].topic_num
							);
						} catch(e) {
							return "transparent";
						}
					});
		}, 1000)
	}

	function update_next_post_with_topic(sel) {

		next_posts = []
		sel.each(d=> {
			next_posts.push(get_next_post_with_topic(d.topic_num))
		})

		sel
			.text((d,i)=> {	

				if(next_posts[i] == "complete") {
					return "All Posts Viewed!"
				} else if(next_posts[i] == "hidden") {
					return "Remaining posts are not currently visible"
				} else {

					var post_element = $(next_posts[i])
					.find("p:first");
					if(typeof post_element[0] !== 'undefined') {
						return post_element[0].textContent.substring(0,50);
					}
				}
			})
		sel.filter((d,i)=> !["hidden", "complete"].includes(next_posts[i]))
			.attr("text-decoration", "underline")
			.style("fill", "#0000FF")
			.style("pointer-events", "auto")
			.style("cursor", "pointer")		
			.on("click", (d,i)=> {
				$(get_next_post_with_topic(d.topic_num)).scrollView();
			});	

		sel.filter((d,i)=> ["hidden", "complete"].includes(next_posts[i]))
			.attr("text-decoration", "none")
			.style("fill", "black")
			.style("pointer-events", "auto")
			.style("cursor", "auto");
	}

	function build_topic_pane() {

		var topic_pane_div = d3.select("body").insert("div")
			.attr("id", "topic_pane")
			.style("width", DIV_WIDTH+"px")
			.style("height", DIV_HEIGHT+"px")
			.style("background", "#e0e0e0");

		topic_pane_div.append("h1")
			.style("align","left")
			.style("font-size","20px")
			.style("font-weight", "bold")
			.text("Topics");

		var topic_svg = topic_pane_div.append("svg")
		    .attr("width", topic_width + topic_margin.right + topic_margin.left)
		    .attr("height", topic_height + topic_margin.top + topic_margin.bottom)
			.append("g")
		    	.attr("transform", 
		    		"translate(" + topic_margin.left + "," + topic_margin.top + ")"
		    	);			

		var topics = topic_svg.selectAll(".node")
			.data(model.topics)
			.enter()
			.append("g")
		  		.attr("class", "node")
		  		.attr("transform", function(d,i){
		    		return "translate(0," + i*TOPIC_SPACING + ")"
		    	}
		    );      


		var topic_rects = topics.append("rect")
			.attr('rx', 6)
			.attr('ry', 6)
			.attr('y', -7)
			.attr('x', -5)
			.attr('width', 5)
			.attr('height', TOPIC_SPACING)
			.style("fill-opacity", 1)
			.style("fill", function(d) {
				return topic_colors(d.topic_num);
			}
		); 

		var topic_size_bars = topics.append("rect")
			.attr('rx', 6)
			.attr('ry', 6)
			.attr('y', 15)
			.attr("x", 5)
			.attr('width', function(d){
		  		return topic_width_scale(d.num_posts);
		  	})
			.attr('height', 12)
			.style("fill-opacity", 0.6)
			.style("fill", function(d) {
		  		return topic_colors(d.topic_num);
			}
		);  

		/*
		var topics_read_circles = topics.append("circle")
			.attr("id", d=> "topic_read_circle_"+d.topic_num)
			.attr("r", 5)
			.attr("fill", "white")
			.attr("cy", 20)
			.attr("cx", 0)
			*/

		var topics_read_circles = topics.append("rect")
			.attr("id", d=> "topic_read_rect_"+d.topic_num)
			.attr("fill", "white")
			.attr('rx', 6)
			.attr('ry', 6)
			.attr("y", 15)
			.attr("x", 5)	
			.attr('height', 12)
			.attr("width", 12);	

		var topic_size_texts = topics.append("text")
			.attr("x", function(d){
				return 8+topic_width_scale(d.num_posts);
			})
			.attr("y", 20)
			.attr("dy", ".35em")  
			.attr("text-anchor", "start")
			.text(function(d) { 
				return d.num_posts;
			} 
		); 

		var topic_names = topics.append("text")
			.attr("x", 5)
			.attr("y", 5)
			.attr("dy", ".35em")
			.attr("text-anchor", "start")
			.text(function(d) { 
				return d.terms;
			}
		);

		var next_posts = topics.append("text")
			.attr("id", d=> "next_post_text_"+d.topic_num)
			.attr("class", "next_post_text")
			.attr("y", 35)
			.attr("x", 5)
			.attr("dy", ".35em")
			.attr("text-anchor", "start");

		update_next_post_with_topic(next_posts);		

		//fire off the popup
		$("#topic_pane").popup({
			pagecontainer: "2x-container",
			background: false,
			autoopen: true,
			vertical: "top",
			horizontal: "right",
			opacity: 0.0,
			autozindex: true,
			keepfocus: false,
			blur: false		
		});	
	}

	function build_observers() {

		function comment_observed_callback(entries, observer) {

			try {
				entries.forEach(function(entry){

					comment_id = get_id_from_class(entry.target.className);
					datum = model.posts.filter(d=> d.id == comment_id)[0];

					if(datum && !datum.viewed && entry.isIntersecting
						&& entry.intersectionRatio >= 0.9) {

						datum.viewed = true;

						topic_viewed = model.topics.filter(
							d=> d.topic_num == datum.topic_num
						)[0];

						topic_viewed.num_viewed += 1;

						d3.select("#topic_read_rect_"+datum.topic_num)
							.attr("width", topic_width_scale(topic_viewed.num_viewed)
							);

						update_next_post_with_topic(
							d3.select("#next_post_text_"+topic_viewed.topic_num)
						);
					}
				});
			} catch(e) {
				console.log("error");
			}
		}

		var observer_options = {"threshold": 1.0}

		const observer = new IntersectionObserver(
			comment_observed_callback,
			observer_options
		);

		Object.values($("div.Comment")).forEach(function(comment) {

			if(typeof comment === 'object' && comment !== null) {
				observer.observe(comment);
			}
		});	
	}

	function build_onclicks() {
		$('p:contains(" more repl")').on("click", ()=>{
			mark_comments_by_topic();
			update_next_post_with_topic(d3.selectAll(".next_post_text"));

		});
	}	

	function clear() {

		//$("#topic_pane").popup("hide");
		d3.select("#topic_pane_wrapper").remove();
	}

	//chrome.runtime.sendMessage({message:"abc"});
	console.log("page controller initialized");

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {

			console.log(request);
			if(request["action"] == "leave") {

				clear();
			} else if(request["action"] == "build topics") {
				model = request;
				initialize_from_data();
				mark_comments_by_topic();
				build_topic_pane();
				build_onclicks();
				build_observers();
			}
		}
	);	

}) ();