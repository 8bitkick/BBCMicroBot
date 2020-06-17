# BBCMicroBot

![Node.js CI](https://github.com/8bitkick/BBCMicroBot/workflows/Node.js%20CI/badge.svg?branch=master)

A twitter bot that runs mentions on a [BBC Micro emulator](https://github.com/mattgodbolt/jsbeeb) and responds with a tweet of 3 second, 50fps video after 30 seconds of emulated execution time. 

### Try it now!

You can try the bot now live at [https://twitter.com/bbcmicrobot](https://twitter.com/bbcmicrobot)

The [@bbcmicrobot](https://twitter.com/bbcmicrobot) gained fans like comedian Dara Ó Briain, science writer Ben Goldacre, and Raspberry Pi founder Eben Upton. The concept is simple - make a retrocomputer accessible over social media. The bot runs any tweet written in BBC BASIC (1982) a programming language developed by Sophie Wilson who later went on to create the ARM architecture.

The Twitter community rose to the challenge with some seriously creative and clever code gold within 280 character limit. Read [more background on BBC Micro Bot here](https://www.dompajak.com/bbcmicrobot.html). 

If you're interested there is also the start of a [Commodore 64 version](https://github.com/8bitkick/c64bot) as well as other bot projects inspired by it including [Auto Tweetcart for the pico8](https://gitlab.com/rendello/auto_tweetcart).

## Running your own bot instance

For development and testing you can run your own instance of the bot on a Linux machine. I've been running it on:

* Arm-based AWS instances
* Raspberry Pi 4 (Raspbian and Raspberry Pi OS)
* Apple Mac OS X

### Installation

* Install [Node.js v12.x](https://nodejs.org/en/download/) 
* Install [ffmpeg](https://www.ffmpeg.org/download.html) (e.g. `sudo apt install ffmpeg`)
* Download or clone this BBCMicroBot repository and `cd` into the directory
* `npm install`

## Local testing

To run a set of test tweets defined in [test.js](https://github.com/8bitkick/BBCMicroBot/blob/master/test.js) and output the video or image capture to the `./tmp/` folder. For each test a checksum of the last frame of emulator video is compared against a known good value. To run the tests type:

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



In the `tmp` folder you should also see the test output files:


![image](https://github.com/8bitkick/BBCMicroBot/blob/master/images/BASE2048.png)


## Interactive testing

The `try` subcommand allows you to run a BASIC program from a file.  If the bot would have posted a replied it instead runs `xdg-open` with the video or image output filename as an argument, which should open it in a suitable viewer:

`node client try someprogram.bas`

For a one-liner, you can specify `/dev/stdin` as the file, for example:

`echo '0MO.4:REP.V.RND(2)*45+2:U.0'|node client try /dev/stdin`

## Connecting to a Twitter account

### Set-up

To run the bot on a Twitter account you need to apply for a Twitter developer account, generate API keys for your bot application and put them into a `.env` file to be accessed by [tweet.js](https://github.com/8bitkick/BBCMicroBot/blob/39c3587c60753db84b48888ea1f01d72d0081f92/tweet.js#L3). 

You can then run the bot with

`npm start`

Please refer to the https://developer.twitter.com if you are unfamiliar with these processes.

## Notes / excuses from the creator

BBCMicroBot was a side project that got unexpectedly successful. There are definitely some areas that can be improved and enhancement to be added which I have not had time for. I'm hoping the talent of the bot users can be focussed there! If you have suggestions please go for it. Let's keep discussion around code issues on github rather than on the bot account as much as possible.

### Architecture
The bot uses Twitter mentions timeline polling and hardcoded delays instead of using webhooks or querying the rate limit APIs. There are more elegant ways of doing this but it's worked solidly for months! Some advantages of this approach is it only needs the free tier Twitter Dev account and doesn't require any open incoming ports on the host machine (definitely a bonus if you run it a home). 

### Security
The purpose of the bot is to allow remote execution of arbitrary code (albeit BASIC) submitted by strangers on the Internet - this is in general not a good idea. The fact that user input is sanitized by first passing through Twitter, and is run on a BBC Micro 'VM' is a big plus, but security is certainly a concern. There is more that can and should be done to sandbox the emulator for example.

### Thanks
Thanks to Matt Godbolt for the JSBeeb emulator that made this project possible and to all the @bbcmicrobot users for their support - I hope this source code is interesting or useful. 


