/**
 * ============================================================================
 * ResumeRank - Multi-Constraint Candidate Selection (Branch & Bound)
 * ============================================================================
 * Course: DSA-II College PBL (Progress Report - 2)
 * Unit: UNIT 4 - BACKTRACKING AND BRANCH AND BOUND (Branch and Bound)
 *
 * Real Project Application:
 * -------------------------
 * While standard 0/1 Knapsack solves single-resource allocation, practical
 * recruitment campaigns face MULTIPLE SIMULTANEOUS CONSTRAINTS:
 *   1. Resource Capacity Constraint (e.g. maximum available interview hours W)
 *   2. Headcount / Interview Quota Constraint (e.g. at most K candidates)
 *
 * The Branch and Bound algorithm systematically explores the state space tree
 * of candidate inclusion/exclusion decisions, calculates a rigorous upper bound
 * at each node via fractional relaxation, and aggressively PRUNES subtrees
 * that cannot mathematically surpass the incumbent best feasible solution.
 *
 * Branch and Bound Architecture:
 * ------------------------------
 * 1. State Representation (Node):
 *    - level: Current candidate index in ratio-sorted order (0 .. N-1)
 *    - current_score: Cumulative score of candidates selected along path
 *    - current_cost: Cumulative interview hours used along path
 *    - current_count: Number of candidates selected along path
 *    - bound: Theoretical upper bound on score achievable from this subtree
 *    - selected: Boolean vector of decisions for candidates 0..level
 *
 * 2. Preprocessing:
 *    Sort all candidates in descending order of efficiency ratio:
 *        ratio_i = score_i / cost_i
 *    This ensures tightest possible bounds during fractional relaxation.
 *
 * 3. Upper Bound Calculation:
 *    Given partial state at level i:
 *    a. If current_cost > W or current_count > K: Bound = 0 (Infeasible)
 *    b. Greedily accumulate whole candidates j = i+1, i+2, ... as long as:
 *       total_cost + cost_j <= W AND total_count + 1 <= K
 *    c. If remaining capacity > 0 and total_count < K, take the fractional
 *       portion of the next candidate (linear relaxation).
 *    d. Bound = accumulated score + fractional score.
 *
 * 4. Branching (0/1 Decisions):
 *    For candidate at next_level:
 *    - Left Branch: INCLUDE candidate (if cost and count constraints permit)
 *    - Right Branch: EXCLUDE candidate
 *
 * 5. Bounding and Pruning:
 *    If node.bound <= best_score:
 *        PRUNE this node and all descendants! (Bounding condition)
 *    Else:
 *        Insert into Priority Queue / State Pool.
 *
 * 6. Exploration Strategy:
 *    Least-Cost / Max-Bound Branch and Bound (LCBB):
 *    Uses a Priority Queue (Max-Heap) ordered by upper bound.
 *    Always expands the globally most promising state first.
 *
 * 7. Complexity Analysis:
 *    Worst-Case Time:  O(2^N) state space tree exploration.
 *    Average Time:     Exponentially reduced due to aggressive pruning.
 *    Space Complexity: O(2^N) for priority queue in worst case,
 *                      typically bounded to O(N * K) in practice.
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>

#define MAX_CANDIDATES 500
#define MAX_NAME_LEN 128
#define MAX_HEAP_SIZE 65536
#define MAX_INPUT_BUFFER (1024 * 1024)

/* Candidate representation */
typedef struct {
    int original_id;
    char name[MAX_NAME_LEN];
    double score; // Value
    int cost;     // Weight
    double ratio; // score / cost
} Candidate;

/* Search tree node representation */
typedef struct {
    int level;                      // Index in sorted candidate array
    double current_score;           // Accumulated score
    int current_cost;               // Accumulated cost
    int current_count;              // Number of candidates selected
    double bound;                   // Upper bound for subtree
    bool selected[MAX_CANDIDATES];  // Selection bitmask
} StateNode;

/* Max-Heap for LCBB (Least-Cost / Max-Bound Priority Queue) */
typedef struct {
    StateNode items[MAX_HEAP_SIZE];
    int size;
} PriorityQueue;

/* Branch & Bound Result */
typedef struct {
    int selected_ids[MAX_CANDIDATES];
    int selected_indices[MAX_CANDIDATES];
    int selected_count;
    double total_score;
    int total_cost;
    int capacity;
    int max_candidates;
    int candidates_count;
    long long states_explored;
    long long branches_pruned;
    double initial_upper_bound;
} BranchBoundResult;

/* Priority Queue Operations */
static void pq_init(PriorityQueue *pq) {
    pq->size = 0;
}

