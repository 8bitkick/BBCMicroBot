
// This code calls JSBeeb emulator functions directly

define(['6502', 'video', 'soundchip', 'models', 'ddnoise', 'cmos', 'utils','fdc','basic-tokenise'],
function (Cpu6502, Video, SoundChip, models, DdNoise, Cmos,  utils,fdc,tokeniser) {

  const fs = require('fs');

  var video, path, processor, cycles;
  var thisEmulator = null;
  var MaxCyclesPerIter = 100 * 1000;
  var hexword = utils.hexword;

  var model = models.findModel('B');
  model.os.push('gxr.rom'); // Add GXR ROM

  var keyboardBuffer = 0x0300; // BBC Micro OS 1.20
  var IBP = 0x02E1; // input pointer
  var OBP = 0x02D8; // output pointer

  async function emulate(input,path,duration,capture_start) {

    var frameBuffer32 = new Uint32Array(1024 * 625);
    var soundBuffer = new Float32Array(44100 * duration).fill(0); 
    var soundPoint = 0;
    var frame = 0;
    var soundChip = new SoundChip.SoundChip(44100);
    var dbgr = {
      setCpu: function () {
      }
    };

    // Set up video and sound capture
    video = new Video.Video(false, frameBuffer32, function paint(minx, miny, maxx, maxy) {
      if (frame > capture_start){
        soundChip.render(soundBuffer, soundPoint, 882); // 44100Hz / 50fps = 882
        soundPoint= soundPoint + 882;

        fs.writeFileSync( path+'frame'+(frame-capture_start)+'.rgba', frameBuffer32,(err) => {
          if (err) throw err;
        });} frame++;});

        // Set up our BBC Micro emulator
        processor = new Cpu6502(model, dbgr, video, soundChip, new DdNoise.FakeDdNoise(), new Cmos());
        await processor.initialise();
    
        /* Tokenizer input method
        var t         = await tokeniser.create();
        var tokenised = await t.tokenise(input);

        await runUntilInput();
          var page = processor.readmem(0x18) << 8;
          for (var i = 0; i < tokenised.length; ++i) {
            processor.writemem(page + i, tokenised.charCodeAt(i));
          }
          // Set VARTOP (0x02/3) and TOP(0x12/3)
          var end = page + tokenised.length;
          var endLow = end & 0xff;
          var endHigh = (end >>> 8) & 0xff;
          processor.writemem(0x02, endLow);
          processor.writemem(0x03, endHigh);
          processor.writemem(0x12, endLow);
          processor.writemem(0x13, endHigh);

        input="RUN\r";
        */
    
        await runUntilInput();
        await pasteToBuffer(input);
        await runFor((2000000*duration)-15000*(input.length));

        await fs.writeFileSync( path+'audiotrack.raw', soundBuffer.slice(0, soundPoint),(err) => {
          if (err) throw err;
        });

        return frame-capture_start;
      }


      function writeToKeyboardBuffer(text) {
        var inputBufferPointer = processor.readmem(IBP);
        for (var a = 0; a<text.length;a++){
          processor.writemem(keyboardBuffer+inputBufferPointer, text.charCodeAt(a));
          inputBufferPointer++;
          if (inputBufferPointer>0xff) {inputBufferPointer=0xE0;}
        }
        processor.writemem(IBP,inputBufferPointer);
        return processor.execute(text.length*15000); // Wait until Buffer empty
      }

      function pasteToBuffer(textIn) {
        var regex = new RegExp(/(.|[\r\n]){1,31}/g);
        var fragments = textIn.match(regex);
        if (fragments==null) return;
        for (const fragment of fragments) {
          writeToKeyboardBuffer(fragment);
        }
        return;
      }
  
      // The following is from https://github.com/mattgodbolt/jsbeeb/blob/master/tests/test.js
      function runFor(cycles) {
        var left = cycles;
        var stopped = false;
        return new Promise(function (resolve) {
          var runAnIter = function () {
            var todo = Math.max(0, Math.min(left, MaxCyclesPerIter));
            if (todo) {
              stopped = !processor.execute(todo);
              left -= todo;
            }
            if (left && !stopped) {
              setTimeout(runAnIter, 0);
            } else {
              resolve();
            }
          };
          runAnIter();
        });
      }

  
      function runUntilInput() {
        var idleAddr = processor.model.isMaster ? 0xe7e6 : 0xe581;
        var hit = false;
        var hook = processor.debugInstruction.add(function (addr) {
          if (addr === idleAddr) {
            hit = true;
            return hit;
          }
        });
        return runFor(20 * 2000000).then(function () {
          hook.remove();
          runFor(1);
          return hit;
        });
      }


      return {
        emulate:emulate
      };
    }
  );
