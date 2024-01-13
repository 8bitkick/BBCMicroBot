
const BotGenesis = 1569394800; // First ever bot tweet 25 Sep 2019
const AWS = require('aws-sdk');
require('dotenv').config();
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

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
    Bucket: "bbcmic.ro",
    Key: 'state/'+tag,
    Body: JSON.stringify(body),
    ACL:'public-read', 
    ContentType: 'application/json'
  };
  // Uploading files to the bucket
  await s3.upload(params).promise();
  console.log("Cache: bbcmic.ro/state/"+tag);

  // load index.txt from S3, append tag, upload back to S3
  let index = await s3.getObject({Bucket: "bbcmic.ro", Key: 'state/index.txt'}).promise();
  index = index.Body.toString('utf-8');
  index += tag+"\n";
  params.Key = 'state/index.txt';
  params.Body = index;
  await s3.upload(params).promise();
  
  await invalidateCloudFront(params.Key);

  return tag;
}

async function invalidateCloudFront(fileKey) {
  const distributionId = process.env.CLOUDFRONT;

  const params = {
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: 1,
        Items: [`/${fileKey}`]
      }
    }
  };

  await cloudfront.createInvalidation(params).promise();
  console.log(`CloudFront invalidation created for ${fileKey}`);
}

module.exports = cache;
