import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidateAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineEye, HiOutlinePencil, HiOutlineTrash, HiOutlineCheck, HiOutlineX, HiOutlineUpload } from 'react-icons/hi';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [isAdmin, setIsAdmin] = useState(true);

  useEffect(() => { loadCandidates(); }, [search, statusFilter]);

  async function loadCandidates() {
    try {
      setLoading(true);
      const params = { per_page: 100 };
      if (search) params.name = search;
      if (statusFilter) params.status = statusFilter;
      const res = await candidateAPI.getAll(params);
      setCandidates(res.candidates || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Are you sure? This will permanently delete all candidates and their associated resume data.")) {
      return;
    }
    try {
      setLoading(true);
      await candidateAPI.clearAll();
      toast.success("All candidates cleared successfully");
      await loadCandidates();
    } catch (err) {
      toast.error(err.message || "Failed to clear candidates");
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await candidateAPI.delete(id);
      toast.success(`${name} deleted`);
      loadCandidates();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleShortlist(id, name) {
    try {
      await candidateAPI.shortlist(id);
      toast.success(`${name} shortlisted`);
      loadCandidates();
    } catch (err) { toast.error(err.message); }
  }

  async function handleReject(id, name) {
    try {
      await candidateAPI.reject(id);
      toast.success(`${name} rejected`);
      loadCandidates();
    } catch (err) { toast.error(err.message); }
  }

  const getScoreClass = (score) => score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return (
    <div className="animate-fadeIn">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Candidates</h1>
          <p>{total} candidates in database</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              id="admin-mode-toggle"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 500, color: isAdmin ? 'var(--danger)' : 'var(--text-secondary)' }}>
              {isAdmin ? 'Admin Mode (Active)' : 'Admin Mode (Inactive)'}
            </span>
          </label>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
            <div className="search-container" style={{ flex: 1, minWidth: 200, maxWidth: 350 }}>
              <HiOutlineSearch className="search-icon" />
              <input
                type="text" className="search-input" placeholder="Search by name or email..."
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="form-input" style={{ width: 'auto', minWidth: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isAdmin && (
              <button
                id="clear-all-candidates-btn"
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleClearAll}
                title="Admin: Clear all candidate records and resume data"
              >
                <HiOutlineTrash /> Clear All Candidates
              </button>
            )}
            <Link to="/upload" className="btn btn-primary btn-sm"><HiOutlineUpload /> Upload</Link>
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><p>Loading candidates...</p></div>
        ) : candidates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No candidates yet</h3>
            <p>Upload your first resume to start indexing candidates.</p>
            <Link to="/upload" className="btn btn-primary">Upload Resume</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Candidate</th>
                  <th>Email</th>
                  <th>Experience</th>
                  <th>Education</th>
                  <th>Skills</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>{i + 1}</td>
                    <td>
                      <Link to={`/candidates/${c.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {c.name}
                      </Link>
                      {c.current_role && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.current_role}</div>}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                    <td>{c.experience_years || 0} yr</td>
                    <td>{c.education || '—'}</td>
                    <td>
                      <div className="skill-badges">
                        {(c.skills || []).slice(0, 3).map((s) => (
                          <span key={s.id} className="skill-badge">{s.name}</span>
                        ))}
                        {(c.skills || []).length > 3 && <span className="badge badge-neutral">+{c.skills.length - 3}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'Shortlisted' ? 'badge-success' : c.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <Link to={`/candidates/${c.id}`} className="btn btn-ghost btn-sm" title="View"><HiOutlineEye /></Link>
                        <button className="btn btn-ghost btn-sm" title="Shortlist" onClick={() => handleShortlist(c.id, c.name)} style={{ color: 'var(--success)' }}><HiOutlineCheck /></button>
                        <button className="btn btn-ghost btn-sm" title="Reject" onClick={() => handleReject(c.id, c.name)} style={{ color: 'var(--warning)' }}><HiOutlineX /></button>
                        <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => handleDelete(c.id, c.name)} style={{ color: 'var(--danger)' }}><HiOutlineTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
