"use strict";
require('dotenv').config();

const PORT = process.env.PORT || 6502
const TEST = (process.argv.indexOf("test") > -1)

const express   = require('express');
const https     = require("https");
const fs        = require("fs");
const cert_path = "./certs/";
const Feed      = TEST ? require("./test").Feed : require('./hashtag');

// add timestamps in front of log messages
require( 'console-stamp' )( console, { pattern: 'dd/mm/yyyy HH:MM:ss '},"Serv:" );

function log(l){console.log(l)}

var tootFeed = new Feed();
var app = express();
var emulators = 0;
var served = 0;

app.get('/pop', (req, res) => {
  if (req.client.authorized) {
    let toot = (tootFeed.queue.length>0) ? tootFeed.queue.pop() : "{}";

    res.send(toot);

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
  console.log('BBC Micro Bot toot server listening on port ' + listener.address().port);
});

// Poll the twitter mentions

tootFeed.update();
setInterval(function(){ tootFeed.update(); }, 45000);
