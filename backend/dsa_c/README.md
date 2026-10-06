# ResumeRank — Unit 3 & Unit 4 C Data Structures & Algorithms

This directory contains the authentic C implementations for **Unit 3 (0/1 Knapsack)** and **Unit 4 (Branch and Bound)** developed for the **DSA-II College Project-Based Learning (PBL) Progress Report–2**.

---

## 📋 Academic Alignment & Overview

| Unit | Syllabus Concept | Algorithm | Real Application in ResumeRank | Complexity (Time / Space) | Implementation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Unit 3** | Dynamic Programming | **0/1 Knapsack** | **Single-Resource Candidate Selection Optimizer**: Selects the highest-scoring candidate subset within a recruiter's finite interview time/capacity budget. | Time: $\mathcal{O}(N \cdot W)$<br>Space: $\mathcal{O}(N \cdot W)$ | `knapsack.c` |
| **Unit 4** | Backtracking & Branch & Bound | **Branch and Bound (LCBB)** | **Multi-Constraint Candidate Selection Optimizer**: Finds the globally optimal candidate cohort subject to both maximum interview resource capacity **AND** maximum candidate headcount limit (quota). | Time: $\mathcal{O}(2^N)$ worst-case (pruned heavily)<br>Space: $\mathcal{O}(2^N)$ max-heap | `branch_bound.c` |

---

## 🧠 Unit 3: 0/1 Knapsack Algorithm (`knapsack.c`)

### 1. Problem Formulation
In real-world talent acquisition, recruiters have finite interview capacity $W$ (e.g., 20 hours of senior engineering interview bandwidth). Each candidate $i \in \{1, \dots, N\}$ has:
- **Value ($v_i$)**: The candidate's composite match score calculated by the ResumeRank ranking engine ($0.0 \le v_i \le 100.0$).
- **Weight ($w_i$)**: The interview/evaluation resource time required (e.g., $1 \le w_i \le 10$ hours).

**Objective**: Maximize total score $\sum_{i \in S} v_i$ subject to $\sum_{i \in S} w_i \le W$, where $S \subseteq \{1, \dots, N\}$ and each candidate can either be selected ($1$) or not ($0$).

### 2. Dynamic Programming Formulation
- **State Definition**:
  $DP[i][w]$ represents the maximum composite score achievable considering the first $i$ candidates with available interview budget $w$.
- **Base Conditions**:
  $$DP[0][w] = 0 \quad \forall w \in [0, W] \quad \text{(No candidates left)}$$
  $$DP[i][0] = 0 \quad \forall i \in [0, N] \quad \text{(Zero capacity)}$$
- **Recurrence Relation**:
  $$DP[i][w] = \begin{cases} \max\Big(DP[i-1][w], \; DP[i-1][w - w_i] + v_i\Big), & \text{if } w_i \le w \\ DP[i-1][w], & \text{if } w_i > w \end{cases}$$
- **Optimal Substructure & Overlapping Subproblems**:
  Satisfies Bellman's Principle of Optimality: The optimal selection of $i$ candidates contains within it the optimal selection of $i-1$ candidates for the remaining capacity.
- **Solution Reconstruction**:
  Backtracking from $DP[N][W]$: if $DP[i][w] \ne DP[i-1][w]$, candidate $i$ was selected; we then decrement $w$ by $w_i$ and continue upward.

---

## 🌳 Unit 4: Branch and Bound Algorithm (`branch_bound.c`)

### 1. Problem Formulation
Recruiters rarely optimize for capacity alone. Often, they have:
1. A **maximum interview capacity** $W$ (e.g., $\le 15$ hours), and
2. A **maximum headcount quota** $K$ (e.g., interview at most 3 finalists).

Standard 0/1 Knapsack DP cannot handle multiple simultaneous constraints without adding state dimensions and increasing memory. **Branch and Bound** excels here by exploring the decision tree with state-space pruning.

### 2. Algorithmic Architecture
- **Preprocessing**: Candidates are sorted in descending order of efficiency ratio:
  $$\text{ratio}_i = \frac{v_i}{w_i} \quad (\text{Match Score per Interview Hour})$$
