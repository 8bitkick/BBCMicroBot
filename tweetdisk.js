const request = require('request');
const fs = require("fs");
PNG = require("pngjs").PNG;

function stegDecode(dataIn){
  const magicWord = 0x12345678;

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

  // Perform checksum
  //var crc = crc32.buf(fileData);
  //if (checksum != crc) {console.log("*** checksum failed ***");return null;} else {console.log("*** checksum passed ***");}
  var disk = {
    // Header: we expect 1024 bytes header with zero in undefined fields
    version:      data32[1], // 0x00000001
    fileLength:   data32[2],
    headerLength: data32[3],
    checksum:     data32[4],
    emulator:     data32[5], // Emulator (default is 0, JSbeeb)
    model:        data32[6], // (0 = BBC Model B, 1 = BBC Master)

    // Config 3|2|1|0
    //
    // byte 0 =
    // byte 1 = model (0 = BBC Model B, 1 = BBC Master)
    // byte 2 = config (1 = GXR ROM)
  }
    // Payload
  disk.data = new Uint8Array(data8.slice(disk.headerLength, disk.fileLength+disk.headerLength))
  return disk;
}

async function getTweetDisk(imageURL){
  return new Promise(function(resolve, reject){
    request({ uri:imageURL, encoding: null }, function (error, response, body) {
      if (error) return reject(error);
      try {
        var png = PNG.sync.read(body);
        var tweetdisk = stegDecode(png.data);
        resolve(tweetdisk);
      } catch(e) {
        reject(e);
      }
    });
  });
}

module.exports = {
  get: getTweetDisk
};
