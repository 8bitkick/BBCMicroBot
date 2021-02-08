"use strict";

const base2048     = require('base2048');
const Grapheme     = require('grapheme-splitter');
var splitter = new Grapheme();

const Filter       = require('bad-words');
const customFilter = new Filter({ placeHolder: '*'});
//customFilter.addWords('words','here');

function isBASIC(bas){ // TODO convert to regex
  bas = bas.replace(/@\w+/g, "").trim(); // get rid of tags and white space
  var basic = (bas.match(/^\d/) != null) || // Line number.
  bas.includes("=") || // Or contains an equals sign.
  (bas.match("[^\0-\x7e]")!=null); // Or contains tokens.
  return basic;
}

function processInput(tweet,compressed) {
  var i = tweet.text.trim();
  if (compressed == true) {
    try{
      i=String.fromCharCode.apply(null, base2048.decode(i.trim()));//output.trim()));
    }
    catch(error){
      console.warn(error);
      console.log("Not base2048 - processing as BASIC tokens");
      i = tweet.text.trim();
    }
  }

  i = i.replace(/[“]/g,'"');
  i = i.replace(/[”]/g,'"');
  i = i.replace(/&lt;/g,'<');
  i = i.replace(/&gt;/g,'>');
  i = i.replace(/&amp;/g,'&');

  return i;
}

function parseTweet(tweet){

  var userMentions = [];
  if (typeof tweet.entities.user_mentions != 'undefined' ){
    tweet.entities.user_mentions.forEach(function(m) {
      if (typeof m.indices != 'undefined') {
        // Use unshift to get the last indices first so we can change the
        // string there without invalidating indices we've yet to process.
        userMentions.unshift(m.indices);
      }
    });
  }

  userMentions.forEach(function(m) {
    tweet.text = tweet.text.slice(0, m[0]) + tweet.text.slice(m[1]);
  });

  var graphemes = splitter.splitGraphemes(tweet.text.trim());
var one_hour = 2000000*60*60;

  var c = {
    emulator:   "beebjit",
    flags:      "-accurate -rom 7 roms/gxr.rom -opt video:paint-start-cycles=60680000,video:border-chars=0 -frame-cycles 1 -max-frames 150 -cycles 69000000",
    compressed: false,
    input:      ""
  }


  for (let i = 0; i<graphemes.length; i++){

    switch (graphemes[i]){

      case "🗜":
      c.compressed = true;
      break;

      case "🚀": // Snapshot after three hours emulation time
      c.emulator = "beebjit";
      c.flags    = "-cycles "+(3*one_hour+4000000000)+" -frame-cycles "+3*one_hour+" -opt video:border-chars=0";
      c.isBASIC  = true;
      break;
/*
      case "⏳": // Time lapse of three hours execution time
      case "⌛":
      c.emulator = "beebjit"; // 
      c.flags    = "-cycles "+(3*one_hour+4000000)+" -frame-cycles 4000000 -opt video:border-chars=0,video:paint-start-cycles=4000000,video:paint-cycles="+(3*one_hour/150)+"  -max-frames 150";
      c.isBASIC  = true;
      break;


      case "⏰": // Fast run 3 hours then 3 seconds time lapse
      c.emulator = "beebjit";
      c.flags = "-cycles "+(3*one_hour+9000000)+" -opt video:paint-start-cycles="+(3*one_hour)+",video:paint-cycles=40000,video:border-chars=0 -frame-cycles 1 -max-frames 150";
      c.isBASIC = true;
      break;
*/
      case "🎬": // Fast run 3 hours then 3 seconds time lapse
      c.emulator = "beebjit";
      c.flags = "-opt video:paint-start-cycles="+(3*one_hour)+",video:border-chars=0 -frame-cycles 1 -max-frames 150 -exit-on-max-frames -cycles "+((3*one_hour)+8000000);
     // c.flags = "-cycles "+(3*one_hour+9000000)+" -opt video:paint-start-cycles="+(3*one_hour)+",video:paint-cycles=40000,video:border-chars=0 -frame-cycles 1 -max-frames 150";
      c.isBASIC = true;
      break;
        
      case "⛔": // Do not run 
      c.isBASIC  = false;
      return c;

      default:
      c.input += graphemes[i];
      var g = graphemes[i].codePointAt(0);
      if (g > 1024 && g < 0x10FF) {c.compressed = true;}
    }
  }
  tweet.text = c.input;
  c.input = processInput(tweet, c.compressed);
  c.rude = (customFilter.clean(c.input) != c.input);
  if (!c.isBASIC) {
    c.isBASIC = c.compressed || isBASIC(tweet.text);
  }

  console.log("\n",c);
  return c;
}

module.exports = {
    parseTweet: parseTweet
};
