"""
Ranking Engine Service
=======================
Calculates candidate scores against job requirements using weighted scoring.
Uses custom DSA implementations for sorting and retrieval.
"""
import json
from backend.dsa import MergeSort, MaxHeap


def calculate_scores(candidate, job, required_skills, preferred_skills):
    """
    Calculate all score components for a candidate against a job.

    Returns:
        Dictionary with all score components and final score
    """
    candidate_skills = [s['name'].lower() for s in candidate.get('skills', [])]
    req_skills = [s['name'].lower() for s in required_skills]
    pref_skills = [s['name'].lower() for s in preferred_skills]
    all_job_skills = req_skills + pref_skills

    # 1. Skill Score (0-100)
    matching_skills = []
    missing_skills = []

    for skill_dict in required_skills:
        if skill_dict['name'].lower() in candidate_skills:
            matching_skills.append(skill_dict['name'])
        else:
            missing_skills.append(skill_dict['name'])

    for skill_dict in preferred_skills:
        if skill_dict['name'].lower() in candidate_skills:
            matching_skills.append(skill_dict['name'])

    total_skills = len(all_job_skills)
    if total_skills > 0:
        # Required skills count more (weighted)
        required_matches = sum(1 for s in req_skills if s in candidate_skills)
        preferred_matches = sum(1 for s in pref_skills if s in candidate_skills)

        required_weight = 0.7 if pref_skills else 1.0
        preferred_weight = 0.3 if pref_skills else 0.0

        if req_skills:
            req_ratio = required_matches / len(req_skills)
        else:
            req_ratio = 1.0

        if pref_skills:
            pref_ratio = preferred_matches / len(pref_skills)
        else:
            pref_ratio = 0

        skill_score = (req_ratio * required_weight + pref_ratio * preferred_weight) * 100
    else:
        skill_score = 50  # No skills specified, neutral score

    # 2. Experience Score (0-100)
    min_exp = job.get('minimum_experience', 0)
    cand_exp = candidate.get('experience_years', 0)

    if min_exp == 0:
        experience_score = 100 if cand_exp > 0 else 70
    elif cand_exp >= min_exp:
        # Exceeding requirement gives bonus up to 100
        ratio = cand_exp / min_exp
        experience_score = min(100, 80 + (ratio - 1) * 20)
    else:
        # Below requirement
        experience_score = max(0, (cand_exp / min_exp) * 80)

    # 3. Education Score (0-100)
    education_score = _calculate_education_score(
        candidate.get('education', ''),
        job.get('education_requirement', '')
    )

    # 4. Project Score (0-100)
    projects = candidate.get('projects', [])
    if not projects:
        project_score = 30
    else:
        relevant_count = 0
        for proj in projects:
            proj_text = (proj.get('name', '') + ' ' +
                        proj.get('description', '') + ' ' +
                        proj.get('technologies', '')).lower()
            for skill_name in all_job_skills:
                if skill_name in proj_text:
                    relevant_count += 1
                    break

        if len(projects) > 0:
            relevance_ratio = relevant_count / len(projects)
        else:
            relevance_ratio = 0

        project_score = min(100, 30 + len(projects) * 10 + relevance_ratio * 40)

    # 5. Certification Score (0-100)
    certifications = candidate.get('certifications', [])
    if not certifications:
        certification_score = 20
    else:
        relevant_certs = 0
        for cert in certifications:
            cert_text = (cert.get('name', '') + ' ' + (cert.get('issuer', '') or '')).lower()
            for skill_name in all_job_skills:
                if skill_name in cert_text:
                    relevant_certs += 1
                    break

        certification_score = min(100, 20 + len(certifications) * 15 + relevant_certs * 20)

    # 6. Final Score (weighted)
    skill_w = job.get('skill_weight', 0.50)
    exp_w = job.get('experience_weight', 0.20)
    edu_w = job.get('education_weight', 0.15)
    proj_w = job.get('project_weight', 0.10)
    cert_w = job.get('certification_weight', 0.05)

    final_score = (
        skill_score * skill_w +
        experience_score * exp_w +
        education_score * edu_w +
        project_score * proj_w +
        certification_score * cert_w
    )

    # Round scores
    result = {
        'skill_score': round(skill_score, 1),
        'experience_score': round(experience_score, 1),
        'education_score': round(education_score, 1),
        'project_score': round(project_score, 1),
        'certification_score': round(certification_score, 1),
        'final_score': round(final_score, 1),
        'matching_skills': matching_skills,
        'missing_skills': missing_skills,
        'explanation': _generate_explanation(
            candidate, job, skill_score, experience_score,
            education_score, project_score, certification_score,
            final_score, matching_skills, missing_skills
        )
    }

    return result


