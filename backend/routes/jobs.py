"""
Job API Routes
"""
import json
from flask import Blueprint, request, jsonify
from backend.models import db, Job, JobSkill, Skill, Candidate, Ranking
from backend.services.ranking_engine import calculate_scores, rank_candidates, get_top_k

jobs_bp = Blueprint('jobs', __name__)


@jobs_bp.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Get all jobs."""
    try:
        jobs = Job.query.order_by(Job.created_at.desc()).all()
        result = []
        for job in jobs:
            job_dict = job.to_dict()
            # Add candidate count and top score
            rankings = Ranking.query.filter_by(job_id=job.id).all()
            job_dict['candidate_count'] = len(rankings)
            job_dict['top_score'] = max([r.final_score for r in rankings], default=0)
            result.append(job_dict)
        return jsonify({'jobs': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get a single job with details."""
    try:
        job = Job.query.get_or_404(job_id)
        job_dict = job.to_dict()
        rankings = Ranking.query.filter_by(job_id=job.id).order_by(Ranking.rank.asc()).all()
        job_dict['candidate_count'] = len(rankings)
        job_dict['top_score'] = max([r.final_score for r in rankings], default=0)
        job_dict['rankings'] = [r.to_dict() for r in rankings]
        return jsonify(job_dict)
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@jobs_bp.route('/api/jobs', methods=['POST'])
def create_job():
    """Create a new job."""
    try:
        data = request.get_json()

        if not data.get('title'):
            return jsonify({'error': 'Job title is required'}), 400

        # Validate weights
        skill_w = data.get('skill_weight', 0.50)
        exp_w = data.get('experience_weight', 0.20)
        edu_w = data.get('education_weight', 0.15)
        proj_w = data.get('project_weight', 0.10)
        cert_w = data.get('certification_weight', 0.05)

        total_weight = skill_w + exp_w + edu_w + proj_w + cert_w
        if abs(total_weight - 1.0) > 0.01:
            return jsonify({'error': f'Weights must sum to 100%. Current sum: {total_weight*100:.1f}%'}), 400

        job = Job(
            title=data['title'],
            description=data.get('description', ''),
            minimum_experience=data.get('minimum_experience', 0),
            education_requirement=data.get('education_requirement', ''),
            status=data.get('status', 'Active'),
            skill_weight=skill_w,
            experience_weight=exp_w,
            education_weight=edu_w,
            project_weight=proj_w,
            certification_weight=cert_w,
        )
        db.session.add(job)
        db.session.flush()

        # Add required skills
        for skill_name in data.get('required_skills', []):
            skill = Skill.query.filter(Skill.name.ilike(skill_name)).first()
            if not skill:
                skill = Skill(name=skill_name)
                db.session.add(skill)
                db.session.flush()
            job_skill = JobSkill(job_id=job.id, skill_id=skill.id, skill_type='required')
            db.session.add(job_skill)

        # Add preferred skills
        for skill_name in data.get('preferred_skills', []):
            skill = Skill.query.filter(Skill.name.ilike(skill_name)).first()
            if not skill:
                skill = Skill(name=skill_name)
                db.session.add(skill)
                db.session.flush()
            job_skill = JobSkill(job_id=job.id, skill_id=skill.id, skill_type='preferred')
            db.session.add(job_skill)

        db.session.commit()

        return jsonify({
            'message': 'Job created successfully',
            'job': job.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('/api/jobs/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    """Update a job."""
    try:
        job = Job.query.get_or_404(job_id)
        data = request.get_json()

        if 'title' in data:
            job.title = data['title']
        if 'description' in data:
            job.description = data['description']
        if 'minimum_experience' in data:
            job.minimum_experience = float(data['minimum_experience'])
        if 'education_requirement' in data:
            job.education_requirement = data['education_requirement']
        if 'status' in data:
            job.status = data['status']
        if 'skill_weight' in data:
            job.skill_weight = float(data['skill_weight'])
        if 'experience_weight' in data:
            job.experience_weight = float(data['experience_weight'])
        if 'education_weight' in data:
            job.education_weight = float(data['education_weight'])
        if 'project_weight' in data:
            job.project_weight = float(data['project_weight'])
        if 'certification_weight' in data:
            job.certification_weight = float(data['certification_weight'])

        # Update skills
        if 'required_skills' in data or 'preferred_skills' in data:
            JobSkill.query.filter_by(job_id=job.id).delete()

            for skill_name in data.get('required_skills', []):
                skill = Skill.query.filter(Skill.name.ilike(skill_name)).first()
                if not skill:
                    skill = Skill(name=skill_name)
                    db.session.add(skill)
                    db.session.flush()
                job_skill = JobSkill(job_id=job.id, skill_id=skill.id, skill_type='required')
                db.session.add(job_skill)

            for skill_name in data.get('preferred_skills', []):
                skill = Skill.query.filter(Skill.name.ilike(skill_name)).first()
                if not skill:
                    skill = Skill(name=skill_name)
                    db.session.add(skill)
                    db.session.flush()
                job_skill = JobSkill(job_id=job.id, skill_id=skill.id, skill_type='preferred')
                db.session.add(job_skill)

        db.session.commit()

        return jsonify({
            'message': 'Job updated successfully',
            'job': job.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('/api/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job."""
    try:
        job = Job.query.get_or_404(job_id)
        db.session.delete(job)
        db.session.commit()
        return jsonify({'message': 'Job deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('/api/jobs/<int:job_id>/rank', methods=['POST'])
def rank_for_job(job_id):
    """Rank all candidates for a job."""
    try:
        job = Job.query.get_or_404(job_id)
        candidates = Candidate.query.all()

        if not candidates:
            return jsonify({'error': 'No candidates available for ranking'}), 400

        # Get job skills
        required_skills = [js.skill.to_dict() for js in job.job_skills.filter_by(skill_type='required')]
        preferred_skills = [js.skill.to_dict() for js in job.job_skills.filter_by(skill_type='preferred')]

        job_dict = job.to_dict()

        # Calculate scores for each candidate
        candidates_with_scores = []
        for candidate in candidates:
            candidate_dict = candidate.to_dict(include_details=True)
            scores = calculate_scores(candidate_dict, job_dict, required_skills, preferred_skills)
            scores['candidate_id'] = candidate.id
            scores['name'] = candidate.name
            scores['email'] = candidate.email
            candidates_with_scores.append(scores)

        # Rank using custom Merge Sort
        ranked, sort_viz = rank_candidates(candidates_with_scores)

        # Delete old rankings for this job
        Ranking.query.filter_by(job_id=job.id).delete()

        # Save new rankings
        for r in ranked:
            ranking = Ranking(
                candidate_id=r['candidate_id'],
                job_id=job.id,
                skill_score=r['skill_score'],
                experience_score=r['experience_score'],
                education_score=r['education_score'],
                project_score=r['project_score'],
                certification_score=r['certification_score'],
                final_score=r['final_score'],
                rank=r['rank'],
                matching_skills=json.dumps(r.get('matching_skills', [])),
                missing_skills=json.dumps(r.get('missing_skills', [])),
                explanation=r.get('explanation', '')
            )
            db.session.add(ranking)

        db.session.commit()

        return jsonify({
            'message': f'Ranked {len(ranked)} candidates for {job.title}',
            'rankings': ranked,
            'sort_visualization': sort_viz
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('/api/jobs/<int:job_id>/rankings', methods=['GET'])
def get_rankings(job_id):
    """Get rankings for a job."""
    try:
        job = Job.query.get_or_404(job_id)
        top_k = request.args.get('top_k', type=int)

        rankings = Ranking.query.filter_by(job_id=job.id).order_by(Ranking.rank.asc()).all()

        if not rankings:
            return jsonify({
                'rankings': [],
                'job': job.to_dict(),
                'message': 'No rankings yet. Click "Rank Candidates" to generate rankings.'
            })

        ranking_dicts = [r.to_dict() for r in rankings]

        if top_k and top_k > 0:
            # Use Max Heap for Top-K
            candidates_for_heap = []
            for r in ranking_dicts:
                candidates_for_heap.append({
                    'candidate_id': r['candidate_id'],
                    'name': r['candidate']['name'] if r['candidate'] else 'Unknown',
                    'final_score': r['final_score'],
                    'skill_score': r['skill_score'],
                    'experience_score': r['experience_score'],
                    'education_score': r['education_score'],
                    'project_score': r['project_score'],
                    'certification_score': r['certification_score'],
                    'matching_skills': r['matching_skills'],
                    'missing_skills': r['missing_skills'],
                    'explanation': r['explanation'],
                    'candidate': r['candidate']
                })

            top_candidates, heap_viz = get_top_k(candidates_for_heap, top_k)

            return jsonify({
                'rankings': top_candidates,
                'job': job.to_dict(),
                'heap_visualization': heap_viz,
                'total_candidates': len(ranking_dicts),
                'showing': min(top_k, len(ranking_dicts))
            })

        return jsonify({
            'rankings': ranking_dicts,
            'job': job.to_dict(),
            'total_candidates': len(ranking_dicts)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
