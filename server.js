"use strict";
require('dotenv').config();

const PORT = process.env.PORT || 6502
const TEST = (process.argv.indexOf("test") > -1)

const express   = require('express');
const https     = require("https");
const fs        = require("fs");
const Feed      = TEST ? require("./test").Feed : require('./mentions');
const cert_path = "./certs/";
const base2048     = require('base2048');
const Filter       = require('bad-words');
const customFilter = new Filter({ placeHolder: '*'});
const twtr = TEST ? require('./test') : require('./tweet');
//customFilter.addWords('words','here');

// add timestamps in front of log messages
require( 'console-stamp' )( console, { pattern: 'dd/mm/yyyy HH:MM:ss '},"Serv:" );

function log(l){console.log(l)}

var app = express();
var emulators = 0;
var served = 0;

app.get('/pop', (req, res) => {
  if (req.client.authorized) {
    var tweet = getTweet();
    res.send(tweet);
    if (TEST && tweet.text == null) {process.exit()};
  }
})

app.get('/quit', (req, res) => {
  if (req.client.authorized) {
    process.exit();
  }
})

var options = {
  key: fs.readFileSync(cert_path+'server_key.pem'),
  cert: fs.readFileSync(cert_path+'server_cert.pem'),
  ca: [ fs.readFileSync(cert_path+'server_cert.pem') ],
  requestCert: true,
  rejectUnauthorized: true
};

var listener = https.createServer(options, app).listen(PORT, function () {
  console.log('MicroBot tweet server listening on port ' + listener.address().port);
});

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
    tweet.text = i;
    return tweet;
  }

function getTweet(){
  var tweet = processInput(tweetFeed.pop());
  if (tweet.text != null && customFilter.clean(tweet.text) != tweet.text) {
    console.warn("BLOCKED @"+tweet.user.screen_name)
    twtr.block(tweet);
    return getTweet();
  } else {
    return tweet;
  }
}

// Poll the twitter mentions
var tweetFeed = new Feed('1260761572890165254');
tweetFeed.update();
setInterval(function(){ tweetFeed.update(); }, 12500);
