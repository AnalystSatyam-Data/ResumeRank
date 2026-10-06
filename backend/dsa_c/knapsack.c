/**
 * ============================================================================
 * ResumeRank - Candidate Selection Optimizer (0/1 Knapsack Algorithm)
 * ============================================================================
 * Course: DSA-II College PBL (Progress Report - 2)
 * Unit: UNIT 3 - DYNAMIC PROGRAMMING (0/1 Knapsack)
 *
 * Real Project Application:
 * -------------------------
 * A recruiter has a finite capacity of interview time / screening resources
 * (e.g., 20 hours or resource credits) and a pool of candidates who have been
 * evaluated by the ResumeRank ranking engine.
 *
 * Each candidate has:
 *   - id: Unique candidate identifier
 *   - name: Candidate full name
 *   - score (Value, v_i): Match score from ResumeRank ranking engine (0-100)
 *   - cost  (Weight, w_i): Interview / evaluation resource cost (e.g. 1-10 units)
 *
 * Objective:
 *   Select a subset of candidates S subset {1, ..., N} such that:
 *       Maximize:   SUM_{i in S} score_i
 *       Subject to: SUM_{i in S} cost_i <= Capacity (W)
 *       Constraint: 0/1 decision per candidate (either selected or not)
 *
 * Dynamic Programming Formulation:
 * --------------------------------
 * 1. DP State Definition:
 *    DP[i][w] = Maximum total candidate match score achievable considering
 *               the first i candidates (1 <= i <= N) with total interview
 *               cost not exceeding w (0 <= w <= W).
 *
 * 2. Base Condition:
 *    DP[0][w] = 0.0 for all w in [0, W] (No candidates available)
 *    DP[i][0] = 0.0 for all i in [0, N] (Zero capacity available)
 *
 * 3. Recurrence Relation:
 *    For candidate i with cost[i-1] and score[i-1]:
 *
 *    If cost[i-1] <= w:
 *        DP[i][w] = MAX(
 *            DP[i-1][w],                         // EXCLUDE candidate i
 *            DP[i-1][w - cost[i-1]] + score[i-1] // INCLUDE candidate i
 *        )
 *    Else:
 *        DP[i][w] = DP[i-1][w]                   // Cannot include (exceeds capacity)
 *
 * 4. Solution Reconstruction (Backtracking):
 *    Start at i = N, w = Capacity.
 *    If DP[i][w] != DP[i-1][w]:
 *        Candidate (i-1) was selected!
 *        w = w - cost[i-1]
 *    Decrement i and continue until i == 0 or w == 0.
 *
 * 5. Complexity Analysis:
 *    Time Complexity:  O(N * W) where N = number of candidates, W = capacity.
 *                      Pseudo-polynomial time complexity.
 *    Space Complexity: O(N * W) for the 2D DP table.
 *                      Enables full solution path reconstruction.
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>
#include <ctype.h>

#define MAX_CANDIDATES 500
#define MAX_NAME_LEN 128
#define MAX_INPUT_BUFFER (1024 * 1024) // 1MB buffer for JSON input

/* Candidate representation */
typedef struct {
    int id;
    char name[MAX_NAME_LEN];
    double score; // Value (match/ranking score)
    int cost;     // Weight (interview resource hours/credits)
} Candidate;

/* Result representation */
typedef struct {
    int selected_ids[MAX_CANDIDATES];
    int selected_indices[MAX_CANDIDATES];
    int selected_count;
    double total_score;
    int total_cost;
    int capacity;
    int candidates_count;
} KnapsackResult;

/* Function prototypes */
KnapsackResult solve_knapsack(Candidate *candidates, int n, int capacity, double ***out_dp_table);
void print_json_result(const KnapsackResult *result, const Candidate *candidates);
void run_demo(void);
bool parse_json_input(const char *json_str, Candidate *candidates, int *n, int *capacity);

/**
 * Core 0/1 Knapsack Dynamic Programming Solver
 */
