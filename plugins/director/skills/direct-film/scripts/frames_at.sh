#!/bin/zsh
# frames_at.sh <film.mp4> <out.jpg> t1 t2 ... — gridded 640px frames at callout times (grid cell = 192x108 at 1080p)
set -e
f=$1; o=$2; shift 2; d=$(mktemp -d); i=0
trap 'rm -rf $d' EXIT
vf="scale=640:-1,drawgrid=w=64:h=36:t=1:c=yellow@0.4"
for t in "$@"; do
  i=$((i+1)); png=$d/$(printf %02d $i).png
  ffmpeg -v error -y -ss $t -i $f -frames:v 1 -vf $vf $png
  [ -f $png ] || ffmpeg -v error -y -sseof -0.1 -i $f -frames:v 1 -vf $vf $png # a time past the end shows the last frame, so cells stay in order
done
cols=$(( $# < 4 ? $# : 4 ))
ffmpeg -v error -y -i $d/%02d.png -vf tile=${cols}x$(( ($# + cols - 1) / cols )) -frames:v 1 $o; echo $o
