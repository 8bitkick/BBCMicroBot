# BBCMicroBot

![Node.js CI](https://github.com/8bitkick/BBCMicroBot/workflows/Node.js%20CI/badge.svg?branch=mastodon)

A bot that runs toots that mention the #bbcmicrobot tag on a [BBC Micro emulator](https://github.com/scarybeasts/beebjit/) and responds with a toot of 3 second, 50fps video after 30 seconds of emulated execution time.

## Using the bot

You can try the bot now live at [https://mastodon.me.uk/@bbcmicrobot](https://mastodon.me.uk/@bbcmicrobot)

For help running code on the bot please see [the User Guide](https://github.com/8bitkick/BBCMicroBot/blob/master/docs/user%20guide.md).

## Background

The [@bbcmicrobot](https://mastodon.me.uk/@bbcmicrobot) gained fans like comedian Dara Ó Briain, science writer Ben Goldacre, and Raspberry Pi founder Eben Upton. The concept is simple - make a retrocomputer accessible over social media. The bot runs any toot written in BBC BASIC (1982) a programming language developed by Sophie Wilson who later went on to create the ARM architecture.

The Twitter community rose to the challenge with some seriously creative and clever code within 280 character limit. Read [more background on BBC Micro Bot here](https://www.dompajak.com/bbcmicrobot.html).

It started a Twitter code bot revolution! There's a guide to building emulators in the cloud in the [Commodore 64 notes](https://github.com/8bitkick/c64bot) as well as full bot projects inspired by it including [Auto Tweetcart for the pico8](https://gitlab.com/rendello/auto_tweetcart) and Kay Savetz's AppleIIbot, PC BASIC Bot and [Atari8BitBot](https://github.com/savetz/Atari8BitBot).

In November 2022 BBC Micro Bot was founded on Mastodon.

https://mastodon.me.uk/@bbcmicrobot

## Contributing

### Running your own bot instance

For development and testing you can run your own instance of the bot on a Linux machine. I've been running it on:

* Arm-based AWS instances (Ubuntu)
* Raspberry Pi 4 (Raspbian and Raspberry Pi OS)
* Apple Mac OS X

### Installation

* Install [Node.js v12.x](https://nodejs.org/en/download/)
* Install [ffmpeg](https://www.ffmpeg.org/download.html) (e.g. `sudo apt install ffmpeg`)
* Download or clone this BBCMicroBot repository and `cd` into the directory
* `npm install`

### Local testing

To run a set of test toots defined in [test.js](https://github.com/8bitkick/BBCMicroBot/blob/mastodon/test.js) and output the video or image capture to the `./tmp/` folder. For each test a checksum of the last frame of emulator video is compared against a known good value. To run the tests type:

`npm test`

You should see output like the following:

~~~
[14/06/2020 09:06:49 ] [LOG]    Cli0: Running BASE2048 from @<TEST SERVER>
[14/06/2020 09:06:49 ] [LOG]    Cli0: Base 2048 decode
[14/06/2020 09:06:49 ] [LOG]    Cli0: Loading OS from roms/os.rom
[14/06/2020 09:06:49 ] [LOG]    Cli0: Loading ROM from roms/BASIC.ROM
[14/06/2020 09:06:49 ] [LOG]    Cli0: Loading ROM from roms/b/DFS-0.9.rom
[14/06/2020 09:06:49 ] [LOG]    Cli0: Loading ROM from roms/gxr.rom
[14/06/2020 09:06:59 ] [LOG]    Cli0: JSbeeb DONE in 9.807s
[14/06/2020 09:07:01 ] [LOG]    Cli0: JSbeeb captured 150 frames (1 unique)
[14/06/2020 09:07:01 ] [LOG]    Cli0: Ffmpeg DONE in 0.172s
[14/06/2020 09:07:01 ] [LOG]    Cli0: checksum: 80f830477fc1632c3f8a65702825f33b3d6c069e
[14/06/2020 09:07:01 ] [LOG]    Cli0: BASE2048 TEST - OK
~~~~


In the `tmp` folder you should also see the test output files.

### Interactive testing

The `try` subcommand allows you to run a BASIC program from a file.  If the bot would have posted a replied it instead runs `xdg-open` with the video or image output filename as an argument, which should open it in a suitable viewer:

`node client try someprogram.bas`

If you omit the filename, it defaults to reading from `stdin` which is handy for one-liners:

`echo '0MO.4:REP.V.RND(2)*45+2:U.0'|node client try`

### Connecting to a Mastodon account

You need to put the `ACCESS_TOKEN` for the Mastodon account for the bot and the `HASHTAG` that the bot should watch for in a `.env` file to be accessed by [mastodon.js](https://github.com/8bitkick/BBCMicroBot/blob/mastodon/mastodon.js#L8).

You can then run the bot with

`npm start`

### Thanks

Thanks to Matt Godbolt for the JSBeeb emulator that made this project possible and to all the @bbcmicrobot users for their support - I hope this source code is interesting or useful.