KnapsackResult solve_knapsack(Candidate *candidates, int n, int capacity, double ***out_dp_table) {
    KnapsackResult result;
    memset(&result, 0, sizeof(KnapsackResult));
    result.capacity = capacity;
    result.candidates_count = n;

    if (n <= 0 || capacity <= 0) {
        if (out_dp_table != NULL) *out_dp_table = NULL;
        return result;
    }

    /* Allocate (n + 1) x (capacity + 1) DP table */
    double **dp = (double **)malloc((n + 1) * sizeof(double *));
    if (!dp) {
        fprintf(stderr, "Error: Memory allocation failed for DP table rows.\n");
        exit(1);
    }
    for (int i = 0; i <= n; i++) {
        dp[i] = (double *)calloc(capacity + 1, sizeof(double));
        if (!dp[i]) {
            fprintf(stderr, "Error: Memory allocation failed for DP table cols.\n");
            exit(1);
        }
    }

    /* Base condition: DP[0][w] = 0 and DP[i][0] = 0 (handled by calloc) */

    /* Fill DP table according to recurrence relation */
    for (int i = 1; i <= n; i++) {
        int item_cost = candidates[i - 1].cost;
        double item_score = candidates[i - 1].score;

        for (int w = 0; w <= capacity; w++) {
            if (item_cost <= w) {
                double include_val = dp[i - 1][w - item_cost] + item_score;
                double exclude_val = dp[i - 1][w];
                dp[i][w] = (include_val > exclude_val) ? include_val : exclude_val;
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    /* The maximum value achievable is at DP[n][capacity] */
    result.total_score = dp[n][capacity];

    /* Backtracking: Reconstruct the optimal set of selected candidates */
    int curr_w = capacity;
    int temp_selected[MAX_CANDIDATES];
    int count = 0;

    for (int i = n; i > 0 && curr_w > 0; i--) {
        /* If score differs from previous row, candidate i-1 was included */
        if (fabs(dp[i][curr_w] - dp[i - 1][curr_w]) > 1e-6) {
            temp_selected[count++] = i - 1;
            curr_w -= candidates[i - 1].cost;
            result.total_cost += candidates[i - 1].cost;
        }
    }

    /* Reverse to preserve original candidate index ordering */
    result.selected_count = count;
    for (int i = 0; i < count; i++) {
        int idx = temp_selected[count - 1 - i];
        result.selected_indices[i] = idx;
        result.selected_ids[i] = candidates[idx].id;
    }

    if (out_dp_table != NULL) {
        *out_dp_table = dp;
    } else {
        /* Clean up table if caller didn't request it */
        for (int i = 0; i <= n; i++) free(dp[i]);
        free(dp);
    }

    return result;
}

/**
 * Output formatted JSON result to stdout
 */
void print_json_result(const KnapsackResult *result, const Candidate *candidates) {
    printf("{\n");
    printf("  \"status\": \"success\",\n");
    printf("  \"algorithm\": \"0/1 Knapsack (Dynamic Programming)\",\n");
    printf("  \"unit\": \"Unit 3 - Dynamic Programming\",\n");
    printf("  \"capacity\": %d,\n", result->capacity);
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
        printf("      \"id\": %d,\n", candidates[idx].id);
        printf("      \"name\": \"%s\",\n", candidates[idx].name);
        printf("      \"score\": %.2f,\n", candidates[idx].score);
        printf("      \"cost\": %d\n", candidates[idx].cost);
        printf("    }%s\n", (i == result->selected_count - 1) ? "" : ",");
    }
    printf("  ],\n");

    /* Complexity & Viva Metadata */
    printf("  \"metadata\": {\n");
    printf("    \"time_complexity\": \"O(N * W)\",\n");
    printf("    \"space_complexity\": \"O(N * W)\",\n");
    printf("    \"state_definition\": \"DP[i][w] = Max score using subset of first i candidates within resource limit w\",\n");
    printf("    \"recurrence\": \"DP[i][w] = max(DP[i-1][w], DP[i-1][w - cost[i-1]] + score[i-1])\",\n");
    printf("    \"principle\": \"Principle of Optimality (Optimal Substructure & Overlapping Subproblems)\"\n");
    printf("  }\n");
    printf("}\n");
}

/**
 * Robust lightweight JSON parser for input JSON:
 * {
 *   "capacity": 20,
 *   "candidates": [
 *     {"id": 1, "name": "...", "score": 95.5, "cost": 3},
 *     ...
 *   ]
 * }
 */
bool parse_json_input(const char *json_str, Candidate *candidates, int *n, int *capacity) {
    *n = 0;
    *capacity = 0;

    /* Extract capacity */
    const char *cap_ptr = strstr(json_str, "\"capacity\"");
    if (cap_ptr) {
        const char *colon = strchr(cap_ptr, ':');
        if (colon) {
            *capacity = atoi(colon + 1);
        }
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
        c.id = *n + 1;
        strcpy(c.name, "Candidate");
        c.score = 50.0;
        c.cost = 2; // Default 2 hours

        /* Parse id */
        const char *id_ptr = strstr(obj_start, "\"id\"");
        if (id_ptr && id_ptr < obj_end) {
            const char *colon = strchr(id_ptr, ':');
            if (colon && colon < obj_end) c.id = atoi(colon + 1);
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

        /* Enforce reasonable bounds */
        if (c.cost <= 0) c.cost = 1;

        candidates[*n] = c;
        (*n)++;

        p = obj_end + 1;
    }

    return (*n >= 0 && *capacity >= 0);
}

/**
 * Standalone demo mode for viva presentation
 */
void run_demo(void) {
    printf("======================================================================\n");
    printf(" RESUMERANK - UNIT 3: 0/1 KNAPSACK CANDIDATE SELECTION OPTIMIZER DEMO\n");
    printf("======================================================================\n\n");

    Candidate demo_candidates[] = {
        {1, "Rahul Sharma", 94.5, 4},
        {2, "Priya Patel", 89.0, 3},
        {3, "Amit Verma", 86.2, 5},
        {4, "Sneha Reddy", 91.8, 4},
        {5, "Vikram Malhotra", 78.0, 2},
        {6, "Ananya Iyer", 82.5, 3},
        {7, "Rohan Gupta", 74.0, 2}
    };
    int n = sizeof(demo_candidates) / sizeof(demo_candidates[0]);
    int capacity = 10; // Recruiter has 10 hours of interview capacity

    printf("Scenario: Recruiter has %d interview capacity units (hours).\n", capacity);
    printf("Candidate Pool:\n");
    printf("  ID | Candidate Name         | Match Score (Value) | Interview Cost (Weight)\n");
    printf("  -------------------------------------------------------------------------\n");
    for (int i = 0; i < n; i++) {
        printf("  %-2d | %-22s | %-19.1f | %d hours\n",
               demo_candidates[i].id, demo_candidates[i].name,
               demo_candidates[i].score, demo_candidates[i].cost);
    }
    printf("\nSolving using 0/1 Knapsack Dynamic Programming...\n\n");

    double **dp_table = NULL;
    KnapsackResult result = solve_knapsack(demo_candidates, n, capacity, &dp_table);

    printf("=== Dynamic Programming Table (Sample View) ===\n");
    printf("Row (Candidate) \\ Cap: ");
    for (int w = 0; w <= capacity; w += 2) printf(" W=%-2d ", w);
    printf("\n--------------------------------------------------------------\n");
    for (int i = 0; i <= n; i++) {
        if (i == 0) printf("Base (0 candidates)   : ");
        else printf("Item %d (%-14s): ", i, demo_candidates[i - 1].name);
        for (int w = 0; w <= capacity; w += 2) {
            printf("%5.1f ", dp_table[i][w]);
        }
        printf("\n");
    }

    printf("\n=== Optimization Results ===\n");
    printf("Selected Candidates Count: %d\n", result.selected_count);
    printf("Total Match Score Achieved: %.2f\n", result.total_score);
    printf("Total Interview Cost Used : %d / %d hours (Remaining: %d hours)\n\n",
           result.total_cost, capacity, capacity - result.total_cost);

    printf("Selected Candidates:\n");
    for (int i = 0; i < result.selected_count; i++) {
        int idx = result.selected_indices[i];
        printf("  * ID #%d: %s | Score: %.1f | Cost: %d hours\n",
               demo_candidates[idx].id, demo_candidates[idx].name,
               demo_candidates[idx].score, demo_candidates[idx].cost);
    }

    /* Free DP table */
    for (int i = 0; i <= n; i++) free(dp_table[i]);
    free(dp_table);

    printf("\n=== Viva Notes ===\n");
    printf("- Time Complexity : O(N * W) = O(%d * %d) = %d operations\n", n, capacity, n * capacity);
    printf("- Space Complexity: O(N * W) table for deterministic backtracking\n");
    printf("- Proof of Optimality: Bellman's Principle of Optimality ensures global optimum.\n");
}

int main(int argc, char *argv[]) {
    /* If run with --demo, execute interactive demo for viva presentation */
    if (argc > 1 && strcmp(argv[1], "--demo") == 0) {
        run_demo();
        return 0;
    }

    /* Otherwise, read JSON from standard input */
    static char buffer[MAX_INPUT_BUFFER];
    size_t bytes_read = fread(buffer, 1, sizeof(buffer) - 1, stdin);
    buffer[bytes_read] = '\0';

    Candidate candidates[MAX_CANDIDATES];
    int n = 0;
    int capacity = 0;

    if (bytes_read == 0 || !parse_json_input(buffer, candidates, &n, &capacity)) {
        /* If no valid JSON input on stdin, run demo */
        run_demo();
        return 0;
    }

    double **dp_table = NULL;
    KnapsackResult result = solve_knapsack(candidates, n, capacity, &dp_table);
    print_json_result(&result, candidates);

    if (dp_table) {
        for (int i = 0; i <= n; i++) free(dp_table[i]);
        free(dp_table);
    }

    return 0;
}
