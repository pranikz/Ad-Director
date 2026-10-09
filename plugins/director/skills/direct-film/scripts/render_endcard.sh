#!/bin/zsh
# render_endcard.sh <project-dir> — endcard/brand.json (+ any Google Font in its "font") → endcard/tail.mp4
set -e
here=${0:A:h}; e=${1:A}/endcard
[ -f $e/brand.json ] || { echo "missing $e/brand.json"; exit 1; }
python3 $here/fonts.py $e/index.html $e/brand.json >/dev/null
python3 -c "import json,sys;print(json.dumps({'brand':open(sys.argv[1]).read()}))" $e/brand.json > $e/brand.vars.json
(cd $e && npx --yes hyperframes@0.8.137 render --quiet --workers 4 --variables-file brand.vars.json -o tail.mp4 >tail.log 2>&1) || { echo "end card render failed, see $e/tail.log"; exit 1; } # 4 workers: 6 can run HyperFrames out of memory
echo "$e/tail.mp4 $(ffprobe -v error -show_entries format=duration -of csv=p=0 $e/tail.mp4)s"
