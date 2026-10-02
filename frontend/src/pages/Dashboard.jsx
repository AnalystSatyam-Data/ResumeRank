import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, candidateAPI, jobAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HiOutlineUsers, HiOutlineDocumentText, HiOutlineBriefcase, HiOutlineLightningBolt, HiOutlineStar, HiOutlineTrendingUp, HiOutlineUpload, HiOutlinePlus, HiOutlineChartBar } from 'react-icons/hi';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#14b8a6'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [analytics, candidatesRes, jobsRes] = await Promise.all([
        analyticsAPI.get(),
        candidateAPI.getAll({ per_page: 8, sort_by: 'created_at', sort_order: 'desc' }),
        jobAPI.getAll(),
      ]);
      setData(analytics);
      setRecentCandidates(candidatesRes.candidates || []);
      setJobs(jobsRes.jobs || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const skillData = (data?.skill_counts || []).slice(0, 8);
  const scoreData = data?.score_distribution ? Object.entries(data.score_distribution).map(([range, count]) => ({ range, count })) : [];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>{getGreeting()}, Recruiter 👋</h1>
        <p>Here's your recruitment overview</p>
        <div className="page-header-actions">
          <Link to="/upload" className="btn btn-primary"><HiOutlineUpload /> Upload Resume</Link>
          <Link to="/jobs/create" className="btn btn-secondary"><HiOutlinePlus /> Create Job</Link>
          <Link to="/rankings" className="btn btn-secondary"><HiOutlineChartBar /> Rank Candidates</Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
            <HiOutlineUsers />
          </div>
          <div className="summary-card-value">{summary.total_candidates || 0}</div>
          <div className="summary-card-label">Total Candidates</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
            <HiOutlineDocumentText />
          </div>
          <div className="summary-card-value">{summary.resumes_processed || 0}</div>
          <div className="summary-card-label">Resumes Processed</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
            <HiOutlineBriefcase />
          </div>
          <div className="summary-card-value">{summary.active_jobs || 0}</div>
          <div className="summary-card-label">Active Jobs</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'rgba(236,72,153,0.12)', color: '#f472b6' }}>
            <HiOutlineLightningBolt />
          </div>
          <div className="summary-card-value">{summary.indexed_skills || 0}</div>
          <div className="summary-card-label">Indexed Skills</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
            <HiOutlineTrendingUp />
          </div>
          <div className="summary-card-value">{summary.average_score || 0}%</div>
          <div className="summary-card-label">Avg Match Score</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
            <HiOutlineStar />
          </div>
          <div className="summary-card-value" style={{ fontSize: '1.25rem' }}>
            {summary.top_candidate ? summary.top_candidate.name : '—'}
          </div>
          <div className="summary-card-label">
            Top Candidate {summary.top_candidate ? `— ${summary.top_candidate.score}%` : ''}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2 mb-xl">
        <div className="chart-container">
          <div className="chart-title">Candidate Score Distribution</div>
          {scoreData.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="range" tick={{ fill: '#9aa0b0', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9aa0b0', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, color: '#e8eaed' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="text-muted">No ranking data yet. Rank candidates against a job to see score distribution.</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <div className="chart-title">Most Common Skills</div>
          {skillData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={skillData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis type="number" tick={{ fill: '#9aa0b0', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#9aa0b0', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, color: '#e8eaed' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {skillData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="text-muted">No skills indexed yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Candidates */}
      <div className="grid-2">
        <div className="table-container">
          <div className="table-header">
            <h3>Recent Candidates</h3>
            <Link to="/candidates" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {recentCandidates.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Skills</th>
                    <th>Experience</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCandidates.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/candidates/${c.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {c.name}
                        </Link>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.email}</span>
                      </td>
                      <td>
                        <div className="skill-badges">
                          {(c.skills || []).slice(0, 3).map((s) => (
                            <span key={s.id} className="skill-badge">{s.name}</span>
                          ))}
                          {(c.skills || []).length > 3 && (
                            <span className="badge badge-neutral">+{c.skills.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td>{c.experience_years}yr</td>
                      <td>
                        <span className={`badge ${c.status === 'Shortlisted' ? 'badge-success' : c.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No candidates yet. Upload your first resume to get started.</p>
              <Link to="/upload" className="btn btn-primary btn-sm">Upload Resume</Link>
            </div>
          )}
        </div>

        <div className="table-container">
          <div className="table-header">
            <h3>Active Jobs</h3>
            <Link to="/jobs" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {jobs.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Candidates</th>
                    <th>Top Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0, 6).map((j) => (
                    <tr key={j.id}>
                      <td>
                        <Link to={`/jobs/${j.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {j.title}
                        </Link>
                      </td>
                      <td>{j.candidate_count || 0}</td>
                      <td>{j.top_score ? `${j.top_score}%` : '—'}</td>
                      <td>
                        <span className={`badge ${j.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No jobs created yet.</p>
              <Link to="/jobs/create" className="btn btn-primary btn-sm">Create Job</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
