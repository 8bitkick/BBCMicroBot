"use strict";

const Mastodon       = require('mastodon');
const log            = require('npmlog');
const fs             = require('fs')


require('dotenv').config();
log.level = process.env.LOG_LEVEL || 'verbose';

const config = {
	access_token: process.env.ACCESS_TOKEN,
	api_url: `https://${process.env.API_HOST}/api/v1/`,
	hashtag: process.env.HASHTAG,
};

const client   = new Mastodon(config);
log.info("BBC Micro Bot mastodon edition");
log.info(`Running on: ${process.env.API_HOST}  #${config.hashtag}`);


// Monitor timeline {timeline
class Timeline {
	constructor() {
		this.queue = []; // list of mention statuses
	}


	async update() {

		//console.log(`${config.api_url}timelines/public/?access_token=${config.access_token}&tag=${config.hashtag}`)
		const response = (await client.get('/timelines/tag/:hashtag',{'hashtag':`${config.hashtag}`})).data;

		// List all tagged posts
		for (var i = 0; i < response.length; i++) {

			// Remove those we've already liked
			if (response[i].favourited !== true) {

				response[i].text = response[i].content.replace(/<[^>]*>?/gm, '');
				console.log(response[i].id,"@"+response[i].account.username+" tagged #bbcmicrobot");
				this.queue.push(response[i]);
			}

		}

	}
}



module.exports = Timeline;
