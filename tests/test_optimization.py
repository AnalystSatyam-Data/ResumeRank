"""
Unit and Integration Tests for Unit 3 & Unit 4 DSA Optimizers
=============================================================
Tests for:
1. Unit 3: 0/1 Knapsack (Dynamic Programming)
2. Unit 4: Branch and Bound (Least-Cost / Max-Bound Branch & Bound)
3. Flask API endpoints: /api/optimization/knapsack and /api/optimization/branch-bound
4. Constraint satisfaction, optimality, and edge cases
"""

import pytest
from backend.app import app
from backend.services.optimizer_service import (
    run_knapsack_optimizer,
    run_branch_bound_optimizer,
    derive_interview_cost
)


# ==============================================================================
# UNIT 3: 0/1 KNAPSACK TESTS
# ==============================================================================

class TestKnapsackOptimizer:
    """Test suite for genuine 0/1 Knapsack Dynamic Programming solver."""

    def test_normal_case_known_optimum(self):
        """
        Verify known optimal solution:
        Items:
          A: score 60, cost 2 (ratio 30)
          B: score 100, cost 4 (ratio 25)
          C: score 120, cost 6 (ratio 20)
        Capacity: 6
        Possible combinations:
          A + B: cost 6, score 160  <-- OPTIMAL
          C: cost 6, score 120
        """
        candidates = [
            {'id': 1, 'name': 'Candidate A', 'score': 60.0, 'cost': 2},
            {'id': 2, 'name': 'Candidate B', 'score': 100.0, 'cost': 4},
            {'id': 3, 'name': 'Candidate C', 'score': 120.0, 'cost': 6},
        ]
        result = run_knapsack_optimizer(candidates, capacity=6)

        assert result['status'] == 'success'
        assert result['total_cost'] <= 6
        assert result['total_score'] == 160.0
        assert result['selected_count'] == 2
        selected_ids = {c['id'] for c in result['selected_candidates']}
        assert selected_ids == {1, 2}

    def test_empty_candidate_list(self):
        """Empty candidate pool should return 0 selections and 0 score."""
        result = run_knapsack_optimizer([], capacity=10)
        assert result['status'] == 'success'
        assert result['selected_count'] == 0
        assert result['total_score'] == 0.0
        assert result['total_cost'] == 0
        assert len(result['selected_candidates']) == 0

    def test_capacity_zero(self):
        """Capacity 0 should yield 0 selected candidates."""
        candidates = [{'id': 1, 'name': 'Alice', 'score': 90.0, 'cost': 3}]
        result = run_knapsack_optimizer(candidates, capacity=0)
        assert result['selected_count'] == 0
        assert result['total_score'] == 0.0
        assert result['total_cost'] == 0

    def test_capacity_too_small(self):
        """Capacity smaller than minimum candidate cost yields 0 selected."""
        candidates = [
            {'id': 1, 'name': 'Senior Lead', 'score': 95.0, 'cost': 5},
            {'id': 2, 'name': 'Architect', 'score': 98.0, 'cost': 6},
        ]
        result = run_knapsack_optimizer(candidates, capacity=3)
        assert result['selected_count'] == 0
        assert result['total_score'] == 0.0
        assert result['total_cost'] == 0

    def test_capacity_large_enough_for_all(self):
        """If capacity >= sum(costs), all candidates must be selected."""
        candidates = [
            {'id': 1, 'name': 'Alice', 'score': 85.0, 'cost': 2},
            {'id': 2, 'name': 'Bob', 'score': 90.0, 'cost': 3},
            {'id': 3, 'name': 'Charlie', 'score': 75.0, 'cost': 2},
        ]
        total_possible_score = 85.0 + 90.0 + 75.0
        total_possible_cost = 2 + 3 + 2

        result = run_knapsack_optimizer(candidates, capacity=10)
        assert result['selected_count'] == 3
        assert result['total_score'] == total_possible_score
        assert result['total_cost'] == total_possible_cost

    def test_single_candidate_feasible(self):
        """Single candidate fitting within capacity is selected."""
        candidates = [{'id': 1, 'name': 'Alice', 'score': 88.0, 'cost': 3}]
        result = run_knapsack_optimizer(candidates, capacity=5)
        assert result['selected_count'] == 1
        assert result['total_score'] == 88.0
        assert result['total_cost'] == 3

    def test_single_candidate_infeasible(self):
        """Single candidate exceeding capacity is not selected."""
        candidates = [{'id': 1, 'name': 'Alice', 'score': 88.0, 'cost': 4}]
        result = run_knapsack_optimizer(candidates, capacity=2)
        assert result['selected_count'] == 0
        assert result['total_score'] == 0.0
        assert result['total_cost'] == 0

    def test_capacity_invariant(self):
        """Total resource usage must NEVER exceed capacity."""
        candidates = [
            {'id': i, 'name': f'Candidate {i}', 'score': 50.0 + i * 5, 'cost': 2 + (i % 3)}
            for i in range(1, 15)
        ]
        for cap in [5, 10, 15, 20]:
            res = run_knapsack_optimizer(candidates, capacity=cap)
            assert res['total_cost'] <= cap

    def test_invalid_negative_capacity(self):
        """Negative capacity should raise ValueError."""
        with pytest.raises(ValueError):
            run_knapsack_optimizer([{'id': 1, 'name': 'A', 'score': 80, 'cost': 2}], capacity=-5)


