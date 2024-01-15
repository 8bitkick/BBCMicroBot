# BBC Micro Bot User Guide

This guide will outline how BBC Micro Bot works on Mastodon and provide some tricks to reduce the size of your code (so that it can fit in a toot) with the [Owlet Editor](https://bbcmic.ro). 

## Prerequisites 

Before reading below check this awesome [interactive BBC BASIC tutorial](https://www.bbcmicrobot.com/learn/index.html) first if you aren’t familiar or want a refresher. The guide below is more about using the bot and how to minify code rather than covering the BBC BASIC language.

## How to run your code

When you include [#bbcmicrobot](https://mastodon.me.uk/@bbcmicrobot) in a toot the bot will run your toot as code on a BBC Micro emulator. Your code must fit within a single toot, limited to 500 characters by its home instance.

### Default 

Normally the bot runs your code for 30 seconds, and then takes 3 second video clip that it posts to Mastodon. If that final 3 seconds is a static image, the bot will reply with a PNG image instead.

### Emoji commands

You can add an emoji to the end of your toot to send a command to the bot. These are not included in the program sent to the BBC Micro emulator, and should not be in your code in Owlet. Because the [emulator is very fast](https://github.com/scarybeasts/beebjit) a 3 hour emulation only takes a few seconds. Although the emulation is fast, the video capture at the end is real-time - the 🎬 is the same as leaving a real BBC Micro running for 3 hours and then afterwards taking a look at the screen for 3 seconds. 


Bot execution modes

| Emoji       | Pre render  | GXR | Output.     |
| ----------- | ----------- | ----| ----------- |
| None        | 30 sec      | Yes | 3 sec video |
| 🎬          | 3 hours*    | No  | 3 sec video |
| 🚀          | 3 hours*    | No  | screen shot |


\* The bot runs 3 hours equivalent 6502 execution in just a few seconds thanks to Beebjit!

### Unexpected behavior with 🎬 mode animations 

We use the beebjit `-fast` parameter to achive very fast emulation in the accelerated modes, the only downside being some unexpected 'relativistic' effects if your code relies on external timers. In this mode CPU time is accelerated several thousandfold and decoupled from timing of BBC Micro peripherals and timers which remain emulated in real-time. This means flashing colours in the palette, and `*FX 19` or `INKEY` based timing will not work well!

If your code waits for an external timer based event like VSYNC the video will appear to freeze. It's recommended to use `FOR ... NEXT` loop based delays in code you intend to run with 🎬 mode for that reason. The emulator takes a screenshot every 40,000 emulated 6502 cycles (which is the same period as VSYNC) and so resulting animation will still look [pretty much the same on a real machine](https://twitter.com/bbcmicrobot/status/1356755101587697669?s=20).


## Etiquette 

If you copy or modify someone's code you should either reply to the original toot so people can see the thread, or acknowledge the author in your toot. When you toot at the bot your code is public. You might find that other users are inspired to help reduce the size of your code, improve the design or remix it - you should take this as a compliment!

BBC Micro Bot is a place to write fun code and help each other out doing it. Toots containing any bad words will be ignored and the user account blocked. This is automatic and on quite a strict filter. 

# Writing code in a toot

The [Owlet Editor](https://bbcmic.ro) is designed specifically for creative coding with BBC Micro Bot. 

## Reducing code size

One of the fun and challenging aspects of the bot is you need to squeeze your code down in size - code golf! Techniques to do this have evolved over time, many pioneered by [Rheolism](https://botsin.space/@rheolism). Here we outline some fundamental approaches, this is by no means comprehensive.

```
10 PRINT "HELLO WORLD"
20 GOTO 10 
```


### Removing line numbers and spaces

You do not need line numbers in your code. The numbers are automatically added in increments of 10 by the bot. As a guide, Owlet will show you the line numbers in the gutter of the editor if you omit them from your code. Spaces are usually removable, but are required in some cases where a variable name is directly next to a BASIC keyword.

```
PRINT"HELLO WORLD"
GOTO10 
```

### Abbreviations 

BBC BASIC keywords can also be abbreviated. Abbreviations have the advantage that they are still somewhat readable. However they are not as small as byte tokens. For example `PRINT` can become `P.` and `GOTO` can become `G.`. You can find a list of minimum abbreviations [here](https://central.kaserver5.org/Kasoft/Typeset/BBC/Ch47.html). Using the [Owlet Editor](https://bbcmic.ro) you can expand any abbreviation to the full keyword using the `expand` button.

```
P."HELLO WORLD"
G.10
```

### BBC BASIC byte tokens

As with the original implementation each BBC BASIC keyword is represented in memory as a single byte. We can use these byte tokens directly in toots to save characters. You can quickly do the conversion in the [Owlet Editor](https://bbcmic.ro) using the `Shrink` button (so you don't need to worry about learning the [values of byte tokens](http://www.benryves.com/bin/bbcbasic/manual/Appendix_Tokeniser.htm)). The `PRINT` keyword shrinks to byte token 0xF1. This is represented in a toot as Unicode U+00F1 which is `ñ`.

```
ñ"HELLO WORLD"
å10
```

Note that some byte values must be ORed with 0x100 in order to map to a valid Unicode character that can be used in the editor or in a tweet. For byte tokens this is done automatically in Owlet, and the BBC Micro emulator ANDs all character codepoints with 0xFF to return them to single byte values. 


### base2048 encoding [deprecated for Mastodon due to larger post length]

[Base2048](https://github.com/qntm/base2048) is a Unicode encoding optimized for transmitting binary data through Twitter. Using base2048 gives you an extra 100 characters of BBC BASIC code in a tweet, bringing it to ~384 characters in total. However our Hello World tweet will no longer be human readable. For this reason we no longer support base2048 on the Mastodon bot.

```
༣Ȝǁঐ౭चؼ๗ԪʢࠁನȤ3
```

## Advanced minification techniques

### VDU and graphics commands

VDU commands are powerful in BBC BASIC. One of their many uses is to change the colors assigned in the current palette:

```
VDU 19,1,4,0,0,0
VDU 19,2,6,0,0,0
```
Instead of declaring the values in a `VDU` statement you can instead `PRINT` the byte values and they will be executed by the VDU driver with an identical result. There's a handy [online tool to convert VDU calls to strings](https://8bitkick.github.io/vdu/). The VDU calls above would become:
```
PRINT"ēāĄĀĀĀēĂĆĀĀĀ"
```
Note that graphics commands (e.g. `GCOL` and `PLOT`) can also be expressed as VDU commands as shown in the [table on the conversion page](https://8bitkick.github.io/vdu/). This mean complex graphics sequences can be run using a single `PRINT` command! This can save a lot of characters.

### Inline binary data

Using the BASIC `DATA` and `READ` keywords to store data can quickly become large. It's possible to store byte data directly into a `REM` statement to be read out by the BBC BASIC peek command `?`. The address of the data is calculated as a 5 byte offset from the start of the BASIC program memory defined in `PAGE`

```
REMthis statement is my data
D=PAGE+5
FOR A=0 TO 24
PRINT D?A
NEXT
```

In this example the first value returned would be 116, the ASCII value for the letter `t`. You can create a Twitter-friendly byte string to use in a `REM` from comma separated data with the [VDU to string tool](https://8bitkick.github.io/vdu/)
