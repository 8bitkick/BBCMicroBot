const fs           = require('fs');

function exec(cmd) {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout? stdout.trim() : stderr);
    });
  });
}


async function beebjit(c, jsbeeb){

// Run tweet on emulator
var tokenised;
try {
  var basic = c.input;
  var tmp = basic.replace(/\#\w+/g, "").trim(); // get rid of tags and white space
  if (tmp.match(/^\d/) != null) {
      // If there are line numbers remove a trailing explicit "RUN".
      basic = basic.replace(/\n\s*RUN[\s\n]*$/, "");
  }

  console.log(basic)
  tokenised = await jsbeeb.tokenise(basic);
  await fs.writeFileSync("./tmp/tweet.bas",tokenised,{encoding:"binary"});
  await fs.writeFileSync("./tmp/keys.bin","RUN\r",{encoding:"binary"});

  var keyboardBuffer = "03e0"; // BBC Micro OS 1.20
  var IBP = 0x02E1; // input pointer
  var OBP = 0x02D8; // output pointer

  var page = ( c.flags.includes("gxr.rom") ) ? "1c00" : "1900";
  var end = parseInt(page,16) + tokenised.length;
  var endLow = (end & 0xff).toString(16);
  var endHigh = ((end >>> 8) & 0xff).toString(16);

  // beebjit debug commands
  var commands = "'"+
                  ["breakat 725000",
                  "c",
                  "loadmem ../tmp/tweet.bas "+page, // paste tokenised program into PAGE
                  "loadmem ../tmp/keys.bin "+keyboardBuffer, // 0x03E0 OS 1.2
                  "writem 02e1 e4", // Advance pointer 4 bytes
                  "writem 0000 "+endLow, // LOWMEM
                  "writem 0001 "+endHigh,
                  "writem 0002 "+endLow, // VARTOP
                  "writem 0003 "+endHigh,
                  "writem 0012 "+endLow, // TOP
                  "writem 0013 "+endHigh,
                  "c"
              ].join(";")+"'";

} catch (e) {
  console.log("Tokenisation FAILED");
  console.log(e);
  return null;
}

let beebjit_cmd = "cd beebjit && ./beebjit -fast -headless -frames-dir ../tmp/ -cycles "+c.cycles+" "+c.flags+" -commands "+commands;
await exec(beebjit_cmd );
console.log(beebjit_cmd);
}

module.exports = beebjit;
