"use strict";
require('dotenv').config();
const PORT        = process.env.PORT || 6502;
const HOST        = process.env.SERVER || 'localhost'
var   POLL_DELAY  = process.env.POLL_DELAY || 5000

const TEST = (process.argv.indexOf("test") > -1)
const TRY = (process.argv.indexOf("try") > -1)
POLL_DELAY = TEST ? 0 : POLL_DELAY ;

const emulationDuration   = 33; // seconds
const startFrame          = 1587; // frames (50fps when vsync active)

const fs           = require('fs');
const requirejs    = require('requirejs'); // for jsbeeb compatibility
const https        = require('https');
const cert_path    = "./certs/";
const parser       = require('./parser');
const gifsicle     = require('gifsicle');
const beebjit      = require('./beebjit');
const cache      = require('./cache');

let   beebState    = null;

var mastodon = TRY ? null : require(TEST ? './test' : './mastodon');

var tweetServer = {
  hostname: HOST,
  port: PORT,
  method: 'GET',
  key: fs.readFileSync(cert_path+'client_key.pem'),
  cert: fs.readFileSync(cert_path+'client_cert.pem'),
  ca: fs.readFileSync(cert_path+'server_cert.pem')
};

function exec(cmd) {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout? stdout.trim() : stderr);
    });
  });
}


function log(l){console.log(l);}

