import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { candidateAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlinePhone, HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlineCheck, HiOutlineX, HiOutlinePencil, HiOutlineSave } from 'react-icons/hi';

export default function CandidateDetail() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => { loadCandidate(); }, [id]);

  async function loadCandidate() {
    try {
      const data = await candidateAPI.getById(id);
      setCandidate(data);
      setEditData({
        name: data.name, email: data.email, phone: data.phone,
        education: data.education, university: data.university,
        graduation_year: data.graduation_year,
        experience_years: data.experience_years,
        current_company: data.current_company, current_role: data.current_role
      });
    } catch (err) { toast.error('Failed to load candidate'); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    try {
      await candidateAPI.update(id, editData);
      toast.success('Candidate updated');
      setEditing(false);
      loadCandidate();
    } catch (err) { toast.error(err.message); }
  }

  async function handleStatus(status) {
    try {
      if (status === 'Shortlisted') await candidateAPI.shortlist(id);
      else await candidateAPI.reject(id);
      toast.success(`Candidate ${status.toLowerCase()}`);
      loadCandidate();
    } catch (err) { toast.error(err.message); }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading candidate...</p></div>;
  if (!candidate) return <div className="empty-state"><h3>Candidate not found</h3></div>;

  const c = candidate;
  const getScoreClass = (s) => s >= 70 ? 'high' : s >= 40 ? 'medium' : 'low';

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                {c.name?.charAt(0)}
              </div>
              <div>
                {editing ? (
                  <input className="form-input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} style={{ fontSize: '1.25rem', fontWeight: 700 }} />
                ) : (
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{c.name}</h1>
                )}
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{c.current_role || 'Candidate'} {c.current_company ? `at ${c.current_company}` : ''}</div>
              </div>
            </div>
            <span className={`badge ${c.status === 'Shortlisted' ? 'badge-success' : c.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{c.status}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {editing ? (
              <>
                <button className="btn btn-primary btn-sm" onClick={handleSave}><HiOutlineSave /> Save</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><HiOutlinePencil /> Edit</button>
                <button className="btn btn-success btn-sm" onClick={() => handleStatus('Shortlisted')}><HiOutlineCheck /> Shortlist</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleStatus('Rejected')}><HiOutlineX /> Reject</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Contact + Education + Experience */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Contact Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <InfoRow icon={<HiOutlineMail />} label="Email" value={editing ? <input className="form-input" value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} /> : c.email || '—'} />
            <InfoRow icon={<HiOutlinePhone />} label="Phone" value={editing ? <input className="form-input" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} /> : c.phone || '—'} />
            <InfoRow icon={<HiOutlineAcademicCap />} label="Education" value={editing ? <input className="form-input" value={editData.education || ''} onChange={e => setEditData({ ...editData, education: e.target.value })} /> : `${c.education || '—'} ${c.university ? `• ${c.university}` : ''} ${c.graduation_year ? `(${c.graduation_year})` : ''}`} />
            <InfoRow icon={<HiOutlineBriefcase />} label="Experience" value={editing ? <input className="form-input" type="number" step="0.5" value={editData.experience_years || ''} onChange={e => setEditData({ ...editData, experience_years: e.target.value })} /> : `${c.experience_years || 0} years`} />
          </div>
        </div>

        {/* Skills */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Skills ({(c.skills || []).length})</div>
          {(c.skills || []).length > 0 ? (
            <div className="skill-badges" style={{ gap: '8px' }}>
              {c.skills.map(s => <span key={s.id} className="skill-badge">{s.name}</span>)}
            </div>
          ) : <p className="text-muted">No skills recorded</p>}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1rem' }}>
        {/* Projects */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Projects ({(c.projects || []).length})</div>
          {(c.projects || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {c.projects.map(p => (
                <div key={p.id} style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{p.description}</div>}
                  {p.technologies && <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary-hover)' }}>Tech: {p.technologies}</div>}
                </div>
              ))}
            </div>
          ) : <p className="text-muted">No projects recorded</p>}
        </div>

        {/* Certifications */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Certifications ({(c.certifications || []).length})</div>
          {(c.certifications || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {c.certifications.map(cert => (
                <div key={cert.id} style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cert.name}</div>
                  {cert.issuer && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Issued by: {cert.issuer}</div>}
                </div>
              ))}
            </div>
          ) : <p className="text-muted">No certifications recorded</p>}
        </div>
      </div>

      {/* Job Matching */}
      {(c.rankings || []).length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>Job Matching Results</div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Job</th><th>Rank</th><th>Skill</th><th>Exp</th><th>Edu</th><th>Project</th><th>Cert</th><th>Final</th><th>Matching</th><th>Missing</th>
                </tr>
              </thead>
              <tbody>
                {c.rankings.map(r => (
                  <tr key={r.id}>
                    <td><Link to={`/jobs/${r.job_id}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.job_title}</Link></td>
                    <td><span className="badge badge-primary">#{r.rank}</span></td>
                    <td>{r.skill_score}%</td>
                    <td>{r.experience_score}%</td>
                    <td>{r.education_score}%</td>
                    <td>{r.project_score}%</td>
                    <td>{r.certification_score}%</td>
                    <td><span className={`badge ${getScoreClass(r.final_score) === 'high' ? 'badge-success' : getScoreClass(r.final_score) === 'medium' ? 'badge-warning' : 'badge-danger'}`}>{r.final_score}%</span></td>
                    <td><div className="skill-badges">{(r.matching_skills || []).slice(0, 3).map((s, i) => <span key={i} className="skill-badge" style={{ fontSize: '0.65rem' }}>✓ {s}</span>)}</div></td>
                    <td><div className="skill-badges">{(r.missing_skills || []).slice(0, 3).map((s, i) => <span key={i} className="badge badge-danger" style={{ fontSize: '0.65rem' }}>✗ {s}</span>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {c.rankings[0]?.explanation && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--accent-primary-hover)' }}>Why this ranking:</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{c.rankings[0].explanation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '0.875rem' }}>{value}</div>
      </div>
    </div>
  );
}
