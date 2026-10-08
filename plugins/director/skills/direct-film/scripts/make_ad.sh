#!/bin/zsh
# make_ad.sh <project-dir> <key> [--clean]
#   films/<key>.mp4 + overlay/cfg/<key>.json (callouts) + endcard/tail.mp4 (+ audio/tail.m4a) → out/with-text/<key>.mp4
#   --clean skips the text overlay → out/clean/<key>.mp4
# Render the end card once first:  (cd endcard && npx --yes hyperframes@0.8.137 render --variables-file brand.vars.json -o tail.mp4)
set -e
p=${1:A}; k=$2; film=$p/films/$k.mp4; tail=$p/endcard/tail.mp4
[ -f $film ] || { echo "missing $film"; exit 1; }
fd=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $film); td=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $tail)
inputs=(-i $film); vf="[0:v]fps=24,format=yuv420p,setsar=1[v0]"
if [ "$3" != "--clean" ]; then
  cfg=$p/overlay/cfg/$k.json
  python3 -c "import json,sys;print(json.dumps({'cfg':open(sys.argv[1]).read()}))" $cfg > $p/overlay/cfg/$k.vars.json
  (cd $p/overlay && npx --yes hyperframes@0.8.137 render --format mov --fps 24 --quiet --variables-file cfg/$k.vars.json -o renders/$k.mov >/dev/null 2>&1)
  inputs+=(-i $p/overlay/renders/$k.mov); vf="[0:v][1:v]overlay=0:0:format=auto,fps=24,format=yuv420p,setsar=1[v0]"; ti=2; dest=$p/out/with-text
else ti=1; dest=$p/out/clean; fi
inputs+=(-i $tail)
if [ -f $p/audio/tail.m4a ]; then inputs+=(-i $p/audio/tail.m4a); ta="[$((ti+1)):a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:$td,asetpts=PTS-STARTPTS,afade=t=out:st=$(echo "$td-0.5"|bc):d=0.5[a1]"
else ta="anullsrc=r=48000:cl=stereo,atrim=0:$td[a1]"; fi
ffmpeg -v error -y "${inputs[@]}" -filter_complex "$vf;[$ti:v]fps=24,format=yuv420p,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0[v];[0:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:$fd,afade=t=out:st=$(echo "$fd-0.15"|bc):d=0.15[a0];$ta;[a0][a1]concat=n=2:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11[a]" -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart $dest/$k.mp4
echo "$dest/$k.mp4 $(ffprobe -v error -show_entries format=duration -of csv=p=0 $dest/$k.mp4)s"
