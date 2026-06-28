#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


CODEX_HOME = Path.home() / '.codex'
HISTORY_PATH = CODEX_HOME / 'history.jsonl'
SESSIONS_PATH = CODEX_HOME / 'sessions'


@dataclass(frozen=True)
class SessionMeta:
  id: str
  session_id: str
  parent_thread_id: str | None
  timestamp: str
  path: Path
  thread_source: str | None
  agent_nickname: str | None
  agent_role: str | None
  origin: str


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description='Report Codex session usage and estimated cost, including spawned agents.',
  )
  parser.add_argument(
    'thread_id',
    nargs='?',
    help='Top-level session/thread id to analyze.',
  )
  parser.add_argument(
    '--last',
    action='store_true',
    help='Analyze the last distinct session id from ~/.codex/history.jsonl, excluding the current one by default.',
  )
  parser.add_argument(
    '--include-current',
    action='store_true',
    help='When used with --last, allow the most recent distinct session id to be selected.',
  )
  parser.add_argument(
    '--json',
    action='store_true',
    help='Print JSON instead of the text report.',
  )
  parser.add_argument(
    '--no-offline',
    action='store_true',
    help='Pass through to ccusage and allow live pricing refresh instead of --offline.',
  )
  return parser.parse_args()


def read_last_distinct_session_id(include_current: bool) -> str:
  if not HISTORY_PATH.exists():
    raise SystemExit(f'History file not found: {HISTORY_PATH}')

  seen: list[str] = []

  with HISTORY_PATH.open() as history_file:
    for line in history_file:
      line = line.strip()
      if not line:
        continue
      record = json.loads(line)
      session_id = record.get('session_id')
      if not isinstance(session_id, str) or not session_id:
        continue
      if not seen or seen[-1] != session_id:
        seen.append(session_id)

  if not seen:
    raise SystemExit('No session ids found in history.jsonl.')

  if include_current:
    return seen[-1]

  if len(seen) < 2:
    raise SystemExit('No previous session found. Re-run with --include-current if needed.')

  return seen[-2]


def load_session_metadata() -> dict[str, SessionMeta]:
  if not SESSIONS_PATH.exists():
    raise SystemExit(f'Sessions directory not found: {SESSIONS_PATH}')

  sessions: dict[str, SessionMeta] = {}

  for path in sorted(SESSIONS_PATH.rglob('*.jsonl')):
    with path.open() as session_file:
      first_line = session_file.readline().strip()

    if not first_line:
      continue

    try:
      record = json.loads(first_line)
    except json.JSONDecodeError:
      continue

    if record.get('type') != 'session_meta':
      continue

    payload = record.get('payload', {})
    if not isinstance(payload, dict):
      continue

    rollout_id = payload.get('id')
    session_id = payload.get('session_id')
    timestamp = payload.get('timestamp')

    if not isinstance(rollout_id, str) or not rollout_id:
      continue
    if not isinstance(session_id, str) or not session_id:
      continue
    if not isinstance(timestamp, str) or not timestamp:
      continue

    source = payload.get('source')
    origin = 'session'
    if isinstance(source, dict) and isinstance(source.get('subagent'), dict):
      subagent = source['subagent']
      if 'other' in subagent:
        origin = str(subagent['other'])
      elif isinstance(subagent.get('thread_spawn'), dict):
        origin = str(subagent['thread_spawn'].get('agent_nickname', 'subagent'))

    sessions[rollout_id] = SessionMeta(
      id=rollout_id,
      session_id=session_id,
      parent_thread_id=payload.get('parent_thread_id'),
      timestamp=timestamp,
      path=path,
      thread_source=payload.get('thread_source'),
      agent_nickname=payload.get('agent_nickname'),
      agent_role=payload.get('agent_role'),
      origin=origin,
    )

  return sessions


def find_root_session(thread_id: str, sessions: dict[str, SessionMeta]) -> SessionMeta:
  if thread_id in sessions:
    return sessions[thread_id]

  for meta in sessions.values():
    if meta.session_id == thread_id and meta.id == thread_id:
      return meta

  raise SystemExit(f'Could not find session metadata for thread id {thread_id}.')


