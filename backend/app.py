"""
ResumeRank - Flask Backend Application
========================================
Main application entry point.
"""
import os
import re
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from backend.models import db, Candidate, Skill, candidate_skills
from backend.dsa import HashTable, Trie, Graph

# Global DSA instances
skill_index = HashTable(size=53)
skill_trie = Trie()
candidate_graph = Graph()


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__, static_folder=None)

    # Configuration
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'resumerank.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    upload_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    os.makedirs(upload_path, exist_ok=True)

    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = upload_path
    # Allow several files in one request; each individual resume is capped at 10MB.
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB total request

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": [
        re.compile(r"^http://(localhost|127\.0\.0\.1):\d+$")
    ]}})
    db.init_app(app)

    # Register blueprints
    from backend.routes.candidates import candidates_bp
    from backend.routes.resumes import resumes_bp
    from backend.routes.jobs import jobs_bp
    from backend.routes.search_analytics import search_bp, analytics_bp, dsa_bp, settings_bp
    from backend.routes.optimization import optimization_bp

    app.register_blueprint(candidates_bp)
    app.register_blueprint(resumes_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(dsa_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(optimization_bp)

    # Create tables and seed
    with app.app_context():
        db.create_all()

        # Seed if empty
        from backend.seed import seed_database
        seed_database()

        # Build DSA indexes
        rebuild_indexes()

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({'error': 'File too large. Maximum size is 10MB'}), 413

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    # Health check
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'app': 'ResumeRank',
            'version': '1.0.0'
        })

    return app


def rebuild_indexes():
    """Rebuild all DSA indexes from database."""
    global skill_index, skill_trie, candidate_graph

    skill_index = HashTable(size=53)
    skill_trie = Trie()
    candidate_graph = Graph()

    try:
        # Get all skills
        skills = Skill.query.all()
        for skill in skills:
            skill_trie.insert(skill.name)
            candidate_graph.add_node(f"skill_{skill.id}", "skill", skill.name)

        # Get all candidates with skills
        candidates = Candidate.query.all()
        for candidate in candidates:
            candidate_graph.add_node(f"cand_{candidate.id}", "candidate", candidate.name)

            for skill in candidate.skills:
                # Add to hash table index
                skill_index.insert(skill.name, candidate.id)
                # Add edge to graph
                candidate_graph.add_edge(f"cand_{candidate.id}", f"skill_{skill.id}")

    except Exception as e:
        print(f"Warning: Could not build indexes: {e}")


# Create the app instance
app = create_app()

if __name__ == '__main__':
    app.run(debug=os.environ.get('FLASK_DEBUG', '').lower() == 'true', port=5001, host='127.0.0.1')
