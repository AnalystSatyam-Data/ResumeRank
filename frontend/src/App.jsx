import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import CandidateDetail from './pages/CandidateDetail';
import Upload from './pages/Upload';
import Jobs from './pages/Jobs';
import CreateJob from './pages/CreateJob';
import JobDetail from './pages/JobDetail';
import Rankings from './pages/Rankings';
import Compare from './pages/Compare';
import SkillSearch from './pages/SkillSearch';
import Analytics from './pages/Analytics';
import DSAVisualization from './pages/DSAVisualization';
import Settings from './pages/Settings';
import { HiOutlineMenu } from 'react-icons/hi';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e2130',
            color: '#e8eaed',
            border: '1px solid #2a2d3e',
            borderRadius: '8px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <div className="app-layout">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
          <div className="mobile-header">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
              <HiOutlineMenu size={20} />
            </button>
            <div className="sidebar-logo" style={{ width: 32, height: 32, fontSize: '0.875rem' }}>R</div>
            <span style={{ fontWeight: 600 }}>ResumeRank</span>
          </div>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/create" element={<CreateJob />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/search" element={<SkillSearch />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/dsa" element={<DSAVisualization />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
