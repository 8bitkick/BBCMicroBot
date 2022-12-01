const fs           = require('fs');

const MemStart     = 0x0000;
const MemLength    = 0x7fff; // 32K RAM

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
    let basic = c.input;
    let tmp = basic.replace(/\#\w+/g, "").trim(); // get rid of tags and white space
    if (tmp.match(/^\d/) != null) {
      // If there are line numbers remove a trailing explicit "RUN".
      basic = basic.replace(/\n\s*RUN[\s\n]*$/, "");
    }

    console.log(basic)
    tokenised = await jsbeeb.tokenise(basic);
    await fs.writeFileSync("./tmp/tweet.bas",tokenised,{encoding:"binary"});
    await fs.writeFileSync("./tmp/keys.bin","RUN\r",{encoding:"binary"});

    let keyboardBuffer = "03e0"; // BBC Micro OS 1.20
    let IBP = 0x02E1; // input pointer
    let OBP = 0x02D8; // output pointer

    let page = ( c.flags.includes("gxr.rom") ) ? "1c00" : "1900";
    let end = parseInt(page,16) + tokenised.length;
    let endLow = (end & 0xff).toString(16);
    let endHigh = ((end >>> 8) & 0xff).toString(16);

    // beebjit debug commands
    let commands = "'"+
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
    "breakat "+c.cycles, // after emulated cycles
    "c",
    "r",
    "crtc",
    "bbc",
    `savemem ../tmp/savemem.bin ${MemStart.toString(16)} ${MemLength.toString(16)}`, // BBC Micro memory dump
    "c"
  ].join(";")+"'";


  let beebjit_cmd = "cd beebjit && ./beebjit -fast -headless -frames-dir ../tmp/ -cycles "+(c.cycles+40000)+" "+c.flags+" -commands "+commands;
  let stdout      = await exec(beebjit_cmd );
  console.log(beebjit_cmd);
  let state       = await parseBeebjitState(stdout);

  console.log(state);
  return state;


} catch (e) {
  console.log("Tokenisation FAILED");
  console.log(e);
  return null;
}
}


// Parse Beebjit state dump
async function parseBeebjitState(stdout){
  let regdump = stdout.match(/A=(.+) X=(.+) Y=(.+) S=(.+) F=(.+) PC=(.+) cycles/i);
  let crtcregs = stdout.match(/R\d\d \$([0-9A-Fa-f]{2})/mg).map(r => parseInt(r.substring(5,7),16));
  let registers = {
    A:parseInt(regdump[1],16),
    X:parseInt(regdump[2],16),
    Y:parseInt(regdump[3],16),
    S:parseInt(regdump[4],16),
    F:regdump[5],
    PC:parseInt(regdump[6],16)
  }

  let ulaControl = parseInt(stdout.match(/ULA control \$(.+)/i)[1],16);
  let ulaPalette = stdout.match(/ULA palette \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+) \$(\S+)/i).slice(1,17).map(a => parseInt(a,16));
  let mem        = await fs.readFileSync("./tmp/savemem.bin");

  let state = {
    "RAM":        mem.toString('base64'),
    "address":    MemStart.toString(16),
    "CPU6502":    registers,
    "CRTC":       crtcregs,
    "ULAcontrol": ulaControl,
    "ULApalette": ulaPalette
  };

  return state; // full BBC Micro state snapshot
}

module.exports = beebjit;
