  require('dotenv').config();
  const Twitter          = require('twitter');
  const API_KEYS         = {
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token_key: process.env.access_token_key,
    access_token_secret: process.env.access_token_secret
  }

  const twitter          = new Twitter(API_KEYS);

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

  async function videoReply(filename,mediaType,replyTo,text,tweet,checksum,hasAudio){
    const mediaData   = require('fs').readFileSync(filename);
    const mediaSize   = require('fs').statSync(filename).size;

    try {
    var data = await post('media/upload', {command:'INIT',total_bytes: mediaSize,media_type : mediaType});
    await post('media/upload',    {command:'APPEND', media_id:data.media_id_string, media:mediaData,segment_index: 0});
    await post('media/upload',    {command:'FINALIZE', media_id:data.media_id_string});
    await post('statuses/update', {status:text, media_ids:data.media_id_string, in_reply_to_status_id: replyTo});
    await post('favorites/create',{id: replyTo});
    console.log("Media post DONE");
    }

    catch(e) {
      console.log("Media post FAILED");
      console.log(e);
    }
}

function noOutput(tweet) {
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
