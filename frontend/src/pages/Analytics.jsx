import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#14b8a6', '#f43f5e', '#a855f7'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.get().then(res => setData(res)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading analytics...</p></div>;

  const scoreData = data?.score_distribution ? Object.entries(data.score_distribution).map(([range, count]) => ({ range, count })) : [];
  const skillData = data?.skill_counts || [];
  const expData = data?.experience_distribution ? Object.entries(data.experience_distribution).map(([range, count]) => ({ range, count })) : [];
  const eduData = data?.education_distribution || [];
  const statusData = data?.status_distribution || [];
  const jobData = data?.candidates_per_job || [];

  const hasData = (arr) => arr && arr.length > 0 && arr.some(d => (d.count || d.value || 0) > 0);

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1>Analytics</h1><p>Recruitment insights and statistics</p></div>

      <div className="grid-2 mb-xl">
        <div className="chart-container">
          <div className="chart-title">Candidate Score Distribution</div>
          {hasData(scoreData) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="range" tick={{ fill: '#9aa0b0', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9aa0b0', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, color: '#e8eaed' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="Rank candidates to see score distribution" />}
        </div>

        <div className="chart-container">
          <div className="chart-title">Most Common Skills (Top 10)</div>
          {skillData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={skillData.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis type="number" tick={{ fill: '#9aa0b0', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={85} tick={{ fill: '#9aa0b0', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, color: '#e8eaed' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Candidates">
                  {skillData.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No skills indexed yet" />}
        </div>
      </div>

      <div className="grid-2 mb-xl">
        <div className="chart-container">
          <div className="chart-title">Candidates by Experience</div>
          {hasData(expData) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={expData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="range" tick={{ fill: '#9aa0b0', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9aa0b0', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, color: '#e8eaed' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No candidates yet" />}
        </div>

        <div className="chart-container">
          <div className="chart-title">Candidates by Education</div>
          {eduData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={eduData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, count }) => `${name} (${count})`}>
                  {eduData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, color: '#e8eaed' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No candidates yet" />}
        </div>
      </div>

      <div className="grid-2">
        <div className="chart-container">
          <div className="chart-title">Candidates Per Job</div>
          {jobData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={jobData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="name" tick={{ fill: '#9aa0b0', fontSize: 10 }} angle={-15} />
                <YAxis tick={{ fill: '#9aa0b0', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, color: '#e8eaed' }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Ranked Candidates" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="Rank candidates for jobs to see distribution" />}
        </div>

        <div className="chart-container">
          <div className="chart-title">Shortlisted vs Rejected</div>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, count }) => `${name} (${count})`}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.name === 'Shortlisted' ? '#10b981' : entry.name === 'Rejected' ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, color: '#e8eaed' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No candidates yet" />}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--text-muted)' }}>
      <p>{message}</p>
    </div>
  );
}
