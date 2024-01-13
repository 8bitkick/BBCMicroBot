const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function main(){


  const params = {
    Bucket: "bbcmic.ro",
    Prefix: "state/"
  };
  // Uploading files to the bucket
  response = await s3.listObjectsV2(params).promise();
  console.log(response)


}


main();
