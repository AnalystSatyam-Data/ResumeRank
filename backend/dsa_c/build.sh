#!/usr/bin/env bash
# ==============================================================================
# ResumeRank - Build Script for macOS / Linux (Unit 3 & Unit 4 C Algorithms)
# ==============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

CC="${CC:-gcc}"

echo "[ResumeRank] Using C compiler: $CC"

echo "[ResumeRank] Compiling Unit 3: 0/1 Knapsack (knapsack.c)..."
$CC -Wall -Wextra -O2 -std=c99 knapsack.c -o knapsack -lm
echo "[ResumeRank] Compiled: knapsack"

echo "[ResumeRank] Compiling Unit 4: Branch and Bound (branch_bound.c)..."
$CC -Wall -Wextra -O2 -std=c99 branch_bound.c -o branch_bound -lm
echo "[ResumeRank] Compiled: branch_bound"

echo ""
echo "[SUCCESS] Both Unit 3 and Unit 4 C executables are compiled and ready."
