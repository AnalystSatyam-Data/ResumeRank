import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX, HiOutlineSave } from 'react-icons/hi';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.get().then(res => {
      setSettings(res.settings || {});
    }).catch(() => toast.error('Failed to load settings')).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    try {
      await settingsAPI.update({
        skill_weight: settings.skill_weight,
        experience_weight: settings.experience_weight,
        education_weight: settings.education_weight,
        project_weight: settings.project_weight,
        certification_weight: settings.certification_weight,
        max_upload_size: settings.max_upload_size,
        theme: settings.theme,
      });
      toast.success('Settings saved');
    } catch (err) { toast.error(err.message); }
  }

  async function addSkill() {
    if (!newSkill.trim()) return;
    try {
      await settingsAPI.addSkill(newSkill.trim());
      toast.success(`Skill "${newSkill.trim()}" added`);
      setNewSkill('');
      const res = await settingsAPI.get();
      setSettings(res.settings || {});
    } catch (err) { toast.error(err.message); }
  }

  async function removeSkill(skill) {
    try {
      await settingsAPI.removeSkill(skill);
      toast.success(`Skill "${skill}" removed`);
      const res = await settingsAPI.get();
      setSettings(res.settings || {});
    } catch (err) { toast.error(err.message); }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading settings...</p></div>;

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1>Settings</h1><p>Configure application preferences</p></div>

      {/* App Info */}
      <div className="card mb-lg">
        <div className="card-title" style={{ marginBottom: '1rem' }}>Application Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Application</span><span>ResumeRank</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Version</span><span>1.0.0</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Description</span><span>Resume Indexing & Candidate Ranking Tool</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Stack</span><span>React + Flask + SQLite</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">DSA Structures</span><span>Hash Table, Trie, Graph, Merge Sort, Max Heap</span></div>
        </div>
      </div>

      {/* Default Weights */}
      <div className="card mb-lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="card-title">Default Scoring Weights</div>
          <button className="btn btn-primary btn-sm" onClick={handleSave}><HiOutlineSave /> Save</button>
        </div>
        {[
          { key: 'skill_weight', label: 'Skill Match' },
          { key: 'experience_weight', label: 'Experience' },
          { key: 'education_weight', label: 'Education' },
          { key: 'project_weight', label: 'Projects' },
          { key: 'certification_weight', label: 'Certifications' },
        ].map(w => (
          <div key={w.key} className="form-group">
            <label className="form-label">{w.label} ({(parseFloat(settings[w.key] || 0) * 100).toFixed(0)}%)</label>
            <input type="range" min="0" max="1" step="0.05" value={settings[w.key] || 0}
              onChange={e => setSettings({ ...settings, [w.key]: e.target.value })} style={{ width: '100%' }} />
          </div>
        ))}
      </div>

      {/* Upload Settings */}
      <div className="card mb-lg">
        <div className="card-title" style={{ marginBottom: '1rem' }}>Upload Settings</div>
        <div className="form-group">
          <label className="form-label">Maximum Resume Upload Size (MB)</label>
          <input className="form-input" type="number" value={settings.max_upload_size || 10} style={{ maxWidth: 150 }}
            onChange={e => setSettings({ ...settings, max_upload_size: e.target.value })} />
        </div>
      </div>

      {/* Theme */}
      <div className="card mb-lg">
        <div className="card-title" style={{ marginBottom: '1rem' }}>Theme Preference</div>
        <select className="form-input" value={settings.theme || 'dark'} onChange={e => setSettings({ ...settings, theme: e.target.value })} style={{ maxWidth: 200 }}>
          <option value="dark">Dark (Default)</option>
          <option value="light">Light (Coming Soon)</option>
        </select>
      </div>

      {/* Skill Dictionary */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: '1rem' }}>
          Skill Dictionary ({(settings.skill_dictionary || []).length} skills)
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input className="form-input" placeholder="Add new skill..." value={newSkill}
            onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()}
            style={{ maxWidth: 300 }} />
          <button className="btn btn-primary btn-sm" onClick={addSkill}><HiOutlinePlus /> Add</button>
        </div>
        <div className="skill-badges" style={{ gap: '6px', maxHeight: 300, overflowY: 'auto' }}>
          {(settings.skill_dictionary || []).map(skill => (
            <span key={skill} className="skill-badge" style={{ cursor: 'pointer' }} onClick={() => removeSkill(skill)}>
              {skill} <HiOutlineX style={{ marginLeft: 4, fontSize: '0.65rem' }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
