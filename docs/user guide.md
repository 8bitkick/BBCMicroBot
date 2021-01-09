# BBC Micro Bot User Guide

This guide will outline how BBC Micro Bot works on Twitter and tricks to reduce the size of your code to fit in a tweet with Owlet. 

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

## Code of conduct

If you copy or modify someones code you should either reply to the original tweet so people can see the Thread, or acknowledge the author you tweet. When you tweet the at the bot your code is public. You might find that other users are inspired to help reduce the size of your code, improve the design or create new tweets inspired by it - you should take this as a compliment!

BBC Micro Bot is a place to write fun code and help each other out doing it. Tweets contains any bad words will be ignored and the user account blocked. This is automatic and on quite a strict filter. 

## Writing code

The [Owlet Editor](https://bbcmic.ro) is designed specifically for creative coding with BBC Micro Bot. From within the editor you can hit the `Share` button to automatically be taken to your Twitter account and tweet the code.

## Reducing code size

There are several strategies to reducing code size and tools to help you do it.