static void pq_push(PriorityQueue *pq, StateNode node) {
    if (pq->size >= MAX_HEAP_SIZE - 1) return; // Capacity protection
    int i = pq->size++;
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (pq->items[parent].bound >= node.bound) break;
        pq->items[i] = pq->items[parent];
        i = parent;
    }
    pq->items[i] = node;
}

static StateNode pq_pop(PriorityQueue *pq) {
    StateNode top = pq->items[0];
    StateNode last = pq->items[--pq->size];
    if (pq->size > 0) {
        int i = 0;
        while (i * 2 + 1 < pq->size) {
            int left = i * 2 + 1;
            int right = i * 2 + 2;
            int best = (right < pq->size && pq->items[right].bound > pq->items[left].bound) ? right : left;
            if (last.bound >= pq->items[best].bound) break;
            pq->items[i] = pq->items[best];
            i = best;
        }
        pq->items[i] = last;
    }
    return top;
}

static bool pq_empty(const PriorityQueue *pq) {
    return pq->size == 0;
}

/* Comparison function for sorting candidates by ratio descending */
static int compare_candidates(const void *a, const void *b) {
    const Candidate *ca = (const Candidate *)a;
    const Candidate *cb = (const Candidate *)b;
    if (cb->ratio > ca->ratio) return 1;
    if (cb->ratio < ca->ratio) return -1;
    return (cb->score > ca->score) ? 1 : -1;
}

/**
 * Calculate Upper Bound via Combined Fractional Relaxation and Headcount Quota
 */
static double calculate_bound(const StateNode *node, const Candidate *candidates, int n, int capacity, int max_candidates) {
    if (node->current_cost > capacity || node->current_count > max_candidates) {
        return 0.0; // Infeasible state
    }

    int rem_capacity = capacity - node->current_cost;
    int rem_count = max_candidates - node->current_count;

    if (rem_capacity <= 0 || rem_count <= 0 || node->level >= n - 1) {
        return node->current_score;
    }

    /* 1. Fractional Knapsack Bound on remaining capacity */
    double cap_bound = 0.0;
    int total_cost = 0;
    for (int j = node->level + 1; j < n; j++) {
        if (total_cost + candidates[j].cost <= rem_capacity) {
            total_cost += candidates[j].cost;
            cap_bound += candidates[j].score;
        } else {
            int left = rem_capacity - total_cost;
            if (left > 0) {
                cap_bound += candidates[j].score * ((double)left / candidates[j].cost);
            }
            break;
        }
    }

    /* 2. Top-K Bound on remaining candidates by score */
    double remaining_scores[MAX_CANDIDATES];
    int num_remaining = 0;
    for (int j = node->level + 1; j < n; j++) {
        remaining_scores[num_remaining++] = candidates[j].score;
    }

    for (int i = 0; i < num_remaining - 1; i++) {
        for (int j = i + 1; j < num_remaining; j++) {
            if (remaining_scores[j] > remaining_scores[i]) {
                double tmp = remaining_scores[i];
                remaining_scores[i] = remaining_scores[j];
                remaining_scores[j] = tmp;
            }
        }
    }

    double count_bound = 0.0;
    int take = (rem_count < num_remaining) ? rem_count : num_remaining;
    for (int i = 0; i < take; i++) {
        count_bound += remaining_scores[i];
    }

    /* Admissible upper bound is the minimum of capacity and headcount relaxations */
    double rem_bound = (cap_bound < count_bound) ? cap_bound : count_bound;
    return node->current_score + rem_bound;
}

/**
 * Core Branch and Bound Candidate Selection Solver
 */
