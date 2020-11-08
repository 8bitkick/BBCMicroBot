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
const Grapheme     = require('grapheme-splitter');
var splitter = new Grapheme();

function detokenise(string){
	const tokens = ["AND ","DIV ","EOR ","MOD ","OR ","ERROR ","LINE ","OFF ","STEP ","SPC","TAB(","ELSE ","THEN ","line no. ","OPENIN","PTR","PAGE ","TIME ","LOMEM ","HIMEM ","ABS","ACS","ADVAL","ASC","ASN","ATN","BGET","COS","COUNT ","DEG","ERL ","ERR ","EVAL","EXP","EXT","FALSE ","FN","GET ","INKEY","INSTR","INT","LEN","LN","LOG","NOT ","OPENIN","OPENOUT","PI ","POINT(","POS ","RAD","RND","SGN","SIN","SQR","TAN","TO ","TRUE ","USR","VAL","VPOS ","CHR$","GET$ ","INKEY$","LEFT$(","MID$(","RIGHT$(","STR$","STRING$(","EOF ","AUTO ","DELETE ","LOAD ","LIST ","NEW ","OLD ","RENUMBER ","SAVE ","PUT","PTR","PAGE ","TIME ","LOMEM ","HIMEM ","SOUND ","BPUT","CALL ","CHAIN ","CLEAR ","CLOSE","CLG ","CLS ","DATA ","DEF ","DIM ","DRAW ","END ","ENDPROC ","ENVELOPE ","FOR ","GOSUB ","GOTO ","GCOL ","IF ","INPUT ","LET ","LOCAL ","MODE ","MOVE ","NEXT ","ON ","VDU ","PLOT ","PRINT ","PROC","READ ","REM ","REPEAT ","REPORT ","RESTORE ","RETURN ","RUN ","STOP ","COLOUR ","TRACE ","UNTIL ","WIDTH ","OSCLI"];
	
	var graphemes = splitter.splitGraphemes(string.trim());
	var output = "";
	
	for (let i = 0; i<graphemes.length; i++){
		var g = graphemes[i].codePointAt(0) & 0xff;
		output += g>=0x80 ? " "+tokens[g-0x80] : graphemes[i];
	}
	return output;
}

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
		var content = "["+text+"](https://www.twitter.com/"+response.in_reply_to_screen_name+">) posted \n```basic\n"+detokenise(input)+"```\n"+response.entities.media[0].media_url_https+"\n[See original tweet](https://www.twitter.com/bbcmicrobot/status/"+response.id_str+">)\n";
			console.log(content);
			
			if (typeof discordClient === 'undefined') {
				const Discord = require('discord.js');
				discordClient = new Discord.WebhookClient(process.env.webhookID, process.env.webhookToken);
			}
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
