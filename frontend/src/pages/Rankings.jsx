import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI, candidateAPI, optimizationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineChartBar, HiOutlineEye, HiOutlineCheck, HiOutlineX, HiOutlineLightningBolt } from 'react-icons/hi';

export default function Rankings() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [rankings, setRankings] = useState([]);
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [topK, setTopK] = useState('');
  const [ranking, setRanking] = useState(false);

  // Optimization States (DSA Unit 3 & 4)
  const [optAlgorithm, setOptAlgorithm] = useState('knapsack');
  const [optCapacity, setOptCapacity] = useState(15);
  const [optMaxCandidates, setOptMaxCandidates] = useState(3);
  const [optLoading, setOptLoading] = useState(false);
  const [optResult, setOptResult] = useState(null);

  async function handleRunOptimization() {
    if (!selectedJob) {
      toast.error('Please select a job first');
      return;
    }
    const cap = parseInt(optCapacity, 10);
    if (isNaN(cap) || cap <= 0) {
      toast.error('Please enter a valid interview capacity (hours > 0)');
      return;
    }

    setOptLoading(true);
    try {
      toast.loading(`Running ${optAlgorithm === 'knapsack' ? '0/1 Knapsack' : 'Branch & Bound'}...`, { id: 'opt' });
      let res;
      if (optAlgorithm === 'knapsack') {
        res = await optimizationAPI.knapsack({
          job_id: parseInt(selectedJob, 10),
          capacity: cap,
        });
      } else {
        const maxC = parseInt(optMaxCandidates, 10) || 3;
        res = await optimizationAPI.branchBound({
          job_id: parseInt(selectedJob, 10),
          capacity: cap,
          max_candidates: maxC,
        });
      }
      setOptResult(res);
      toast.success('Optimal candidate cohort selected!', { id: 'opt' });
    } catch (err) {
      toast.error(err.message || 'Optimization failed', { id: 'opt' });
    } finally {
      setOptLoading(false);
    }
  }

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

      {/* ============================================================== */}
      {/* CANDIDATE SELECTION OPTIMIZER (DSA UNIT 3 & UNIT 4)            */}
      {/* ============================================================== */}
      {selectedJob && (
        <div className="card mt-lg" style={{ marginTop: '2rem', border: '1px solid var(--border)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-primary" style={{ padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700 }}>DSA UNIT 3 & 4</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Candidate Selection Optimizer</h3>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Select optimal candidate subsets under recruiter interview capacity & hiring constraints
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Optimization Algorithm</label>
              <select className="form-input" value={optAlgorithm} onChange={e => { setOptAlgorithm(e.target.value); setOptResult(null); }}>
                <option value="knapsack">Unit 3: 0/1 Knapsack (Dynamic Programming)</option>
                <option value="branchbound">Unit 4: Branch and Bound (LCBB Multi-Constraint)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Available Capacity (Interview Hours)</label>
              <input
                type="number"
                min="1"
                max="100"
                className="form-input"
                value={optCapacity}
                onChange={e => setOptCapacity(e.target.value)}
                placeholder="e.g. 15"
              />
            </div>

            {optAlgorithm === 'branchbound' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Maximum Candidates (Headcount Quota)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="form-input"
                  value={optMaxCandidates}
                  onChange={e => setOptMaxCandidates(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleRunOptimization}
              disabled={optLoading}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: 42, marginBottom: 0 }}
            >
              <HiOutlineLightningBolt /> {optLoading ? 'Optimizing...' : 'Run Optimization'}
            </button>
          </div>

          {optResult && (
            <div className="animate-fadeIn" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              {/* Summary Cards */}
              <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
                <div className="summary-card">
                  <div className="summary-card-value" style={{ color: 'var(--accent-primary-hover)' }}>
                    {optResult.total_score?.toFixed(1) || 0}
                  </div>
                  <div className="summary-card-label">Total Score Achieved</div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-value">
                    {optResult.total_cost} / {optResult.capacity} hrs
                  </div>
                  <div className="summary-card-label">Interview Resource Usage</div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-value" style={{ color: 'var(--success)' }}>
                    {optResult.selected_count} {optResult.max_candidates ? `/ ${optResult.max_candidates}` : ''}
                  </div>
                  <div className="summary-card-label">Candidates Selected</div>
                </div>
                {optResult.statistics && (
                  <>
                    <div className="summary-card">
                      <div className="summary-card-value">{optResult.statistics.states_explored}</div>
                      <div className="summary-card-label">States Explored</div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-card-value" style={{ color: 'var(--warning)' }}>
                        {optResult.statistics.branches_pruned}
                      </div>
                      <div className="summary-card-label">Branches Pruned</div>
                    </div>
                  </>
                )}
              </div>

              {/* Selected Candidates Table */}
              <div className="table-container" style={{ marginBottom: '1rem' }}>
                <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>Selected Candidates — {optResult.algorithm}</h4>
                  <span className="badge badge-success">Optimality Guaranteed</span>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Selection #</th>
                        <th>Candidate Name</th>
                        <th>Match Score</th>
                        <th>Interview Resource Cost</th>
                        <th>Efficiency (Score/Cost)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(optResult.selected_candidates || []).map((cand, idx) => (
                        <tr key={cand.id || idx}>
                          <td><span className="badge badge-primary">#{idx + 1}</span></td>
                          <td>
                            <Link to={`/candidates/${cand.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {cand.name}
                            </Link>
                          </td>
                          <td>
                            <div className={`score-circle ${getScoreClass(cand.score)}`} style={{ width: 34, height: 34, fontSize: '0.8125rem' }}>
                              {(cand.score || 0).toFixed(0)}%
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{cand.cost} hours</span>
                          </td>
                          <td>
                            <span className="badge badge-primary">
                              {((cand.score || 0) / (cand.cost || 1)).toFixed(2)} pts/hr
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Viva-Friendly Algorithmic Justification */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-primary-hover)', marginBottom: '0.25rem' }}>
                  DSA Algorithmic Justification:
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {optAlgorithm === 'knapsack' ? (
                    <>
                      <strong>Unit 3 (0/1 Knapsack):</strong> Using dynamic programming with recurrence{' '}
                      <code>DP[i][w] = max(DP[i-1][w], DP[i-1][w-cost] + score)</code>, the C optimizer constructed the 2D state table in <strong>O(N &times; W)</strong> time. Backtracking reconstructed this global optimum without exceeding the {optResult.capacity}-hour interview capacity.
                    </>
                  ) : (
                    <>
                      <strong>Unit 4 (Branch & Bound):</strong> Using Least-Cost / Max-Bound Branch and Bound (LCBB), the C optimizer prioritized states by fractional upper bound relaxation while enforcing both interview capacity (&le; {optResult.capacity} hrs) and headcount quota (&le; {optResult.max_candidates} candidates). It explored {optResult.statistics?.states_explored} states and pruned {optResult.statistics?.branches_pruned} suboptimal subtrees.
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
