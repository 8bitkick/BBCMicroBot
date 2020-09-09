
// This code calls JSBeeb emulator functions directly

define(['6502', 'video', 'soundchip', 'models', 'ddnoise', 'cmos', 'utils','fdc','basic-tokenise'],
function (Cpu6502, Video, SoundChip, models, DdNoise, Cmos,  utils,fdc,tokeniser) {

  const fs = require('fs');

  var video, path, processor, cycles;
  var thisEmulator = null;
  var MaxCyclesPerIter = 100 * 1000;
  var hexword = utils.hexword;

  var keyboardBuffer = 0x0300; // BBC Micro OS 1.20
  var IBP = 0x02E1; // input pointer
  var OBP = 0x02D8; // output pointer

  var screenMode = 0x0355; // Current screen mode.

  async function emulate(input,path,duration,capture_start,tweetdisk) {

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
        soundPoint = soundPoint + 882;

        var mode = processor.readmem(screenMode);
        var fd = fs.openSync(path+'frame'+(frame-capture_start)+'.rgba', 'w');
        // frameBuffer32 includes the frame border.  The area where the image is
        // varies a little by screen mode - it's always 640 pixels wide (i.e. 2560
        // bytes since each pixel is 4 bytes) but in mode 7 it is offset to the
        // right by 16 pixels (64 bytes), which we compensate for below.
        //
        // In modes 3,6,7 the screen is a little shorter, but we just crop to the
        // tallest height it can be since this works better when there's a mode
        // switch mid-video.

        // Top-left of screen.
        var off = 262944;
        // Bottom-right of screen.
        var end = 2358556;
        switch (mode) {
          case 3: case 6:
          // This includes the "stripe" below the bottom line of the screen.
          end = 2309468; break;
          case 7:
          off = 263008; end = 2309468; break;
        }
        while (off <= 2358556) {
          if ((mode == 3 || mode == 6) && off < end) {
            // The "stripes" have alpha = 0, but we want to make them
            // non-transparent so that an image output looks better on
            // a non-black background.
            var start = off / 4;

            for (var i = 0; i != 1024; ++i) {
              if (frameBuffer32[start + i] != 0)
              break;
              frameBuffer32[start + i] = 0xff000000;
            }
          }
          fs.writeSync(fd, frameBuffer32, off, 2560);
          off += 4096;
        }
        fs.closeSync(fd);
      }
      frame++;});

      // Set up our BBC Micro emulator default
      if (tweetdisk==null){
        var model = models.findModel('B');
        model.os.push('gxr.rom'); // Add GXR ROM
        processor = new Cpu6502(model, dbgr, video, soundChip, new DdNoise.FakeDdNoise(), new Cmos());
        await processor.initialise();
        var runcmd = "RUN\r";
      }
      else {
        // Tweetdisk
        var model = models.findModel('B');
        processor = new Cpu6502(model, dbgr, video, soundChip, new DdNoise.FakeDdNoise(), new Cmos());
        await processor.initialise();
        await processor.fdc.loadDisc(0, fdc.discFor(processor.fdc, "tweetdisk", tweetdisk.data));
        processor.sysvia.keyDown(16); // shift
        await runFor(2000000);
        processor.sysvia.keyUp(16); // shift
        var runcmd = "";
        var input ="";
      }
      await runUntilInput();

      // Use the tokeniser if the program contains non-ASCII characters or if
      // it doesn't have any line number. Skip if this is a tweetdisk
      if ((/[^\0-\x7e]/.test(input) || !/^ *[0-9]/m.test(input)) && (tweetdisk==null)) {
        /* Tokeniser input method */
        var t         = await tokeniser.create();
        var tokenised = await t.tokenise(input);

        var page = processor.readmem(0x18) << 8;
        for (var i = 0; i < tokenised.length; ++i) {
          processor.writemem(page + i, tokenised.charCodeAt(i));
        }
        var end = page + tokenised.length;
        var endLow = end & 0xff;
        var endHigh = (end >>> 8) & 0xff;
        // Set LOMEM.
        processor.writemem(0x00, endLow);
        processor.writemem(0x01, endHigh);
        // Set VARTOP.
        processor.writemem(0x02, endLow);
        processor.writemem(0x03, endHigh);
        // Set TOP.
        processor.writemem(0x12, endLow);
        processor.writemem(0x13, endHigh);

        input=runcmd;
      } else {
        input=input.replace(/[\n]/g,'\r');
        if (!input.endsWith('\r')) {
          input=input+'\r';
        }
        if (!/\r\s*RUN\s*\r/.test(input)) {
          input=input+runcmd;
        }
      }

      await pasteToBuffer(input);
      await runFor((2000000*duration)-15000*(input.length));

      // Check if the soundBuffer has any non-zero values.
      if (soundBuffer.some(function(elt, idx, a) { return elt != 0; })) {
        await fs.writeFileSync( path+'audiotrack.raw', soundBuffer.slice(0, soundPoint),(err) => {
          if (err) throw err;
        });
      }

      return frame < capture_start ? 0 : frame-capture_start;
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
