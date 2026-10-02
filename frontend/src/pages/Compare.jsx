import { useState, useEffect } from 'react';
import { candidateAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineScale } from 'react-icons/hi';

export default function Compare() {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    candidateAPI.getAll({ per_page: 100 }).then(res => {
      setCandidates(res.candidates || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function toggleSelect(id) {
    if (selected.includes(id)) {
      setSelected(selected.filter(x => x !== id));
    } else if (selected.length < 4) {
      setSelected([...selected, id]);
    } else {
      toast.error('Maximum 4 candidates for comparison');
    }
  }

  const selectedCandidates = candidates.filter(c => selected.includes(c.id));
  const getScoreClass = (s) => s >= 70 ? 'high' : s >= 40 ? 'medium' : 'low';

  // For comparison, we create pseudo-scores based on available data
  const getBestValue = (field) => {
    const values = selectedCandidates.map(c => {
      if (field === 'skills') return (c.skills || []).length;
      if (field === 'experience') return c.experience_years || 0;
      return 0;
    });
    return Math.max(...values);
  };

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading...</p></div>;

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1>Compare Candidates</h1><p>Select 2–4 candidates to compare side by side</p></div>

      {/* Candidate Picker */}
      <div className="card mb-lg">
        <div className="card-title" style={{ marginBottom: '0.75rem' }}>Select Candidates ({selected.length}/4)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: 300, overflowY: 'auto' }}>
          {candidates.map(c => (
            <button key={c.id} className={`btn btn-sm ${selected.includes(c.id) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleSelect(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedCandidates.length >= 2 ? (
        <div className="table-container">
          <div className="table-header"><h3><HiOutlineScale /> Candidate Comparison</h3></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Attribute</th>
                  {selectedCandidates.map(c => <th key={c.id}>{c.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Education</td>
                  {selectedCandidates.map(c => <td key={c.id}>{c.education || '—'}{c.university ? <br /> : ''}{c.university && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.university}</span>}</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Experience</td>
                  {selectedCandidates.map(c => {
                    const isBest = (c.experience_years || 0) === getBestValue('experience') && selectedCandidates.length > 1;
                    return <td key={c.id} style={isBest ? { color: 'var(--success)', fontWeight: 600 } : {}}>{c.experience_years || 0} years {isBest && '★'}</td>;
                  })}
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Current Role</td>
                  {selectedCandidates.map(c => <td key={c.id}>{c.current_role || '—'}<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.current_company || ''}</span></td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Skills Count</td>
                  {selectedCandidates.map(c => {
                    const count = (c.skills || []).length;
                    const isBest = count === getBestValue('skills') && selectedCandidates.length > 1;
                    return <td key={c.id} style={isBest ? { color: 'var(--success)', fontWeight: 600 } : {}}>{count} skills {isBest && '★'}</td>;
                  })}
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Skills</td>
                  {selectedCandidates.map(c => (
                    <td key={c.id}>
                      <div className="skill-badges" style={{ maxWidth: 250 }}>
                        {(c.skills || []).map(s => <span key={s.id} className="skill-badge" style={{ fontSize: '0.65rem' }}>{s.name}</span>)}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Status</td>
                  {selectedCandidates.map(c => (
                    <td key={c.id}>
                      <span className={`badge ${c.status === 'Shortlisted' ? 'badge-success' : c.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{c.status}</span>
                    </td>
                  ))}
                </tr>
                {/* Common Skills */}
                <tr>
                  <td style={{ fontWeight: 600 }}>Common Skills</td>
                  <td colSpan={selectedCandidates.length}>
                    {(() => {
                      const skillSets = selectedCandidates.map(c => new Set((c.skills || []).map(s => s.name)));
                      const common = [...skillSets[0]].filter(s => skillSets.every(set => set.has(s)));
                      return common.length > 0 ? (
                        <div className="skill-badges">{common.map(s => <span key={s} className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ {s}</span>)}</div>
                      ) : <span className="text-muted">No common skills</span>;
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state card">
          <h3>Select at least 2 candidates</h3>
          <p>Click on candidate names above to add them to the comparison.</p>
        </div>
      )}
    </div>
  );
}
