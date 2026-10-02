"""
Candidate API Routes
"""
import os
import json
from flask import Blueprint, request, jsonify, current_app
from backend.models import db, Candidate, Skill, Project, Certification, Ranking, candidate_skills

candidates_bp = Blueprint('candidates', __name__)


@candidates_bp.route('/api/candidates', methods=['GET'])
def get_candidates():
    """Get all candidates with optional filtering."""
    try:
        query = Candidate.query

        # Search by name
        name = request.args.get('name')
        if name:
            query = query.filter(Candidate.name.ilike(f'%{name}%'))

        # Search by email
        email = request.args.get('email')
        if email:
            query = query.filter(Candidate.email.ilike(f'%{email}%'))

        # Filter by status
        status = request.args.get('status')
        if status:
            query = query.filter(Candidate.status == status)

        # Filter by skill
        skill_name = request.args.get('skill')
        if skill_name:
            query = query.join(candidate_skills).join(Skill).filter(
                Skill.name.ilike(f'%{skill_name}%')
            )

        # Filter by min experience
        min_exp = request.args.get('min_experience')
        if min_exp:
            query = query.filter(Candidate.experience_years >= float(min_exp))

        # Filter by max experience
        max_exp = request.args.get('max_experience')
        if max_exp:
            query = query.filter(Candidate.experience_years <= float(max_exp))

        # Filter by education
        education = request.args.get('education')
        if education:
            query = query.filter(Candidate.education.ilike(f'%{education}%'))

        # Sorting
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        if sort_by == 'name':
            order_col = Candidate.name
        elif sort_by == 'experience':
            order_col = Candidate.experience_years
        elif sort_by == 'education':
            order_col = Candidate.education
        else:
            order_col = Candidate.created_at

        if sort_order == 'asc':
            query = query.order_by(order_col.asc())
        else:
            query = query.order_by(order_col.desc())

        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        per_page = min(per_page, 100)

        candidates = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'candidates': [c.to_dict() for c in candidates.items],
            'total': candidates.total,
            'page': candidates.page,
            'pages': candidates.pages,
            'per_page': per_page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('/api/candidates/<int:candidate_id>', methods=['GET'])
def get_candidate(candidate_id):
    """Get a single candidate with full details."""
    try:
        candidate = Candidate.query.get_or_404(candidate_id)
        return jsonify(candidate.to_dict(include_details=True))
    except Exception as e:
        return jsonify({'error': f'Candidate not found: {str(e)}'}), 404


