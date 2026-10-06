"""
Optimization API Routes
=======================
REST API endpoints for Unit 3 (0/1 Knapsack) and Unit 4 (Branch and Bound)
candidate selection optimizers.
"""

from flask import Blueprint, request, jsonify
from backend.models import db, Candidate, Job, Ranking
from backend.services.optimizer_service import (
    run_knapsack_optimizer,
    run_branch_bound_optimizer,
    derive_interview_cost
)

optimization_bp = Blueprint('optimization', __name__)


def _extract_candidates_from_request(data):
    """
    Helper to extract candidate list from request payload.
    Supports:
      1. Directly passed 'candidates' array: [{id, name, score, cost}, ...]
      2. 'job_id': fetch candidates and existing ranking scores for that job.
      3. 'candidate_ids': fetch specific candidates from database.
    """
    # 1. Direct candidates array
    if 'candidates' in data and isinstance(data['candidates'], list) and len(data['candidates']) > 0:
        return data['candidates']

    # 2. Job ID specified: load from existing rankings or calculate
    job_id = data.get('job_id')
    if job_id:
        rankings = Ranking.query.filter_by(job_id=job_id).order_by(Ranking.rank.asc()).all()
        if rankings:
            extracted = []
            for r in rankings:
                cand = r.candidate
                name = cand.name if cand else f"Candidate {r.candidate_id}"
                exp = cand.experience_years if cand else 0
                extracted.append({
                    'id': r.candidate_id,
                    'name': name,
                    'final_score': r.final_score,
                    'experience_years': exp,
                    'cost': derive_interview_cost({'experience_years': exp})
                })
            return extracted

        # If job has no rankings yet, fetch candidates from database
        candidates = Candidate.query.limit(25).all()
        extracted = []
        for c in candidates:
            # Fallback heuristic score based on candidate profile if unranked
            score = min(100.0, 50.0 + (c.experience_years or 0) * 8 + len(c.skills) * 4)
            extracted.append({
                'id': c.id,
                'name': c.name,
                'final_score': round(score, 1),
                'experience_years': c.experience_years,
                'cost': derive_interview_cost({'experience_years': c.experience_years})
            })
        return extracted

    # 3. Specific candidate IDs specified
    candidate_ids = data.get('candidate_ids')
    if candidate_ids and isinstance(candidate_ids, list):
        candidates = Candidate.query.filter(Candidate.id.in_(candidate_ids)).all()
        extracted = []
        for c in candidates:
            # Check if there is a ranking
            ranking = Ranking.query.filter_by(candidate_id=c.id).first()
            score = ranking.final_score if ranking else min(100.0, 50.0 + (c.experience_years or 0) * 8 + len(c.skills) * 4)
            extracted.append({
                'id': c.id,
                'name': c.name,
                'final_score': round(score, 1),
                'experience_years': c.experience_years,
                'cost': derive_interview_cost({'experience_years': c.experience_years})
            })
        return extracted

    # 4. Fallback: all candidates from database
    candidates = Candidate.query.limit(20).all()
    extracted = []
    for c in candidates:
        ranking = Ranking.query.filter_by(candidate_id=c.id).first()
        score = ranking.final_score if ranking else min(100.0, 50.0 + (c.experience_years or 0) * 8 + len(c.skills) * 4)
        extracted.append({
            'id': c.id,
            'name': c.name,
            'final_score': round(score, 1),
            'experience_years': c.experience_years,
            'cost': derive_interview_cost({'experience_years': c.experience_years})
        })
    return extracted


@optimization_bp.route('/api/optimization/knapsack', methods=['POST'])
def optimize_knapsack():
    """
    POST /api/optimization/knapsack
    ---------------------------------
    Optimize candidate selection using Unit 3: 0/1 Knapsack (Dynamic Programming).

    Request Body:
      - capacity: (int, required) Recruiter available interview resource budget.
      - job_id: (int, optional) Job ID to load ranked candidates for.
      - candidates: (list, optional) Custom candidate list.
      - candidate_ids: (list, optional) Filter by candidate IDs.

    Response:
      - algorithm: Algorithm title and unit.
      - capacity: Input capacity.
      - total_score: Optimal total score achieved.
      - total_cost: Total interview resources consumed.
      - selected_count: Number of candidates selected.
      - selected_candidates: List of chosen candidates.
      - metadata: Complexity and DP recurrence details.
    """
    try:
        data = request.get_json() or {}
        capacity = data.get('capacity')
        if capacity is None:
            return jsonify({'error': 'Parameter "capacity" (available interview resource hours) is required.'}), 400

        try:
            capacity = int(capacity)
            if capacity < 0:
                return jsonify({'error': 'Capacity cannot be negative.'}), 400
        except ValueError:
            return jsonify({'error': 'Capacity must be a valid integer.'}), 400

        candidates = _extract_candidates_from_request(data)
        result = run_knapsack_optimizer(candidates, capacity)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@optimization_bp.route('/api/optimization/branch-bound', methods=['POST'])
def optimize_branch_bound():
    """
    POST /api/optimization/branch-bound
    -------------------------------------
    Optimize candidate selection using Unit 4: Branch and Bound (LCBB).

    Request Body:
      - capacity: (int, required) Recruiter available interview resource budget.
      - max_candidates: (int, optional) Recruiter maximum candidate hiring/interview quota.
      - job_id: (int, optional) Job ID to load ranked candidates for.
      - candidates: (list, optional) Custom candidate list.
      - candidate_ids: (list, optional) Filter by candidate IDs.

    Response:
      - algorithm: Algorithm title and unit.
      - capacity: Input capacity limit.
      - max_candidates: Input headcount quota.
      - total_score: Optimal total score achieved.
      - total_cost: Total interview resources consumed.
      - selected_count: Number of candidates selected.
      - selected_candidates: List of chosen candidates with efficiency ratios.
      - statistics: States explored, branches pruned, initial upper bound.
    """
    try:
        data = request.get_json() or {}
        capacity = data.get('capacity')
        if capacity is None:
            return jsonify({'error': 'Parameter "capacity" (available interview resource hours) is required.'}), 400

        try:
            capacity = int(capacity)
            if capacity < 0:
                return jsonify({'error': 'Capacity cannot be negative.'}), 400
        except ValueError:
            return jsonify({'error': 'Capacity must be a valid integer.'}), 400

        max_candidates = data.get('max_candidates')
        if max_candidates is not None:
            try:
                max_candidates = int(max_candidates)
                if max_candidates < 0:
                    return jsonify({'error': 'max_candidates cannot be negative.'}), 400
            except ValueError:
                return jsonify({'error': 'max_candidates must be a valid integer.'}), 400

        candidates = _extract_candidates_from_request(data)
        result = run_branch_bound_optimizer(candidates, capacity, max_candidates)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
