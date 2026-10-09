#!/bin/zsh
# qa_sheet.sh <film.mp4> <outdir> — 64-frame contact sheet (8x8, gridded) over the whole film + shot-cut times.
# Look at the sheet for: walking through objects, morphing hands/faces, beautified or aged-wrong casting,
# fake text/logos, red-liquid props, wardrobe drift. Cuts go to <outdir>/<name>.cuts (one time per line).
set -e
f=$1; o=$2; mkdir -p $o; n=${f:t:r}
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $f) # 64 cells spread over any length (4 fps for a 16 s take)
ffmpeg -v error -y -i $f -vf "fps=64/${d},scale=320:-1,drawgrid=w=32:h=18:t=1:c=yellow@0.25,tile=8x8" -frames:v 1 $o/$n.sheet.jpg
ffmpeg -hide_banner -i $f -vf "select='gt(scene,0.25)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*" | cut -d: -f2 > $o/$n.cuts
echo "sheet: $o/$n.sheet.jpg ($(printf %.2f $(echo "$d/64"|bc -l)) s per cell)"; echo "cuts: $(tr '\n' ' ' < $o/$n.cuts)"
