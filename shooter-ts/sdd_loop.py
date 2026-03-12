#!/usr/bin/env python3
"""
SDD Loop Automation Script
===========================
タスクごとに spec-tdd → validate-tdd → spec-impl → validate-impl を自動実行する。

Usage:
    python3 sdd_loop.py --workdir . --feature reflect-shooter
    python3 sdd_loop.py --workdir . --feature reflect-shooter --tasks 3 5 7
"""

import argparse
import subprocess
import json
import sys
import os
import re
import time
from pathlib import Path
from datetime import datetime

# ============================================================
# Configuration (defaults, overridden by CLI args)
# ============================================================
MAX_VALIDATE_RETRIES = 6   # validate 失敗の最大リトライ数
MAX_TASK_RESTARTS = 3      # タスク全体のやり直し最大回数
MAX_PARSE_RETRIES = 2      # verdict パース失敗時のリトライ数
TIMEOUT = 1800              # 1回の QwenCLI 呼び出しタイムアウト（秒）


# ============================================================
# Global state (set by main from CLI args)
# ============================================================
FEATURE = ""
WORKDIR = ""
QWEN = ""
MODEL = ""
LOGFILE = ""
RESULTS_FILE = ""
ENV = {}
QWEN_BASE = []   # QwenCLI ベースコマンド（共通）


def init_config(args):
    """CLI 引数からグローバル設定を初期化する"""
    global FEATURE, WORKDIR, QWEN, MODEL, LOGFILE, RESULTS_FILE
    global ENV, QWEN_BASE

    FEATURE = args.feature
    WORKDIR = str(Path(args.workdir).resolve())
    QWEN = args.qwen
    MODEL = args.model

    LOGFILE = os.path.join(WORKDIR, "sdd_loop.log")
    RESULTS_FILE = os.path.join(WORKDIR, "sdd_results.json")

    ENV = {**os.environ, "LMSTUDIO_API_KEY": "dummy"}

    QWEN_BASE = [
        QWEN,
        "--auth-type", "openai",
        "--openai-api-key", "dummy",
        "-m", MODEL,
    ]


# ============================================================
# Logging
# ============================================================
def log(msg, level="INFO"):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] [{level}] {msg}"
    print(line)
    with open(LOGFILE, "a") as f:
        f.write(line + "\n")


# ============================================================
# QwenCLI Execution
# ============================================================
def run_qwen(prompt, yolo=False, json_output=False):
    """QwenCLI を実行して出力を返す。yolo=True で自動承認、json_output=True で構造化出力。"""
    cmd = list(QWEN_BASE)
    if yolo:
        cmd.append("-y")
    if json_output:
        cmd.extend(["-o", "json"])

    log(f"  QwenCLI: yolo={yolo}, json={json_output}, prompt={prompt[:80]}...")

    try:
        result = subprocess.run(
            cmd,
            input=prompt.encode("utf-8"),
            capture_output=True,
            cwd=WORKDIR,
            env=ENV,
            timeout=TIMEOUT,
        )
        output = result.stdout.decode("utf-8", errors="replace")
        if result.stderr and not json_output:
            output += "\n" + result.stderr.decode("utf-8", errors="replace")
        return output, result.returncode
    except subprocess.TimeoutExpired:
        log("  TIMEOUT", level="ERROR")
        return "", -1


