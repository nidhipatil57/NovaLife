import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDataContext } from '../../context/DataContext';
import './DashboardLayout.css';

const navItems = [
  { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
  { icon: '✅', label: 'Tasks', path: '/tasks' },
  { icon: '📅', label: 'Calendar', path: '/calendar' },
  { icon: '🎯', label: 'Goals', path: '/goals' },
  { icon: '🔄', label: 'Habits', path: '/habits' },
  { icon: '💰', label: 'Finance', path: '/finance' },
  { icon: '🎧', label: 'Focus', path: '/focus' },
  { icon: '📊', label: 'Analytics', path: '/analytics' },
  { divider: true },
  { icon: '🤖', label: 'AI Assistant', path: '/ai-assistant' },
  { icon: '🧠', label: 'Brain Dump', path: '/brain-dump' },
  { icon: '🚨', label: 'Rescue Mode', path: '/rescue' },
  { divider: true },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
];

// AI Chatbot (floating)
function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi Nidhi! 👋 How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Consume real finance data if logged in
  let transactions: any[] = [];
  let savingsGoals: any[] = [];
  let financialHealthScore = 75;
  try {
    const context = useDataContext();
    transactions = context.transactions || [];
    savingsGoals = context.savingsGoals || [];
    financialHealthScore = context.financialHealthScore || 75;
  } catch (e) {}

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.toLowerCase().trim();
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      // Calculate real time parameters for quick replies
      const balance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
      const currentMonthStr = new Date().toISOString().substring(0, 7);
      const monthlyExpenses = transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const responses: Record<string, string> = {
        'plan my day': "I've analyzed your schedule. Here's your optimized plan:\n\n🔴 2:00 PM — Physics Assignment (2h)\n🔵 4:00 PM — Team Meeting (1h)\n🟡 5:30 PM — Math Test Prep (1.5h)\n🟢 7:00 PM — Gym (1h)\n\nYou have 85% chance of completing everything!",
        'what should i do next': "Based on urgency and your current energy level, I recommend starting with the Physics Assignment. It's due tonight and carries the highest priority score (98/100).",
        'help me study': "Let's create a study sprint! I'll break your material into 25-minute focused sessions with 5-minute breaks. Which subject should we start with?",
        'reschedule': "I've analyzed your remaining tasks. Here's a restructured plan that accounts for your energy levels and time constraints.",
        'balance': `Your available balance is ₹${balance.toLocaleString()}.`,
        'health': `Your Financial Health Score is ${financialHealthScore}/100. Check the Finance Hub to see your savings rate and budget discipline detail.`,
        'goal': savingsGoals.length > 0 
          ? `You have ${savingsGoals.length} savings goals. Primary goal: ${savingsGoals[0].name} (Saved: ₹${Number(savingsGoals[0].saved_amount).toLocaleString()} / ₹${Number(savingsGoals[0].target_amount).toLocaleString()}).`
          : "You haven't set up any savings goals yet. Navigate to 💰 Finance to create a milestone roadmap!",
        'spend': `This month, you have spent a total of ₹${monthlyExpenses.toLocaleString()}. Navigate to the Finance Hub to see a full analytics breakdown.`
      };
      const key = Object.keys(responses).find(k => userMsg.includes(k));
      setMessages(prev => [...prev, {
        role: 'ai',
        text: key ? responses[key] : "I'd be happy to help! Try asking about your 'balance', 'spending', 'savings goal', 'financial health', or ask me to 'plan my day'!"
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen(!open)} aria-label="AI Chat">
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="chatbot-window glass-card-static">
          <div className="chatbot-header">
            <div className="chatbot-avatar"><div className="ai-avatar-inner" style={{ width: 24, height: 24 }}></div></div>
            <div>
              <div className="chatbot-name">NovaLife AI</div>
              <div className="chatbot-status">● Online</div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}><p>{msg.text}</p></div>
            ))}
            {isTyping && (
              <div className="chat-msg ai">
                <div className="typing-indicator" style={{ display: 'flex', gap: '4px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', width: 'fit-content' }}>
                  <span className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }}></span>
                  <span className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }}></span>
                  <span className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
          </div>
          <div className="chatbot-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask NovaLife anything..."
            />
            <button onClick={sendMessage} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const mainRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const prevPathnameRef = useRef<string>(location.pathname);

  // Preserve scroll position of .dash-main per route
  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    // Save scroll position for the previous route
    const prevPath = prevPathnameRef.current;
    if (prevPath !== location.pathname) {
      scrollPositionsRef.current[prevPath] = mainElement.scrollTop;
    }

    // Update prev pathname ref
    prevPathnameRef.current = location.pathname;

    // Restore scroll position for the current route
    const targetScrollTop = scrollPositionsRef.current[location.pathname] || 0;

    // Wait a brief moment for the new page components to finish mounting
    const timer = setTimeout(() => {
      if (mainRef.current) {
        mainRef.current.scrollTop = targetScrollTop;
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const userInitials = displayName.charAt(0).toUpperCase();

  return (
    <div className={`dashboard-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`dash-sidebar glass-card-static ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <div className="logo-orb" style={{ width: 24, height: 24 }}></div>
              {!collapsed && <span className="logo-text" style={{ fontSize: '1rem' }}>Nova<span className="gradient-text">Life</span></span>}
            </Link>
          </div>
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if ('divider' in item && item.divider) {
              return <div key={i} className="sidebar-divider" />;
            }
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={i}
                to={item.path!}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-label">{item.label}</span>}
                {isActive && <div className="sidebar-active-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!collapsed ? (
            <div className="sidebar-user" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="user-avatar-small">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div>
                  <div className="user-name" style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', fontSize: '1.1rem', transition: 'transform 0.2s' }} 
                title="Log Out"
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M9 4H4v16h5" />
                  <path d="M20 12H9" />
                  <path d="M13 8l-4 4 4 4" />
                </svg>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%' }}>
              <div className="user-avatar-small" style={{ margin: '0 auto' }}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" />
                ) : (
                  userInitials
                )}
              </div>
              <button 
                onClick={handleLogout} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '1rem', color: 'var(--text-secondary)', transition: 'transform 0.2s' }} 
                title="Log Out"
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M9 4H4v16h5" />
                  <path d="M20 12H9" />
                  <path d="M13 8l-4 4 4 4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="dash-main" ref={mainRef}>
        <Outlet />
      </main>

      {location.pathname !== '/ai-assistant' && <AIChatbot />}
    </div>
  );
}
