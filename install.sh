#!/bin/bash

set -euo pipefail

echo
echo Installing BBC Micro Bot
echo ------------------------

echo Building beebjit
#####################
# TODO once the error in issue 45 is fixed this could just be a git submodule...
if [ ! -d beebjit ]; then
  git clone https://github.com/scarybeasts/beebjit.git
fi
pushd beebjit
git fetch
git reset --hard
# https://github.com/scarybeasts/beebjit/issues/45
git checkout 9fcaa1096857e919f6872856c7bbc77f38e77027
# Backport warning fix, which is error with -Werror
git cherry-pick -x c00f1b736582beb8362dfd5e5ecc33e192ab3040
# if scarybeasts used Makefiles we could save a compile & link every time...
./build_headless_opt.sh
popd

echo Getting GXR ROM
ln -sf ./node_modules/jsbeeb/roms/ roms
test -f roms/gxr.rom || curl -sL https://mdfs.net/System/ROMs/Graphics/GXR120 -o roms/gxr.rom
cp roms/gxr.rom beebjit/roms/

echo Creating directories
########################
mkdir -p tmp
mkdir -p certs

echo Generating certificates
############################

pushd certs
test -f server_cert.pem || openssl req -x509 -newkey rsa:4096 -keyout server_key.pem -out server_cert.pem -nodes -days 365 -subj "/CN=localhost/O=BBC\ Micro\ Bot"
test -f client_csr.pem || openssl req -newkey rsa:4096 -keyout client_key.pem -out client_csr.pem -nodes -days 365 -subj "/CN=Emulator Client"
test -f server_key.pem || openssl x509 -req -in client_csr.pem -CA server_cert.pem -CAkey server_key.pem -out client_cert.pem -set_serial 01 -days 365
chmod og-rwx *
popd