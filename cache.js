const BotGenesis = 1569394800; // First ever bot tweet 25 Sep 2019
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function cache(toot, beebState){

  // Were assuming single thread sequential URL generation here...
  let num = Math.floor(Date.now()/1000) - 1569394800;
  let digits = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let len = Math.min(digits.length, 62);
  let tag = '';
  while (num > 0) {
    tag = digits[num % len] + tag;
    num = parseInt(num / len, 10);
  }


  let body = {
    'v': 3,
    'toot':  toot.prog,
    'mode':  toot.mode,
    'src':   toot.src,
    'state': beebState
  }

  const params = {
    Bucket: "link.bbcmic.ro",
    Key: 'state/'+tag, // File name you want to save as in S3
    Body: JSON.stringify(body)
  };
  // Uploading files to the bucket
  await s3.upload(params).promise();
  console.log("Cache: link.bbcmic.ro/state/"+tag)


  return tag;
}

module.exports = cache;
