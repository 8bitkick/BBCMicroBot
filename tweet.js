  /* Set to false to avoid potentially tweeting repetitive messages - we don't
   * want the bot to be shadow-banned by twitter as happened to a previous
   * incarnation which responded with text instead of images or videos.
   */
  const ENABLE_TEXT_REPLY = false;

  require('dotenv').config();
  const Twitter          = require('twitter');
  const API_KEYS         = {
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token_key: process.env.access_token_key,
    access_token_secret: process.env.access_token_secret,
  }

  const twitter          = new Twitter(API_KEYS);
  const Discord = require('discord.js');

const discordClient = new Discord.WebhookClient(process.env.webhookID, process.env.webhookToken);



  function post (endpoint, params) {
    return new Promise((resolve, reject) => {
      twitter.post(endpoint, params, (error, data, response) => {
        if (error) {
          reject(error); //  POST failure is not critical, reject
        } else {
          resolve(data);
        }
      });
    });
  }

  function get (api,params) {
  	return new Promise((resolve, reject) => {
  		twitter.get(api, params, (err, data) => {
  			if (err) {
  				console.log(err);
  				console.log('RETRY GET in 15 seconds');
  				setTimeout(() => { // Retry GET as we need the data to process
  					get(api, params);
  				}, 15000);
  			} else {
  				resolve(data);
  			}
  		});
  	})
  }

  async function videoReply(filename,mediaType,replyTo,text,tweet,checksum,hasAudio,input){
    const mediaData   = require('fs').readFileSync(filename);
    const mediaSize   = require('fs').statSync(filename).size;

    try {
    var data = await post('media/upload', {command:'INIT',total_bytes: mediaSize,media_type : mediaType});
    await post('media/upload',    {command:'APPEND', media_id:data.media_id_string, media:mediaData,segment_index: 0});
    await post('media/upload',    {command:'FINALIZE', media_id:data.media_id_string});
    var response = await post('statuses/update', {status:text, media_ids:data.media_id_string, in_reply_to_status_id: replyTo});
    await post('favorites/create',{id: replyTo});
    console.log("Media post DONE ");

    // Post to discord too
    var content = text+" posted \n\n`"+input+"`\nhttps://www.twitter.com/bbcmicrobot/status/"+response.id_str;
    console.log(content);
    discordClient.send('Webhook test', {
	username: 'bbcmicrobot',
	"content": content
});	    
    
    }

    catch(e) {
      console.log("Media post FAILED");
      console.log(e);
    }
}

function noOutput(tweet) {
  console.warn("NO VIDEO CAPTURED");
  if (!ENABLE_TEXT_REPLY) return;
  try {
    post('statuses/update', {status: "@"+tweet.user.screen_name+" Sorry, no output captured from that program", in_reply_to_status_id: tweet.id_str});
  }
  catch(e) {
    console.log("Non-media post FAILED");
    console.log(e);
  }
}

function block(tweet) {
  post('blocks/create',{screen_name: tweet.user.screen_name});
}

module.exports = {
    videoReply: videoReply,
    noOutput: noOutput,
    block: block,
    post: post,
    get: get
};