# ============================================================
# Test Execution (run tests before validate-impl)
# ============================================================
def run_tests(task_num):
    """テストファイルを実行して結果テキストを返す。ファイルがなければ None。"""
    test_file = Path(WORKDIR) / f"test_task{task_num}.ts"
    if not test_file.exists():
        log(f"  No test file: {test_file}")
        return None

    log(f"  Running tests: node --experimental-strip-types {test_file.name}")
    try:
        result = subprocess.run(
            ["node", "--experimental-strip-types", test_file.name],
            capture_output=True,
            cwd=WORKDIR,
            timeout=30,
        )
        output = result.stdout.decode("utf-8", errors="replace")
        stderr = result.stderr.decode("utf-8", errors="replace").strip()
        full = output
        if stderr:
            full += "\nSTDERR:\n" + stderr
        full += f"\nExit code: {result.returncode}"
        log(f"  Test exit code: {result.returncode}")
        return full
    except subprocess.TimeoutExpired:
        log(f"  Test TIMEOUT (30s)", level="WARN")
        return "Test execution timed out after 30 seconds\nExit code: timeout"
    except Exception as e:
        log(f"  Test execution error: {e}", level="ERROR")
        return f"Test execution error: {e}\nExit code: error"


# ============================================================
# Regression Test (run all existing tests after each task)
# ============================================================
def run_all_tests():
    """既存の全テストファイルを実行して、リグレッションがないか確認する。
    戻り値: (all_passed: bool, summary: str, failures: list[str])"""
    test_files = sorted(Path(WORKDIR).glob("test_task*.ts"))
    if not test_files:
        return True, "No test files found", []

    passed = []
    failures = []
    for tf in test_files:
        try:
            result = subprocess.run(
                ["node", "--experimental-strip-types", tf.name],
                capture_output=True,
                cwd=WORKDIR,
                timeout=30,
            )
            stdout = result.stdout.decode("utf-8", errors="replace")
            stderr = result.stderr.decode("utf-8", errors="replace").strip()

            if result.returncode == 0 and "FAIL" not in stdout:
                passed.append(tf.name)
            else:
                error = stderr or stdout
                failures.append(f"{tf.name}: {error[:300]}")
        except subprocess.TimeoutExpired:
            failures.append(f"{tf.name}: TIMEOUT")
        except Exception as e:
            failures.append(f"{tf.name}: {e}")

    total = len(test_files)
    summary = f"{len(passed)}/{total} tests passed"
    if failures:
        summary += f", {len(failures)} failed"
        log(f"  [Regression] {summary}", level="WARN")
        for f in failures:
            log(f"    FAIL: {f[:200]}", level="WARN")
    else:
        log(f"  [Regression] {summary}")

    return len(failures) == 0, summary, failures


# ============================================================
# Verdict Parsing
# ============================================================
def parse_verdict(raw_output):
    """QwenCLI -o json の出力から verdict を抽出する"""

    # Step 1: -o json の場合、result オブジェクトから result テキストを取得
    result_text = _extract_result_text(raw_output)
    if result_text is None:
        result_text = raw_output  # json でなければ生テキストをそのまま使う

    # Step 2: 最終行から JSON を探す（下から順に試す）
    lines = [l.strip() for l in result_text.strip().split("\n") if l.strip()]
    for line in reversed(lines):
        # markdown code fence を除去
        cleaned = re.sub(r'^```(?:json)?|```$', '', line).strip()
        if not cleaned:
            continue
        try:
            obj = json.loads(cleaned)
            if isinstance(obj, dict) and "verdict" in obj:
                return obj
        except json.JSONDecodeError:
            continue

    # Step 3: テキスト全体から verdict JSON を正規表現で探す
    m = re.search(r'\{"verdict"\s*:\s*"(GO|NO-GO)"(?:\s*,\s*"issues"\s*:\s*\[.*?\])?\s*\}', result_text)
    if m:
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            pass

    # Step 4: verdict JSON がなくても、テキストからGO/NO-GO判定を推測
    lower = result_text.lower()
    if re.search(r'\ball\s+checks?\s+(?:\w+\s+)*pass|(?<!\bno.)verdict\s*[:\s]\s*go\b|no\s+issues?\s+found|correct\s+and\s+sufficient', lower):
        return {"verdict": "GO"}
    if re.search(r'\bno.?go\b|not.?pass|issues?\s+found|problems?\s+found', lower):
        return None  # NO-GO っぽいがissuesが不明なのでフォールバックに任せる

    return None


