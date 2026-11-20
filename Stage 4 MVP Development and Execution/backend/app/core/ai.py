import base64
import json
import re
import time
import urllib.error
import urllib.request

from app.core import config

# Claude through the Anthropic Messages API. Every AI feature goes through ask_json(), so the
# model, the key, the timeouts and the limits live in one place. The key stays on the server.
API_URL = "https://api.anthropic.com/v1/messages"
API_VERSION = "2023-06-01"

# Each user can make this many AI requests an hour (saved answers are free and do not count).
HOURLY_LIMIT = 40
_used: dict[int, list[float]] = {}


class AIError(Exception):
    pass


class AIOff(AIError):
    pass


class AILimit(AIError):
    pass


def enabled() -> bool:
    return bool(config.ANTHROPIC_API_KEY)


def take_turn(user_id: int) -> None:
    now = time.time()
    recent = [t for t in _used.get(user_id, []) if now - t < 3600]
    if len(recent) >= HOURLY_LIMIT:
        raise AILimit("You used the AI a lot in the last hour. Try again later")
    _used[user_id] = [*recent, now]


def image_block(data: bytes, content_type: str) -> dict:
    return {
        "type": "image",
        "source": {"type": "base64", "media_type": content_type, "data": base64.b64encode(data).decode()},
    }


def post(body: dict) -> dict:
    # One call to Claude; returns the whole answer.
    if not enabled():
        raise AIOff("The AI assistant is not switched on yet")
    request = urllib.request.Request(API_URL, data=json.dumps(body).encode(), method="POST", headers={
        "x-api-key": config.ANTHROPIC_API_KEY,
        "anthropic-version": API_VERSION,
        "content-type": "application/json",
    })
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as error:
        detail = error.read()[:300]
        print(f"[ai] Anthropic answered {error.code}: {detail!r}", flush=True)
        if error.code in (401, 403):
            raise AIError("The AI key on the server is not valid") from error
        if error.code == 429:
            raise AIError("The AI is busy right now. Try again in a minute") from error
        if error.code == 400 and b"credit" in detail.lower():
            raise AIError("The AI account has no credit left") from error
        if error.code == 404:
            raise AIError("The AI model name on the server is not right (AI_MODEL)") from error
        raise AIError("The AI service could not answer") from error
    except Exception as error:  # noqa: BLE001 - network problems look the same to the page
        raise AIError("The AI service could not be reached") from error


def send(system: str, content: list, max_tokens: int, schema: dict | None = None) -> dict:
    # Asks Claude and returns the answer as a dict. With a schema, Claude must answer by "calling"
    # the give_answer tool, so the answer always comes back as structured JSON (no text to parse).
    body = {
        "model": config.AI_MODEL,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": content}],
    }
    if schema is not None:
        body["tools"] = [{"name": "give_answer", "description": "Give the final answer.", "input_schema": schema}]
        body["tool_choice"] = {"type": "tool", "name": "give_answer"}
    answer = post(body)
    for part in answer.get("content", []):
        if part.get("type") == "tool_use" and isinstance(part.get("input"), dict):
            return part["input"]
    text = "".join(part.get("text", "") for part in answer.get("content", []) if part.get("type") == "text")
    try:
        return parse_json(text)
    except AIError:
        print(f"[ai] could not read the answer (stop_reason={answer.get('stop_reason')}): {text[:300]!r}", flush=True)
        if answer.get("stop_reason") == "max_tokens":
            raise AIError("The AI answer was too long. Try again") from None
        raise


def parse_json(text: str) -> dict:
    # Claude is asked for JSON only; this also copes with ```json fences or a sentence around it.
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        raise AIError("The AI answer could not be read")
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError as error:
        raise AIError("The AI answer could not be read") from error


def ask_json(system: str, content: list, max_tokens: int = 1500, schema: dict | None = None) -> dict:
    return send(system, content, max_tokens, schema or {"type": "object"})


def text_list(description: str) -> dict:
    return {"type": "array", "items": {"type": "string"}, "description": description}
