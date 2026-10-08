#!/bin/zsh
# new_project.sh <project-dir> — scaffold an ad-film project from the skill's templates.
set -e
here=${0:A:h}; p=${1:A}; mkdir -p $p/{refs,films/takes,prompts,qa,audio,out/{with-text,clean}}
[ -d $p/overlay ] || cp -R $here/../templates/text-overlay $p/overlay
[ -d $p/endcard ] || { cp -R $here/../templates/endcard $p/endcard; cp $p/endcard/brand.example.json $p/endcard/brand.json; }
mkdir -p $p/overlay/cfg; echo "project ready: $p"