def _extract_result_text(raw_output):
    """QwenCLI -o json 出力から result.result を取得"""
    try:
        data = json.loads(raw_output)
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and item.get("type") == "result":
                    return item.get("result", "")
        return None
    except (json.JSONDecodeError, TypeError):
        return None


def fallback_parse(raw_output):
    """verdict のパースに失敗した場合、LLM に JSON 変換を依頼する"""
    log("  Verdict parse failed, trying LLM fallback...")

    truncated = raw_output[-3000:]
    prompt = f"""以下はテスト検証の結果テキストの末尾です。
この中から最終判定（verdict）を見つけて、JSON形式で1行だけ出力してください。
他のテキストは一切不要です。JSONのみを出力してください。

検証結果（末尾）:
{truncated}

出力形式:
合格の場合: {{"verdict":"GO"}}
不合格の場合: {{"verdict":"NO-GO","issues":["問題1","問題2"]}}"""

    output, _ = run_qwen(prompt, yolo=True)
    verdict = parse_verdict(output)

    if verdict:
        log(f"  LLM fallback succeeded: {verdict['verdict']}")
        return verdict

    log("  LLM fallback also failed", level="WARN")
    return None


# ============================================================
# Validate (parse + fallback + リトライ 統合)
# ============================================================
def validate(phase, feature, task_num):
    """
    validate-tdd or validate-impl を実行して verdict を返す。
    impl フェーズでは事前にテストを実行し、結果をプロンプトに含める。
    パース失敗時は LLM フォールバック → それも失敗なら validate 再実行。
    """
    test_results = None
    if phase == "impl":
        test_results = run_tests(task_num)

    for parse_try in range(MAX_PARSE_RETRIES):
        if parse_try > 0:
            log(f"  Validate re-run (parse retry {parse_try + 1}/{MAX_PARSE_RETRIES})")

        cmd_name = f"/kiro:validate-{phase} {feature} {task_num}"
        if test_results is not None:
            cmd_name += f"\n\n## Test Execution Results (pre-run by automation)\nThe following test results were obtained by running `node --experimental-strip-types test_task{task_num}.ts`:\n```\n{test_results}\n```\nYou do NOT need to run the tests yourself. Evaluate based on these results and code review."
        output, rc = run_qwen(cmd_name, json_output=True)

        # Step 1: 直接パース
        verdict = parse_verdict(output)
        if verdict:
            return verdict

        # Step 2: LLM フォールバック
        result_text = _extract_result_text(output) or output
        verdict = fallback_parse(result_text)
        if verdict:
            return verdict

        # Step 3: パースもフォールバックも失敗 → ループして validate 再実行
        log(f"  Parse completely failed, will re-run validate...", level="WARN")

    log(f"  All parse retries exhausted, returning NO-GO", level="ERROR")
    return {"verdict": "NO-GO", "issues": [f"validate の出力を {MAX_PARSE_RETRIES} 回パース試行したが全て失敗"]}


# ============================================================
# Task File Parsing
# ============================================================
def parse_tasks():
    """tasks.md からタスク番号とタイトルを取得"""
    tasks_path = Path(WORKDIR) / ".kiro" / "specs" / FEATURE / "tasks.md"
    if not tasks_path.exists():
        log(f"tasks.md not found: {tasks_path}", level="ERROR")
        sys.exit(1)

    tasks = []
    with open(tasks_path) as f:
        for line in f:
            # "- [ ] Task 3: タイトル" or "- [x] Task 14a: タイトル"
            m = re.match(r'-\s*\[[ x]\]\s*Task\s+(\d+[a-z]?)\s*:\s*(.*)', line)
            if m:
                tasks.append({
                    "num": m.group(1),
                    "title": m.group(2).strip(),
                    "done": "[x]" in line,
                })
    return tasks


