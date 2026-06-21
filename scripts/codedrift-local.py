#!/usr/bin/env python3
"""Run CodeDrift with repository-local runtime caches."""

import json
import os
from pathlib import Path
from typing import Optional


REPO_ROOT = Path(__file__).resolve().parents[1]
TREE_SITTER_CACHE = REPO_ROOT / ".codecodedrift" / "cache" / "tree-sitter-language-pack"
HF_MODEL_CACHE = (
    Path.home()
    / ".cache"
    / "huggingface"
    / "hub"
    / "models--sentence-transformers--all-MiniLM-L6-v2"
)


def _configure_model_offline_mode() -> None:
    if HF_MODEL_CACHE.exists():
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")


def _patch_session_parser() -> None:
    from codedrift import session_parser
    original_parse_session = session_parser.parse_session

    def find_latest_session(project_dir: str) -> Optional[Path]:
        project_path = str(Path(project_dir).resolve())

        claude_session = session_parser._project_log_dir(project_path)
        if claude_session:
            files = sorted(
                claude_session.glob("*.jsonl"),
                key=lambda candidate: candidate.stat().st_mtime,
                reverse=True,
            )
            if files:
                return files[0]

        codex_sessions_root = Path.home() / ".codex" / "sessions"
        if not codex_sessions_root.is_dir():
            return None

        matching_sessions: list[Path] = []
        for candidate in codex_sessions_root.rglob("*.jsonl"):
            if _is_codex_project_session(candidate, project_path):
                matching_sessions.append(candidate)

        if not matching_sessions:
            return None

        matching_sessions.sort(key=lambda candidate: candidate.stat().st_mtime, reverse=True)
        return matching_sessions[0]

    def parse_session(jsonl_path: str) -> dict:
        session_path = Path(jsonl_path)
        if _looks_like_codex_session(session_path):
            return _parse_codex_session(session_path)

        return original_parse_session(jsonl_path)

    session_parser.find_latest_session = find_latest_session
    session_parser.parse_session = parse_session


def _looks_like_codex_session(session_path: Path) -> bool:
    try:
        first_line = session_path.read_text(errors="replace").splitlines()[0]
    except IndexError:
        return False

    try:
        record = json.loads(first_line)
    except json.JSONDecodeError:
        return False

    return (
        record.get("type") == "session_meta"
        and record.get("payload", {}).get("source") == "cli"
        and record.get("payload", {}).get("originator") == "codex-tui"
    )


def _is_codex_project_session(session_path: Path, project_path: str) -> bool:
    try:
        with session_path.open(errors="replace") as handle:
            for _, raw_line in zip(range(5), handle):
                raw_line = raw_line.strip()
                if not raw_line:
                    continue

                try:
                    record = json.loads(raw_line)
                except json.JSONDecodeError:
                    continue

                if record.get("type") != "session_meta":
                    continue

                session_cwd = record.get("payload", {}).get("cwd")
                return session_cwd == project_path
    except OSError:
        return False

    return False


def _parse_codex_session(session_path: Path) -> dict:
    task_text = ""
    files_read: list[str] = []
    symbols_resolved: list[str] = []
    session_id: Optional[str] = None

    for raw_line in session_path.read_text(errors="replace").splitlines():
        raw_line = raw_line.strip()
        if not raw_line:
            continue

        try:
            record = json.loads(raw_line)
        except json.JSONDecodeError:
            continue

        record_type = record.get("type")
        payload = record.get("payload", {})

        if record_type == "session_meta" and not session_id:
            session_id = payload.get("id")
            continue

        if record_type == "event_msg" and payload.get("type") == "user_message":
            message = payload.get("message")
            if isinstance(message, str) and message.strip():
                normalized_message = _normalize_task_text(message)
                if normalized_message and (not task_text or _looks_like_injected_prompt(task_text)):
                    task_text = normalized_message
            continue

        if record_type != "response_item":
            continue

        item_type = payload.get("type")

        if item_type == "message" and payload.get("role") == "user" and not task_text:
            extracted_text = _extract_codex_text(payload.get("content", []))
            if extracted_text and not _looks_like_injected_prompt(extracted_text):
                task_text = extracted_text
            continue

        if item_type != "function_call":
            continue

        tool_name = payload.get("name", "")
        arguments = _parse_tool_arguments(payload.get("arguments", ""))
        if tool_name == "codedrift_read":
            file_path = arguments.get("file")
            if isinstance(file_path, str) and file_path:
                files_read.append(file_path)
        elif tool_name == "codedrift_resolve":
            symbol = arguments.get("symbol")
            if isinstance(symbol, str) and symbol:
                symbols_resolved.append(symbol)

    return {
        "task_text": task_text,
        "files_read": list(dict.fromkeys(files_read)),
        "symbols_resolved": list(dict.fromkeys(symbols_resolved)),
        "session_id": session_id,
    }


def _extract_codex_text(content: object) -> str:
    if not isinstance(content, list):
        return ""

    for block in content:
        if not isinstance(block, dict):
            continue
        if block.get("type") in {"input_text", "output_text"}:
            text = block.get("text")
            if isinstance(text, str) and text.strip():
                return _normalize_task_text(text)

    return ""


def _normalize_task_text(text: str) -> str:
    normalized = text.strip()

    for marker in ("</environment_context>", "</INSTRUCTIONS>"):
        if marker in normalized:
            trailing = normalized.rsplit(marker, maxsplit=1)[-1].strip()
            if trailing:
                normalized = trailing

    lines = [line.strip() for line in normalized.splitlines() if line.strip()]
    if lines:
        normalized = " ".join(lines)

    return normalized


def _looks_like_injected_prompt(text: str) -> bool:
    return text.startswith("# AGENTS.md instructions") or text.startswith("<environment_context>")


def _parse_tool_arguments(raw_arguments: object) -> dict[str, object]:
    if isinstance(raw_arguments, dict):
        return raw_arguments
    if not isinstance(raw_arguments, str) or not raw_arguments:
        return {}

    try:
        parsed = json.loads(raw_arguments)
    except json.JSONDecodeError:
        return {}

    return parsed if isinstance(parsed, dict) else {}


def main() -> None:
    _configure_model_offline_mode()

    try:
        from tree_sitter_language_pack import configure
        from tree_sitter_language_pack.options import PackConfig
    except ImportError:
        pass
    else:
        configure(PackConfig(cache_dir=str(TREE_SITTER_CACHE)))

    _patch_session_parser()

    from codedrift.cli import main as codedrift_main

    codedrift_main(prog_name="codedrift")


if __name__ == "__main__":
    main()
