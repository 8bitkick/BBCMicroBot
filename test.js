"use strict";


// Monitor timeline timeline
function Tests(since_id){

  console.log("TEST TWEETS QUEUED");

  this.tests = [
    {
      name: "FRAME_CAPTURE", // MODE 0-6
      text: "0 MODE 2\n10 FOR C = 0 TO 7\n20 COLOUR C\n30 PRINT \"COLOUR \",C\n40 NEXT C\n"+
            "60 MOVE 0,0\n70 DRAW 1279,0\n80 DRAW 1279,1023\n90 DRAW 0,1023\n100 DRAW 0,0\n"+
            "110 DRAW 1279,1023\n120 VDU 23,1,0;0;0;0;\n130 P.TAB(0,16);INT(TIME/10)/10;\" s   \"\n140 GOTO 130",
      mediaType: "video/mp4",
      checksum: "16fcadcb6bb3b10db6f196683b6ed9129187d692"
    },
    {
      name: "CHARACTERS",
      text: "10 PRINT“&gt;&amp;&lt;&amp;lt;”'SPC39\"|\"\n20 VDU 23,1,0;0;0;0;\n", // Tests twitter HTML escapes for <,&,> and OS X auto ""
      mediaType: "image/png",
      checksum: "8054997db79c6860f43c81a73a291a3ddd59850f"
    },
    {
      name: "BASE2048", // Test code HT @kweepa
      text: '🗜Еۇಲڕਯॾ൷ԘϽѤटҪߧϙߟڒԡQԈࢤOʮߟญԁǤथطऽঋՒฤѮफՋࡢࠉƻਏಘДߡ೧շमৰٹԖϼՕՑصړͲథłҷߣƋԬնɚతࠒеदƗڵͶɢଙಇХਙࢻڕݠॶঔಘЭబƓٱUȤ೦ÐҿறԳࢤసɊঔઅЦŧԱٱߜɢडjҏƿƻঢշਢϮοեԘबঢеઉƿԛԂԜझॻȻΧҮԗՃȝ४ࢦɆςJદӘʪശऍݡબϯಜՋଦചॺږʟϮĦխҶէঐȼΧnԙҰȠछਢΑਐػϗזƄɒࠀնઉʢτԪƆമࠀནʟɄฮҸ෬խஙǷm೧౼Պ๑ɂ৮бʦடಣӷദഌࢷฐʃɟಞҏࢧȸॹ੩ɒೡΝӺݏࢪࢷฐʃЛઘԻТथطਬওՒ๑ѮࢡԪߩตʃסಅХਗഴןࠁνଛΡϗࢠसصశʃסಈϦथҺڶӊਦɣಛѮണאֆȷʏCઐײڿࢼ',
      mediaType: "image/png",
      checksum: "50d22d7e91cfd11635a193fe41922617de3b7eaa"
    },
    {
      name: "STATICAUDIO", // Test static image with audio gives a video
      text: '0V.279;0;0;0;0;12:P."BEEP":REP.V.7:U.NOTINKEY50',
      mediaType: "video/mp4",
      hasAudio: true,
      checksum: "c28811f08350a0fd116ff103671e05de6f6731a5"
    },
    {
      name: "AUDIOVISUAL", // Video with sound
      text: '1MO.2:V.5:ENV.1,1,-26,-36,-45,255,255,255,127,0,0,0,126,0:SO.1,1,1,1\n2GC.0,RND(7):PL.85,RND(1280),1023A.RND:G.2\n',
      mediaType: "video/mp4",
      hasAudio: true,
      checksum: "ddc2194259220d5b629f993d7988e2e01f470b01"
    },
    {
      name: "NOVSYNC", // Test handling of no frames captured
      text: '1MO.2:!-512=&B0308:REP.P."HELLO WORLD":U.0',
      mediaType: "text/plain",
      hasAudio: false,
      checksum: ""
    },
      {name: null, text: null}
  ]
}

  // Get the next section of timeline timeline
  Tests.prototype.update = async function () {}

  // Add the interesting timeline to the BBC Emulator queue
  Tests.prototype.pop = function (timeline) {

    var test = this.tests.shift();
    var tweet = {
      'created_at'                : null,
      'user'                      : {'screen_name':"<TEST SERVER>"},
      'text'                      : test.text,
      'id_str'                    : test.name,
      'in_reply_to_status_id_str' : "1",
      'truncated'                 : false,
      'favorited'                 : false,
      'user_mentions'             : ['bbcmicrobot'],
      'entities'                  : {user_mentions: ["test"]},
      'bbcmicrobot_has_audio'     : (test.hasAudio == true),
      'bbcmicrobot_checksum'      : test.checksum,
      'bbcmicrobot_media_type'    : test.mediaType
    };

    return tweet;
  }

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

  function videoReply(filename,mediaType,replyTo,text,tweet,checksum,hasAudio){
    console.log("checksum: "+checksum)
    if (tweet.bbcmicrobot_checksum != checksum) {
      throw new Error(replyTo+' TEST - \u001b[31mFAILED\u001b[0m')
    }
    console.log("mediaType: "+mediaType)
    if (tweet.bbcmicrobot_media_type != mediaType) {
      throw new Error(replyTo+' TEST - \u001b[31mFAILED\u001b[0m')
    }
    console.log("hasAudio: "+hasAudio)
    if (tweet.bbcmicrobot_has_audio != hasAudio) {
      throw new Error(replyTo+' TEST - \u001b[31mFAILED\u001b[0m')
    }
    if (mediaType == 'video/mp4') {
      exec('ffprobe -v 0 -select_streams a -show_streams '+filename).then(
        function(audioInfo) {
          var videoHasAudio = (audioInfo.length > 0);
          console.log("videoHasAudio: "+videoHasAudio);
          if (hasAudio != videoHasAudio) {
            throw new Error(replyTo+' TEST - \u001b[31mFAILED\u001b[0m')
          }
        });
    }
    console.log(replyTo+' TEST - \u001b[32mOK\u001b[0m')
  }

  function noOutput(tweet) {
    // If the checksum is empty then we expect no output.
    if (tweet.bbcmicrobot_checksum == '') {
      console.log(tweet.id_str+' TEST - \u001b[32mOK\u001b[0m')
    } else {
      throw new Error(tweet.id_str+' TEST - \u001b[31mFAILED\u001b[0m')
    }
  }

  function block(tweet) {
    throw new Error(tweet.id_str+' TEST - \u001b[31mFAILED\u001b[0m')
  }

  module.exports = {
    Feed: Tests,
    videoReply: videoReply,
    noOutput: noOutput,
    block: block
  };
