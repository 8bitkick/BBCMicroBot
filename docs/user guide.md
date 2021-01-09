# BBC Micro Bot User Guide

This guide will outline how BBC Micro Bot works on Twitter and tricks to reduce the size of your code to fit in a tweet with the [Owlet Editor](https://bbcmic.ro). 

[Read this introduction first](https://www.bbcmicrobot.com/learn/index.html) if you aren’t already familiar with BBC BASIC language or BBC Micro.

## How to run your code

When you include [@bbcmicrobot](https://twitter.com/bbcmicrobot) in a tweet the bot will run your tweet as code on a BBC Micro emulator. 

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

## Writing code

The [Owlet Editor](https://bbcmic.ro) is designed specifically for creative coding with BBC Micro Bot. From within the editor you can hit the `Share` button to automatically be taken to your Twitter account and tweet the code.

## Reducing code size

One of the fun and challenging aspects of the bot is you need to squeeze your code into a tweet - code golf! Techniques to do this have evolved over time many pioneered by [Rheolism](https://www.twitter.com/rheolism). Here we outline some fundamental approaches, this is by no means comprehensive.

```
10 PRINT "HELLO WORLD"
20 GOTO 10 
```
*34 characters*


### Removing line numbers and spaces

You do not need line numbers in your tweeted code. The numbers are automatically added in increments of 10 by the bot. As a guide Owlet will show you the line numbers in the gutter of the editor if you omit them from your code. Spaces are usually removable, but are required in some cases where a variable name is directly next to a BASIC keyword.

```
PRINT"HELLO WORLD"
GOTO10 
```
*26 characters*


### BBC BASIC byte tokens

Every BBC BASIC keyword is represented in memory as a single byte. For example `PRINT` is represented as byte value 0xF1 which is `ñ`. We can use these byte tokens directly in tweets to save characters. The [Owlet Editor](https://bbcmic.ro) lets you automatically do this quickly and easily with the `Shrink` button. 

```
ñ"HELLO WORLD"
å10
```
*18 characters*

Note that some values must be ORed with 0x100 in order to map to a valid Unicode charcter that can be used in the edtior or in a tweet. This is also done automatically in Owlet, and the BBC Micro emulator ANDs all character codepoints with 0xFF to return them to single byte values. 

There is a [full list of byte tokens](http://www.benryves.com/bin/bbcbasic/manual/Appendix_Tokeniser.htm) for reference. 


### Abbreviations 

BBC BASIC keywords can also be abbreviated. Abbreviations have the advantage that they are still somewhat readable. However they are not as small as byte tokens. For example `PRINT` can become `P.`. You can find a list of minimum abbreviations [here](https://central.kaserver5.org/Kasoft/Typeset/BBC/Ch47.html). Using the [Owlet Editor](https://bbcmic.ro) you can expand any abbreviation to the full keyword using the `expand` button. 

```
P."HELLO WORLD"
GOTO 10 
```
*24 characters*


