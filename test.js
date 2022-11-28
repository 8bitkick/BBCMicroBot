"use strict";


// Monitor timeline timeline
function Tests(since_id){

  console.log("TEST TWEETS QUEUED");

  var tests = [
/* FIXME Now a hashtag is required to run, and the BASIC check is currently disabled.
    {
      name: "NOBASIC", // Test a tweet without BASIC isn't run
      text: "I love the 80s",
      mediaType: "",
      checksum: ""
    },
*/
    {
      name: "ROCKET_MODE", // Test that a slow program completes
      text: "🚀0 MODE 2:VDU5\n10 FOR X = 0 TO 1279 STEP8:FOR Y = 0 TO 1023 STEP 4:GCOL 0, RND(7):PLOT 69, X, Y:NEXT:NEXT\nREPEAT UNTIL FALSE",
      mediaType: "image/png",
      checksum: "a02c1e9f18e3a86718067695c0e6e97ffdd5c6bd"
    },
/* FIXME The timing seems to be off (due to beebjit commit 1565081621bc49db857390eb04a52be815d66add)
    {
      name: "FRAME_CAPTURE", // MODE 0-6
      text: "0 MODE 2\n10 FOR C = 0 TO 7\n20 COLOUR C\n30 PRINT \"COLOUR \",C\n40 NEXT C\n"+
            "60 MOVE 0,0\n70 DRAW 1279,0\n80 DRAW 1279,1023\n90 DRAW 0,1023\n100 DRAW 0,0\n"+
            "110 DRAW 1279,1023\n120 VDU 23,1,0;0;0;0;\n130 P.TAB(0,16);INT(TIME/10)/10;\" s   \"\n140 GOTO 130",
      mediaType: "image/gif",
      checksum: "b0a979b0be31f48fc85b29635f55489857327f26"
    },
*/
    {
      name: "CHARACTERS",
      text: "💾10 PRINT“&gt;&amp;&lt;&amp;lt;”'SPC39\"|\"\n20 VDU 23,1,0;0;0;0;\n", // Tests twitter HTML escapes for <,&,> and OS X auto ""
      mediaType: "image/png",
      checksum: "c3f630a42cc39990a6e38c574a93f6c79b3c5a8a"
    },
    /* beebjit doesn't currently support capturing audio output
    {
      name: "STATICAUDIO", // Test static image with audio gives a video
      text: '0V.279;0;0;0;0;12:P."BEEP":REP.V.7:U.NOTINKEY50',
      mediaType: "image/gif",
      hasAudio: true,
      checksum: "810209c18581c36ad7a3eb40502519e1aec39cae"
    },
    {
      name: "AUDIOVISUAL", // Video with sound
      text: '1MO.2:V.5:ENV.1,1,-26,-36,-45,255,255,255,127,0,0,0,126,0:SO.1,1,1,1\n2GC.0,RND(7):PL.85,RND(1280),1023A.RND:G.2\n',
      mediaType: "image/gif",
      hasAudio: true,
      checksum: "4a954818f333f1d9a3b7334246bcdb5056295e3d"
    },
    */
    {
      name: "MODE6", // Test stripes aren't transparent in PNG
      text: '1MO.6:?&D0=2:F.L=0TO999:V.32+L MOD95:N.:V.19;4;0;279;0;0;0;0;',
      mediaType: "image/png",
      checksum: "06577a813c4df4f59f0e2325e9fe5874b7106293"
    },
    {
      name: "RUNCHECK", // Regression test for program that didn't used to get run
      text: '0REM THIS SHOULD GET RUN\n1MO.6:P."MODE6":V.19;4;0;19,1,6;0;279;0;0;0;0',
      mediaType: "image/png",
      checksum: "b595b191a31cff941162438d1ce0135d71018a01"
    },
    {
      name: "YOUONLYRUNONCE", // Check that an explicit RUN suppresses an implicit one.
      text: '🖬1PRINT"HELLO":!-512=&B000B\nRUN',
      mediaType: "image/png",
      checksum: "28222f638d2c0b97e7e03d0e54561ab7364bd445"
    },
    {
      name: "NOLINENOS", // Test no line numbers -> tokeniser.
      text: "💾P.\"HELLO\";\nV.279;0;0;0;0;32\nP.\"WORLD\"",
      mediaType: "image/png",
      checksum: "5c3db47017774d43ad27c9916af332d471e273e6"
    },
    {
      name: "TOKENS", // Test tokens -> tokeniser.
      text: "\xf1~\u0190\n\xef279;0;0;0;0;\n",
      mediaType: "image/png",
      checksum: "649072777ed9938fddaed9a57c27f07f2945c0fb"
    },
    {
      name: "MENTIONS", // Test mention and hashtag removal
      text: "<span class=\"h-card\"><a href=\"https://mastodon.me.uk/@bbcmicrobot\" class=\"u-url mention\">@<span>BBCMicroBot</span></a></span> <span class=\"h-card\"><a href=\"https://mastodon.nz/@rheolism\" class=\"u-url mention\">@<span>RhEolisM</span></a></span> <a href=\"https://mastodon.me.uk/tags/bbcmicrobot\" class=\"mention hashtag\" rel=\"tag\">#<span>bbcmicrobot</span></a> 1V.279;0;0;0;0;12:PRINTCHR$141\"Hello\"'CHR$141\"Hello\"CHR$21\n",
      mediaType: "image/png",
      checksum: "10e6285dc55ec5ddab8470e8f038725db2d0ffbc"
    },
    {
      name: "OVERLONG", // Test overlong line doesn't crash the bot
      text: "0REM " + ("BBC".repeat(88)),
      mediaType: "text/plain",
      checksum: ""
    },
    {
      name: "TOKENISE_LONG", // Test tokenisation handles a long input
      text: "💾0PRINT" + (":PRINT".repeat(125)),
      mediaType: "image/gif",
      checksum: "b1099ab5729e3fdabb1aa12c05aae77f18e6ee83"
    },
      {name: null, text: null}
  ]

  this.queue = [];
  while (tests.length) {
    var test = tests.pop();
    var user_mentions = test.user_mentions;
    if (user_mentions === null) {user_mentions = ['bbcmicrobot'];}
    var toot = {
      'account'                   : {'url':'@test@localhost'},
      'created_at'                : null,
      'user'                      : {'screen_name':"<TEST SERVER>"}, //
      'text'                      : test.text,
      'id'                        : test.name,
      'in_reply_to_id'            : "1",
      'truncated'                 : false,
      'favorited'                 : false,
      'entities'                  : {'user_mentions': user_mentions},
      'bbcmicrobot_has_audio'     : (test.hasAudio == true),
      'bbcmicrobot_checksum'      : test.checksum,
      'bbcmicrobot_media_type'    : test.mediaType
    };
    this.queue.push(toot);
  }
}

  // Get the next section of timeline timeline
  Tests.prototype.update = async function () {}

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

  function videoReply(filename,mediaType,id,replyTo,tweet,checksum,hasAudio){
    console.log("checksum: "+checksum)
    if (tweet.bbcmicrobot_checksum != checksum) {
      throw new Error(id+' TEST - \u001b[31mFAILED\u001b[0m')
    }
    console.log("mediaType: "+mediaType)
    if (tweet.bbcmicrobot_media_type != mediaType) {
      throw new Error(id+' TEST - \u001b[31mFAILED\u001b[0m')
    }
    console.log("hasAudio: "+hasAudio)
    if (tweet.bbcmicrobot_has_audio != hasAudio) {
      throw new Error(id+' TEST - \u001b[31mFAILED\u001b[0m')
    }
    if (mediaType == 'image/gif') { 
      exec('ffprobe -v 0 -select_streams a -show_streams '+filename).then(
        function(audioInfo) {
          var videoHasAudio = (audioInfo.length > 0);
          console.log("videoHasAudio: "+videoHasAudio);
          if (hasAudio != videoHasAudio) {
            throw new Error(id+' TEST - \u001b[31mFAILED\u001b[0m')
          }
        });
    }
    console.log(replyTo+' TEST - \u001b[32mOK\u001b[0m')
  }

  function noOutput(tweet) {
    // If the checksum is empty then we expect no output.
    if (tweet.bbcmicrobot_checksum == '') {
      console.log(tweet.id+' TEST - \u001b[32mOK\u001b[0m')
    } else {
      throw new Error(tweet.id+' TEST - \u001b[31mFAILED\u001b[0m')
    }
  }

  function block(tweet) {
    throw new Error(tweet.id+' TEST - \u001b[31mFAILED\u001b[0m')
  }

  module.exports = {
    Feed: Tests,
    videoReply: videoReply,
    noOutput: noOutput,
    block: block
  };