BranchBoundResult solve_branch_bound(Candidate *candidates, int n, int capacity, int max_candidates) {
    BranchBoundResult result;
    memset(&result, 0, sizeof(BranchBoundResult));
    result.capacity = capacity;
    result.max_candidates = (max_candidates >= 0) ? max_candidates : n;
    result.candidates_count = n;

    if (n <= 0 || capacity <= 0 || result.max_candidates <= 0) {
        return result;
    }

    /* 1. Preprocess: compute ratios and sort candidates descending by ratio */
    for (int i = 0; i < n; i++) {
        candidates[i].ratio = candidates[i].score / (double)(candidates[i].cost > 0 ? candidates[i].cost : 1);
    }
    qsort(candidates, n, sizeof(Candidate), compare_candidates);

    /* 2. Initialize Priority Queue for LCBB */
    PriorityQueue *pq = (PriorityQueue *)malloc(sizeof(PriorityQueue));
    if (!pq) {
        fprintf(stderr, "Error: Memory allocation failed for Priority Queue.\n");
        exit(1);
    }
    pq_init(pq);

    /* 3. Create Root Node */
    StateNode root;
    memset(&root, 0, sizeof(StateNode));
    root.level = -1;
    root.current_score = 0.0;
    root.current_cost = 0;
    root.current_count = 0;
    root.bound = calculate_bound(&root, candidates, n, capacity, result.max_candidates);
    result.initial_upper_bound = root.bound;

    pq_push(pq, root);

    double best_score = 0.0;
    StateNode best_node = root;

    /* 4. Branch & Bound Search Loop */
    while (!pq_empty(pq)) {
        StateNode current = pq_pop(pq);
        result.states_explored++;

        /* PRUNING: Bound cannot beat current best feasible solution */
        if (current.bound <= best_score) {
            result.branches_pruned++;
            continue;
        }

        /* Check if current feasible state improves best solution */
        if (current.current_score > best_score) {
            best_score = current.current_score;
            best_node = current;
        }

        /* If leaf node, no further branching possible */
        if (current.level >= n - 1) continue;

        int next_level = current.level + 1;

        /* -------------------------------------------------------------
         * BRANCH 1: INCLUDE candidate[next_level]
         * ------------------------------------------------------------- */
        int include_cost = current.current_cost + candidates[next_level].cost;
        int include_count = current.current_count + 1;

        if (include_cost <= capacity && include_count <= result.max_candidates) {
            StateNode left;
            left.level = next_level;
            left.current_cost = include_cost;
            left.current_count = include_count;
            left.current_score = current.current_score + candidates[next_level].score;
            memcpy(left.selected, current.selected, sizeof(current.selected));
            left.selected[next_level] = true;
            left.bound = calculate_bound(&left, candidates, n, capacity, result.max_candidates);

            if (left.current_score > best_score) {
                best_score = left.current_score;
                best_node = left;
            }

            if (left.bound > best_score) {
                pq_push(pq, left);
            } else {
                result.branches_pruned++; // Pruned by bounding
            }
        } else {
            result.branches_pruned++; // Pruned by constraint violation
        }

        /* -------------------------------------------------------------
         * BRANCH 2: EXCLUDE candidate[next_level]
         * ------------------------------------------------------------- */
        StateNode right;
        right.level = next_level;
        right.current_cost = current.current_cost;
        right.current_count = current.current_count;
        right.current_score = current.current_score;
        memcpy(right.selected, current.selected, sizeof(current.selected));
        right.selected[next_level] = false;
        right.bound = calculate_bound(&right, candidates, n, capacity, result.max_candidates);

        if (right.bound > best_score) {
            pq_push(pq, right);
        } else {
            result.branches_pruned++; // Pruned by bounding
        }
    }

    free(pq);

    /* 5. Compile Best Solution */
    result.total_score = best_node.current_score;
    result.total_cost = best_node.current_cost;
    result.selected_count = 0;

    for (int i = 0; i < n; i++) {
        if (best_node.selected[i]) {
            result.selected_indices[result.selected_count] = i;
            result.selected_ids[result.selected_count] = candidates[i].original_id;
            result.selected_count++;
        }
    }

    return result;
}

/**
 * Output formatted JSON result to stdout
 */
void print_json_result(const BranchBoundResult *result, const Candidate *candidates) {
    printf("{\n");
    printf("  \"status\": \"success\",\n");
    printf("  \"algorithm\": \"Branch and Bound (LCBB / Best-First Search)\",\n");
    printf("  \"unit\": \"Unit 4 - Backtracking and Branch & Bound\",\n");
    printf("  \"capacity\": %d,\n", result->capacity);
    printf("  \"max_candidates\": %d,\n", result->max_candidates);
    printf("  \"total_score\": %.2f,\n", result->total_score);
    printf("  \"total_cost\": %d,\n", result->total_cost);
    printf("  \"remaining_capacity\": %d,\n", result->capacity - result->total_cost);
    printf("  \"selected_count\": %d,\n", result->selected_count);
    printf("  \"candidates_evaluated\": %d,\n", result->candidates_count);

    /* Selected Candidates List */
    printf("  \"selected_candidates\": [\n");
    for (int i = 0; i < result->selected_count; i++) {
        int idx = result->selected_indices[i];
        printf("    {\n");
        printf("      \"id\": %d,\n", candidates[idx].original_id);
        printf("      \"name\": \"%s\",\n", candidates[idx].name);
        printf("      \"score\": %.2f,\n", candidates[idx].score);
        printf("      \"cost\": %d,\n", candidates[idx].cost);
        printf("      \"ratio\": %.2f\n", candidates[idx].ratio);
        printf("    }%s\n", (i == result->selected_count - 1) ? "" : ",");
    }
    printf("  ],\n");

    /* Branch & Bound Execution Statistics */
    printf("  \"statistics\": {\n");
    printf("    \"states_explored\": %lld,\n", result->states_explored);
    printf("    \"branches_pruned\": %lld,\n", result->branches_pruned);
    printf("    \"initial_upper_bound\": %.2f,\n", result->initial_upper_bound);
    printf("    \"best_solution_score\": %.2f,\n", result->total_score);
    printf("    \"time_complexity\": \"O(2^N) worst-case, reduced via pruning\",\n");
    printf("    \"space_complexity\": \"O(2^N) priority queue / O(N) path\",\n");
    printf("    \"bounding_function\": \"Greedy Fractional Relaxation with Capacity and Count Limits\",\n");
    printf("    \"search_strategy\": \"Least-Cost / Max-Bound Branch and Bound (LCBB)\"\n");
    printf("  }\n");
    printf("}\n");
}

