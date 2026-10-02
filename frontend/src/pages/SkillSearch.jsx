import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineSearch } from 'react-icons/hi';

export default function SkillSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    searchAPI.skills('').then(res => setAllSkills(res.skills || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      searchAPI.skills(query).then(res => setSuggestions(res.skills || [])).catch(() => {});
    } else {
      setSuggestions([]);
    }
  }, [query]);

  async function searchCandidates(skillName) {
    setSelectedSkill(skillName);
    setQuery(skillName);
    setSuggestions([]);
    setLoading(true);
    try {
      const res = await searchAPI.candidates({ skill: skillName });
      setCandidates(res.candidates || []);
    } catch (err) { toast.error('Search failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1>Skill Search</h1><p>Search candidates by skills using Trie-powered autocomplete and Hash Table index</p></div>

      <div className="card mb-lg">
        <div style={{ position: 'relative' }}>
          <div className="search-container">
            <HiOutlineSearch className="search-icon" />
            <input className="search-input" placeholder='Type a skill (e.g. "Py" for Python)...' value={query}
              onChange={e => { setQuery(e.target.value); setSelectedSkill(''); }}
              style={{ fontSize: '1rem', padding: '0.875rem 1rem 0.875rem 40px' }} />
          </div>
          {suggestions.length > 0 && !selectedSkill && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 50, maxHeight: 300, overflow: 'auto', marginTop: 4, boxShadow: 'var(--shadow-lg)' }}>
              {suggestions.map(s => (
                <div key={s.name} onClick={() => searchCandidates(s.name)}
                  style={{ padding: '0.625rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                  <span className="badge badge-neutral">{s.count} candidate{s.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          💡 Autocomplete powered by custom <strong>Trie</strong> • Candidate lookup powered by custom <strong>Hash Table</strong>
        </div>
      </div>

      {/* Popular Skills */}
      {!selectedSkill && allSkills.length > 0 && (
        <div className="card mb-lg">
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>Popular Skills</div>
          <div className="skill-badges" style={{ gap: '8px' }}>
            {allSkills.filter(s => s.count > 0).sort((a, b) => b.count - a.count).slice(0, 20).map(s => (
              <button key={s.name} className="skill-badge" style={{ cursor: 'pointer', border: 'none' }} onClick={() => searchCandidates(s.name)}>
                {s.name} ({s.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {selectedSkill && (
        <div className="table-container">
          <div className="table-header">
            <h3>Candidates with <span className="skill-badge">{selectedSkill}</span> ({candidates.length})</h3>
          </div>
          {loading ? (
            <div className="loading-container"><div className="spinner" /><p>Searching...</p></div>
          ) : candidates.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Candidate</th><th>Email</th><th>Experience</th><th>Education</th><th>All Skills</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id}>
                      <td><Link to={`/candidates/${c.id}`} style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</Link></td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                      <td>{c.experience_years}yr</td>
                      <td>{c.education || '—'}</td>
                      <td>
                        <div className="skill-badges">
                          {(c.skills || []).slice(0, 4).map(s => (
                            <span key={s.id} className={`skill-badge ${s.name.toLowerCase() === selectedSkill.toLowerCase() ? '' : ''}`}
                              style={s.name.toLowerCase() === selectedSkill.toLowerCase() ? { background: 'rgba(16,185,129,0.15)', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' } : {}}>
                              {s.name}
                            </span>
                          ))}
                          {(c.skills || []).length > 4 && <span className="badge badge-neutral">+{c.skills.length - 4}</span>}
                        </div>
                      </td>
                      <td><span className={`badge ${c.status === 'Shortlisted' ? 'badge-success' : c.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><h3>No candidates found</h3><p>No candidates have the skill "{selectedSkill}".</p></div>
          )}
        </div>
      )}
    </div>
  );
}