def _calculate_education_score(candidate_edu, job_edu):
    """Calculate education match score."""
    if not job_edu or not job_edu.strip():
        return 80  # No requirement specified

    education_levels = {
        'ph.d': 7, 'phd': 7, 'doctorate': 7,
        'm.tech': 6, 'mtech': 6, 'm.e.': 6,
        'm.s.': 6, 'ms': 6, 'mba': 6, 'mca': 6,
        'master': 6,
        'b.tech': 5, 'btech': 5, 'b.e.': 5, 'be': 5,
        'b.s.': 5, 'bs': 5, 'b.sc': 5, 'bsc': 5,
        'bca': 5, 'bachelor': 5,
        'diploma': 3,
        '12th': 2, 'hsc': 2,
        '10th': 1, 'ssc': 1,
    }

    def get_level(edu_str):
        if not edu_str:
            return 0
        edu_lower = edu_str.lower()
        for key, level in education_levels.items():
            if key in edu_lower:
                return level
        return 3  # Unknown education

    candidate_level = get_level(candidate_edu)
    required_level = get_level(job_edu)

    if required_level == 0:
        return 80
    elif candidate_level >= required_level:
        return 100
    elif candidate_level == required_level - 1:
        return 70
    else:
        return max(20, candidate_level / required_level * 60)


def _generate_explanation(candidate, job, skill_score, exp_score,
                          edu_score, proj_score, cert_score,
                          final_score, matching, missing):
    """Generate a deterministic human-readable explanation."""
    parts = []

    # Skill analysis
    total_required = len(job.get('required_skills', []) if isinstance(job.get('required_skills'), list) else [])
    if skill_score >= 90:
        parts.append(f"Strong skill match with {len(matching)} matching skills")
    elif skill_score >= 70:
        parts.append(f"Good skill match with {len(matching)} matching skills")
    elif skill_score >= 50:
        parts.append(f"Moderate skill match with {len(matching)} matching skills")
    else:
        parts.append(f"Limited skill match with only {len(matching)} matching skills")

    if missing:
        parts.append(f"Missing: {', '.join(missing[:4])}")

    # Experience analysis
    min_exp = job.get('minimum_experience', 0)
    cand_exp = candidate.get('experience_years', 0)
    if min_exp > 0:
        if cand_exp >= min_exp:
            parts.append(f"Experience ({cand_exp}yr) meets/exceeds requirement ({min_exp}yr)")
        else:
            parts.append(f"Experience ({cand_exp}yr) below requirement ({min_exp}yr)")

    # Project analysis
    projects = candidate.get('projects', [])
    if projects:
        parts.append(f"Has {len(projects)} project(s)")

    # Certification analysis
    certs = candidate.get('certifications', [])
    if certs:
        parts.append(f"Has {len(certs)} certification(s)")

    return ". ".join(parts) + "."


def rank_candidates(candidates_with_scores):
    """
    Rank candidates using custom Merge Sort.

    Args:
        candidates_with_scores: List of dicts with score components

    Returns:
        Sorted list with rank assignments and visualization data
    """
    sorter = MergeSort()
    sorted_candidates = sorter.sort(
        candidates_with_scores,
        key="final_score",
        reverse=True,
        record_steps=True
    )

    # Assign ranks
    for i, candidate in enumerate(sorted_candidates):
        candidate['rank'] = i + 1

    return sorted_candidates, sorter.get_visualization_data()


def get_top_k(candidates_with_scores, k):
    """
    Get top K candidates using custom Max Heap.

    Args:
        candidates_with_scores: List of dicts with score components
        k: Number of top candidates to retrieve

    Returns:
        Top K candidates and heap visualization data
    """
    heap = MaxHeap()

    # Build heap from candidates
    for candidate in candidates_with_scores:
        heap.insert(candidate)

    # Extract top K
    top_candidates = heap.top_k(k)

    # Assign ranks
    for i, candidate in enumerate(top_candidates):
        candidate['rank'] = i + 1

    return top_candidates, heap.get_visualization_data()
