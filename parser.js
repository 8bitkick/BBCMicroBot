"use strict";

const base2048     = require('base2048');
const Grapheme     = require('grapheme-splitter');
var splitter = new Grapheme();

const Filter       = require('bad-words');
const customFilter = new Filter({ placeHolder: '*'});
//customFilter.addWords('words','here');

function isBASIC(bas){ // TODO convert to regex
  bas = bas.replace(/@\w+/g, "").trim(); // get rid of tags and white space
  var basic = (bas.match(/^\d/) != null) || // code must start with digit
  bas.includes("=") ||
  (bas.match("[^\0-\x7e]")!=null); // Tokens and/or clamp emoji for compressed
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
      output ="P. \"BASE2048 DECODE ERROR\"\r";
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

  var c = {
    emulator:   "jsbeeb",
    flags:      "",
    compressed: false,
    input:      ""
  }

  var one_hour = 2000000*60*60;

  for (let i = 0; i<graphemes.length; i++){

    switch (graphemes[i]){

      case "🗜":
      c.compressed = true;
      break;

      case "📸": // Snapshot after one hour emulation time
      c.emulator = "beebjit";
      c.flags    = "-cycles "+(one_hour+2000000)+" -frame-cycles "+one_hour;
      break;

      case "⏳": // Time lapse after one hour execution time
      case "⌛":
      c.emulator = "beebjit";
      c.flags    = "-cycles "+one_hour+" -frame-cycles "+(2000000*5)+" -max-frames 150"
      break;

      default:
      c.input += graphemes[i];

      var g = graphemes[i].codePointAt(0);
      if (g > 1024 && g < 0x10FF) {c.compressed = true;}
    }
  }

  c.input = processInput(tweet, c.compressed);
  c.rude = (customFilter.clean(c.input) != c.input);
  c.isBASIC = isBASIC(tweet.text);

  console.log("\n",c);
  return c;
}

module.exports = {
    parseTweet: parseTweet
};
