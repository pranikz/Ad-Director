#!/bin/zsh
# package.sh <project-dir> <Delivery Name> — delivery folder + zip in ~/Downloads (with-text, clean, raw films, prompts, projects).
set -e
p=${1:A}; D="$HOME/Downloads/$2"; rm -rf "$D"; mkdir -p "$D"/{01_ads-with-text,02_ads-clean,03_films,04_alt-takes,05_project}
cp $p/out/with-text/*.mp4 "$D/01_ads-with-text/" 2>/dev/null || true; cp $p/out/clean/*.mp4 "$D/02_ads-clean/" 2>/dev/null || true
cp $p/films/*.mp4 "$D/03_films/" 2>/dev/null || true; cp $p/films/takes/*.mp4 "$D/04_alt-takes/" 2>/dev/null || true
rsync -a --exclude renders --exclude node_modules --exclude '*.mov' $p/{prompts,refs,overlay,endcard,brief.md,PROMPTS.md,README.md} "$D/05_project/" 2>/dev/null || true
(cd "$HOME/Downloads" && rm -f "$2.zip" && zip -qr -X "$2.zip" "$2" -x "*.DS_Store" && unzip -tq "$2.zip" >/dev/null) && echo "$D" && echo "$HOME/Downloads/$2.zip"
