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
      checksum: "054f4e9024bc9f6f33886b68a591f94195b550de"
    },
    {
      name: "CHARACTERS",
      text: "10 PRINT“&gt;&amp;&lt;&amp;lt;”\n20 VDU 23,1,0;0;0;0;\n", // Tests twitter HTML escapes for <,&,> and OS X auto ""
      mediaType: "image/png",
      checksum: "75eda4b511c0f56907630fceb8d66a1b6fe00130"
    },
    {
      name: "BASE2048", // Test code HT @kweepa
      text: '🗜Еۇಲڕਯॾ൷ԘϽѤटҪߧϙߟڒԡQԈࢤOʮߟญԁǤथطऽঋՒฤѮफՋࡢࠉƻਏಘДߡ೧շमৰٹԖϼՕՑصړͲథłҷߣƋԬնɚతࠒеदƗڵͶɢଙಇХਙࢻڕݠॶঔಘЭబƓٱUȤ೦ÐҿறԳࢤసɊঔઅЦŧԱٱߜɢडjҏƿƻঢշਢϮοեԘबঢеઉƿԛԂԜझॻȻΧҮԗՃȝ४ࢦɆςJદӘʪശऍݡબϯಜՋଦചॺږʟϮĦխҶէঐȼΧnԙҰȠछਢΑਐػϗזƄɒࠀնઉʢτԪƆമࠀནʟɄฮҸ෬խஙǷm೧౼Պ๑ɂ৮бʦடಣӷദഌࢷฐʃɟಞҏࢧȸॹ੩ɒೡΝӺݏࢪࢷฐʃЛઘԻТथطਬওՒ๑ѮࢡԪߩตʃסಅХਗഴןࠁνଛΡϗࢠसصశʃסಈϦथҺڶӊਦɣಛѮണאֆȷʏCઐײڿࢼ',
      mediaType: "image/png",
      checksum: "80f830477fc1632c3f8a65702825f33b3d6c069e"
    },
    {
      name: "STATICAUDIO", // Test static image with audio gives a video
      text: '0V.279;0;0;0;0;12:P."BEEP":REP.V.7:U.NOTINKEY50',
      mediaType: "video/mp4",
      hasAudio: true,
      checksum: "4fa24019565b3e162cd4d1da8922334fbf3fde58"
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

  async function videoReply(filename,mediaType,replyTo,text,tweet,checksum,hasAudio){
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
      var audioInfo = await exec('ffprobe -v 0 -select_streams a -show_streams '+filename);
      var videoHasAudio = (audioInfo.length > 0);
      console.log("videoHasAudio: "+videoHasAudio);
      if (hasAudio != videoHasAudio) {
        throw new Error(replyTo+' TEST - \u001b[31mFAILED\u001b[0m')
      }
    }
    console.log(replyTo+' TEST - \u001b[32mOK\u001b[0m')
  }

  function noOutput(tweet) {
    throw new Error(tweet.id_str+' TEST - \u001b[31mFAILED\u001b[0m')
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