# ==============================================================================
# UNIT 4: BRANCH AND BOUND TESTS
# ==============================================================================

class TestBranchBoundOptimizer:
    """Test suite for genuine Branch and Bound (LCBB) multi-constraint solver."""

    def test_normal_case_multi_constraint(self):
        """
        Test multi-constraint selection:
        Candidates:
          1: score 90, cost 3 (ratio 30.0)
          2: score 85, cost 3 (ratio 28.3)
          3: score 80, cost 2 (ratio 40.0)
          4: score 70, cost 2 (ratio 35.0)
        Capacity: 7
        Max candidates: 2
        All pairs within cost <= 7:
          3 + 4: cost 4, score 150
          1 + 3: cost 5, score 170  <-- OPTIMAL 2-candidate selection!
          1 + 4: cost 5, score 160
          1 + 2: cost 6, score 175  <-- cost 6 <= 7, count 2! Score 175 is optimal!
        """
        candidates = [
            {'id': 1, 'name': 'Cand 1', 'score': 90.0, 'cost': 3},
            {'id': 2, 'name': 'Cand 2', 'score': 85.0, 'cost': 3},
            {'id': 3, 'name': 'Cand 3', 'score': 80.0, 'cost': 2},
            {'id': 4, 'name': 'Cand 4', 'score': 70.0, 'cost': 2},
        ]
        result = run_branch_bound_optimizer(candidates, capacity=7, max_candidates=2)

        assert result['status'] == 'success'
        assert result['total_cost'] <= 7
        assert result['selected_count'] <= 2
        assert result['total_score'] == 175.0  # Cand 1 (90) + Cand 2 (85) = 175, cost = 6 <= 7
        assert result['selected_count'] == 2

    def test_quota_strictly_enforced(self):
        """Ensure max_candidates headcount quota is strictly respected."""
        candidates = [
            {'id': i, 'name': f'Cand {i}', 'score': 80.0 + i, 'cost': 2}
            for i in range(1, 8)
        ]
        # Capacity is 20 (enough for all 7), but quota is 3
        result = run_branch_bound_optimizer(candidates, capacity=20, max_candidates=3)
        assert result['selected_count'] == 3
        assert result['total_cost'] <= 20

    def test_pruning_and_statistics(self):
        """Branch and Bound must record states explored, branches pruned, and root bound."""
        candidates = [
            {'id': 1, 'name': 'A', 'score': 95.0, 'cost': 4},
            {'id': 2, 'name': 'B', 'score': 90.0, 'cost': 3},
            {'id': 3, 'name': 'C', 'score': 85.0, 'cost': 3},
            {'id': 4, 'name': 'D', 'score': 80.0, 'cost': 2},
            {'id': 5, 'name': 'E', 'score': 75.0, 'cost': 2},
            {'id': 6, 'name': 'F', 'score': 70.0, 'cost': 2},
        ]
        result = run_branch_bound_optimizer(candidates, capacity=8, max_candidates=3)
        stats = result['statistics']

        assert stats['states_explored'] > 0
        assert stats['branches_pruned'] >= 0
        assert stats['initial_upper_bound'] >= result['total_score']
        assert result['total_cost'] <= 8
        assert result['selected_count'] <= 3

    def test_empty_candidates_branch_bound(self):
        """Empty candidate pool returns 0 selections."""
        result = run_branch_bound_optimizer([], capacity=10, max_candidates=3)
        assert result['selected_count'] == 0
        assert result['total_score'] == 0.0

    def test_zero_capacity_branch_bound(self):
        """Zero capacity returns 0 selections."""
        candidates = [{'id': 1, 'name': 'Alice', 'score': 90.0, 'cost': 3}]
        result = run_branch_bound_optimizer(candidates, capacity=0, max_candidates=2)
        assert result['selected_count'] == 0
        assert result['total_score'] == 0.0

    def test_single_candidate_branch_bound(self):
        """Single candidate respects both capacity and quota."""
        candidates = [{'id': 1, 'name': 'Alice', 'score': 90.0, 'cost': 3}]

        # Feasible
        res_ok = run_branch_bound_optimizer(candidates, capacity=5, max_candidates=1)
        assert res_ok['selected_count'] == 1
        assert res_ok['total_score'] == 90.0

        # Infeasible due to quota
        res_no_quota = run_branch_bound_optimizer(candidates, capacity=5, max_candidates=0)
        assert res_no_quota['selected_count'] == 0

        # Infeasible due to capacity
        res_no_cap = run_branch_bound_optimizer(candidates, capacity=2, max_candidates=1)
        assert res_no_cap['selected_count'] == 0


