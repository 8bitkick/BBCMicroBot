#!/bin/bash

echo
echo Installing BBC Micro Bot
echo ------------------------

echo Getting GXR ROM
ln -s ./node_modules/jsbeeb/roms/ roms
cd roms
curl http://mdfs.net/System/ROMs/Graphics/GXR120 > gxr.rom
cd -

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
