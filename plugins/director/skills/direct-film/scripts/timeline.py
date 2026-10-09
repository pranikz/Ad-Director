"""timeline.py <project-dir> — write <project>/timeline.json for the desktop app's timeline viewer.

Per film key (films/<key>.mp4): shots (from qa/<key>.cuts, else detected now), dialogue (qa/<key>.dialogue.json:
[{"start","end","text"}] if you saved one), QA issues (qa/<key>.vlm.json from the app's Gemini check), callouts + cards (overlay/cfg/<key>.json), end card span, outputs, takes.
"""
import json, re, subprocess, sys
from pathlib import Path

p = Path(sys.argv[1]).resolve()
dur = lambda f: float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)], capture_output=True, text=True).stdout or 0)

def cuts(key, film):
    c = p / "qa" / f"{key}.cuts"
    if not c.exists() or c.stat().st_mtime < film.stat().st_mtime:  # a replaced film gets new cuts
        out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(film), "-vf", "select='gt(scene,0.25)',showinfo", "-f", "null", "-"], capture_output=True, text=True).stderr
        c.parent.mkdir(exist_ok=True); c.write_text("\n".join(l.split("pts_time:")[1].split()[0] for l in out.splitlines() if "pts_time:" in l))
    return [float(x) for x in c.read_text().split()]

films = []
for film in sorted((p / "films").glob("*.mp4")):
    k, fd = film.stem, dur(film)
    t = [0.0] + [x for x in cuts(k, film) if 0.2 < x < fd - 0.2] + [fd]
    cfg = p / "overlay" / "cfg" / f"{k}.json"
    c = json.loads(cfg.read_text()) if cfg.exists() else {}
    dlg = p / "qa" / f"{k}.dialogue.json"
    vlm = p / "qa" / f"{k}.vlm.json"
    issues = json.loads(vlm.read_text()).get("issues", []) if vlm.exists() else []
    out = {v: f"out/{v}/{k}.mp4" for v in ("with-text", "clean") if (p / "out" / v / f"{k}.mp4").exists()}
    total = dur(p / (out.get("with-text") or out["clean"])) if out else fd
    films.append({
        "key": k, "film": f"films/{film.name}", "outputs": out, "filmDuration": round(fd, 3), "duration": round(total, 3),
        "tracks": {
            "shots": [{"start": round(a, 3), "end": round(b, 3), "label": f"Shot {i+1}"} for i, (a, b) in enumerate(zip(t, t[1:]))],
            "dialogue": json.loads(dlg.read_text()) if dlg.exists() else [],
            "callouts": [{"start": x["t0"], "end": x["t1"], "label": " ".join(x["lines"])} for x in c.get("callouts", [])],
            "cards": [{"start": x["t0"], "end": x["t1"], "label": x["title"]} for x in c.get("cards", [])],
            "qa": [{"start": float(i.get("time", 0)), "end": float(i.get("time", 0)) + 0.4, "label": f"{i.get('category', '')}: {i.get('note', '')}", "severity": i.get("severity", "minor")} for i in issues],
            "endcard": [{"start": round(fd, 3), "end": round(fd + 3.9, 3), "label": "Offer"}, {"start": round(fd + 3.9, 3), "end": round(total, 3), "label": "Packshot"}] if total > fd + 1 else [],
        },
        "takes": sorted(f"films/takes/{x.name}" for x in (p / "films" / "takes").glob("*.mp4") if re.search(rf"(^|_){re.escape(k.split('_', 1)[-1])}(_|$)", x.stem)),
    })
(p / "timeline.json").write_text(json.dumps({"project": p.name, "films": films}, indent=1, ensure_ascii=False))
print(f"{p / 'timeline.json'}: {len(films)} films")