- **State Space Tree Node**:
  $$\text{Node} = \langle \text{level}, \text{current\_score}, \text{current\_cost}, \text{current\_count}, \text{bound}, \text{selected}[\;] \rangle$$
- **Bounding Function (Fractional Knapsack Relaxation)**:
  At any node, an upper bound on the maximum score achievable in the entire subtree is calculated by greedily taking remaining whole candidates and adding the fractional portion of the next candidate up to the capacity and quota limit.
- **Branching (0/1 Decision)**:
  - **Left Branch (Include)**: Only if $\text{cost} + w_{i} \le W$ and $\text{count} + 1 \le K$.
  - **Right Branch (Exclude)**: $\text{cost}$ and $\text{count}$ remain unchanged.
- **Pruning Criterion**:
  If $\text{node.bound} \le \text{best\_feasible\_score}$, the node is **pruned immediately**, eliminating the exponential expansion of that entire subtree!
- **Search Strategy**:
  Least-Cost / Max-Bound Branch and Bound (**LCBB**) using a Max-Heap Priority Queue. The most promising node (highest upper bound) is always expanded first.

---

## 🛠️ Build & Compilation Instructions

### On Windows
Run the automated batch script:
```cmd
backend\dsa_c\build.bat
```
Or compile manually with GCC/MinGW:
```cmd
gcc -Wall -Wextra -O2 -std=c99 backend\dsa_c\knapsack.c -o backend\dsa_c\knapsack.exe -lm
gcc -Wall -Wextra -O2 -std=c99 backend\dsa_c\branch_bound.c -o backend\dsa_c\branch_bound.exe -lm
```

### On macOS / Linux
Run the shell script:
```bash
./backend/dsa_c/build.sh
```
Or using `make`:
```bash
cd backend/dsa_c && make
```

---

## 🔬 Standalone Terminal Demos for Viva

Both programs can be executed in standalone interactive demonstration mode directly from the terminal without launching the web server:

### 1. 0/1 Knapsack Demo
```bash
# On Windows
backend\dsa_c\knapsack.exe --demo

# On macOS / Linux
./backend/dsa_c/knapsack --demo
```
*Displays the full Dynamic Programming table, candidate pool, selected items, total score, and viva notes.*

### 2. Branch and Bound Demo
```bash
# On Windows
backend\dsa_c\branch_bound.exe --demo

# On macOS / Linux
./backend/dsa_c/branch_bound --demo
```
*Displays candidate efficiency ratios ($v_i/w_i$), root upper bound, nodes explored, branches pruned, and optimal multi-constraint solution.*

---

## 🎓 Viva Questions & Key Concepts

1. **Why does 0/1 Knapsack use Dynamic Programming?**
   - The problem exhibits **overlapping subproblems** (the same remaining capacity subproblem is evaluated multiple times) and **optimal substructure** (an optimal subset contains optimal solutions to smaller subproblems). A greedy approach fails for 0/1 Knapsack because items cannot be divided.

2. **Why is 0/1 Knapsack pseudo-polynomial?**
   - The time complexity is $\mathcal{O}(N \cdot W)$. While linear in $W$, $W$ is a numeric value whose representation requires $\log_2(W)$ bits. Thus, the time is exponential in terms of the input length of $W$.

3. **How does Branch and Bound differ from Backtracking?**
   - Backtracking typically uses Depth-First Search (DFS) and prunes only based on constraint feasibility (e.g. N-Queens).
   - Branch and Bound uses a bounding function to calculate an **optimistic bound** (upper bound for maximization) and prunes based on both feasibility **AND** suboptimality ($\text{bound} \le \text{incumbent}$). It often uses Best-First Search (LCBB) via a priority queue.

4. **Why is candidate sorting by ratio ($v_i / w_i$) critical for Branch and Bound?**
   - Sorting ensures that the fractional knapsack relaxation gives the tightest possible upper bound quickly, allowing the algorithm to find strong feasible solutions near the top of the tree and aggressively prune suboptimal branches early.
