import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI, searchAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX } from 'react-icons/hi';

export default function CreateJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', minimum_experience: 0, education_requirement: 'B.Tech',
    skill_weight: 50, experience_weight: 20, education_weight: 15, project_weight: 10, certification_weight: 5,
  });
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [preferredSkills, setPreferredSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [addingTo, setAddingTo] = useState('required');
  const [submitting, setSubmitting] = useState(false);

  const totalWeight = form.skill_weight + form.experience_weight + form.education_weight + form.project_weight + form.certification_weight;

  async function handleSkillSearch(q) {
    setSkillInput(q);
    if (q.length > 0) {
      try {
        const res = await searchAPI.skills(q);
        setSkillSuggestions((res.skills || []).map(s => s.name));
      } catch { setSkillSuggestions([]); }
    } else { setSkillSuggestions([]); }
  }

  function addSkill(name) {
    if (addingTo === 'required' && !requiredSkills.includes(name)) {
      setRequiredSkills([...requiredSkills, name]);
    } else if (addingTo === 'preferred' && !preferredSkills.includes(name)) {
      setPreferredSkills([...preferredSkills, name]);
    }
    setSkillInput('');
    setSkillSuggestions([]);
  }

  function addCustomSkill() {
    if (skillInput.trim()) addSkill(skillInput.trim());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Job title is required'); return; }
    if (totalWeight !== 100) { toast.error(`Weights must sum to 100%. Current: ${totalWeight}%`); return; }

    setSubmitting(true);
    try {
      await jobAPI.create({
        ...form,
        skill_weight: form.skill_weight / 100,
        experience_weight: form.experience_weight / 100,
        education_weight: form.education_weight / 100,
        project_weight: form.project_weight / 100,
        certification_weight: form.certification_weight / 100,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
      });
      toast.success('Job created successfully');
      navigate('/jobs');
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1>Create Job</h1><p>Define job requirements and scoring weights</p></div>
      <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
        <div className="card mb-lg">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Job Details</div>
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Software Developer" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Job description..." rows={3} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Minimum Experience (years)</label>
              <input className="form-input" type="number" min="0" step="0.5" value={form.minimum_experience} onChange={e => setForm({ ...form, minimum_experience: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label className="form-label">Education Requirement</label>
              <select className="form-input" value={form.education_requirement} onChange={e => setForm({ ...form, education_requirement: e.target.value })}>
                <option value="">Any</option>
                <option value="Diploma">Diploma</option>
                <option value="B.Tech">B.Tech / B.E.</option>
                <option value="B.Sc">B.Sc / BCA</option>
                <option value="M.Tech">M.Tech / M.E.</option>
                <option value="M.S.">M.S. / MCA</option>
                <option value="MBA">MBA</option>
                <option value="Ph.D">Ph.D</option>
              </select>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card mb-lg">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Skills</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button type="button" className={`btn btn-sm ${addingTo === 'required' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAddingTo('required')}>Required</button>
            <button type="button" className={`btn btn-sm ${addingTo === 'preferred' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAddingTo('preferred')}>Preferred</button>
          </div>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="form-input" placeholder={`Search and add ${addingTo} skills...`} value={skillInput} onChange={e => handleSkillSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addCustomSkill}><HiOutlinePlus /></button>
            </div>
            {skillSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 50, maxHeight: 200, overflow: 'auto', marginTop: 4 }}>
                {skillSuggestions.map(s => (
                  <div key={s} onClick={() => addSkill(s)} style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.target.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Required Skills ({requiredSkills.length})</div>
            <div className="skill-badges">{requiredSkills.map(s => (
              <span key={s} className="skill-badge" style={{ cursor: 'pointer' }} onClick={() => setRequiredSkills(requiredSkills.filter(x => x !== s))}>{s} <HiOutlineX style={{ marginLeft: 4 }} /></span>
            ))}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Preferred Skills ({preferredSkills.length})</div>
            <div className="skill-badges">{preferredSkills.map(s => (
              <span key={s} className="badge badge-neutral" style={{ cursor: 'pointer' }} onClick={() => setPreferredSkills(preferredSkills.filter(x => x !== s))}>{s} <HiOutlineX style={{ marginLeft: 4 }} /></span>
            ))}</div>
          </div>
        </div>

        {/* Weights */}
        <div className="card mb-lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="card-title">Scoring Weights</div>
            <span className={`badge ${totalWeight === 100 ? 'badge-success' : 'badge-danger'}`}>Total: {totalWeight}%</span>
          </div>
          {[
            { key: 'skill_weight', label: 'Skill Match', default_val: 50 },
            { key: 'experience_weight', label: 'Experience', default_val: 20 },
            { key: 'education_weight', label: 'Education', default_val: 15 },
            { key: 'project_weight', label: 'Projects', default_val: 10 },
            { key: 'certification_weight', label: 'Certifications', default_val: 5 },
          ].map(w => (
            <div key={w.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ minWidth: 120, fontSize: '0.875rem' }}>{w.label}</div>
              <input type="range" min="0" max="100" step="5" value={form[w.key]} onChange={e => setForm({ ...form, [w.key]: parseInt(e.target.value) })} style={{ flex: 1 }} />
              <div style={{ minWidth: 40, textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>{form[w.key]}%</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || totalWeight !== 100}>
            {submitting ? 'Creating...' : 'Create Job'}
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/jobs')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
