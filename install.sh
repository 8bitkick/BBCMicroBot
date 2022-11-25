#!/bin/bash

echo
echo Installing BBC Micro Bot
echo ------------------------

echo Building beebjit
#####################
git clone https://github.com/scarybeasts/beebjit.git
cd beebjit
# https://github.com/scarybeasts/beebjit/issues/45
git checkout 9fcaa1096857e919f6872856c7bbc77f38e77027
# Backport warning fix, which is error with -Werror
git cherry-pick -x c00f1b736582beb8362dfd5e5ecc33e192ab3040
./build_headless_opt.sh
cd  ..

echo Getting GXR ROM
ln -s ./node_modules/jsbeeb/roms/ roms
cd roms
curl https://mdfs.net/System/ROMs/Graphics/GXR120 > gxr.rom
cd -
cp roms/gxr.rom beebjit/roms/

echo Creating directories
########################
mkdir tmp
mkdir certs

echo Generating certificates
############################
cd certs

openssl req -x509 -newkey rsa:4096 -keyout server_key.pem -out server_cert.pem -nodes -days 365 -subj "/CN=localhost/O=BBC\ Micro\ Bot"
openssl req -newkey rsa:4096 -keyout client_key.pem -out client_csr.pem -nodes -days 365 -subj "/CN=Emulator Client"
openssl x509 -req -in client_csr.pem -CA server_cert.pem -CAkey server_key.pem -out client_cert.pem -set_serial 01 -days 365
chmod og-rwx *
