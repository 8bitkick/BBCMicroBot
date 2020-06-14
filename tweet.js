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

  async function videoReply(videoFilename,replyTo,text){
    const pathToMovie = videoFilename;
    const mediaType   = 'video/mp4';
    const mediaData   = require('fs').readFileSync(pathToMovie);
    const mediaSize   = require('fs').statSync(pathToMovie).size;

    try {
    var data = await post('media/upload', {command:'INIT',total_bytes: mediaSize,media_type : mediaType});
    await post('media/upload',    {command:'APPEND', media_id:data.media_id_string, media:mediaData,segment_index: 0});
    await post('media/upload',    {command:'FINALIZE', media_id:data.media_id_string});
    await post('statuses/update', {status:text, media_ids:data.media_id_string, in_reply_to_status_id: replyTo});
    await post('favorites/create',{id: replyTo});
    console.log("Video post DONE");
    }

    catch(e) {
      console.log("Video post FAILED");
      console.log(e);
    }
}

module.exports = {
    videoReply: videoReply,
    post: post,
    get: get
};
