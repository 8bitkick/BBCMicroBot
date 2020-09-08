const request = require('request');
const fs = require("fs");
PNG = require("pngjs").PNG;

function stegDecode(dataIn){
  const magicWord = 0x12345678;
  const version   = 0x00000001;

  var image8    = new Uint8Array(dataIn);
  var data8     = new Uint8Array(900*900);
  var data32    = new Uint32Array(data8.buffer);

  let i = 0;

  for (let d = 0; d<image8.length; d++){
    var b    = 0;
    for (let j = 0; j<4; j++){
      if (i % 4 == 3) {i++;} // skip alpha bytes
      b |= (image8[i] & 3) << (j*2);
      i++;
    }
    data8[d] = b;
  }

  // Check header
  if (data32[0] != magicWord) {
    console.log('not a recognised steg file '+data32[0x00].toString(16));return null;
  }

  var fileLength    = data32[2];
  var headerLength  = data32[3];
  var checksum      = data32[4];
  var fileData      = new Uint8Array(data8.slice(headerLength, fileLength+headerLength));

  // Perform checksum
  //var crc = crc32.buf(fileData);
  //if (checksum != crc) {console.log("*** checksum failed ***");return null;} else {console.log("*** checksum passed ***");}
  return fileData;
}

async function getTweetDisk(imageURL){
    return new Promise(function(resolve, reject){
        request({ uri:imageURL, encoding: null }, function (error, response, body) {
            if (error) return reject(error);
            try {
              var png = PNG.sync.read(body);
              var diskData = stegDecode(png.data);
                resolve(diskData);
            } catch(e) {
                reject(e);
            }
        });
    });
}

module.exports = {
  get: getTweetDisk
};