# ============================================================
# Task Completion
# ============================================================
def mark_task_done(task_num):
    """tasks.md のチェックボックスを [ ] → [x] に更新する"""
    tasks_path = Path(WORKDIR) / ".kiro" / "specs" / FEATURE / "tasks.md"
    content = tasks_path.read_text(encoding="utf-8")

    old = f"- [ ] Task {task_num}:"
    new = f"- [x] Task {task_num}:"

    if old in content:
        content = content.replace(old, new, 1)
        tasks_path.write_text(content, encoding="utf-8")
        log(f"  Marked {task_num} as done in tasks.md")
    else:
        log(f"  Could not find checkbox for {task_num} in tasks.md (may already be checked)", level="WARN")


# ============================================================
# Git Snapshot (タスク開始時の状態を保存・復元)
# ============================================================
def git_snapshot_save(task_num):
    """タスク開始前の HEAD SHA を記録する"""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=WORKDIR, capture_output=True, text=True
        )
        sha = result.stdout.strip()
        log(f"  [Git] Snapshot saved before task {task_num} (SHA: {sha[:8]})")
        return sha
    except Exception as e:
        log(f"  [Git] Snapshot save failed: {e}", level="WARN")
        return None


def git_snapshot_restore(task_num, sha=None):
    """タスク開始前の状態に git で巻き戻す"""
    try:
        if sha:
            subprocess.run(["git", "reset", "--hard", sha], cwd=WORKDIR, capture_output=True)
        else:
            subprocess.run(["git", "checkout", "."], cwd=WORKDIR, capture_output=True)
        subprocess.run(["git", "clean", "-fd"], cwd=WORKDIR, capture_output=True)
        log(f"  [Git] Restored to snapshot before task {task_num}")
    except Exception as e:
        log(f"  [Git] Restore failed: {e}", level="WARN")


def git_commit_task(task_num):
    """タスク完了後に git commit する"""
    try:
        subprocess.run(["git", "add", "-A"], cwd=WORKDIR, capture_output=True)
        subprocess.run(
            ["git", "commit", "-m", f"task {task_num}: passed"],
            cwd=WORKDIR, capture_output=True,
        )
        log(f"  [Git] Committed task {task_num}")
    except Exception as e:
        log(f"  [Git] Commit failed: {e}", level="WARN")


# ============================================================
# Fix Prompt Builders
# ============================================================
def build_fix_prompt_tdd(feature, task_num, issues):
    issues_text = "\n".join(f"- {issue}" for issue in issues)
    return f"""テストファイル test_task{task_num}.ts に問題が見つかりました。

まず以下のファイルを読んでから修正してください:
1. test_task{task_num}.ts（修正対象）
2. .kiro/specs/{feature}/design.md（正しいインターフェース定義）
3. .kiro/specs/{feature}/tasks.md（タスク {task_num} の仕様）

問題点:
{issues_text}

テストファイルを直接編集してください。"""


def build_fix_prompt_impl(feature, task_num, issues):
    issues_text = "\n".join(f"- {issue}" for issue in issues)
    return f"""タスク {task_num} の実装に問題が見つかりました。

まず以下のファイルを読んでから修正してください:
1. test_task{task_num}.ts（テスト — これが通るように実装を直す）
2. .kiro/specs/{feature}/design.md（正しいインターフェース定義）
3. .kiro/specs/{feature}/tasks.md（タスク {task_num} の仕様）
4. 該当する src/*.ts ファイル（修正対象）

問題点:
{issues_text}

実装ファイルを直接編集してください。テストファイルは変更しないでください。"""


