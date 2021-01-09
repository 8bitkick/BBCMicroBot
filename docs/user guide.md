# BBC Micro Bot User Guide

This guide will outline how BBC Micro Bot works on Twitter and tricks to reduce the size of your code to fit in a tweet with the [Owlet Editor](https://bbcmic.ro). 

## First read this

**[Read this awesome interactive BBC BASIC tutorial first](https://www.bbcmicrobot.com/learn/index.html)** if you aren’t familiar or want a refresher. The guide below is more about the mechanics of the bot and editor rather than the BBC BASIC language.

## How to run your code

When you include [@bbcmicrobot](https://twitter.com/bbcmicrobot) in a tweet the bot will run your tweet as code on a BBC Micro emulator. Your code must fit within a single tweet, limiting it to 280 characters.

### Default 

Normally the bot runs your code for 30 seconds, and then takes 3 second video clip that it posts to Twitter. If that last 3 seconds is a static image the bot will reply with a PNG image instead.

### Emojis

Certain emojis are commands to the bot. These are not included in the program sent to the BBC Micro emulator. Because the [emulator is very fast](https://github.com/scarybeasts/beebjit) a 3 hour emulations only take a few seconds.

🚀  The rocket emoji instructs the bot to run a 3 hour emulation and respond with a screenshot

🎬  The clapper board emoji instructs the bot to run a 3 hour emulation and respond with a 3 second video

🗜️  The clamp icon is no longer used. It was used to show a tweet was base2048 encoded, but this is now autodetected.

### Ignored tweets

The bot will reply to any mention that starts with a line number, contains an `=` sign or contains special characters. This needs improving. 

## Etiquette 

If you copy or modify someones code you should either reply to the original tweet so people can see the thread, or acknowledge the author in your tweet. When you tweet the at the bot your code is public. You might find that other users are inspired to help reduce the size of your code, improve the design or remix it - you should take this as a compliment!

BBC Micro Bot is a place to write fun code and help each other out doing it. Tweets contains any bad words will be ignored and the user account blocked. This is automatic and on quite a strict filter. 

# Writing code in a tweet

The [Owlet Editor](https://bbcmic.ro) is designed specifically for creative coding with BBC Micro Bot. From within the editor you can hit the `Share` button to automatically be taken to your Twitter account and tweet the code.

## Reducing code size

One of the fun and challenging aspects of the bot is you need to squeeze your code into a tweet - code golf! Techniques to do this have evolved over time many pioneered by [Rheolism](https://www.twitter.com/rheolism). Here we outline some fundamental approaches, this is by no means comprehensive.

One tip for starters - `@bbcmicrobot` is a long name. If you reply to a tweet from @bbcmicrobot you don't need to explicity include the `@bbcmicrobot` mention in the code for the bot to see and run your tweet. This will save you 13 characters. 

```
10 PRINT "HELLO WORLD"
20 GOTO 10 
```


### Removing line numbers and spaces

You do not need line numbers in your tweeted code. The numbers are automatically added in increments of 10 by the bot. As a guide Owlet will show you the line numbers in the gutter of the editor if you omit them from your code. Spaces are usually removable, but are required in some cases where a variable name is directly next to a BASIC keyword.

```
PRINT"HELLO WORLD"
GOTO10 
```

### Abbreviations 

BBC BASIC keywords can also be abbreviated. Abbreviations have the advantage that they are still somewhat readable. However they are not as small as byte tokens. For example `PRINT` can become `P.`. You can find a list of minimum abbreviations [here](https://central.kaserver5.org/Kasoft/Typeset/BBC/Ch47.html). Using the [Owlet Editor](https://bbcmic.ro) you can expand any abbreviation to the full keyword using the `expand` button. 

```
P."HELLO WORLD"
GOTO 10 
```

### BBC BASIC byte tokens

Every BBC BASIC keyword is represented in memory as a single byte. For example `PRINT` is represented as byte value 0xF1 which is `ñ`. We can use these byte tokens directly in tweets to save characters. The [Owlet Editor](https://bbcmic.ro) lets you automatically do this quickly and easily with the `Shrink` button. Here is a [full list of byte tokens](http://www.benryves.com/bin/bbcbasic/manual/Appendix_Tokeniser.htm) for reference. 

```
ñ"HELLO WORLD"
å10
```
### Representing binary data in tweets

Note that some byte values must be ORed with 0x100 in order to map to a valid Unicode charcter that can be used in the edtior or in a tweet. For byte tokens this is done automatically in Owlet, and the BBC Micro emulator ANDs all character codepoints with 0xFF to return them to single byte values. 


### base2048 encoding

[Base2048](https://github.com/qntm/base2048) is a Unicode encoding optimized for transmitting binary data through Twitter. Using base2048 gives you an extra 100 characters of BBC BASIC code in a tweet, bringing it to ~384 characters in total. However our Hello World tweet will no longer be human readible:

```
༣Ȝǁঐ౭चؼ๗ԪʢࠁನȤ3
```

The [Owlet Editor](https://bbcmic.ro) will automatically encode any tweet as base2048 if it is over 280 characters in length. It will only encode when you hit the `share` button and send as a tweet. You can also decode in Owlet with the `Expand` button.


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

Using the BASIC `DATA` and `READ` keywords to store data can quickly become large. It's possible to be byte data directly into a `REM` statement to be read out by the BBC BASIC peek command `?`. The address of the data is calculated as a 5 byte offset from the start of the BASIC program memory defined in `PAGE`

```
REMthis statement is my data
D=PAGE+5
FOR A=0 TO 24
PRINT D?A
NEXT
```

In this example the first value returned would be 116, the ASCII value for the letter `t`
