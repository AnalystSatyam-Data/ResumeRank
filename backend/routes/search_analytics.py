"""
Search, Analytics, DSA Visualization, and Settings API Routes
"""
import json
from flask import Blueprint, request, jsonify
from backend.models import db, Candidate, Skill, Job, Ranking, Project, Certification, Setting, candidate_skills
from backend.services.resume_parser import get_skill_dictionary, add_to_skill_dictionary, remove_from_skill_dictionary
from sqlalchemy import func

search_bp = Blueprint('search', __name__)
analytics_bp = Blueprint('analytics', __name__)
dsa_bp = Blueprint('dsa', __name__)
settings_bp = Blueprint('settings', __name__)


# ==================== SEARCH ====================

@search_bp.route('/api/search/skills', methods=['GET'])
def search_skills():
    """Search skills using Trie autocomplete."""
    try:
        prefix = request.args.get('q', '').strip()
        from backend.app import skill_trie, skill_index

        if not prefix:
            # Return all skills with counts
            skills = db.session.query(
                Skill.name,
                func.count(candidate_skills.c.candidate_id).label('count')
            ).outerjoin(candidate_skills).group_by(Skill.name).all()
            return jsonify({
                'skills': [{'name': s[0], 'count': s[1]} for s in skills]
            })

        # Use Trie for autocomplete
        suggestions = skill_trie.autocomplete(prefix, max_results=15)
        results = []
        for suggestion in suggestions:
            skill_name = suggestion['word']
            # Use Hash Table for candidate lookup
            candidate_ids = skill_index.search(skill_name)
            results.append({
                'name': skill_name,
                'count': len(candidate_ids) if candidate_ids else 0
            })

        return jsonify({
            'skills': results,
            'prefix': prefix,
            'trie_stats': skill_trie.get_stats()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/api/search/candidates', methods=['GET'])
def search_candidates():
    """Search candidates by skill using Hash Table index."""
    try:
        skill_name = request.args.get('skill', '').strip()
        query_str = request.args.get('q', '').strip()

        if skill_name:
            from backend.app import skill_index
            candidate_ids = skill_index.search(skill_name)
            if candidate_ids:
                candidates = Candidate.query.filter(Candidate.id.in_(candidate_ids)).all()
                return jsonify({
                    'candidates': [c.to_dict() for c in candidates],
                    'skill': skill_name,
                    'count': len(candidates)
                })
            return jsonify({'candidates': [], 'skill': skill_name, 'count': 0})

        if query_str:
            candidates = Candidate.query.filter(
                db.or_(
                    Candidate.name.ilike(f'%{query_str}%'),
                    Candidate.email.ilike(f'%{query_str}%')
                )
            ).all()
            return jsonify({
                'candidates': [c.to_dict() for c in candidates],
                'query': query_str,
                'count': len(candidates)
            })

        return jsonify({'candidates': [], 'count': 0})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== ANALYTICS ====================

@analytics_bp.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data."""
    try:
        # Score distribution
        rankings = Ranking.query.all()
        scores = [r.final_score for r in rankings]
        score_distribution = {
            '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0
        }
        for score in scores:
            if score < 20:
                score_distribution['0-20'] += 1
            elif score < 40:
                score_distribution['20-40'] += 1
            elif score < 60:
                score_distribution['40-60'] += 1
            elif score < 80:
                score_distribution['60-80'] += 1
            else:
                score_distribution['80-100'] += 1

        # Most common skills
        skill_counts = db.session.query(
            Skill.name,
            func.count(candidate_skills.c.candidate_id).label('count')
        ).join(candidate_skills).group_by(Skill.name).order_by(
            func.count(candidate_skills.c.candidate_id).desc()
        ).limit(15).all()

        # Experience distribution
        candidates = Candidate.query.all()
        exp_distribution = {
            '0-1 years': 0, '1-3 years': 0, '3-5 years': 0,
            '5-10 years': 0, '10+ years': 0
        }
        for c in candidates:
            exp = c.experience_years or 0
            if exp < 1:
                exp_distribution['0-1 years'] += 1
            elif exp < 3:
                exp_distribution['1-3 years'] += 1
            elif exp < 5:
                exp_distribution['3-5 years'] += 1
            elif exp < 10:
                exp_distribution['5-10 years'] += 1
            else:
                exp_distribution['10+ years'] += 1

        # Education distribution
        edu_counts = db.session.query(
            Candidate.education,
            func.count(Candidate.id)
        ).filter(Candidate.education.isnot(None)).group_by(
            Candidate.education
        ).all()

        # Status distribution
        status_counts = db.session.query(
            Candidate.status,
            func.count(Candidate.id)
        ).group_by(Candidate.status).all()

        # Candidates per job
        job_candidate_counts = db.session.query(
            Job.title,
            func.count(Ranking.id)
        ).outerjoin(Ranking).group_by(Job.id, Job.title).all()

        # Summary stats
        total_candidates = Candidate.query.count()
        total_jobs = Job.query.filter_by(status='Active').count()
        total_skills = Skill.query.count()
        avg_score = db.session.query(func.avg(Ranking.final_score)).scalar() or 0

        # Top candidate
        top_ranking = Ranking.query.order_by(Ranking.final_score.desc()).first()
        top_candidate = None
        if top_ranking:
            tc = Candidate.query.get(top_ranking.candidate_id)
            if tc:
                top_candidate = {
                    'name': tc.name,
                    'score': top_ranking.final_score
                }

        return jsonify({
            'summary': {
                'total_candidates': total_candidates,
                'resumes_processed': total_candidates,
                'active_jobs': total_jobs,
                'indexed_skills': total_skills,
                'average_score': round(avg_score, 1),
                'top_candidate': top_candidate
            },
            'score_distribution': score_distribution,
            'skill_counts': [{'name': s[0], 'count': s[1]} for s in skill_counts],
            'experience_distribution': exp_distribution,
            'education_distribution': [{'name': e[0] or 'Not Specified', 'count': e[1]} for e in edu_counts],
            'status_distribution': [{'name': s[0], 'count': s[1]} for s in status_counts],
            'candidates_per_job': [{'name': j[0], 'count': j[1]} for j in job_candidate_counts],
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== DSA VISUALIZATION ====================

@dsa_bp.route('/api/dsa/hash-table', methods=['GET'])
def get_hash_table_viz():
    """Get Hash Table visualization data."""
    try:
        from backend.app import skill_index
        return jsonify({
            'visualization': skill_index.get_visualization_data(),
            'stats': skill_index.get_stats()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dsa_bp.route('/api/dsa/hash-table/search', methods=['GET'])
def hash_table_search():
    """Search in Hash Table."""
    try:
        key = request.args.get('key', '').strip()
        from backend.app import skill_index
        result = skill_index.search(key)
        return jsonify({
            'key': key,
            'found': result is not None,
            'value': result,
            'stats': skill_index.get_stats()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dsa_bp.route('/api/dsa/trie', methods=['GET'])
def get_trie_viz():
    """Get Trie visualization data."""
    try:
        prefix = request.args.get('prefix', '')
        from backend.app import skill_trie
        return jsonify({
            'visualization': skill_trie.get_visualization_data(prefix),
            'stats': skill_trie.get_stats()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dsa_bp.route('/api/dsa/trie/autocomplete', methods=['GET'])
def trie_autocomplete():
    """Autocomplete using Trie."""
    try:
        prefix = request.args.get('prefix', '').strip()
        from backend.app import skill_trie
        results = skill_trie.autocomplete(prefix, max_results=10)
        return jsonify({
            'prefix': prefix,
            'suggestions': results,
            'stats': skill_trie.get_stats()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dsa_bp.route('/api/dsa/graph', methods=['GET'])
def get_graph_viz():
    """Get Graph visualization data."""
    try:
        from backend.app import candidate_graph
        return jsonify({
            'visualization': candidate_graph.get_visualization_data(),
            'stats': candidate_graph.get_stats()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dsa_bp.route('/api/dsa/merge-sort', methods=['POST'])
def merge_sort_viz():
    """Run Merge Sort visualization."""
    try:
        from backend.dsa import MergeSort
        data = request.get_json() or {}

        # Get candidate data
        if data.get('candidates'):
            candidates_data = data['candidates']
        else:
            # Use current rankings or candidate data
            from backend.models import Ranking
            rankings = Ranking.query.order_by(Ranking.final_score.desc()).limit(20).all()
            if rankings:
                candidates_data = [{
                    'name': r.candidate.name if r.candidate else f'Candidate {r.candidate_id}',
                    'final_score': r.final_score,
                    'skill_score': r.skill_score,
                    'experience_score': r.experience_score,
                    'project_score': r.project_score
                } for r in rankings]
            else:
                # Use actual candidates
                candidates = Candidate.query.limit(20).all()
                candidates_data = [{
                    'name': c.name,
                    'final_score': c.experience_years * 10 + len(list(c.skills)) * 5,
                    'skill_score': len(list(c.skills)) * 10,
                    'experience_score': c.experience_years * 20,
                    'project_score': c.projects.count() * 15
                } for c in candidates]

        import random
        random.shuffle(candidates_data)

        sorter = MergeSort()
        sorted_data = sorter.sort(candidates_data, key='final_score', reverse=True, record_steps=True)

        return jsonify({
            'original': candidates_data,
            'sorted': sorted_data,
            'visualization': sorter.get_visualization_data()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dsa_bp.route('/api/dsa/max-heap', methods=['GET'])
def get_max_heap_viz():
    """Get Max Heap visualization data."""
    try:
        from backend.dsa import MaxHeap

        # Build heap from rankings
        rankings = Ranking.query.all()
        heap = MaxHeap()

        if rankings:
            for r in rankings:
                heap.insert({
                    'name': r.candidate.name if r.candidate else f'Candidate {r.candidate_id}',
                    'candidate_id': r.candidate_id,
                    'final_score': r.final_score,
                    'score': r.final_score
                })
        else:
            # Use candidates if no rankings
            candidates = Candidate.query.limit(15).all()
            for c in candidates:
                score = c.experience_years * 10 + len(list(c.skills)) * 8
                heap.insert({
                    'name': c.name,
                    'candidate_id': c.id,
                    'final_score': round(score, 1),
                    'score': round(score, 1)
                })

        return jsonify({
            'visualization': heap.get_visualization_data(),
            'stats': heap.get_stats(),
            'is_valid': heap.validate()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dsa_bp.route('/api/dsa/max-heap/top-k', methods=['GET'])
def max_heap_top_k():
    """Get Top-K from Max Heap."""
    try:
        k = request.args.get('k', 5, type=int)
        from backend.dsa import MaxHeap

        rankings = Ranking.query.all()
        heap = MaxHeap()

        if rankings:
            for r in rankings:
                heap.insert({
                    'name': r.candidate.name if r.candidate else f'Candidate {r.candidate_id}',
                    'candidate_id': r.candidate_id,
                    'final_score': r.final_score,
                    'score': r.final_score
                })
        else:
            candidates = Candidate.query.all()
            for c in candidates:
                score = c.experience_years * 10 + len(list(c.skills)) * 8
                heap.insert({
                    'name': c.name,
                    'candidate_id': c.id,
                    'final_score': round(score, 1),
                    'score': round(score, 1)
                })

        top = heap.top_k(k)
        for i, item in enumerate(top):
            item['rank'] = i + 1

        return jsonify({
            'top_k': top,
            'k': k,
            'heap_size': heap.size(),
            'visualization': heap.get_visualization_data()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== SETTINGS ====================

@settings_bp.route('/api/settings', methods=['GET'])
def get_settings():
    """Get application settings."""
    try:
        settings = Setting.query.all()
        settings_dict = {s.key: s.value for s in settings}

        # Defaults
        defaults = {
            'skill_weight': '0.50',
            'experience_weight': '0.20',
            'education_weight': '0.15',
            'project_weight': '0.10',
            'certification_weight': '0.05',
            'max_upload_size': '10',
            'theme': 'dark',
            'app_name': 'ResumeRank',
            'app_subtitle': 'Resume Indexing & Candidate Ranking Tool',
        }

        for key, default in defaults.items():
            if key not in settings_dict:
                settings_dict[key] = default

        # Add skill dictionary
        settings_dict['skill_dictionary'] = get_skill_dictionary()

        return jsonify({'settings': settings_dict})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/api/settings', methods=['PUT'])
def update_settings():
    """Update application settings."""
    try:
        data = request.get_json()
        for key, value in data.items():
            if key == 'skill_dictionary':
                continue  # Handle separately
            setting = Setting.query.filter_by(key=key).first()
            if setting:
                setting.value = str(value)
            else:
                setting = Setting(key=key, value=str(value))
                db.session.add(setting)

        db.session.commit()
        return jsonify({'message': 'Settings updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/api/settings/skills', methods=['POST'])
def add_skill_to_dictionary():
    """Add a skill to the dictionary."""
    try:
        data = request.get_json()
        skill_name = data.get('skill', '').strip()
        if not skill_name:
            return jsonify({'error': 'Skill name is required'}), 400

        added = add_to_skill_dictionary(skill_name)
        if added:
            # Also add to database and indexes
            skill = Skill.query.filter(Skill.name.ilike(skill_name)).first()
            if not skill:
                skill = Skill(name=skill_name)
                db.session.add(skill)
                db.session.commit()

            from backend.app import skill_trie
            skill_trie.insert(skill_name)

            return jsonify({'message': f'Skill "{skill_name}" added to dictionary'})
        return jsonify({'message': f'Skill "{skill_name}" already exists'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/api/settings/skills', methods=['DELETE'])
def remove_skill_from_dictionary():
    """Remove a skill from the dictionary."""
    try:
        data = request.get_json()
        skill_name = data.get('skill', '').strip()
        if not skill_name:
            return jsonify({'error': 'Skill name is required'}), 400

        removed = remove_from_skill_dictionary(skill_name)
        if removed:
            return jsonify({'message': f'Skill "{skill_name}" removed from dictionary'})
        return jsonify({'message': f'Skill "{skill_name}" not found in dictionary'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
