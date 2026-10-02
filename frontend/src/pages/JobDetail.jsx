import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineChartBar, HiOutlineEye, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(false);

  useEffect(() => { loadJob(); }, [id]);

  async function loadJob() {
    try {
      const data = await jobAPI.getById(id);
      setJob(data);
    } catch (err) { toast.error('Failed to load job'); }
    finally { setLoading(false); }
  }

  async function handleRank() {
    setRanking(true);
    try {
      toast.loading('Calculating rankings...', { id: 'ranking' });
      await jobAPI.rank(id);
      toast.success('Rankings calculated!', { id: 'ranking' });
      loadJob();
    } catch (err) { toast.error(err.message, { id: 'ranking' }); }
    finally { setRanking(false); }
  }

  const getScoreClass = (s) => s >= 70 ? 'high' : s >= 40 ? 'medium' : 'low';

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading job...</p></div>;
  if (!job) return <div className="empty-state"><h3>Job not found</h3></div>;

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{job.title}</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 600 }}>{job.description}</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <span>Min Exp: {job.minimum_experience}yr</span>
            <span>Edu: {job.education_requirement || 'Any'}</span>
            <span className={`badge ${job.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{job.status}</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleRank} disabled={ranking}>
          <HiOutlineChartBar /> {ranking ? 'Ranking...' : 'Rank Candidates'}
        </button>
      </div>

      <div className="grid-2 mb-lg">
        <div className="card">
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>Required Skills</div>
          <div className="skill-badges">{(job.required_skills || []).map(s => <span key={s.id} className="skill-badge">{s.name}</span>)}</div>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>Scoring Weights</div>
          {[
            { label: 'Skill Match', val: job.skill_weight * 100 },
            { label: 'Experience', val: job.experience_weight * 100 },
            { label: 'Education', val: job.education_weight * 100 },
            { label: 'Projects', val: job.project_weight * 100 },
            { label: 'Certifications', val: job.certification_weight * 100 },
          ].map(w => (
            <div key={w.label} className="score-bar" style={{ marginBottom: 4 }}>
              <div style={{ minWidth: 100, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{w.label}</div>
              <div className="score-bar-track"><div className={`score-bar-fill high`} style={{ width: `${w.val}%` }} /></div>
              <div className="score-bar-value">{w.val}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rankings */}
      <div className="table-container">
        <div className="table-header">
          <h3>Candidate Rankings ({(job.rankings || []).length})</h3>
        </div>
        {(job.rankings || []).length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th><th>Candidate</th><th>Skill</th><th>Exp</th><th>Edu</th><th>Project</th><th>Cert</th><th>Final Score</th><th>Matching</th><th>Missing</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {job.rankings.map(r => (
                  <tr key={r.id}>
                    <td><span className="badge badge-primary" style={{ fontWeight: 700, fontSize: '0.875rem' }}>#{r.rank}</span></td>
                    <td>
                      <Link to={`/candidates/${r.candidate_id}`} style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {r.candidate?.name || 'Unknown'}
                      </Link>
                    </td>
                    <td>{r.skill_score}%</td>
                    <td>{r.experience_score}%</td>
                    <td>{r.education_score}%</td>
                    <td>{r.project_score}%</td>
                    <td>{r.certification_score}%</td>
                    <td>
                      <div className={`score-circle ${getScoreClass(r.final_score)}`} style={{ width: 42, height: 42, fontSize: '0.75rem' }}>
                        {r.final_score}%
                      </div>
                    </td>
                    <td>
                      <div className="skill-badges">{(r.matching_skills || []).slice(0, 2).map((s, i) => <span key={i} className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓{s}</span>)}</div>
                    </td>
                    <td>
                      <div className="skill-badges">{(r.missing_skills || []).slice(0, 2).map((s, i) => <span key={i} className="badge badge-danger" style={{ fontSize: '0.65rem' }}>✗{s}</span>)}</div>
                    </td>
                    <td><Link to={`/candidates/${r.candidate_id}`} className="btn btn-ghost btn-sm"><HiOutlineEye /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No rankings yet</h3>
            <p>Click "Rank Candidates" to calculate scores and rank all candidates for this job.</p>
            <button className="btn btn-primary" onClick={handleRank}><HiOutlineChartBar /> Rank Candidates</button>
          </div>
        )}
      </div>
    </div>
  );
}
