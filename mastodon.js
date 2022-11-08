/* Set to false to avoid potentially tweeting repetitive messages - we don't
* want the bot to be shadow-banned by twitter as happened to a previous
* incarnation which responded with text instead of images or videos.
*/
const ENABLE_TEXT_REPLY = false;

require('dotenv').config();
const fs	       = require('fs');

function detokenise(string){
	const tokens = ["AND ","DIV ","EOR ","MOD ","OR ","ERROR ","LINE ","OFF ","STEP ","SPC","TAB(","ELSE ","THEN ","line no. ","OPENIN","PTR","PAGE ","TIME ","LOMEM ","HIMEM ","ABS","ACS","ADVAL","ASC","ASN","ATN","BGET","COS","COUNT ","DEG","ERL ","ERR ","EVAL","EXP","EXT","FALSE ","FN","GET ","INKEY","INSTR","INT","LEN","LN","LOG","NOT ","OPENIN","OPENOUT","PI ","POINT(","POS ","RAD","RND","SGN","SIN","SQR","TAN","TO ","TRUE ","USR","VAL","VPOS ","CHR$","GET$ ","INKEY$","LEFT$(","MID$(","RIGHT$(","STR$","STRING$(","EOF ","AUTO ","DELETE ","LOAD ","LIST ","NEW ","OLD ","RENUMBER ","SAVE ","PUT","PTR","PAGE ","TIME ","LOMEM ","HIMEM ","SOUND ","BPUT","CALL ","CHAIN ","CLEAR ","CLOSE","CLG ","CLS ","DATA ","DEF ","DIM ","DRAW ","END ","ENDPROC ","ENVELOPE ","FOR ","GOSUB ","GOTO ","GCOL ","IF ","INPUT ","LET ","LOCAL ","MODE ","MOVE ","NEXT ","ON ","VDU ","PLOT ","PRINT ","PROC","READ ","REM ","REPEAT ","REPORT ","RESTORE ","RETURN ","RUN ","STOP ","COLOUR ","TRACE ","UNTIL ","WIDTH ","OSCLI"];

	var output = "";

	for (let i = 0; i<graphemes.length; i++){
		var g = graphemes[i].codePointAt(0) & 0xff;
		output += g>=0x80 ? " "+tokens[g-0x80] : graphemes[i];
	}
	return output;
}

function post (path, params) {
	console.log("Post",path,params)
}

function get (path,params) {
		console.log("get",path,params)
}

async function videoReply(filename,mediaType,replyTo,text,tweet,checksum,hasAudio,program,mode){
	const mediaData   = require('fs').readFileSync(filename);
	const mediaSize   = require('fs').statSync(filename).size;

	try {
		 let progData = encodeURIComponent(JSON.stringify({
                        "v":1,
                        "program":program,
                        "author":text,
                        "date": Date.now(),
												"id": replyTo
                }));

		progData = progData.replace(/\(/g, '%28').replace(/\)/g, '%29');

		var data = await post('media/upload', {command:'INIT',total_bytes: mediaSize,media_type : mediaType});
		await post('media/upload',    {command:'APPEND', media_id:data.media_id_string, media:mediaData,segment_index: 0});
		await post('media/upload',    {command:'FINALIZE', media_id:data.media_id_string});
		var response = await post('statuses/update', {status:text+" Source: https://bbcmic.ro/#"+progData, media_ids:data.media_id_string, in_reply_to_status_id: replyTo});
		await post('favorites/create',{id: replyTo});
		console.log("Media post DONE "+response.id_str);

		let record = {
				"v":2,
				"author":tweet.user.screen_name,
				"program":program,
				"mode":mode,
				"date":Math.floor(new Date(tweet.created_at))/1000,
				"in_reply_to_id_str":tweet.id_str
				}

		await fs.writeFileSync('./output/'+response.id_str, JSON.stringify(record,null,4));

		// Post to discord too
		var content = "["+text+"](https://www.twitter.com/"+response.in_reply_to_screen_name+">) posted \n"+response.entities.media[0].media_url_https+"\n\n[Open source in Owlet Editor](https://bbcmic.ro/#"+progData+")\n[See original tweet](https://www.twitter.com/bbcmicrobot/status/"+response.id_str+">)\n";
		if (content.length>1999) {
			content = "["+text+"](https://www.twitter.com/"+response.in_reply_to_screen_name+">) posted \n"+response.entities.media[0].media_url_https+"\n\nSource too long to link to in Owlet\n[See original tweet](https://www.twitter.com/bbcmicrobot/status/"+response.id_str+">)\n";
		};
			console.log(content);
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