# ============================================================
# Main SDD Loop
# ============================================================
def run_task(task_num, task_title):
    """1タスクの SDD ループを実行"""
    log(f"{'='*60}")
    log(f"Task {task_num}: {task_title}")
    log(f"{'='*60}")

    result = {
        "task": task_num,
        "title": task_title,
        "status": "PENDING",
        "restarts": 0,
        "tdd_attempts": 0,
        "impl_attempts": 0,
        "issues_history": [],
    }

    snapshot_sha = git_snapshot_save(task_num)

    for restart in range(MAX_TASK_RESTARTS):
        result["restarts"] = restart
        log(f"  --- Restart {restart}/{MAX_TASK_RESTARTS - 1} ---")

        if restart > 0:
            git_snapshot_restore(task_num, snapshot_sha)

        # ========================================
        # Phase 1: spec-tdd → validate-tdd
        # ========================================
        log(f"  [Phase 1] spec-tdd")
        run_qwen(f"/kiro:spec-tdd {FEATURE} {task_num}", yolo=True)

        tdd_ok = False
        for attempt in range(MAX_VALIDATE_RETRIES):
            result["tdd_attempts"] += 1
            log(f"  [Phase 1] validate-tdd (attempt {attempt + 1}/{MAX_VALIDATE_RETRIES})")

            verdict = validate("tdd", FEATURE, task_num)
            log(f"  Verdict: {verdict['verdict']}")

            if verdict["verdict"] == "GO":
                tdd_ok = True
                log(f"  TDD PASSED")
                break

            issues = verdict.get("issues", ["不明なエラー"])
            result["issues_history"].append({
                "phase": "tdd",
                "attempt": attempt + 1,
                "restart": restart,
                "issues": issues,
            })
            log(f"  Issues: {issues}")

            if attempt < MAX_VALIDATE_RETRIES - 1:
                log(f"  Sending fix prompt...")
                fix_prompt = build_fix_prompt_tdd(FEATURE, task_num, issues)
                run_qwen(fix_prompt, yolo=True)

        if not tdd_ok:
            log(f"  TDD FAILED after {MAX_VALIDATE_RETRIES} attempts, restarting task...", level="WARN")
            continue

        # ========================================
        # Phase 2: spec-impl → validate-impl
        # ========================================
        log(f"  [Phase 2] spec-impl")
        run_qwen(f"/kiro:spec-impl {FEATURE} {task_num}", yolo=True)

        impl_ok = False
        for attempt in range(MAX_VALIDATE_RETRIES):
            result["impl_attempts"] += 1
            log(f"  [Phase 2] validate-impl (attempt {attempt + 1}/{MAX_VALIDATE_RETRIES})")

            verdict = validate("impl", FEATURE, task_num)
            log(f"  Verdict: {verdict['verdict']}")

            if verdict["verdict"] == "GO":
                impl_ok = True
                log(f"  IMPL PASSED")
                break

            issues = verdict.get("issues", ["不明なエラー"])
            result["issues_history"].append({
                "phase": "impl",
                "attempt": attempt + 1,
                "restart": restart,
                "issues": issues,
            })
            log(f"  Issues: {issues}")

            if attempt < MAX_VALIDATE_RETRIES - 1:
                log(f"  Sending fix prompt...")
                fix_prompt = build_fix_prompt_impl(FEATURE, task_num, issues)
                run_qwen(fix_prompt, yolo=True)

        if not impl_ok:
            log(f"  IMPL FAILED after {MAX_VALIDATE_RETRIES} attempts, restarting task...", level="WARN")
            continue

        # ========================================
        # Phase 3: Regression Test (run ALL existing tests)
        # ========================================
        log(f"  [Phase 3] Running all existing tests for regression check")
        reg_ok, reg_summary, reg_failures = run_all_tests()
        if not reg_ok:
            log(f"  [Regression] Task {task_num} broke existing tests")
            result["issues_history"].append({
                "phase": "regression",
                "attempt": 1,
                "restart": restart,
                "issues": reg_failures[:5],
            })
            reg_fixed = False
            for reg_attempt in range(3):
                failures_text = "\n".join(f"- {f[:200]}" for f in reg_failures[:5])
                fix_prompt = (
                    f"タスク {task_num} の実装後、既存テストでリグレッションが発生しました。\n\n"
                    f"まず以下を読んでください:\n"
                    f"1. 失敗したテストファイル\n"
                    f"2. .kiro/specs/{FEATURE}/design.md（正しいインターフェース定義）\n"
                    f"3. 該当する src/*.ts ファイル\n\n"
                    f"失敗したテスト:\n{failures_text}\n\n"
                    f"src/ の実装ファイルを修正してください。テストファイルは変更しないでください。"
                )
                log(f"  Sending regression fix prompt (attempt {reg_attempt + 1}/3)...")
                run_qwen(fix_prompt, yolo=True)
                reg_ok2, reg_summary2, reg_failures2 = run_all_tests()
                if reg_ok2:
                    reg_fixed = True
                    log(f"  [Regression] Fixed after {reg_attempt + 1} attempt(s)")
                    break
                reg_failures = reg_failures2
                result["issues_history"].append({
                    "phase": "regression",
                    "attempt": reg_attempt + 2,
                    "restart": restart,
                    "issues": reg_failures2[:5],
                })

            if not reg_fixed:
                log(f"  [Regression] Could not fix regressions, restarting task...", level="WARN")
                continue

        # 全フェーズ成功
        result["status"] = "PASSED"
        mark_task_done(task_num)
        git_commit_task(task_num)
        log(f"  Task {task_num} PASSED (tdd: {result['tdd_attempts']} attempts, impl: {result['impl_attempts']} attempts)")
        return result

    result["status"] = "FAILED"
    log(f"  Task {task_num} FAILED after {MAX_TASK_RESTARTS} restarts", level="ERROR")
    return result


