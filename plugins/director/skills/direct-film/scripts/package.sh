#!/bin/zsh
# package.sh <project-dir> <Delivery Name> — delivery folder + zip in ~/Downloads (with-text, clean, raw films, prompts, projects).
set -e
p=${1:A}; name=$2
[[ -n $name && $name != */* && $name != .* ]] || { echo "usage: package.sh <project-dir> <Delivery Name>"; exit 1; }
D=$HOME/Downloads/$name
# never delete anything that isn't an earlier delivery of ours (an empty name used to mean all of ~/Downloads)
[[ ${D:A} != $p && $p != ${D:A}/* ]] || { echo "\"$name\" is the project's own folder; pick another delivery name"; exit 1; }
if [ -e $D ]; then [ -f $D/.director-delivery ] || { echo "$D already exists and isn't a Director delivery; pick another name"; exit 1; }; rm -rf $D; fi
mkdir -p $D/{01_ads-with-text,02_ads-clean,03_films,04_alt-takes,05_project}; touch $D/.director-delivery
cp $p/out/with-text/*.mp4 $D/01_ads-with-text/ 2>/dev/null || true; cp $p/out/clean/*.mp4 $D/02_ads-clean/ 2>/dev/null || true
cp $p/films/*.mp4 $D/03_films/ 2>/dev/null || true; cp $p/films/takes/*.mp4 $D/04_alt-takes/ 2>/dev/null || true
rsync -a --exclude renders --exclude node_modules --exclude '*.mov' $p/{prompts,refs,overlay,endcard,brief.md,PROMPTS.md,README.md} $D/05_project/ 2>/dev/null || true
(cd $HOME/Downloads && rm -f "$name.zip" && zip -qr -X "$name.zip" "$name" -x "*.DS_Store" -x "*/.director-delivery" && unzip -tq "$name.zip" >/dev/null) && echo $D && echo "$HOME/Downloads/$name.zip"