/**
 * Lightweight JSON parser for Branch & Bound input:
 * {
 *   "capacity": 20,
 *   "max_candidates": 3,
 *   "candidates": [ ... ]
 * }
 */
bool parse_json_input(const char *json_str, Candidate *candidates, int *n, int *capacity, int *max_candidates) {
    *n = 0;
    *capacity = 0;
    *max_candidates = -1;

    /* Extract capacity */
    const char *cap_ptr = strstr(json_str, "\"capacity\"");
    if (cap_ptr) {
        const char *colon = strchr(cap_ptr, ':');
        if (colon) *capacity = atoi(colon + 1);
    }

    /* Extract max_candidates */
    const char *max_ptr = strstr(json_str, "\"max_candidates\"");
    if (max_ptr) {
        const char *colon = strchr(max_ptr, ':');
        if (colon) *max_candidates = atoi(colon + 1);
    }

    /* Extract candidates array */
    const char *cands_ptr = strstr(json_str, "\"candidates\"");
    if (!cands_ptr) return false;

    const char *array_start = strchr(cands_ptr, '[');
    if (!array_start) return false;

    const char *p = array_start;
    while (*p && *n < MAX_CANDIDATES) {
        const char *obj_start = strchr(p, '{');
        if (!obj_start) break;
        const char *obj_end = strchr(obj_start, '}');
        if (!obj_end) break;

        Candidate c;
        memset(&c, 0, sizeof(Candidate));
        c.original_id = *n + 1;
        strcpy(c.name, "Candidate");
        c.score = 50.0;
        c.cost = 2;

        /* Parse id */
        const char *id_ptr = strstr(obj_start, "\"id\"");
        if (id_ptr && id_ptr < obj_end) {
            const char *colon = strchr(id_ptr, ':');
            if (colon && colon < obj_end) c.original_id = atoi(colon + 1);
        }

        /* Parse name */
        const char *name_ptr = strstr(obj_start, "\"name\"");
        if (name_ptr && name_ptr < obj_end) {
            const char *first_quote = strchr(name_ptr + 6, '\"');
            if (first_quote && first_quote < obj_end) {
                const char *second_quote = strchr(first_quote + 1, '\"');
                if (second_quote && second_quote <= obj_end) {
                    int len = (int)(second_quote - first_quote - 1);
                    if (len >= MAX_NAME_LEN) len = MAX_NAME_LEN - 1;
                    strncpy(c.name, first_quote + 1, len);
                    c.name[len] = '\0';
                }
            }
        }

        /* Parse score */
        const char *score_ptr = strstr(obj_start, "\"score\"");
        if (!score_ptr || score_ptr > obj_end) score_ptr = strstr(obj_start, "\"final_score\"");
        if (score_ptr && score_ptr < obj_end) {
            const char *colon = strchr(score_ptr, ':');
            if (colon && colon < obj_end) c.score = atof(colon + 1);
        }

        /* Parse cost */
        const char *cost_ptr = strstr(obj_start, "\"cost\"");
        if (!cost_ptr || cost_ptr > obj_end) cost_ptr = strstr(obj_start, "\"resource_cost\"");
        if (!cost_ptr || cost_ptr > obj_end) cost_ptr = strstr(obj_start, "\"interview_cost\"");
        if (cost_ptr && cost_ptr < obj_end) {
            const char *colon = strchr(cost_ptr, ':');
            if (colon && colon < obj_end) c.cost = atoi(colon + 1);
        }

        if (c.cost <= 0) c.cost = 1;

        candidates[*n] = c;
        (*n)++;

        p = obj_end + 1;
    }

    if (*max_candidates < 0) *max_candidates = *n;
    return (*n >= 0 && *capacity >= 0);
}

