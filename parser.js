"use strict";

const base2048     = require('base2048');
const Filter       = require('bad-words');
const customFilter = new Filter({ placeHolder: '*'});
const one_hour     = 2000000*60*60;

function parseTweet(tweet){
  let mode = 0; // not BASIC

  // get rid of tags and white space
  let text = tweet.full_text || tweet.text;
  text = text.replace(/@\w+/g, "").trim();

  // Check for emojis
  let rocket  = text.replace(/\uD83D\uDE80/g,"");
  if (rocket != text){
    mode = 2; text = rocket;

  }
  let clapper = text.replace(/\uD83C\uDFAC/g,"");
  if (clapper != text){
    mode = 3; text = clapper;
  }

  let clamp   = text.replace(/\uD83D\uDDDC/g,"");
  if (clamp != text){
    text=clamp; clamp=true;
  }

  // check for base2048 encoding
  let b2048_chars = text.match(/[\u0201-\u10FF]/g);
  let compressed = (b2048_chars != null && b2048_chars.length > 100) || clamp;
  if (compressed==true) {
    try{
      text=String.fromCharCode.apply(null, base2048.decode(text.trim().replace(/\uD83D\uDDDC/g,"")));
    }
    catch(error){
      console.warn(text);
      console.log("Not base2048 - processing as BASIC");
    }
  }

  // check for BBC BASIC tokens (including OR 0x100)
  let tokens =  text.match([/\x{0080}-\x{01FF}/g])!=null;

  // replace twitter escaped HTML escaped chars
  text = text.replace(/[“]/g,'"'); // replace italic quotes
  text = text.replace(/[”]/g,'"');
  text = text.replace(/&lt;/g,'<');
  text = text.replace(/&gt;/g,'>');
  text = text.replace(/&amp;/g,'&');

  let basic = (text.match(/^[\d]|\*/) != null) || text.includes("="); // Starts with a digit or * or contains =
  if (mode == 0 && (basic || compressed || tokens)) {mode = 1;} // BASIC, 30 seconds default
  if (customFilter.clean(text) != text) {mode = -1}; // RUDE

  // Replace t.co URLs with original tweet text
    tweet.entities.urls.forEach(function(u) {
      text = text.replace(u.url, u.display_url);
    })

  return {
    program: text,
    mode: mode
  }
}

module.exports = {
  parseTweet:parseTweet
}
