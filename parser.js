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
  out = out.replace(/[“”]/g,'"');
  console.log(out)

  return out;
}

function parseTweet(toot){
  var graphemes = splitter.splitGraphemes(toot.text.trim());
  var one_hour = 2000000*60*60;

  var c = {
    emulator:   "beebjit",
    flags:      "-accurate -rom 7 roms/gxr.rom -opt video:paint-start-cycles=60680000,video:border-chars=0 -frame-cycles 1 -max-frames 150",
    cycles:     69000000,
    compressed: false,
    input:      "",
	  mode: 1,
    isBASIC: true
  }

  for (let i = 0; i<graphemes.length; i++){

    switch (graphemes[i]){

      case "🚀": // Snapshot after three hours emulation time
      c.emulator = "beebjit";
      c.flags    = " -frame-cycles "+3*one_hour+" -opt video:border-chars=0";
      c.isBASIC  = true;
		  c.mode     = 2;
      c.cycles   = (3*one_hour+4000000000);
      break;

      case "🎬": // Fast run 3 hours then 3 seconds time lapse
      c.emulator = "beebjit";
      c.flags    = "-opt video:paint-start-cycles="+(3*one_hour)+",video:border-chars=0 -frame-cycles 1 -max-frames 150 -exit-on-max-frames";
      c.cycles   = ((3*one_hour)+8000000);
      c.isBASIC  = true;
		  c.mode     = 3;
      break;

      case "⛔": // Do not run
      c.isBASIC  = false;
		  c.mode = 0;
      return c;

      default:
      c.input += graphemes[i];
      var g = graphemes[i].codePointAt(0);
    }
  }
  toot.text = c.input;
  c.input = processInput(toot);
  c.rude = (customFilter.clean(c.input) != c.input);

  console.log("\n",c);
  return c;
}

module.exports = {
    parseTweet: parseTweet
};
