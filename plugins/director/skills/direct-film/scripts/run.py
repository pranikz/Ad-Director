"""Parallel AI Studio runner (uses the aistudio-mcp package's own client).

  uv run --with "git+https://github.com/galleri5/aistudio-mcp" python run.py jobs.json OUTDIR [--quote]

jobs.json = [{"name": str, "model": str, "fields": {...}}]. A field value "@name" is replaced by that
earlier job's result URL (read from OUTDIR/results.json), so plates feed films without uploads.
--quote prints the credit cost of every job and exits without spending anything.
Results land in OUTDIR/<name>.<ext>; status per job is merged into OUTDIR/results.json.
"""
import json, sys, time, logging
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from aistudio_mcp import server as s

logging.disable(logging.INFO)
jobs = json.load(open(sys.argv[1]))
out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
res_path = out / "results.json"
load = lambda: json.loads(res_path.read_text()) if res_path.exists() else {}
results = load()

def sub(v, quoting=False):
    if isinstance(v, str) and v.startswith("@"):
        return "https://example.com/pending.jpg" if quoting and v[1:] not in results else results[v[1:]]["url"]
    if isinstance(v, list): return [sub(x, quoting) for x in v]
    return v

if "--quote" in sys.argv:
    total = 0
    for j in jobs:
        q = s.estimate(j["model"], {k: sub(v, True) for k, v in j["fields"].items()})["credits"]
        total += q; print(f"{j['name']:<32} {j['model']:<34} {q:>8.0f} cr")
    print(f"{'TOTAL':<67} {total:>8.0f} cr   (balance {s._balance()['available']:.0f})"); sys.exit()

def run(j):
    f = {k: sub(v) for k, v in j["fields"].items()}
    q = s.estimate(j["model"], f)["credits"]
    r = s.generate(j["model"], f, confirm_credits=q)
    pid = r.get("prediction_id") or r.get("inference_id") or r.get("id")
    print(f"[{j['name']}] submitted {pid} ({q:.0f} cr)", flush=True)
    t0 = time.time()
    while True:
        doc = s.get_result(pid, preview=False, wait=60)[0]
        if doc["status"] in ("completed", "failed"): break
        if time.time() - t0 > 3600: return j["name"], {"pid": pid, "status": "timeout"}
    if doc["status"] != "completed":
        err = str(doc.get("error") or doc.get("error_message"))
        print(f"[{j['name']}] FAILED {err}", flush=True)  # filtered/failed jobs are refunded by AI Studio
        return j["name"], {"pid": pid, "status": "failed", "error": err}
    url = doc["outputs"][0]
    ext = url.rsplit(".", 1)[-1].split("?")[0][:4]
    s._fetch(url, out / f"{j['name']}.{ext}")
    print(f"[{j['name']}] done in {time.time()-t0:.0f}s -> {j['name']}.{ext}", flush=True)
    return j["name"], {"pid": pid, "status": "completed", "url": url, "file": str(out / f"{j['name']}.{ext}"), "credits": q}

with ThreadPoolExecutor(len(jobs)) as ex:
    done = dict(ex.map(run, jobs))
merged = load() | done  # re-read: another runner may have written meanwhile
res_path.write_text(json.dumps(merged, indent=1))
print(json.dumps({k: v["status"] for k, v in done.items()}))
