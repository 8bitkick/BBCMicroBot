"use strict";

const TRY = (process.argv.indexOf("try") > -1)

require('dotenv').config();
const Filter       = require('bad-words');
const customFilter = new Filter({ placeHolder: '*'});
//customFilter.addWords('words','here');
const Grapheme     = require('grapheme-splitter');
var splitter = new Grapheme();
const htmlparser2  = require('htmlparser2');

function processInput(toot) {
  if (TRY) return toot.text.trim();

  var out = '';
  var ignore = 0;
  const htmlparser = new htmlparser2.Parser({
    onopentag(name, attributes) {
      if (ignore) {
        ++ignore;
        return;
      }

      var c = attributes['class'];
      if (c !== undefined && c.match(/\b(?:mention|hashtag)\b/)) {
        ignore = 1;
        return;
      }
      if (name === 'p' || name === 'br') out += '\n';
    },
    ontext(text) {
      if (!ignore) out += text;
    },
    onclosetag(name) {
      if (ignore) --ignore;
    },
  });

  console.log(toot.text)
  htmlparser.parseComplete(toot.text);
  out = out.trim();
//  out = out.replace(/^W+/g,""); // remove whitespace at beginning of lines
//  out = out.replace(/\n\n/g,"\n"); // remove empty lines
  out = out.replace(/[“”]/g,'"'); // replace italic quotes
  console.log(out)

  return out;
}

function parseTweet(tweet){
  var graphemes = splitter.splitGraphemes(tweet.text.trim());
var one_hour = 2000000*60*60;

  var c = {
    emulator:   "beebjit",
    flags:      "-accurate -rom 7 roms/gxr.rom -opt video:paint-start-cycles=60680000,video:border-chars=0 -frame-cycles 1 -max-frames 150 -cycles 69000000",
    compressed: false,
    input:      "",
	  mode: 1,
    isBASIC: true,
    useDFS: false
  }


  for (let i = 0; i<graphemes.length; i++){

    switch (graphemes[i]){


      case "🚀": // Snapshot after three hours emulation time
      c.emulator = "beebjit";
      c.flags    = "-cycles "+(3*one_hour+4000000000)+" -frame-cycles "+3*one_hour+" -opt video:border-chars=0";
      c.isBASIC  = true;
		    c.mode = 2;
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
		    c.mode = 3;
      break;

      case "⛔": // Do not run
      c.isBASIC  = false;
		    c.mode = 0;
      return c;

      case "🖬":
      case "💾": // Not really period appropriate, but probably the more common "floppy disk" emoji.
      c.useDFS = true;
      break;

      default:
      c.input += graphemes[i];
      var g = graphemes[i].codePointAt(0);
    //  if (g > 1024 && g < 0x10FF) {c.compressed = true;}
    }
  }
  tweet.text = c.input;
  c.input = processInput(tweet);
  c.rude = (customFilter.clean(c.input) != c.input);

  // c.emulator = "beebjit";
  // c.flags    = "-cycles "+(3*one_hour+4000000000)+" -frame-cycles "+3*one_hour+" -opt video:border-chars=0";
  // c.isBASIC  = true;
  //   c.mode = 2;

  console.log("\n",c);
  return c;
}

module.exports = {
    parseTweet: parseTweet
};
