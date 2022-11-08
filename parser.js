"use strict";

const Filter       = require('bad-words');
const customFilter = new Filter({ placeHolder: '*'});
const one_hour     = 2000000*60*60;

function parseTweet(tweet){
  let mode = 0; // not BASIC

  // get rid of tags and white space
  let text = tweet.text;


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


  // check for BBC BASIC tokens (including OR 0x100)
  let tokens =  text.match([/\x{0080}-\x{01FF}/g])!=null;

  // replace twitter escaped HTML escaped chars
  text = text.replace(/<br \/>/g,"\r\n");
  text = text.replace(/<[^>]*>?/gm, '');
  text = text.replace(/[“]/g,'"'); // replace italic quotes
  text = text.replace(/[”]/g,'"');
  text = text.replace(/&quot;/g,'"');
  text = text.replace(/&lt;/g,'<');
  text = text.replace(/&gt;/g,'>');
  text = text.replace(/&amp;/g,'&');
  text = text.replace(/&#39;/g,"'");
  text = text.replace(/\#bbcmicrobot/g, "").trim();

  if (mode == 0) {mode = 1;} // BASIC, 30 seconds default
  if (customFilter.clean(text) != text) {mode = -1}; // RUDE

  // // Replace t.co URLs with original tweet text
  //   tweet.entities.urls.forEach(function(u) {
  //     text = text.replace(u.url, u.display_url);
  //   })



  return {
    program: text,
    mode: mode
  }
}

module.exports = {
  parseTweet:parseTweet
}