def collect_thread_tree(root_id: str, sessions: dict[str, SessionMeta]) -> tuple[dict[str, int], list[SessionMeta]]:
  depths = {root_id: 0}
  ordered_ids = [root_id]
  changed = True

  while changed:
    changed = False
    for meta in sessions.values():
      parent_id = meta.parent_thread_id
      if parent_id not in depths or meta.id in depths:
        continue
      depths[meta.id] = depths[parent_id] + 1
      ordered_ids.append(meta.id)
      changed = True

  ordered = [sessions[session_id] for session_id in ordered_ids if session_id in sessions]
  ordered.sort(key=lambda meta: (depths[meta.id], meta.timestamp, meta.id))
  return depths, ordered


def run_ccusage(since_date: str, offline: bool) -> dict:
  command = ['ccusage', 'codex', 'session', '--json', '--since', since_date]
  if offline:
    command.append('--offline')

  result = subprocess.run(
    command,
    check=False,
    capture_output=True,
    text=True,
  )

  if result.returncode != 0:
    raise SystemExit(f'ccusage failed: {result.stderr.strip() or result.stdout.strip()}')

  try:
    return json.loads(result.stdout)
  except json.JSONDecodeError as exc:
    raise SystemExit(f'Failed to parse ccusage JSON: {exc}') from exc


def match_usage_entries(rollout_ids: set[str], ccusage_data: dict) -> dict[str, dict]:
  sessions = ccusage_data.get('sessions', [])
  if not isinstance(sessions, list):
    raise SystemExit('Unexpected ccusage JSON shape: missing sessions list.')

  matched: dict[str, dict] = {}

  for entry in sessions:
    if not isinstance(entry, dict):
      continue
    session_file = entry.get('sessionFile')
    if not isinstance(session_file, str):
      continue
    for rollout_id in rollout_ids:
      if rollout_id in session_file:
        matched[rollout_id] = entry
        break

  return matched


def number(value: object) -> float:
  if isinstance(value, (int, float)):
    return float(value)
  return 0.0


def summarize(entries: list[dict]) -> dict[str, float]:
  totals = {
    'costUSD': 0.0,
    'totalTokens': 0.0,
    'inputTokens': 0.0,
    'outputTokens': 0.0,
    'reasoningOutputTokens': 0.0,
    'cacheReadTokens': 0.0,
  }

  for entry in entries:
    for key in totals:
      totals[key] += number(entry.get(key))

  return totals


def model_names(entry: dict | None) -> str:
  if not entry:
    return 'n/a'
  models = entry.get('models')
  if not isinstance(models, dict) or not models:
    return 'n/a'
  return ', '.join(sorted(models.keys()))


def format_tokens(value: float) -> str:
  return f'{int(value):,}'


def format_cost(value: float) -> str:
  return f'${value:.6f}'


def classify_session(meta: SessionMeta) -> str:
  if meta.parent_thread_id is None:
    return 'parent'
  if meta.origin == 'guardian':
    return 'guardian'
  if meta.agent_role == 'worker':
    return 'workflowWorker'
  return 'otherSubagent'


