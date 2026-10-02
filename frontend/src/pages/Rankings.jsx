import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI, candidateAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineChartBar, HiOutlineEye, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

export default function Rankings() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [rankings, setRankings] = useState([]);
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [topK, setTopK] = useState('');
  const [ranking, setRanking] = useState(false);

  useEffect(() => {
    jobAPI.getAll().then(res => {
      setJobs(res.jobs || []);
      if (res.jobs?.length > 0) setSelectedJob(res.jobs[0].id.toString());
    });
  }, []);

  useEffect(() => {
    if (selectedJob) loadRankings();
  }, [selectedJob, topK]);

  async function loadRankings() {
    setLoading(true);
    try {
      const params = {};
      if (topK) params.top_k = topK;
      const res = await jobAPI.getRankings(selectedJob, params);
      setRankings(res.rankings || []);
      setJobData(res.job);
    } catch (err) { toast.error('Failed to load rankings'); }
    finally { setLoading(false); }
  }

  async function handleRank() {
    if (!selectedJob) return;
    setRanking(true);
    try {
      toast.loading('Calculating rankings...', { id: 'rank' });
      await jobAPI.rank(selectedJob);
      toast.success('Rankings calculated!', { id: 'rank' });
      loadRankings();
    } catch (err) { toast.error(err.message, { id: 'rank' }); }
    finally { setRanking(false); }
  }

  async function handleShortlist(id) {
    try { await candidateAPI.shortlist(id); toast.success('Candidate shortlisted'); loadRankings(); }
    catch (err) { toast.error(err.message); }
  }

  async function handleReject(id) {
    try { await candidateAPI.reject(id); toast.success('Candidate rejected'); loadRankings(); }
    catch (err) { toast.error(err.message); }
  }

  const getScoreClass = (s) => s >= 70 ? 'high' : s >= 40 ? 'medium' : 'low';

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1>Candidate Rankings</h1><p>View and manage candidate rankings for each job</p></div>

      <div className="card mb-lg">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label className="form-label">Select Job</label>
            <select className="form-input" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
              <option value="">Choose a job...</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 120, marginBottom: 0 }}>
            <label className="form-label">Top-K</label>
            <select className="form-input" value={topK} onChange={e => setTopK(e.target.value)}>
              <option value="">All</option>
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleRank} disabled={!selectedJob || ranking} style={{ marginBottom: 0 }}>
            <HiOutlineChartBar /> {ranking ? 'Ranking...' : 'Rank Candidates'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading rankings...</p></div>
      ) : rankings.length > 0 ? (
        <div className="table-container">
          <div className="table-header">
            <h3>{topK ? `Top ${topK}` : 'All'} Candidates — {jobData?.title}</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th><th>Candidate</th><th>Skill Match</th><th>Experience</th><th>Education</th><th>Projects</th><th>Certs</th><th>Final Score</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map(r => {
                  const cand = r.candidate || {};
                  return (
                    <tr key={r.candidate_id}>
                      <td><span className="badge badge-primary" style={{ fontWeight: 700, fontSize: '0.9375rem', padding: '4px 14px' }}>#{r.rank}</span></td>
                      <td>
                        <Link to={`/candidates/${r.candidate_id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {r.name || cand.name}
                        </Link>
                      </td>
                      <td><div className="score-bar"><div className="score-bar-track" style={{ width: 60 }}><div className={`score-bar-fill ${getScoreClass(r.skill_score)}`} style={{ width: `${r.skill_score}%` }} /></div><span className="score-bar-value">{r.skill_score}%</span></div></td>
                      <td>{r.experience_score}%</td>
                      <td>{r.education_score}%</td>
                      <td>{r.project_score}%</td>
                      <td>{r.certification_score}%</td>
                      <td><div className={`score-circle ${getScoreClass(r.final_score)}`}>{r.final_score}%</div></td>
                      <td><span className={`badge ${cand.status === 'Shortlisted' ? 'badge-success' : cand.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{cand.status || '—'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <Link to={`/candidates/${r.candidate_id}`} className="btn btn-ghost btn-sm"><HiOutlineEye /></Link>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--success)' }} onClick={() => handleShortlist(r.candidate_id)}><HiOutlineCheck /></button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleReject(r.candidate_id)}><HiOutlineX /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rankings[0]?.explanation && (
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--accent-primary-hover)' }}>Top Candidate Analysis:</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{rankings[0].explanation}</div>
            </div>
          )}
        </div>
      ) : selectedJob ? (
        <div className="empty-state card">
          <h3>No rankings yet</h3>
          <p>Click "Rank Candidates" to calculate scores for this job.</p>
          <button className="btn btn-primary" onClick={handleRank}><HiOutlineChartBar /> Rank Candidates</button>
        </div>
      ) : (
        <div className="empty-state card">
          <h3>Select a job</h3>
          <p>Choose a job from the dropdown to view or generate rankings.</p>
        </div>
      )}
    </div>
  );
}
