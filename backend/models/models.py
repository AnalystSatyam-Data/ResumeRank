"""
SQLAlchemy Database Models for ResumeRank
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Association table for Candidate-Skill many-to-many
candidate_skills = db.Table('candidate_skills',
    db.Column('candidate_id', db.Integer, db.ForeignKey('candidates.id'), primary_key=True),
    db.Column('skill_id', db.Integer, db.ForeignKey('skills.id'), primary_key=True)
)


class Candidate(db.Model):
    __tablename__ = 'candidates'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    education = db.Column(db.String(300), nullable=True)
    university = db.Column(db.String(300), nullable=True)
    graduation_year = db.Column(db.String(10), nullable=True)
    experience_years = db.Column(db.Float, default=0)
    current_company = db.Column(db.String(200), nullable=True)
    current_role = db.Column(db.String(200), nullable=True)
    resume_path = db.Column(db.String(500), nullable=True)
    resume_text = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='Under Review')  # Under Review, Shortlisted, Rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    skills = db.relationship('Skill', secondary=candidate_skills, backref=db.backref('candidates', lazy='dynamic'))
    projects = db.relationship('Project', backref='candidate', cascade='all, delete-orphan', lazy='dynamic')
    certifications = db.relationship('Certification', backref='candidate', cascade='all, delete-orphan', lazy='dynamic')
    rankings = db.relationship('Ranking', backref='candidate', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'education': self.education,
            'university': self.university,
            'graduation_year': self.graduation_year,
            'experience_years': self.experience_years,
            'current_company': self.current_company,
            'current_role': self.current_role,
            'resume_path': self.resume_path,
            'status': self.status,
            'skills': [s.to_dict() for s in self.skills],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_details:
            data['resume_text'] = self.resume_text
            data['projects'] = [p.to_dict() for p in self.projects]
            data['certifications'] = [c.to_dict() for c in self.certifications]
            data['rankings'] = [r.to_dict() for r in self.rankings]
        return data


class Skill(db.Model):
    __tablename__ = 'skills'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }


class Job(db.Model):
    __tablename__ = 'jobs'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    minimum_experience = db.Column(db.Float, default=0)
    education_requirement = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), default='Active')  # Active, Closed, Draft
    skill_weight = db.Column(db.Float, default=0.50)
    experience_weight = db.Column(db.Float, default=0.20)
    education_weight = db.Column(db.Float, default=0.15)
    project_weight = db.Column(db.Float, default=0.10)
    certification_weight = db.Column(db.Float, default=0.05)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    job_skills = db.relationship('JobSkill', backref='job', cascade='all, delete-orphan', lazy='dynamic')
    rankings = db.relationship('Ranking', backref='job', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self, include_skills=True):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'minimum_experience': self.minimum_experience,
            'education_requirement': self.education_requirement,
            'status': self.status,
            'skill_weight': self.skill_weight,
            'experience_weight': self.experience_weight,
            'education_weight': self.education_weight,
            'project_weight': self.project_weight,
            'certification_weight': self.certification_weight,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_skills:
            data['required_skills'] = [js.skill.to_dict() for js in self.job_skills.filter_by(skill_type='required')]
            data['preferred_skills'] = [js.skill.to_dict() for js in self.job_skills.filter_by(skill_type='preferred')]
        return data


class JobSkill(db.Model):
    __tablename__ = 'job_skills'

    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.id'), nullable=False)
    skill_type = db.Column(db.String(20), default='required')  # required, preferred

    skill = db.relationship('Skill')

    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'skill_id': self.skill_id,
            'skill_type': self.skill_type,
            'skill': self.skill.to_dict() if self.skill else None
        }


class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    name = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    technologies = db.Column(db.String(500), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'name': self.name,
            'description': self.description,
            'technologies': self.technologies
        }


class Certification(db.Model):
    __tablename__ = 'certifications'

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    name = db.Column(db.String(300), nullable=False)
    issuer = db.Column(db.String(200), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'name': self.name,
            'issuer': self.issuer
        }


class Ranking(db.Model):
    __tablename__ = 'rankings'

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    skill_score = db.Column(db.Float, default=0)
    experience_score = db.Column(db.Float, default=0)
    education_score = db.Column(db.Float, default=0)
    project_score = db.Column(db.Float, default=0)
    certification_score = db.Column(db.Float, default=0)
    final_score = db.Column(db.Float, default=0)
    rank = db.Column(db.Integer, default=0)
    matching_skills = db.Column(db.Text, nullable=True)  # JSON string
    missing_skills = db.Column(db.Text, nullable=True)  # JSON string
    explanation = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'job_id': self.job_id,
            'skill_score': self.skill_score,
            'experience_score': self.experience_score,
            'education_score': self.education_score,
            'project_score': self.project_score,
            'certification_score': self.certification_score,
            'final_score': self.final_score,
            'rank': self.rank,
            'matching_skills': json.loads(self.matching_skills) if self.matching_skills else [],
            'missing_skills': json.loads(self.missing_skills) if self.missing_skills else [],
            'explanation': self.explanation,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'candidate': self.candidate.to_dict() if self.candidate else None,
            'job_title': self.job.title if self.job else None
        }


class Setting(db.Model):
    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'key': self.key,
            'value': self.value
        }