# ==============================================================================
# REST API ENDPOINT INTEGRATION TESTS
# ==============================================================================

@pytest.fixture
def api_client():
    app.config["TESTING"] = True
    with app.app_context():
        from backend.models import Candidate
        from backend.seed import seed_database
        if Candidate.query.count() == 0:
            seed_database(force=True)
    with app.test_client() as client:
        yield client


class TestOptimizationAPI:
    """Test suite for REST API endpoints."""

    def test_knapsack_api_custom_candidates(self, api_client):
        payload = {
            'capacity': 10,
            'candidates': [
                {'id': 1, 'name': 'Candidate 1', 'score': 90.0, 'cost': 4},
                {'id': 2, 'name': 'Candidate 2', 'score': 85.0, 'cost': 3},
                {'id': 3, 'name': 'Candidate 3', 'score': 70.0, 'cost': 2},
            ]
        }
        res = api_client.post('/api/optimization/knapsack', json=payload)
        assert res.status_code == 200
        data = res.get_json()
        assert data['status'] == 'success'
        assert data['algorithm'] == '0/1 Knapsack (Dynamic Programming)'
        assert data['capacity'] == 10
        assert data['total_cost'] <= 10
        assert data['selected_count'] == 3
        assert data['total_score'] == 245.0

    def test_knapsack_api_from_database(self, api_client):
        """Test Knapsack API loading candidates automatically from DB."""
        payload = {'capacity': 15}
        res = api_client.post('/api/optimization/knapsack', json=payload)
        assert res.status_code == 200
        data = res.get_json()
        assert data['status'] == 'success'
        assert data['total_cost'] <= 15
        assert len(data['selected_candidates']) > 0

    def test_branch_bound_api_custom_candidates(self, api_client):
        payload = {
            'capacity': 10,
            'max_candidates': 2,
            'candidates': [
                {'id': 1, 'name': 'Candidate 1', 'score': 90.0, 'cost': 4},
                {'id': 2, 'name': 'Candidate 2', 'score': 85.0, 'cost': 3},
                {'id': 3, 'name': 'Candidate 3', 'score': 70.0, 'cost': 2},
            ]
        }
        res = api_client.post('/api/optimization/branch-bound', json=payload)
        assert res.status_code == 200
        data = res.get_json()
        assert data['status'] == 'success'
        assert 'Branch and Bound' in data['algorithm']
        assert data['selected_count'] <= 2
        assert data['total_cost'] <= 10
        assert 'statistics' in data
        assert 'states_explored' in data['statistics']
        assert 'branches_pruned' in data['statistics']

    def test_knapsack_api_missing_capacity(self, api_client):
        """Missing capacity parameter must return 400."""
        res = api_client.post('/api/optimization/knapsack', json={})
        assert res.status_code == 400
        assert 'capacity' in res.get_json()['error'].lower()

    def test_knapsack_api_negative_capacity(self, api_client):
        """Negative capacity parameter must return 400."""
        res = api_client.post('/api/optimization/knapsack', json={'capacity': -10})
        assert res.status_code == 400

    def test_branch_bound_api_negative_max_candidates(self, api_client):
        """Negative max_candidates parameter must return 400."""
        res = api_client.post('/api/optimization/branch-bound', json={'capacity': 10, 'max_candidates': -2})
        assert res.status_code == 400
