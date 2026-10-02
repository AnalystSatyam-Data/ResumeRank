import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineEye, HiOutlineTrash, HiOutlineChartBar } from 'react-icons/hi';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    try {
      const res = await jobAPI.getAll();
      setJobs(res.jobs || []);
    } catch (err) { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This will also delete all associated rankings.`)) return;
    try {
      await jobAPI.delete(id);
      toast.success('Job deleted');
      loadJobs();
    } catch (err) { toast.error(err.message); }
  }

  async function handleRank(id, title) {
    try {
      toast.loading('Calculating rankings...', { id: 'ranking' });
      await jobAPI.rank(id);
      toast.success(`Rankings calculated for ${title}`, { id: 'ranking' });
      loadJobs();
    } catch (err) { toast.error(err.message, { id: 'ranking' }); }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading jobs...</p></div>;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>Jobs</h1>
        <p>Manage job openings and rank candidates</p>
        <div className="page-header-actions">
          <Link to="/jobs/create" className="btn btn-primary"><HiOutlinePlus /> Create Job</Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">💼</div>
          <h3>No jobs created yet</h3>
          <p>Create a job to define requirements and start ranking candidates.</p>
          <Link to="/jobs/create" className="btn btn-primary">Create Job</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
          {jobs.map(job => (
            <div key={job.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 600 }}>{job.title}</h3>
                    <span className={`badge ${job.status === 'Active' ? 'badge-success' : 'badge-neutral'}`} style={{ marginTop: 4 }}>{job.status}</span>
                  </div>
                </div>
                {job.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{job.description.substring(0, 120)}{job.description.length > 120 ? '...' : ''}</p>}

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <span>Min Exp: {job.minimum_experience}yr</span>
                  <span>Edu: {job.education_requirement || 'Any'}</span>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Required Skills</div>
                  <div className="skill-badges">
                    {(job.required_skills || []).map(s => <span key={s.id} className="skill-badge">{s.name}</span>)}
                    {(job.required_skills || []).length === 0 && <span className="text-muted" style={{ fontSize: '0.8125rem' }}>None specified</span>}
                  </div>
                </div>

                {(job.preferred_skills || []).length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Preferred Skills</div>
                    <div className="skill-badges">
                      {job.preferred_skills.map(s => <span key={s.id} className="badge badge-neutral">{s.name}</span>)}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 8, marginTop: '0.75rem' }}>
                  <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Candidates</span><br /><strong>{job.candidate_count || 0}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Top Score</span><br /><strong>{job.top_score ? `${job.top_score}%` : '—'}</strong></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <Link to={`/jobs/${job.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}><HiOutlineEye /> View</Link>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleRank(job.id, job.title)}><HiOutlineChartBar /> Rank</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(job.id, job.title)} style={{ color: 'var(--danger)' }}><HiOutlineTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
