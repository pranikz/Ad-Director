#!/bin/zsh
# qa_sheet.sh <film.mp4> <outdir> — 4 fps contact sheet (8x8, gridded) + shot-cut times.
# Look at the sheet for: walking through objects, morphing hands/faces, beautified or aged-wrong casting,
# fake text/logos, red-liquid props, wardrobe drift. Cuts go to <outdir>/<name>.cuts (one time per line).
set -e
f=$1; o=$2; mkdir -p $o; n=${f:t:r}
ffmpeg -v error -y -i $f -vf "fps=4,scale=320:-1,drawgrid=w=32:h=18:t=1:c=yellow@0.25,tile=8x8" -frames:v 1 $o/$n.sheet.jpg
ffmpeg -hide_banner -i $f -vf "select='gt(scene,0.25)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*" | cut -d: -f2 > $o/$n.cuts
echo "sheet: $o/$n.sheet.jpg"; echo "cuts: $(tr '\n' ' ' < $o/$n.cuts)"
