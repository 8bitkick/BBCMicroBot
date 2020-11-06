#!/bin/bash

echo
echo Installing BBC Micro Bot
echo ------------------------

echo Building beebjit
#####################
git clone https://github.com/scarybeasts/beebjit.git
cd beebjit
set -e
sudo apt install -y libasound2-dev  
gcc -Wall -W -Werror \
    -Wno-unknown-warning-option -Wno-address-of-packed-member \
    -fno-pie -no-pie -Wa,--noexecstack \
    -O3 -DNDEBUG -o beebjit \
    main.c config.c bbc.c defs_6502.c state.c video.c via.c \
    emit_6502.c interp.c inturbo.c state_6502.c sound.c timing.c \
    jit_compiler.c cpu_driver.c asm_x64_abi.c asm_tables.c \
    asm_x64_common.c asm_x64_inturbo.c asm_x64_jit.c \
    asm_x64_common.S asm_x64_inturbo.S asm_x64_jit.S \
    jit_optimizer.c jit_opcode.c keyboard.c \
    teletext.c render.c serial.c log.c test.c tape.c adc.c cmos.c \
    intel_fdc.c wd_fdc.c \
    disc_drive.c disc.c ibm_disc_format.c disc_tool.c \
    disc_fsd.c disc_hfe.c disc_ssd.c disc_adl.c \
    debug.c jit.c util.c \
    os.c \
    -lm -Wl,--unresolved-symbols=ignore-all -lpthread 
# forces build without libx11-dev, libxext-dev
cd  ..

echo Building beebasm 
#####################
git clone https://github.com/stardot/beebasm.git
cd beebasm/src
make all
cd ../..
echo 'PUTTEXT "text.bas", "!BOOT", 0' > beebasm/makedisk.asm

echo Getting GXR ROM
ln -s ./node_modules/jsbeeb/roms/ roms
cd roms
curl http://mdfs.net/System/ROMs/Graphics/GXR120 > gxr.rom
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
