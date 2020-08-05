"use strict";
require('dotenv').config();
const PORT        = process.env.PORT || 6502;
const HOST        = process.env.SERVER || 'localhost'
const MP          = process.env.MP || false
var   POLL_DELAY  = process.env.POLL_DELAY || 5000

const TEST = (process.argv.indexOf("test") > -1)
POLL_DELAY = TEST ? 0 : POLL_DELAY ;

const emulationDuration   = 33; // seconds
const startFrame          = 1587; // frames (50fps when vsync active)

const fs           = require('fs');
const requirejs    = require('requirejs'); // for jsbeeb compatibility
const https        = require('https');
const base2048     = require('base2048');
const cert_path    = "./certs/"; 

const Filter       = require('bad-words');
const customFilter = new Filter({ placeHolder: '*'});
//customFilter.addWords('words','here');

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

// Set up multiprocessing
// -----------------------
let os = require('os'),
cluster = require('cluster');
if (cluster.isMaster && MP == 'true') {
  let cpus = os.cpus();
  cpus.forEach(function (cpu, i) {
    let worker = cluster.fork();
    worker.on('exit', function () {
      console.log("Emulator process exited");
    })
  });

} else {

  if (cluster.isWorker) {clientID = "Cli"+(cluster.worker.id-1);}
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

    function processInput(tweet) {
      var i = tweet.text;

      function b2048decode(text)  {
        const regex = /^.*🗜(.*)/gu;
        var result = regex.exec(text);
        if (result!=null){
          console.log("Base 2048 decode");
          try{
            text = String.fromCharCode.apply(null, base2048.decode(result[1]));
          }
          catch(error){
            console.warn(error);
            text ="BASE2048 DECODE ERROR";
          }
        }
        return text;
      }

      function remove_first_occurrence(str, searchstr)       {
        var index = str.indexOf(searchstr); if (index === -1) {return str;}
        return str.slice(0, index) + str.slice(index + searchstr.length);}

        var namesMentioned = [];
        if (typeof tweet.entities.user_mentions != 'undefined' ){
          tweet.entities.user_mentions.forEach(function(m) {
            namesMentioned.push(m.screen_name);
          });
        }

        namesMentioned.forEach(function(m) {
          i = remove_first_occurrence(i,"@"+m);
        });

        i = b2048decode(i.trim());

        i = i.replace(/[“]/g,'"');
        i = i.replace(/[”]/g,'"');
        i = i.replace(/&lt;/g,'<');
        i = i.replace(/&gt;/g,'>');
        i = i.replace(/&amp;/g,'&');
 
        return i;
      }


      async function run(tweet){
        console.log("");
        console.log("Running "+tweet.id_str+" from @"+tweet.user.screen_name);

        // Convert tweet to BBC Micro friendly characters
        var input = processInput(tweet);
        var path = "./tmp/"+tweet.id_str;

        // Tweet ID will be used in tmp filename passed into shell exec, so check it's safe.  For a real tweet it should be numeric while for a testcase it can contain alphanumerics.
        if (/\W/.test(tweet.id_str)) {
          console.error("id_str contained unexpected character");
          process.exit();
        }

        // Run tweet on emulator
        var start   = new Date()
        var frames  = await emulator.emulate(input,path,emulationDuration,startFrame);
        var end     = new Date() - start
        console.log("JSbeeb DONE in %ds ",end/1000);

        // Count unique video frames
        var uniqueFrames = (await exec("shasum "+path+"*.rgba | awk '{print $1}' | sort | uniq | wc -l"));

        console.log("JSbeeb captured "+frames+" frames ("+uniqueFrames+" unique)");

        start = new Date()

        var hasAudio = fs.existsSync(path+"audiotrack.raw");

        if (frames == 0) {
          // NO VIDEO -> NOTHING
          var ffmpegCmd = "";
        } else if (uniqueFrames==1 && !hasAudio) {
          // STATIC IMAGE WITHOUT SOUND -> PNG SCREENSHOT
          var mediaFilename = path+'.png';
          var mediaType = 'image/png';
          var ffmpegCmd = 'ffmpeg -hide_banner -y -f rawvideo -pixel_format rgba -video_size 640x512  -i '+path+'frame'+(frames-1)+'.rgba -vf "scale=1280:1024" '+mediaFilename
        } else {
          // ANIMATION OR STATIC IMAGE WITH SOUND -> MP4 VIDEO
          var mediaFilename = path+'.mp4';
          var mediaType = 'video/mp4';
          var ffmpegCmd = 'ffmpeg -hide_banner -loglevel panic ';
          if (hasAudio) {
            ffmpegCmd = ffmpegCmd + '-f f32le -ar 44100 -ac 1 -i '+path+'audiotrack.raw ';
          }
          ffmpegCmd = ffmpegCmd + '-y -f image2 -r 50 -s 640x512 -pix_fmt rgba -vcodec rawvideo -i '+path+'frame%d.rgba  -af "highpass=f=50, lowpass=f=15000,volume=0.5" -filter:v "scale=1280:1024" -q 0 -b:v 8M -b:a 128k -c:v libx264 -pix_fmt yuv420p -strict -2 -shortest '+mediaFilename
        }

        if (frames > 0) {
          await exec(ffmpegCmd);
          var checksum = await exec('shasum '+path+'frame'+(frames-1)+'.rgba'+" | awk '{print $1}'");
        } else {
          var checksum = '';
        }
        exec('rm -f '+path+'*.rgba '+path+'*.raw');

        var end = new Date() - start
        console.log("Ffmpeg DONE in %ds ",end/1000);

        if (customFilter.clean(input) != input) {
          console.warn("BLOCKED @"+tweet.user.screen_name)
          twtr.block(tweet);
        } else if (frames == 0) {
          twtr.noOutput(tweet);
        } else {
          twtr.videoReply(mediaFilename,mediaType,tweet.id_str,"@"+tweet.user.screen_name,tweet,checksum,hasAudio);
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
    }
