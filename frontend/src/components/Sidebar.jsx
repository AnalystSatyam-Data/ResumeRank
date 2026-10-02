import { NavLink } from 'react-router-dom';
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineUpload, HiOutlineBriefcase,
  HiOutlineChartBar, HiOutlineScale, HiOutlineSearch, HiOutlineChartPie,
  HiOutlineCube, HiOutlineCog, HiOutlineChevronLeft, HiOutlineChevronRight
} from 'react-icons/hi';

const navItems = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
  { to: '/candidates', icon: HiOutlineUsers, label: 'Candidates' },
  { to: '/upload', icon: HiOutlineUpload, label: 'Upload Resumes' },
  { to: '/jobs', icon: HiOutlineBriefcase, label: 'Jobs' },
  { to: '/rankings', icon: HiOutlineChartBar, label: 'Rankings' },
  { to: '/compare', icon: HiOutlineScale, label: 'Compare' },
  { to: '/search', icon: HiOutlineSearch, label: 'Skill Search' },
  { to: '/analytics', icon: HiOutlineChartPie, label: 'Analytics' },
  { to: '/dsa', icon: HiOutlineCube, label: 'DSA Visualization' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const className = `sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`;

  return (
    <>
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={className}>
        <div className="sidebar-header">
          <div className="sidebar-logo">R</div>
          {!collapsed && (
            <div className="sidebar-brand">
              <h1>ResumeRank</h1>
              <p>Indexing & Ranking Tool</p>
            </div>
          )}
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
            >
              <Icon className="nav-icon" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-toggle">
          <button onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <HiOutlineChevronRight /> : <><HiOutlineChevronLeft /> <span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
