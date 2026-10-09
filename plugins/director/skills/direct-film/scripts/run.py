"""Parallel AI Studio runner (uses the aistudio-mcp package's own client).

  uv run --with "git+https://github.com/galleri5/aistudio-mcp" python run.py jobs.json OUTDIR [--quote]

jobs.json = [{"name": str, "model": str, "fields": {...}}]. A field value "@name" is replaced by that
job's result URL, so plates feed films without uploads: from an earlier batch (OUTDIR/results.json), or from this
batch, in which case the job waits for it.
--quote prints the credit cost of every job and exits without spending anything.
Results land in OUTDIR/<name>.<ext>; each job's status is written to OUTDIR/results.json the moment it lands,
so a crash or one failed job never loses the record of the others. Re-running skips jobs already completed
(their file still on disk), so nothing is paid for twice.
"""
import json, sys, time, logging, threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from aistudio_mcp import server as s

logging.disable(logging.INFO)
jobs = json.load(open(sys.argv[1]))
out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
res_path = out / "results.json"
load = lambda: json.loads(res_path.read_text()) if res_path.exists() else {}
results = load()

lock = threading.Lock()

def record(name, r):
    with lock:  # re-read first: another runner may have written meanwhile
        merged = load(); merged[name] = r; results[name] = r
        res_path.write_text(json.dumps(merged, indent=1))
    return name, r

done_already = lambda name: (results.get(name) or {}).get("status") == "completed" and Path(results[name].get("file", "")).exists()
batch = {j["name"] for j in jobs}
for name in batch:  # this batch re-runs these, so their old failures mustn't fail a job waiting on them
    if not done_already(name): results.pop(name, None)

def sub(v, quoting=False):
    if isinstance(v, str) and v.startswith("@"):
        name = v[1:]
        if quoting and "url" not in (results.get(name) or {}): return "https://example.com/pending.jpg"
        while name in batch and (results.get(name) or {}).get("status") in (None, "submitted"):
            time.sleep(3)  # a plate in this same batch: wait for it, then feed its URL to the film
        ref = results.get(name) or {}
        if "url" not in ref: raise RuntimeError(f"{v} didn't finish ({ref.get('status', 'not in results.json')}), so this job wasn't submitted")
        return ref["url"]
    if isinstance(v, list): return [sub(x, quoting) for x in v]
    return v

if "--quote" in sys.argv:
    total = 0
    for j in jobs:
        q = s.estimate(j["model"], {k: sub(v, True) for k, v in j["fields"].items()})["credits"]
        total += q; print(f"{j['name']:<32} {j['model']:<34} {q:>8.0f} cr")
    print(f"{'TOTAL':<67} {total:>8.0f} cr   (balance {s._balance()['available']:.0f})"); sys.exit()

def run(j):
    name, pid = j["name"], None
    if done_already(name):
        print(f"[{name}] already done -> {results[name]['file']}", flush=True)
        return name, results[name]
    try:
        f = {k: sub(v) for k, v in j["fields"].items()}
        q = s.estimate(j["model"], f)["credits"]
        r = s.generate(j["model"], f, confirm_credits=q)
        pid = r.get("prediction_id") or r.get("inference_id") or r.get("id")
        record(name, {"pid": pid, "status": "submitted", "credits": q})  # paid for: never lose the id
        print(f"[{name}] submitted {pid} ({q:.0f} cr)", flush=True)
        t0 = time.time()
        while True:
            doc = s.get_result(pid, preview=False, wait=60)[0]
            if doc["status"] in ("completed", "failed", "cancelled"): break
            if time.time() - t0 > 3600: return record(name, {"pid": pid, "status": "timeout"})
        if doc["status"] != "completed":
            err = str(doc.get("error") or doc.get("error_message") or doc["status"])
            print(f"[{name}] {doc['status'].upper()} {err}", flush=True)  # filtered/failed jobs are refunded by AI Studio
            return record(name, {"pid": pid, "status": doc["status"], "error": err})
        if not doc.get("outputs"): return record(name, {"pid": pid, "status": "failed", "error": "completed with no outputs"})
        url = doc["outputs"][0]
        ext = url.rsplit(".", 1)[-1].split("?")[0][:4]
        s._fetch(url, out / f"{name}.{ext}")
        print(f"[{name}] done in {time.time()-t0:.0f}s -> {name}.{ext}", flush=True)
        return record(name, {"pid": pid, "status": "completed", "url": url, "file": str(out / f"{name}.{ext}"), "credits": q})
    except Exception as e:  # one bad job (network, a moved quote, a missing @ref) never takes the batch's record with it
        print(f"[{name}] ERROR {e!r}", flush=True)
        return record(name, {"pid": pid, "status": "error", "error": repr(e)})

with ThreadPoolExecutor(len(jobs)) as ex:
    done = dict(ex.map(run, jobs))
print(json.dumps({k: v["status"] for k, v in done.items()}))