/**
 * Standalone demo mode for viva presentation
 */
void run_demo(void) {
    printf("======================================================================\n");
    printf(" RESUMERANK - UNIT 4: BRANCH & BOUND CANDIDATE SELECTION OPTIMIZER\n");
    printf("======================================================================\n\n");

    Candidate demo_candidates[] = {
        {1, "Rahul Sharma", 94.5, 4, 0},
        {2, "Priya Patel", 89.0, 3, 0},
        {3, "Amit Verma", 86.2, 5, 0},
        {4, "Sneha Reddy", 91.8, 4, 0},
        {5, "Vikram Malhotra", 78.0, 2, 0},
        {6, "Ananya Iyer", 82.5, 3, 0},
        {7, "Rohan Gupta", 74.0, 2, 0}
    };
    int n = sizeof(demo_candidates) / sizeof(demo_candidates[0]);
    int capacity = 10;     // Recruiter has 10 hours capacity
    int max_candidates = 3; // Recruiter can hire at most 3 candidates

    printf("Recruiter Constraints:\n");
    printf("  - Available Interview Resource Capacity : %d hours\n", capacity);
    printf("  - Maximum Candidates to Select (Quota)  : %d candidates\n\n", max_candidates);

    printf("Initial Candidate Pool & Efficiency Ratios (Score / Cost):\n");
    printf("  ID | Candidate Name         | Score | Cost | Ratio (Efficiency)\n");
    printf("  --------------------------------------------------------------\n");
    for (int i = 0; i < n; i++) {
        demo_candidates[i].ratio = demo_candidates[i].score / (double)demo_candidates[i].cost;
        printf("  %-2d | %-22s | %5.1f | %-4d | %5.2f pts/hr\n",
               demo_candidates[i].original_id, demo_candidates[i].name,
               demo_candidates[i].score, demo_candidates[i].cost, demo_candidates[i].ratio);
    }

    printf("\nExecuting Least-Cost / Max-Bound Branch & Bound (LCBB)...\n\n");

    BranchBoundResult result = solve_branch_bound(demo_candidates, n, capacity, max_candidates);

    printf("=== Branch and Bound Search Metrics ===\n");
    printf("Initial Root Upper Bound : %.2f\n", result.initial_upper_bound);
    printf("States (Nodes) Explored  : %lld\n", result.states_explored);
    printf("Branches Pruned          : %lld (Bypassed suboptimal subtrees)\n", result.branches_pruned);
    printf("Total Score Achieved     : %.2f\n", result.total_score);
    printf("Total Resource Cost Used : %d / %d hours\n", result.total_cost, capacity);
    printf("Candidates Selected      : %d / %d quota\n\n", result.selected_count, max_candidates);

    printf("Selected Candidates (Optimal Subset under Multi-Constraints):\n");
    for (int i = 0; i < result.selected_count; i++) {
        int idx = result.selected_indices[i];
        printf("  * ID #%d: %s | Score: %.1f | Cost: %d hrs | Ratio: %.2f\n",
               demo_candidates[idx].original_id, demo_candidates[idx].name,
               demo_candidates[idx].score, demo_candidates[idx].cost, demo_candidates[idx].ratio);
    }

    printf("\n=== Viva Notes ===\n");
    printf("- Branching Strategy : 0/1 Decision on each candidate (Include / Exclude)\n");
    printf("- Bounding Function  : Fractional Knapsack Relaxation with both Capacity & Count constraints\n");
    printf("- Pruning Condition  : Subtree pruned if node.bound <= current_best_score\n");
    printf("- Search Strategy    : Best-First Search via Max-Heap Priority Queue (LCBB)\n");
}

int main(int argc, char *argv[]) {
    if (argc > 1 && strcmp(argv[1], "--demo") == 0) {
        run_demo();
        return 0;
    }

    static char buffer[MAX_INPUT_BUFFER];
    size_t bytes_read = fread(buffer, 1, sizeof(buffer) - 1, stdin);
    buffer[bytes_read] = '\0';

    Candidate candidates[MAX_CANDIDATES];
    int n = 0;
    int capacity = 0;
    int max_candidates = 0;

    if (bytes_read == 0 || !parse_json_input(buffer, candidates, &n, &capacity, &max_candidates)) {
        run_demo();
        return 0;
    }

    BranchBoundResult result = solve_branch_bound(candidates, n, capacity, max_candidates);
    print_json_result(&result, candidates);

    return 0;
}
