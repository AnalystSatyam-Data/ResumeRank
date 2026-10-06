"""
ResumeRank - Candidate Selection Optimizer Service
===================================================
Bridge service integrating native C algorithms (Unit 3 0/1 Knapsack &
Unit 4 Branch and Bound) with Flask backend via subprocess communication.
"""

import os
import sys
import json
import shutil
import platform
import subprocess
from typing import Dict, List, Any, Optional

DSA_C_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dsa_c')


def _get_executable_path(algo_name: str) -> str:
    """
    Get the path to the compiled C executable, attempting auto-compilation if missing.

    Args:
        algo_name: 'knapsack' or 'branch_bound'

    Returns:
        Absolute path to the executable.
    """
    is_windows = platform.system() == 'Windows'
    ext = '.exe' if is_windows else ''
    exe_name = f"{algo_name}{ext}"
    exe_path = os.path.join(DSA_C_DIR, exe_name)
    src_path = os.path.join(DSA_C_DIR, f"{algo_name}.c")

    if not os.path.exists(src_path):
        raise FileNotFoundError(f"C source file not found at: {src_path}")

    # Check if executable exists and is up to date
    needs_compile = False
    if not os.path.exists(exe_path):
        needs_compile = True
    else:
        # Recompile if source is newer than binary
        if os.path.getmtime(src_path) > os.path.getmtime(exe_path):
            needs_compile = True

    if needs_compile:
        # Detect C compiler (gcc or clang)
        compiler = shutil.which('gcc') or shutil.which('clang')
        if not compiler:
            if os.path.exists(exe_path):
                return exe_path
            msg = (
                f"C executable '{exe_name}' not found and no C compiler (gcc/clang) was detected in PATH.\n"
                f"Please compile the C program using:\n"
                f"  Windows: backend\\dsa_c\\build.bat\n"
                f"  macOS/Linux: backend/dsa_c/build.sh"
            )
            raise RuntimeError(msg)

        cmd = [compiler, "-Wall", "-Wextra", "-O2", "-std=c99", src_path, "-o", exe_path, "-lm"]
        compile_res = subprocess.run(cmd, capture_output=True, text=True)
        if compile_res.returncode != 0:
            raise RuntimeError(f"C compilation failed for {src_path}:\n{compile_res.stderr}")

    return exe_path


