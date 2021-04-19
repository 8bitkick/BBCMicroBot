"use strict";

const tweet  = require('./tweet');
const TOP_TWEETS = false;

// Monitor timeline timeline
function Timeline(since_id){
	this.queue = []; // list of mention statuses
	this.since_id = since_id; // Only respond with tweets that happened after this
	this.max_id = null; // Only respond with tweets that happened at of before this
	this.mostRecent = since_id;
}


// Get the next section of timeline timeline
Timeline.prototype.update = async function () {

	if (TOP_TWEETS) {
		var params = {'count':100,'screen_name':'bbcmicrobot'}; // 100 is also the max number of extended tweets we can fetch later
		var api = '/statuses/user_timeline';
	} else {
		// Monitor timeline
		var params = {'count':100}; // 100 is also the max number of extended tweets we can fetch later
		var api = '/statuses/mentions_timeline';
	}


	if  (this.max_id != null)   {params.max_id=this.max_id}
	if  (this.since_id != null) {params.since_id=this.since_id}

	var timeline = await getTimeline(api,params);

	if (timeline.length==0){ // We've reached the bottom.
	this.max_id = null;
	this.since_id = this.mostRecent; // fetch stuff since the newest in the queue
} else {

	if (timeline[0].id_str > this.mostRecent) {this.mostRecent=timeline[0].id_str;console.log("RECENT:"+this.mostRecent)}

	// Push timeline to queue and continue descending the timeline next update
	//timeline = filterTimeline(timeline);
	this.addToQueue(timeline);
	this.max_id = decrementInt64(timeline[timeline.length-1].id_str); // get older stuff next time
}


if (timeline.length>0) {console.log("Twitter timeline ",this.since_id, this.max_id, "Queueing: "+this.queue.length);}

}


// Add the interesting timeline to the BBC Emulator queue
Timeline.prototype.pop = function (timeline) {

	if (this.queue.length == 0 ) {return {'null':null}}

	var popped = this.queue.pop();
	console.log("Client popped "+popped.id_str+" Queueing: "+this.queue.length);
	return popped;
}



// Add the interesting timeline to the BBC Emulator queue
Timeline.prototype.addToQueue = async function (timeline) {

	async function inReplyTo(timeline){
		var truncatedList = [];
		timeline.forEach(function(t) {
			truncatedList.push(t.in_reply_to_status_id_str); // save these for later so we can get 100 with one call
		});
		return await tweet.get('/statuses/lookup',{'id': truncatedList.join(',')});
	}

	if (TOP_TWEETS){
		timeline = timeline.filter(tweet => (tweet.favorite_count+tweet.retweet_count>30));
		timeline = await inReplyTo(timeline);
		timeline = await extendTruncated(timeline);
		timeline = timeline.filter(tweet => (tweet.user.screen_name!="bbcmicrobot"));
	}else {
		timeline = filterTimeline(timeline);
	}

	// descending timeline or new
	if (this.queue.length==0 || this.max_id != null){
		this.queue = this.queue.concat(timeline);
	} else

	// added to timeline since we started
	{
		this.queue = timeline.concat(this.queue);
	}

	if (TOP_TWEETS){
		this.queue = this.queue.sort((a,b) => a.favorite_count - b.favorite_count);
	}

}

// Filter out timeline we don't want to run on the BBC micro
function filterTimeline(timeline){
	if (TOP_TWEETS){

	} else {
		timeline = timeline.filter(tweet => (isBASIC(tweet.text)));
		timeline = timeline.filter(tweet => (tweet.favorited==false));
		timeline = timeline.filter(tweet => (tweet.user.screen_name!="bbcmicrobot"));
	}
	return timeline;
}

// Get some timeline and assign tweet.text to what was originally submitted by the user
async function getTimeline(api, params){
	var timeline = await tweet.get(api, params); // get some timeline
	timeline = await extendTruncated(timeline); // we need to fetch 'extended' tweets for text over 140 charcters
	//timeline = timeline.map(t => t.entities.urls.length == 0 ? t : revertURL(t)); // and swap t.co URLs back to text
	return timeline;
}

// Get extended (over 140 chars) tweet text
async function extendTruncated(timeline){
	var tweetsToExtend = timeline.filter(t => t.truncated == true).map(t => t.id_str);

	if (tweetsToExtend.length>0) {
		var extendedTweets = await tweet.get('/statuses/lookup',{'id': tweetsToExtend.join(','), 'tweet_mode':'extended'});

		extendedTweets.forEach(function(extendedTweet) {
			var index = timeline.findIndex(tweet => tweet.id_str == extendedTweet.id_str);
			timeline[index].text = extendedTweet.full_text; // recover full text from extended tweets
			timeline[index].entities = extendedTweet.entities; // enables recovery of URL-like text
		});}

		return timeline;
	}


	function isBASIC(bas){ // TODO convert to regex
		bas = bas.replace(/@\w+/g, "").trim(); // get rid of tags and white space
		var basic = (bas.match(/^\d/) != null) || // code must start with digit
		bas.includes("=") ||
		(bas.match("[^\0-\x7e]")!=null); // Tokens and/or emoji.
		return basic;
	}


	// Decrement string containing int64
	function decrementInt64 (int64) {
		function pad0 (numStr,len) {
			while (numStr.length < len) {
				numStr = "0" + numStr;
			}
			return numStr
		}

		var result = "";
		var midpt = Math.floor(int64.length/2);
		var upper = int64.substring(0,midpt);
		var lower = int64.substring(midpt);
		var upperVal = new Number(upper);
		var lowerVal = new Number(lower);
		if (lowerVal == 0) {
			if (upperVal == 0) {
				// We don't support negative numbers
				result = "*ERROR*"
			}
			else {
				// borrow 1
				result = pad0((--upperVal).toString(),upper.length) +
				(new Number("1"+lower) - 1).toString();
			}
		}
		else {
			var newLower = (lowerVal - 1).toString();
			result = upper + pad0(newLower,lower.length);
		}
		return result;
	}

	module.exports = Timeline;