def build_report(root: SessionMeta, tree: list[SessionMeta], depths: dict[str, int], usage_by_id: dict[str, dict]) -> dict:
  rows = []
  for meta in tree:
    entry = usage_by_id.get(meta.id)
    category = classify_session(meta)
    rows.append(
      {
        'id': meta.id,
        'sessionId': meta.session_id,
        'depth': depths[meta.id],
        'timestamp': meta.timestamp,
        'agentNickname': meta.agent_nickname or ('guardian' if meta.origin == 'guardian' else None),
        'agentRole': meta.agent_role or ('guardian' if meta.origin == 'guardian' else None),
        'origin': meta.origin,
        'threadSource': meta.thread_source,
        'category': category,
        'models': sorted((entry.get('models') or {}).keys()) if entry else [],
        'usage': entry,
      }
    )

  grouped_entries: dict[str, list[dict]] = {
    'parent': [],
    'guardian': [],
    'workflowWorker': [],
    'otherSubagent': [],
  }
  all_entries = []

  for meta in tree:
    entry = usage_by_id.get(meta.id)
    if not entry:
      continue
    grouped_entries[classify_session(meta)].append(entry)
    all_entries.append(entry)

  return {
    'threadId': root.id,
    'rootSessionId': root.session_id,
    'startedAt': root.timestamp,
    'rootRolloutPath': str(root.path),
    'spawnedAgentCount': max(len(tree) - 1, 0),
    'sessions': rows,
    'totals': {
      'thread': summarize(all_entries),
      'parent': summarize(grouped_entries['parent']),
      'guardian': summarize(grouped_entries['guardian']),
      'workflowWorkers': summarize(grouped_entries['workflowWorker']),
      'otherSubagents': summarize(grouped_entries['otherSubagent']),
      'spawnedAgents': summarize(
        grouped_entries['guardian']
        + grouped_entries['workflowWorker']
        + grouped_entries['otherSubagent']
      ),
    },
  }


def print_text_report(report: dict) -> None:
  thread_totals = report['totals']['thread']
  parent_totals = report['totals']['parent']
  guardian_totals = report['totals']['guardian']
  worker_totals = report['totals']['workflowWorkers']
  other_subagent_totals = report['totals']['otherSubagents']
  spawned_totals = report['totals']['spawnedAgents']

  print(f"Thread: {report['threadId']}")
  print(f"Started: {report['startedAt']}")
  print(f"Spawned agents: {report['spawnedAgentCount']}")
  print(f"Thread totals: {format_tokens(thread_totals['totalTokens'])} tokens, {format_cost(thread_totals['costUSD'])} estimated cost")
  print(f"Parent session: {format_tokens(parent_totals['totalTokens'])} tokens, {format_cost(parent_totals['costUSD'])} estimated cost")
  print(f"Spawned agents total: {format_tokens(spawned_totals['totalTokens'])} tokens, {format_cost(spawned_totals['costUSD'])} estimated cost")
  print(f"Workflow workers: {format_tokens(worker_totals['totalTokens'])} tokens, {format_cost(worker_totals['costUSD'])} estimated cost")
  print(f"Guardian approvals: {format_tokens(guardian_totals['totalTokens'])} tokens, {format_cost(guardian_totals['costUSD'])} estimated cost")
  if other_subagent_totals['totalTokens'] > 0:
    print(f"Other subagents: {format_tokens(other_subagent_totals['totalTokens'])} tokens, {format_cost(other_subagent_totals['costUSD'])} estimated cost")
  print('')
  print('Sessions:')

  for session in report['sessions']:
    usage = session['usage'] or {}
    label = session['agentNickname'] or 'parent'
    role = session['agentRole'] or 'session'
    print(
      f"- depth={session['depth']} {label} ({role}, {session['category']}) {session['id']} | "
      f"{format_tokens(number(usage.get('totalTokens')))} tokens | "
      f"{format_cost(number(usage.get('costUSD')))} | "
      f"models={', '.join(session['models']) or 'n/a'}"
    )


def main() -> int:
  args = parse_args()

  if not args.thread_id and not args.last:
    raise SystemExit('Provide a thread id or use --last.')
  if args.thread_id and args.last:
    raise SystemExit('Use either a thread id or --last, not both.')

  thread_id = args.thread_id
  if args.last:
    thread_id = read_last_distinct_session_id(include_current=args.include_current)

  sessions = load_session_metadata()
  root = find_root_session(thread_id, sessions)
  depths, tree = collect_thread_tree(root.id, sessions)
  usage_data = run_ccusage(root.timestamp[:10], offline=not args.no_offline)
  usage_by_id = match_usage_entries({meta.id for meta in tree}, usage_data)
  report = build_report(root, tree, depths, usage_by_id)

  if args.json:
    print(json.dumps(report, indent=2))
  else:
    print_text_report(report)

  return 0


if __name__ == '__main__':
  raise SystemExit(main())
