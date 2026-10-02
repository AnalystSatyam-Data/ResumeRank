"""
API Integration Tests
=====================
Tests for Flask endpoints:
- Health check
- Candidates CRUD
- Jobs and Rankings
- Skill search & Trie autocomplete
- Analytics
- DSA Visualization endpoints
"""
import pytest
from backend.app import app, db
from backend.models import Candidate, Skill, Job, Project, Certification, Ranking


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.app_context():
        from backend.seed import seed_database
        from backend.app import rebuild_indexes
        if Candidate.query.count() == 0:
            seed_database(force=True)
            rebuild_indexes()
    with app.test_client() as client:
        yield client


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert data["app"] == "ResumeRank"


def test_get_candidates(client):
    response = client.get("/api/candidates")
    assert response.status_code == 200
    data = response.get_json()
    assert "candidates" in data
    assert len(data["candidates"]) > 0


def test_get_jobs(client):
    response = client.get("/api/jobs")
    assert response.status_code == 200
    data = response.get_json()
    assert "jobs" in data
    assert len(data["jobs"]) > 0


def test_job_rankings(client):
    jobs_res = client.get("/api/jobs")
    jobs = jobs_res.get_json()["jobs"]
    if len(jobs) > 0:
        job_id = jobs[0]["id"]
        res = client.get(f"/api/jobs/{job_id}/rankings")
        assert res.status_code == 200
        rank_data = res.get_json()
        assert "rankings" in rank_data


def test_trie_autocomplete(client):
    res = client.get("/api/dsa/trie/autocomplete?prefix=py")
    assert res.status_code == 200
    data = res.get_json()
    assert "suggestions" in data
    # Suggestions have dict format with 'word'
    words = [s["word"].lower() for s in data["suggestions"]]
    assert any("python" in w for w in words)


def test_analytics(client):
    res = client.get("/api/analytics")
    assert res.status_code == 200
    data = res.get_json()
    assert "summary" in data
    assert "total_candidates" in data["summary"]
    assert "skill_counts" in data


def test_dsa_hash_table(client):
    res = client.get("/api/dsa/hash-table")
    assert res.status_code == 200
    data = res.get_json()
    assert "visualization" in data
    assert "stats" in data


def test_dsa_merge_sort_viz(client):
    res = client.post("/api/dsa/merge-sort", json={})
    assert res.status_code == 200
    data = res.get_json()
    assert "visualization" in data
    assert "sorted" in data


def test_clear_all_candidates_unauthorized(client):
    res = client.delete("/api/candidates", headers={"X-Role": "guest"})
    assert res.status_code == 403
    data = res.get_json()
    assert "Unauthorized" in data["error"]


def test_clear_all_candidates_success(client):
    # Verify jobs and master skills exist prior to clear
    with app.app_context():
        jobs_count_before = Job.query.count()
        skills_count_before = Skill.query.count()
        assert jobs_count_before > 0
        assert skills_count_before > 0

    # Execute clear all candidates with admin access
    res = client.delete("/api/candidates", headers={"X-Role": "admin"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["count"] == 0

    # Verify candidates list is empty and total is 0
    c_res = client.get("/api/candidates")
    assert c_res.status_code == 200
    c_data = c_res.get_json()
    assert c_data["total"] == 0
    assert len(c_data["candidates"]) == 0

    # Verify candidate-related data is completely deleted
    with app.app_context():
        assert Candidate.query.count() == 0
        assert Project.query.count() == 0
        assert Certification.query.count() == 0
        assert Ranking.query.count() == 0

        # Verify jobs and master skills were NOT deleted
        assert Job.query.count() == jobs_count_before
        assert Skill.query.count() == skills_count_before

    jobs_res = client.get("/api/jobs")
    assert jobs_res.status_code == 200
    assert len(jobs_res.get_json()["jobs"]) > 0