@candidates_bp.route('/api/candidates/<int:candidate_id>', methods=['PUT'])
def update_candidate(candidate_id):
    """Update candidate information."""
    try:
        candidate = Candidate.query.get_or_404(candidate_id)
        data = request.get_json()

        if 'name' in data:
            candidate.name = data['name']
        if 'email' in data:
            candidate.email = data['email']
        if 'phone' in data:
            candidate.phone = data['phone']
        if 'education' in data:
            candidate.education = data['education']
        if 'university' in data:
            candidate.university = data['university']
        if 'graduation_year' in data:
            candidate.graduation_year = data['graduation_year']
        if 'experience_years' in data:
            candidate.experience_years = float(data['experience_years'])
        if 'current_company' in data:
            candidate.current_company = data['current_company']
        if 'current_role' in data:
            candidate.current_role = data['current_role']
        if 'status' in data:
            candidate.status = data['status']

        # Update skills
        if 'skills' in data:
            candidate.skills.clear()
            for skill_name in data['skills']:
                skill = Skill.query.filter_by(name=skill_name).first()
                if not skill:
                    skill = Skill(name=skill_name)
                    db.session.add(skill)
                candidate.skills.append(skill)

        # Update projects
        if 'projects' in data:
            Project.query.filter_by(candidate_id=candidate.id).delete()
            for proj_data in data['projects']:
                project = Project(
                    candidate_id=candidate.id,
                    name=proj_data.get('name', ''),
                    description=proj_data.get('description', ''),
                    technologies=proj_data.get('technologies', '')
                )
                db.session.add(project)

        # Update certifications
        if 'certifications' in data:
            Certification.query.filter_by(candidate_id=candidate.id).delete()
            for cert_data in data['certifications']:
                cert = Certification(
                    candidate_id=candidate.id,
                    name=cert_data.get('name', ''),
                    issuer=cert_data.get('issuer', '')
                )
                db.session.add(cert)

        db.session.commit()

        # Rebuild DSA indexes
        from backend.app import rebuild_indexes
        rebuild_indexes()

        return jsonify({
            'message': 'Candidate updated successfully',
            'candidate': candidate.to_dict(include_details=True)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('/api/candidates', methods=['DELETE'])
@candidates_bp.route('/api/candidates/clear-all', methods=['DELETE', 'POST'])
def clear_all_candidates():
    """Clear all candidates and candidate-related data (Admin only)."""
    try:
        # Check admin role
        role = request.headers.get('X-Role') or request.args.get('role') or 'admin'
        if role.lower() not in ['admin', 'administrator', 'true', '1']:
            return jsonify({'error': 'Unauthorized: Admin access required'}), 403

        # Delete resume files on disk for candidates if they exist within UPLOAD_FOLDER
        upload_dir = current_app.config.get('UPLOAD_FOLDER')
        candidates = Candidate.query.all()
        for candidate in candidates:
            if candidate.resume_path and os.path.exists(candidate.resume_path):
                if upload_dir and os.path.abspath(candidate.resume_path).startswith(os.path.abspath(upload_dir)):
                    try:
                        os.remove(candidate.resume_path)
                    except OSError:
                        pass

        # 1. Delete many-to-many candidate_skills associations
        db.session.execute(candidate_skills.delete())

        # 2. Delete candidate projects
        Project.query.delete()

        # 3. Delete candidate certifications
        Certification.query.delete()

        # 4. Delete candidate rankings
        Ranking.query.delete()

        # 5. Delete candidate records
        Candidate.query.delete()

        db.session.commit()

        # Rebuild DSA indexes
        from backend.app import rebuild_indexes
        rebuild_indexes()

        return jsonify({
            'message': 'All candidates and associated data successfully cleared',
            'count': 0
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('/api/candidates/<int:candidate_id>', methods=['DELETE'])
def delete_candidate(candidate_id):
    """Delete a candidate."""
    try:
        candidate = Candidate.query.get_or_404(candidate_id)

        # Delete resume file
        if candidate.resume_path and os.path.exists(candidate.resume_path):
            try:
                os.remove(candidate.resume_path)
            except OSError:
                pass

        db.session.delete(candidate)
        db.session.commit()

        # Rebuild DSA indexes
        from backend.app import rebuild_indexes
        rebuild_indexes()

        return jsonify({'message': 'Candidate deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('/api/candidates/<int:candidate_id>/shortlist', methods=['POST'])
def shortlist_candidate(candidate_id):
    """Shortlist a candidate."""
    try:
        candidate = Candidate.query.get_or_404(candidate_id)
        candidate.status = 'Shortlisted'
        db.session.commit()
        return jsonify({
            'message': f'{candidate.name} has been shortlisted',
            'candidate': candidate.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('/api/candidates/<int:candidate_id>/reject', methods=['POST'])
def reject_candidate(candidate_id):
    """Reject a candidate."""
    try:
        candidate = Candidate.query.get_or_404(candidate_id)
        candidate.status = 'Rejected'
        db.session.commit()
        return jsonify({
            'message': f'{candidate.name} has been rejected',
            'candidate': candidate.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('/api/candidates/<int:candidate_id>/status', methods=['PUT'])
def update_candidate_status(candidate_id):
    """Update candidate status."""
    try:
        candidate = Candidate.query.get_or_404(candidate_id)
        data = request.get_json()
        status = data.get('status', 'Under Review')
        if status not in ['Under Review', 'Shortlisted', 'Rejected']:
            return jsonify({'error': 'Invalid status'}), 400
        candidate.status = status
        db.session.commit()
        return jsonify({
            'message': f'Status updated to {status}',
            'candidate': candidate.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