var clientID = "Cli0";

  require( 'console-stamp' )( console, { pattern: 'dd/mm/yyyy HH:MM:ss '},clientID+":" );

  requirejs.config({
    baseUrl: "./node_modules/jsbeeb/",
    paths: {
      'jsunzip': 'lib/jsunzip',
      'promise': 'lib/promise-6.0.0',
      'underscore': 'lib/underscore-min',
      'emulator':'../../jsbeeb'
    }
  });

  requirejs(['emulator'],
  function (jsbeeb) {
    "use strict";

      async function run(tweet){
        console.log("");
        console.log("Running "+tweet.id+" from "+tweet.account.url);

        var c = parser.parseTweet(tweet);

				console.log("Parser output",c);

        // If rude or not basic, skip it
        if (!c.isBASIC) {
          console.log ("No BASIC detected");
          setTimeout(requestTweet, POLL_DELAY);
          return;
        }

        if (c.rude) {
          console.warn("BLOCKED @"+tweet.user.screen_name)
          await mastodon.block(tweet);
          setTimeout(requestTweet, POLL_DELAY);
          return;
        }

        let start      = new Date()
        let media_path = "./tmp/"+tweet.id;

        // Emulate on Beebjit
        if (c.emulator == "beebjit") {

          var frame_path = "./tmp/beebjit_frame_";
          var audio_file = null;
          var pixel_format = "bgra";
          var emu_name = "beebjit";

          beebState = await beebjit(c, jsbeeb);
          if (beebState === null) setTimeout(requestTweet, POLL_DELAY);

        } else // JSbeeb
        {
          var frame_path = media_path + "frame";
          audio_file = media_path + "audiotrack.raw";
          var pixel_format = "rgba";
          var emu_name = "jsbeeb";
          var frames  = await jsbeeb.emulate(c.input,frame_path,audio_file,emulationDuration,startFrame);
          if (!fs.existsSync(audio_file)) audio_file = null;
        }

        // Tweet ID will be used in tmp filenames passed into shell exec, so check it's safe.  For a real tweet it should be numeric while for a testcase it can contain alphanumerics.
        if (/\W/.test(tweet.id)) {
          console.error("id contained unexpected character");
          process.exit(1);
        }

        var end     = new Date() - start
        console.log(emu_name+" DONE in %ds ",end/1000);

        // Count unique video frames
	      var shasum_check = (await exec("sha1sum client.js  | awk '{print $1}' | wc -l")); // should equal 1
	      var shasum = (shasum_check > 0) ? "sha1sum" : "shasum";
        var frames = (await exec(shasum+" "+frame_path+"*."+pixel_format+" | awk '{print $1}' | wc -l"));
        var uniqueFrames = (await exec(shasum+" "+frame_path+"*."+pixel_format+" | awk '{print $1}' | sort | uniq | wc -l"));

        console.log("Captured "+frames+" frames ("+uniqueFrames+" unique) "+frame_path);

   	    start = new Date();

        if (frames == 0) {
          // NO VIDEO -> NOTHING
          var ffmpegCmd = "";
        } else if (uniqueFrames==1 && audio_file === null) {
          // STATIC IMAGE WITHOUT SOUND -> PNG SCREENSHOT
          var mediaFilename = media_path+'.png';
          var mediaType = 'image/png';
          var ffmpegCmd = './ffmpeg -hide_banner -y -f rawvideo -pixel_format '+pixel_format+' -video_size 640x512  -i '+frame_path+(frames-1)+'.'+pixel_format+' -vf "scale=1280:1024" '+mediaFilename

        } else {
          // ANIMATION OR STATIC IMAGE WITH SOUND -> GIF
          var mediaFilename = media_path+'.gif';
          var mediaType = 'image/gif';
          var ffmpegCmd = './ffmpeg -hide_banner -loglevel panic ';
          if (audio_file !== null) {
            ffmpegCmd = ffmpegCmd + '-f f32le -ar 44100 -ac 1 -i '+audio_file;
          }
	          ffmpegCmd = ffmpegCmd + '-y -f image2 -r 50 -s 640x512 -pix_fmt '+pixel_format+' -vcodec rawvideo -i '+frame_path+'%d.'+pixel_format+'  -i images/palette.png -filter_complex "[0:v][1:v] paletteuse" -af "highpass=f=50, lowpass=f=15000,volume=0.5" -b:v 8M -b:a 128k -strict -2 -shortest '+mediaFilename
        }

        if (frames > 0) {
          await exec(ffmpegCmd);
          var checksum = await exec(shasum+" "+frame_path+(frames-1)+'.'+pixel_format+" | awk '{print $1}'");
        } else {
          var checksum = '';
        }

        exec('rm -f '+frame_path+'*.'+pixel_format);

        if (audio_file !== null) {
          fs.unlinkSync(audio_file);
        }
	if (frames > 1) {
	var output = await exec ("gifsicle "+mediaFilename+" --optimize=3 --colors=16 --output "+mediaFilename);
	console.log("Gifsicle:"+output);
	}

        var end = new Date() - start
        console.log("Ffmpeg DONE in %ds ",end/1000);

        if (frames == 0) {
          mastodon.noOutput(tweet);
        } else {
          var hasAudio = (audio_file !== null);

          // Summarize toot data
          let tootData = {
    											 "prog":c.input,
                           "mode":c.mode,
    											 "src": tweet.url,
          							 };

          // Save state to cache
          let tag = (TEST) ? await cache(tootData, beebState) : "test";

          // Post a video toot
          mastodon.videoReply(mediaFilename,mediaType,tweet.id,"@"+tweet.account.acct,tweet,checksum,hasAudio,tag);
        }

        setTimeout(requestTweet, POLL_DELAY);
      };

      function requestTweet() {
        tweetServer.path="/pop";
        https.get(tweetServer, (resp) => {
          let data = '';
          resp.setEncoding('utf8');
          resp.on('data', (chunk) => {
            data += chunk;
          });
          // The whole response has been received. Print out the result.
          resp.on('end', () => {
            var tweet = JSON.parse(data);
            if (typeof tweet.text === 'undefined') {
              setTimeout(requestTweet, 5000);
              return;

            } else {
              if (TEST && tweet.text == null) {process.exit()};
              run(tweet).catch((err) => {
                  console.error(err);
                  if (TEST) {
                      tweetServer.path="/quit";
                      https.get(tweetServer);
                      process.exit(1);
                  }
              });
            }
          });
        }).on("error", (err) => {
          log("Error: " + err.message);
          log('Retry in 5 seconds');
          setTimeout(requestTweet, 5000);
        });
      }

      var try_arg = process.argv.indexOf("try") + 1;
      if (try_arg > 0) {
        var try_file = (try_arg == process.argv.length) ? "/dev/stdin" : process.argv[try_arg];
        var toot = {
          text: fs.readFileSync(try_file, 'utf8'),
          id: 'try',
          user: { screen_name: 'try' },
          account: { username: 'try', url: 'https://localhost/@try' },
          entities: {}
        };
        // Set up mastodon object to mock the methods that we use.
        mastodon = {};
        mastodon.videoReply = function(filename,mediaType,replyTo,text,toot,checksum,hasAudio) {
          console.log("Generated " + mediaType);
          exec("xdg-open "+filename);
          process.exit();
        };
        mastodon.block = function(toot) {
          console.log("Failed: Toot blocked because of badwords");
          process.exit(1);
        };
        mastodon.noOutput = function(toot) {
          console.log("Failed: No output captured");
          process.exit(1);
        };
        run(toot);
      } else {
        requestTweet();
      }
    }
  );
