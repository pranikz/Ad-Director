#!/bin/zsh
# make_ad.sh <project-dir> <key> [--clean]
#   films/<key>.mp4 + overlay/cfg/<key>.json (callouts) + endcard/tail.mp4 (+ audio/tail.m4a) → out/with-text/<key>.mp4
#   --clean skips the text overlay → out/clean/<key>.mp4
# Render the end card once first:  scripts/render_endcard.sh <project-dir>
# Any length or size of film: the overlay is rendered at the film's own duration, the picture fits 1920x1080,
# a silent film gets a silent track, and the end card's sound starts with its picture.
set -e
p=${1:A}; k=$2; film=$p/films/$k.mp4; tail=$p/endcard/tail.mp4
[ -f $film ] || { echo "missing $film"; exit 1; }
[ -f $tail ] || { echo "missing $tail (run scripts/render_endcard.sh first)"; exit 1; }
vd=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 $film); td=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $tail)
fit="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1,setsar=1" # no fps before the overlay: it balloons memory
inputs=(-i $film); vf="[0:v]${fit},fps=24,format=yuv420p[v0]"
if [ "$3" != "--clean" ]; then
  cfg=$p/overlay/cfg/$k.json
  python3 -c "import json,sys;print(json.dumps({'cfg':open(sys.argv[1]).read()}))" $cfg > $p/overlay/cfg/$k.vars.json
  python3 ${0:A:h}/fonts.py $p/overlay/index.html $cfg >/dev/null # any Google Font named in the cfg theme
  sed -E "s/data-duration=\"[0-9.]+\"/data-duration=\"$vd\"/g" $p/overlay/index.html > $p/overlay/.$k.html # HyperFrames reads the length before scripts run
  mkdir -p $p/overlay/renders
  (cd $p/overlay && npx --yes hyperframes@0.8.137 render -c .$k.html --format mov --fps 24 --quiet --workers 4 --variables-file cfg/$k.vars.json -o renders/$k.mov >renders/$k.log 2>&1) || { echo "overlay render failed, see $p/overlay/renders/$k.log"; exit 1; }
  inputs+=(-i $p/overlay/renders/$k.mov); vf="[0:v]${fit}[f];[f][1:v]overlay=0:0:format=auto,fps=24,format=yuv420p,setsar=1[v0]"; ti=2; dest=$p/out/with-text
else ti=1; dest=$p/out/clean; fi
inputs+=(-i $tail)
if [ -f $p/audio/tail.m4a ]; then inputs+=(-i $p/audio/tail.m4a); ta="[$((ti+1)):a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${td},asetpts=PTS-STARTPTS,afade=t=out:st=$(echo "$td-0.5"|bc):d=0.5[a1]"
else ta="anullsrc=r=48000:cl=stereo,atrim=0:${td}[a1]"; fi
if [ -n "$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 $film)" ]; then
  fa="[0:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:${vd},afade=t=out:st=$(echo "$vd-0.15"|bc):d=0.15[a0]" # padded to the picture, so the tail's sound starts with the tail
else fa="anullsrc=r=48000:cl=stereo,atrim=0:${vd}[a0]"; fi
mkdir -p $dest
# encode beside the cut and swap it in at the end: a failed or half-done encode never sits in the delivery folder
ffmpeg -v error -y "${inputs[@]}" -filter_complex "$vf;[$ti:v]fps=24,format=yuv420p,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0[v];$fa;$ta;[a0][a1]concat=n=2:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11[a]" -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart -f mp4 $dest/$k.mp4.part
mv $dest/$k.mp4.part $dest/$k.mp4
echo "$dest/$k.mp4 $(ffprobe -v error -show_entries format=duration -of csv=p=0 $dest/$k.mp4)s"
