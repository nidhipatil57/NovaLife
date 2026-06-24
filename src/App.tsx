import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import ParticleField from './effects/ParticleField';
import CursorGlow from './effects/CursorGlow';

// Landing
import LandingPage from './pages/LandingPage';

// Auth
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Dashboard Layout (shared sidebar)
import DashboardLayout from './components/dashboard/DashboardLayout';

// Dashboard Pages
import DashboardHome from './pages/DashboardHome';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import GoalsPage from './pages/GoalsPage';
import HabitsPage from './pages/HabitsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import FocusPage from './pages/FocusPage';
import SettingsPage from './pages/SettingsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import BrainDumpPage from './pages/BrainDumpPage';
import RescueModePage from './pages/RescueModePage';


function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ParticleField />
      <CursorGlow />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Dashboard Routes — Shared Layout with Sidebar */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/brain-dump" element={<BrainDumpPage />} />
          <Route path="/rescue" element={<RescueModePage />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
