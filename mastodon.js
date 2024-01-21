
const ENABLE_TEXT_REPLY = false;
const log            = require('npmlog');
log.level = process.env.LOG_LEVEL || 'verbose';
const Mastodon  = require('mastodon');
require('dotenv').config();
const config = {
	access_token: process.env.ACCESS_TOKEN,
	api_url: `https://${process.env.API_HOST}/api/v1/`,
	hashtag: process.env.HASHTAG,
};

const mastodon = new Mastodon(config);
const fs	     = require('fs');

function post (path, params) {
	log.info("Post",path,params)
}

function get (path,params) {
		log.info("get",path,params)
}


async function videoReply(filename,mediaType,replyTo,text,toot,checksum,hasAudio,tag){

	if (toot.spoiler_text == ""){
		console.log("No CW on bot source post")
	}

	try {

		let resp = await mastodon.post('media', { file: fs.createReadStream(filename), description:"BBC Micro Bot graphics output - "+toot.spoiler_text });
		log.info(resp)
		let id = resp.data.id; // Source: https://bbcmic.ro/#"+progData
		let params = { status:"I ran "+text+"'s program and got this.\nSource: https://bbcmic.ro/?t="+tag+" #bbcbasic", media_ids: [id],in_reply_to_id:replyTo};
		params.visibility = "public";

		let response = await mastodon.post('statuses', params);
		log.info("Media post DONE ",JSON.stringify(response));

		await mastodon.post('statuses/:id/favourite', { id: [toot.id]});
		log.info("Favourited "+toot.id);

		let user = response.in_reply_to_account_id;

		let relationship = await mastodon.get('accounts/relationship', {id: [user]});

		if (relationship[0].following) {
			// Repost toot resp
			log.info("Reposting toot "+response.id);
			await mastodon.post('statuses/:id/reblog', { id: [response.id]});
		}
		

		//return {full:"https://bbcmic.ro/"+experimental+"#"+progData,key:short_url}
		}

		catch(e) {
			log.info("Media post FAILED");
			log.info(e);
			return null;
		}
	}

	function noOutput(toot) {
		console.warn("NO VIDEO CAPTURED");
		if (!ENABLE_TEXT_REPLY) return;
		try {
			post('statuses/update', {status: "@"+toot.user.screen_name+" Sorry, no output captured from that program", in_reply_to_status_id: toot.id});
		}
		catch(e) {
			log.info("Non-media post FAILED");
			log.info(e);
		}
	}

	function block(toot) {
		post('blocks/create',{screen_name: toot.user.screen_name});
	}

	module.exports = {
		videoReply: videoReply,
		noOutput: noOutput,
		block: block,
		post: post,
		get: get
	};