def main():
    parser = argparse.ArgumentParser(description="SDD Loop: spec-tdd → validate-tdd → spec-impl → validate-impl")
    parser.add_argument("--workdir", required=True, help="プロジェクトのルートディレクトリ")
    parser.add_argument("--feature", required=True, help="フィーチャー名（.kiro/specs/<feature>/）")
    parser.add_argument("--qwen", default="qwen", help="QwenCLI のパス (default: qwen)")
    parser.add_argument("--model", default="qwen/qwen3.5-35b-a3b", help="モデル名")
    parser.add_argument("--tasks", nargs="*", help="実行するタスク番号（省略時は未完了の全タスク）")
    args = parser.parse_args()

    init_config(args)

    log(f"SDD Loop started: feature={FEATURE}, workdir={WORKDIR}")
    log(f"Config: model={MODEL}, max_retries={MAX_VALIDATE_RETRIES}, max_restarts={MAX_TASK_RESTARTS}")

    all_tasks = parse_tasks()
    log(f"Found {len(all_tasks)} tasks in tasks.md")

    if args.tasks:
        target_nums = set(args.tasks)
        tasks = [t for t in all_tasks if t["num"] in target_nums]
        log(f"Filtered to {len(tasks)} tasks: {[t['num'] for t in tasks]}")
    else:
        tasks = [t for t in all_tasks if not t["done"]]
        log(f"Running {len(tasks)} incomplete tasks")

    if not tasks:
        log("No tasks to run")
        return

    results = []
    for task in tasks:
        t_start = time.time()
        result = run_task(task["num"], task["title"])
        result["duration_sec"] = round(time.time() - t_start, 1)
        results.append(result)

    # 結果サマリ
    log(f"\n{'='*60}")
    log(f"RESULTS SUMMARY")
    log(f"{'='*60}")
    passed = [r for r in results if r["status"] == "PASSED"]
    failed = [r for r in results if r["status"] == "FAILED"]
    log(f"Passed: {len(passed)}/{len(results)} (failed: {len(failed)})")
    for r in results:
        status = {"PASSED": "OK", "FAILED": "NG"}.get(r["status"], "??")
        log(f"  [{status}] Task {r['task']}: {r['title']} "
            f"(tdd:{r['tdd_attempts']} impl:{r['impl_attempts']} "
            f"restarts:{r['restarts']} time:{r['duration_sec']}s)")

    # 結果を JSON で保存
    with open(RESULTS_FILE, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    log(f"Results saved to {RESULTS_FILE}")


if __name__ == "__main__":
    main()
