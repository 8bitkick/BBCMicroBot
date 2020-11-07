"use strict";
require('dotenv').config();
const PORT        = process.env.PORT || 6502;
const HOST        = process.env.SERVER || 'localhost'
var   POLL_DELAY  = process.env.POLL_DELAY || 5000

const TEST = (process.argv.indexOf("test") > -1)
POLL_DELAY = TEST ? 0 : POLL_DELAY ;

const emulationDuration   = 33; // seconds
const startFrame          = 1587; // frames (50fps when vsync active)

const fs           = require('fs');
const requirejs    = require('requirejs'); // for jsbeeb compatibility
const https        = require('https');
const cert_path    = "./certs/";
const parser       = require('./parser');

var twtr = require(TEST ? './test' : './tweet');

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
        throw error;
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
      'emulator':'../../emulator'
    }
  });

  requirejs(['emulator'],
  function (emulator) {
    "use strict";

      async function run(tweet){
        console.log("");
        console.log("Running "+tweet.id_str+" from @"+tweet.user.screen_name);

        var c = parser.parseTweet(tweet);

        // If rude or not basic, skip it
        if (!c.isBASIC) {console.log ("No BASIC detected");return;}
        if (c.rude) {
          console.warn("BLOCKED @"+tweet.user.screen_name)
          await twtr.block(tweet);
		  setTimeout(requestTweet, POLL_DELAY);
          return;
        }

        var start   = new Date()

        // Emulate
        if (c.emulator == "beebjit") {
          var path = "./beebjit/";
          var prefix = "beebjit_frame_";
          var pixel_format = "bgra";
          var emu_name = "beebjit";

          // Run tweet on emulator

          var tokenised;
          try {
            tokenised = await emulator.tokenise(c.input);
          } catch (e) {
            console.log("Tokenisation FAILED");
            console.log(e);
            return 0;
          }
          await fs.writeFileSync("./beebasm/tokenised.bas",tokenised,{encoding:"binary"});
          await fs.writeFileSync("./beebasm/run.txt","LO.\"TWEET\"\nP.CHR$11CHR$11SPC80CHR$11CHR$11;\nRUN\n");
          await exec("cd beebasm && ./beebasm -i makedisk2.asm -do tweet.ssd -opt 3");
          await exec("cd beebjit && ./beebjit -0 ../beebasm/tweet.ssd -fast -headless -autoboot "+c.flags);
        } else // JSbeeb
        {
          var path = "./tmp/"+tweet.id_str;
          var prefix = "frame";
          var pixel_format = "rgba";
          var emu_name = "jsbeeb";
          var frames  = await emulator.emulate(c.input,path,emulationDuration,startFrame);
        }

        // Tweet ID will be used in tmp filename passed into shell exec, so check it's safe.  For a real tweet it should be numeric while for a testcase it can contain alphanumerics.
        if (/\W/.test(tweet.id_str)) {
          console.error("id_str contained unexpected character");
          process.exit();
        }

        var end     = new Date() - start
        console.log(emu_name+" DONE in %ds ",end/1000);

        // Count unique video frames
	var shasum_check = (await exec("sha1sum client.js  | awk '{print $1}' | wc -l")); // should equal 1
	var shasum = (shasum_check > 0) ? "sha1sum" : "shasum";
        var frames = (await exec(shasum+" "+path+prefix+"*."+pixel_format+" | awk '{print $1}' | wc -l"));
        var uniqueFrames = (await exec(shasum+" "+path+prefix+"*."+pixel_format+" | awk '{print $1}' | sort | uniq | wc -l"));

        console.log("Captured "+frames+" frames ("+uniqueFrames+" unique) "+path+prefix);

   	start = new Date();

        var hasAudio = fs.existsSync(path+"audiotrack.raw");

        if (frames == 0) {
          // NO VIDEO -> NOTHING
          var ffmpegCmd = "";
        } else if (uniqueFrames==1 && !hasAudio) {
          // STATIC IMAGE WITHOUT SOUND -> PNG SCREENSHOT
          var mediaFilename = path+'.png';
          var mediaType = 'image/png';
          var ffmpegCmd = 'ffmpeg -hide_banner -y -f rawvideo -pixel_format '+pixel_format+' -video_size 640x512  -i '+path+prefix+(frames-1)+'.'+pixel_format+' -vf "scale=1280:1024" '+mediaFilename
        } else {
          // ANIMATION OR STATIC IMAGE WITH SOUND -> MP4 VIDEO
          var mediaFilename = path+'.mp4';
          var mediaType = 'video/mp4';
          var ffmpegCmd = 'ffmpeg -hide_banner -loglevel panic ';
          if (hasAudio) {
            ffmpegCmd = ffmpegCmd + '-f f32le -ar 44100 -ac 1 -i '+path+'audiotrack.raw ';
          }
          ffmpegCmd = ffmpegCmd + '-y -f image2 -r 50 -s 640x512 -pix_fmt '+pixel_format+' -vcodec rawvideo -i '+path+prefix+'%d.'+pixel_format+'  -af "highpass=f=50, lowpass=f=15000,volume=0.5" -filter:v "scale=1280:1024" -q 0 -b:v 8M -b:a 128k -c:v libx264 -pix_fmt yuv420p -strict -2 -shortest '+mediaFilename
        }

        if (frames > 0) {
          await exec(ffmpegCmd);
          var checksum = await exec(shasum+" "+path+prefix+(frames-1)+'.'+pixel_format+" | awk '{print $1}'");
        } else {
          var checksum = '';
        }
        exec('rm -f '+path+'*.'+pixel_format+' '+path+'*.raw');

        var end = new Date() - start
        console.log("Ffmpeg DONE in %ds ",end/1000);

        if (frames == 0) {
          twtr.noOutput(tweet);
        } else {
          twtr.videoReply(mediaFilename,mediaType,tweet.id_str,"@"+tweet.user.screen_name,tweet,checksum,hasAudio,c.input);
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
              run(tweet).catch((err) => console.error(err));;
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
        var tweet = {
          text: fs.readFileSync(try_file, 'utf8'),
          id_str: 'try',
          user: { screen_name: 'try' },
          entities: {}
        };
        // Set up twtr object to mock the 'tweet' methods that we use.
        twtr = {};
        twtr.videoReply = function(filename,mediaType,replyTo,text,tweet,checksum,hasAudio) {
          console.log("Generated " + mediaType);
          exec("xdg-open "+filename);
          process.exit();
        };
        twtr.block = function(tweet) {
          console.log("Failed: Tweet blocked because of badwords");
          process.exit();
        };
        twtr.noOutput = function(tweet) {
          console.log("Failed: No output captured");
          process.exit();
        };
        run(tweet);
      } else {
        requestTweet();
      }
    }
  );