def derive_interview_cost(candidate_dict: Dict[str, Any]) -> int:
    """
    Derive realistic interview resource cost (hours) from candidate profile
    when not explicitly provided, without altering the database schema.

    Base interview cost: 2 hours (Screening + Tech Round)
    + 1 hour for every 3 years of experience (Senior / Lead panel evaluation)
    Bounded between 1 and 6 hours.
    """
    if candidate_dict.get('cost') is not None and candidate_dict.get('cost') > 0:
        return int(candidate_dict['cost'])
    if candidate_dict.get('interview_cost') is not None and candidate_dict.get('interview_cost') > 0:
        return int(candidate_dict['interview_cost'])

    exp = candidate_dict.get('experience_years') or candidate_dict.get('experience') or 0
    try:
        exp_float = float(exp)
    except (ValueError, TypeError):
        exp_float = 0.0

    cost = 2 + int(exp_float // 3)
    return max(1, min(6, cost))


def run_knapsack_optimizer(candidates: List[Dict[str, Any]], capacity: int) -> Dict[str, Any]:
    """
    Execute Unit 3: 0/1 Knapsack Optimizer via native C executable.

    Args:
        candidates: List of candidate dicts with id, name, score, and optional cost.
        capacity: Available interview/resource capacity (integer > 0).

    Returns:
        Structured optimization result dictionary.
    """
    if capacity < 0:
        raise ValueError("Interview capacity cannot be negative.")

    # Prepare formatted candidate payloads
    prepared_candidates = []
    for c in candidates:
        cand_id = c.get('id') or c.get('candidate_id', 0)
        name = c.get('name') or c.get('candidate_name') or f"Candidate {cand_id}"
        score = float(c.get('final_score') if c.get('final_score') is not None else c.get('score', 0.0))
        cost = derive_interview_cost(c)
        prepared_candidates.append({
            'id': cand_id,
            'name': name,
            'score': round(score, 2),
            'cost': cost
        })

    if not prepared_candidates or capacity == 0:
        return {
            'status': 'success',
            'algorithm': '0/1 Knapsack (Dynamic Programming)',
            'unit': 'Unit 3 - Dynamic Programming',
            'capacity': capacity,
            'total_score': 0.0,
            'total_cost': 0,
            'remaining_capacity': capacity,
            'selected_count': 0,
            'candidates_evaluated': len(prepared_candidates),
            'selected_candidates': [],
            'metadata': {
                'time_complexity': 'O(N * W)',
                'space_complexity': 'O(N * W)',
                'principle': 'Optimal Substructure and Overlapping Subproblems'
            }
        }

    exe_path = _get_executable_path('knapsack')

    payload = {
        'capacity': int(capacity),
        'candidates': prepared_candidates
    }

    try:
        proc = subprocess.run(
            [exe_path],
            input=json.dumps(payload),
            text=True,
            capture_output=True,
            timeout=15
        )
    except subprocess.TimeoutExpired:
        raise TimeoutError("0/1 Knapsack optimizer execution timed out.")

    if proc.returncode != 0:
        raise RuntimeError(f"Knapsack C binary exited with code {proc.returncode}: {proc.stderr}")

    try:
        result = json.loads(proc.stdout)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON response from Knapsack C binary: {proc.stdout}") from e

    return result


def run_branch_bound_optimizer(candidates: List[Dict[str, Any]], capacity: int, max_candidates: Optional[int] = None) -> Dict[str, Any]:
    """
    Execute Unit 4: Branch and Bound Optimizer via native C executable.

    Args:
        candidates: List of candidate dicts with id, name, score, and optional cost.
        capacity: Available interview/resource capacity (integer > 0).
        max_candidates: Maximum headcount/interview quota to select (integer > 0).

    Returns:
        Structured optimization result dictionary.
    """
    if capacity < 0:
        raise ValueError("Interview capacity cannot be negative.")

    if max_candidates is not None:
        quota = int(max_candidates)
        if quota < 0:
            raise ValueError("max_candidates cannot be negative.")
    else:
        quota = len(candidates)

    prepared_candidates = []
    for c in candidates:
        cand_id = c.get('id') or c.get('candidate_id', 0)
        name = c.get('name') or c.get('candidate_name') or f"Candidate {cand_id}"
        score = float(c.get('final_score') if c.get('final_score') is not None else c.get('score', 0.0))
        cost = derive_interview_cost(c)
        prepared_candidates.append({
            'id': cand_id,
            'name': name,
            'score': round(score, 2),
            'cost': cost
        })

    if not prepared_candidates or capacity == 0 or quota == 0:
        return {
            'status': 'success',
            'algorithm': 'Branch and Bound (LCBB / Best-First Search)',
            'unit': 'Unit 4 - Backtracking and Branch & Bound',
            'capacity': capacity,
            'max_candidates': quota,
            'total_score': 0.0,
            'total_cost': 0,
            'remaining_capacity': capacity,
            'selected_count': 0,
            'candidates_evaluated': len(prepared_candidates),
            'selected_candidates': [],
            'statistics': {
                'states_explored': 0,
                'branches_pruned': 0,
                'initial_upper_bound': 0.0,
                'best_solution_score': 0.0,
                'time_complexity': 'O(2^N) worst-case, reduced via pruning',
                'space_complexity': 'O(2^N) priority queue / O(N) path'
            }
        }

    exe_path = _get_executable_path('branch_bound')

    payload = {
        'capacity': int(capacity),
        'max_candidates': quota,
        'candidates': prepared_candidates
    }

    try:
        proc = subprocess.run(
            [exe_path],
            input=json.dumps(payload),
            text=True,
            capture_output=True,
            timeout=15
        )
    except subprocess.TimeoutExpired:
        raise TimeoutError("Branch and Bound optimizer execution timed out.")

    if proc.returncode != 0:
        raise RuntimeError(f"Branch and Bound C binary exited with code {proc.returncode}: {proc.stderr}")

    try:
        result = json.loads(proc.stdout)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON response from Branch and Bound C binary: {proc.stdout}") from e

    return result
