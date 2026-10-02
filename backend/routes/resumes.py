"""
Resume Upload API Routes
"""
import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from backend.models import db, Candidate, Skill, Project, Certification
from backend.services.resume_parser import parse_resume

resumes_bp = Blueprint('resumes', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'docx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@resumes_bp.route('/api/resumes/upload', methods=['POST'])
def upload_resumes():
    """Upload and process resume files."""
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400

        files = request.files.getlist('files')
        if not files or len(files) == 0:
            return jsonify({'error': 'No files selected'}), 400

        results = []
        upload_dir = current_app.config.get('UPLOAD_FOLDER', 'backend/uploads')
        os.makedirs(upload_dir, exist_ok=True)

        for file in files:
            result = {
                'filename': file.filename,
                'status': 'processing'
            }

            try:
                # Validate file
                if not file.filename:
                    result['status'] = 'failed'
                    result['error'] = 'No filename'
                    results.append(result)
                    continue

                if not allowed_file(file.filename):
                    result['status'] = 'failed'
                    result['error'] = f'Unsupported file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
                    results.append(result)
                    continue

                # Check file size
                file.seek(0, 2)  # Seek to end
                file_size = file.tell()
                file.seek(0)  # Reset

                if file_size > MAX_FILE_SIZE:
                    result['status'] = 'failed'
                    result['error'] = f'File too large. Maximum: {MAX_FILE_SIZE // (1024*1024)}MB'
                    results.append(result)
                    continue

                if file_size == 0:
                    result['status'] = 'failed'
                    result['error'] = 'File is empty'
                    results.append(result)
                    continue

                # Save file
                original_name = secure_filename(file.filename)
                unique_name = f"{uuid.uuid4().hex}_{original_name}"
                file_path = os.path.join(upload_dir, unique_name)
                file.save(file_path)

                # Parse resume
                parsed = parse_resume(file_path)

                # Check for duplicate email
                if parsed.get('email'):
                    existing = Candidate.query.filter_by(email=parsed['email']).first()
                    if existing:
                        result['status'] = 'failed'
                        result['error'] = f'Candidate with email {parsed["email"]} already exists'
                        # Clean up file
                        try:
                            os.remove(file_path)
                        except OSError:
                            pass
                        results.append(result)
                        continue

                # Create candidate
                candidate = Candidate(
                    name=parsed.get('name', 'Unknown Candidate'),
                    email=parsed.get('email'),
                    phone=parsed.get('phone'),
                    education=parsed.get('education'),
                    university=parsed.get('university'),
                    graduation_year=parsed.get('graduation_year'),
                    experience_years=parsed.get('experience_years', 0),
                    current_company=parsed.get('current_company'),
                    current_role=parsed.get('current_role'),
                    resume_path=file_path,
                    resume_text=parsed.get('resume_text', '')[:5000],  # Limit stored text
                    status='Under Review'
                )
                db.session.add(candidate)
                db.session.flush()  # Get the ID

                # Add skills
                skill_names = parsed.get('skills', [])
                for skill_name in skill_names:
                    skill = Skill.query.filter(Skill.name.ilike(skill_name)).first()
                    if not skill:
                        skill = Skill(name=skill_name)
                        db.session.add(skill)
                        db.session.flush()
                    candidate.skills.append(skill)

                # Add projects
                for proj_data in parsed.get('projects', []):
                    project = Project(
                        candidate_id=candidate.id,
                        name=proj_data.get('name', 'Unnamed Project'),
                        description=proj_data.get('description', ''),
                        technologies=proj_data.get('technologies', '')
                    )
                    db.session.add(project)

                # Add certifications
                for cert_data in parsed.get('certifications', []):
                    cert = Certification(
                        candidate_id=candidate.id,
                        name=cert_data.get('name', 'Unnamed Certification'),
                        issuer=cert_data.get('issuer')
                    )
                    db.session.add(cert)

                db.session.commit()

                # Update DSA indexes
                from backend.app import rebuild_indexes
                rebuild_indexes()

                result['status'] = 'success'
                result['candidate'] = candidate.to_dict()
                result['skills_found'] = skill_names
                result['projects_found'] = len(parsed.get('projects', []))
                result['certifications_found'] = len(parsed.get('certifications', []))

            except ValueError as ve:
                result['status'] = 'failed'
                result['error'] = str(ve)
                db.session.rollback()
            except Exception as e:
                result['status'] = 'failed'
                result['error'] = f'Processing error: {str(e)}'
                db.session.rollback()

            results.append(result)

        success_count = sum(1 for r in results if r['status'] == 'success')
        failed_count = sum(1 for r in results if r['status'] == 'failed')

        return jsonify({
            'message': f'Processed {len(results)} files: {success_count} successful, {failed_count} failed',
            'results': results,
            'success_count': success_count,
            'failed_count': failed_count
        })

    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500
