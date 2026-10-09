#!/bin/zsh
# new_project.sh <project-dir> [--update] — scaffold an ad-film project from the skill's templates.
#   --update: refresh an existing project's overlay/ and endcard/ templates to this skill version (fonts, card styles),
#             keeping its configs, brand.json and assets; the old index.html is kept as index.old.html
set -e
here=${0:A:h}; p=${1:A}; mkdir -p $p/{refs,films/takes,prompts,qa,audio,out/{with-text,clean}}
if [ "$2" = "--update" ]; then
  for pair in "text-overlay overlay" "endcard endcard"; do
    t=${pair%% *}; d=$p/${pair##* }
    [ -d $d ] || continue
    [ -f $d/index.html ] && cp $d/index.html $d/index.old.html
    cp $here/../templates/$t/index.html $d/index.html
    for f in meta.json package.json hyperframes.json; do [ -f $here/../templates/$t/$f ] && cp $here/../templates/$t/$f $d/$f; done
  done
  echo "templates updated: $p"; exit 0
fi
[ -d $p/overlay ] || cp -R $here/../templates/text-overlay $p/overlay
[ -d $p/endcard ] || { cp -R $here/../templates/endcard $p/endcard; cp $p/endcard/brand.example.json $p/endcard/brand.json; }
mkdir -p $p/overlay/cfg; echo "project ready: $p"
