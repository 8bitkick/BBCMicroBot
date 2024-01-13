"use strict";
require('dotenv').config();

const PORT = process.env.PORT+1 || 6502
const TEST = (process.argv.indexOf("test") > -1)

const express   = require('express');
const https     = require("https");
const fs        = require("fs");
const cert_path = "./certs/";
const Feed      = TEST ? require("./test").Feed : require('./hashtag');

// add timestamps in front of log messages
require( 'console-stamp' )( console, { pattern: 'dd/mm/yyyy HH:MM:ss '},"Serv:" );

function log(l){console.log(l)}

var tootFeed = {queue:[]};
var app = express();
var emulators = 0;
var served = 0;
var file;

app.get('/pop', (req, res) => {

    let toot = (tootFeed.queue.length>0) ? tootFeed.queue.pop() : "{}";
    console.log("Sending: ",toot)
    res.send(toot);

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
  console.log('BBC Micro Bot TOP toot server listening on port ' + listener.address().port);
});


let current = process.argv[2] || 1023;
let data = null;

async function tweet_gold(text){

  let ex = /Source: https:\/\/bbcmic.ro\/(.*)#(.+) /m
  let result = text.match(ex);
  let json = JSON.parse(decodeURIComponent(result[2]));
  let emoji = ("?experimental=true"==result[1]) ? "🎬" : "";

  let toot = {
    id: json.id,
    date: json.date,
    in_reply_to_status_id: "",
    author: json.author,
    text: json.program+emoji,
    spoiler_text: "Classic BBC Micro Bot Tweet",
    account:{url:"https://www.twitter.com/"+json.author}
  }
  console.log(toot)
  tootFeed.queue.push(toot)
  console.log(tootFeed)
}

function date() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles'});
  }

  async function main() {
    if (data  == null) {
      file = await fs.readFileSync("gold-data.js",'utf8');

      data = JSON.parse(file)
      console.log(data.data.length)
      //console.log(data)
    }

    var today = new Date();
    var hour  = today.getUTCHours();
    var day   = today.getUTCDay();

    console.log(hour,day,current);
    console.log(data["data"][current]);
  //  if (hour <13 || hour > 21) {console.log("waiting");return}

    tweet_gold(data["data"][current])
    current--
    if (current<0) process.exit();

  }

  console.log("Starting at tweet "+current)
  main();
  //setInterval(main,3);
  setInterval(main,3710000);
