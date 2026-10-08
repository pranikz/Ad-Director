"""transcribe.py <film.mp4> — timestamped dialogue via Gemini, to diff against the script.
Prefer the video-trim MCP's transcribe_and_plan tool when it is connected; this is the fallback.
  uv run --with google-genai python transcribe.py film.mp4     (needs GEMINI_API_KEY)
"""
import os, sys, time
from google import genai
c = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
f = c.files.upload(file=sys.argv[1])
while f.state.name == "PROCESSING": time.sleep(2); f = c.files.get(name=f.name)
r = c.models.generate_content(model=os.environ.get("GEMINI_MODEL", "gemini-flash-latest"), contents=[f,
    "Transcribe every spoken line in its original language and script (Hindi in Devanagari). One line each: "
    "[start-end seconds] SPEAKER: text. Note mis-pronounced numbers or garbled words in brackets."])
print(r.text)
