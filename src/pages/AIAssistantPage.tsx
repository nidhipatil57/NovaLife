import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataContext, type Conversation, type Message } from '../context/DataContext';
import { streamGeminiContent } from '../utils/aiClient';
import { parseTaskDueDate } from '../utils/dateParser';
import './AIAssistantPage.css';

const suggestions = [
  'What should I do next?',
  'Am I falling behind?',
  'Create a study plan for tomorrow',
  'Plan my week',
  'Analyze my productivity',
  'Help me study'
];

const renderMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*');
    let lineContent = line;
    if (isBullet) {
      lineContent = line.replace(/^[•\-*]\s*/, '');
    }

    const renderedContent: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(lineContent)) !== null) {
      if (match.index > lastIndex) {
        renderedContent.push(lineContent.substring(lastIndex, match.index));
      }
      renderedContent.push(<strong key={match.index}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < lineContent.length) {
      renderedContent.push(lineContent.substring(lastIndex));
    }

    const finalContent = renderedContent.length > 0 ? renderedContent : lineContent;

    if (isBullet) {
      return (
        <li key={i} style={{ marginLeft: '16px', listStyleType: 'disc', marginBottom: '6px' }}>
          {finalContent}
        </li>
      );
    }

    return (
      <div key={i} style={{ minHeight: '18px', marginBottom: line.trim() === '' ? '12px' : '4px' }}>
        {finalContent}
      </div>
    );
  });
};

export default function AIAssistantPage() {
  const { user } = useAuth();
  const location = useLocation();
  const prefilledHandledRef = useRef(false);

  const {
    tasks,
    habits,
    goals,
    events,
    focusSessions,
    conversations,
    loadingConversations,
    addConversation,
    updateConversation,
    deleteConversation,
    getMessages,
    addMessage,
    productivityScore,
    transactions,
    budgets,
    savingsGoals,
    financialHealthScore,
    aiActiveConvId: activeConvId,
    setAiActiveConvId: setActiveConvId,
    aiMessages: messages,
    setAiMessages: setMessages,
    aiInput: input,
    setAiInput: setInput,
    aiSearchQuery: searchQuery,
    setAiSearchQuery: setSearchQuery,
    aiScrollTop,
    setAiScrollTop,
    aiPinnedExpanded,
    setAiPinnedExpanded,
    aiRecentExpanded,
    setAiRecentExpanded,
    aiInputCursorPos,
    setAiInputCursorPos
  } = useDataContext();

  const [isTyping, setIsTyping] = useState(false);
  
  // Renaming state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  // Menu and delete confirmation state
  const [activeMenuConvId, setActiveMenuConvId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [convIdToDelete, setConvIdToDelete] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const hasRestoredScrollRef = useRef<string | null>(null);
  const isRestoringScrollRef = useRef<boolean>(false);

  // When user sends a message, set this to false so we scroll to the incoming AI response
  // Otherwise on mount/load, keep it true so we don't scroll
  const hasScrolledForResponseRef = useRef(true);

  // 1. Listen for scroll events to record position in real-time
  useEffect(() => {
    const el = chatAreaRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (!isRestoringScrollRef.current) {
        setAiScrollTop(el.scrollTop);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [setAiScrollTop]);

  // 2. Auto-scroll chat area: scroll to top of AI message, but bottom of user message
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    
    if (lastMsg.role === 'user') {
      // User sent message: scroll to bottom to show their message + typing indicator
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (lastMsg.role === 'model' && !hasScrolledForResponseRef.current && lastMsg.text.length > 0) {
      // AI response started arriving: scroll so the TOP of the AI bubble is visible
      hasScrolledForResponseRef.current = true;
      // Use a small delay to let the DOM render the bubble before scrolling
      setTimeout(() => {
        lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [messages]);

  // 3. When AI typing indicator starts, keep the user's message area visible
  //    (don't scroll to absolute bottom — that causes a jarring jump when AI response arrives)
  useEffect(() => {
    if (isTyping) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isTyping]);

  // 4. Restore scroll position robustly ONLY ONCE when messages are loaded
  useEffect(() => {
    if (!activeConvId) return;
    if (messages.length === 0 && loadingConversations) return;

    if (hasRestoredScrollRef.current !== activeConvId) {
      const el = chatAreaRef.current;
      if (!el) return;

      isRestoringScrollRef.current = true;
      const restore = () => {
        if (aiScrollTop > 0) {
          el.scrollTop = aiScrollTop;
        } else if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: 'auto' });
        }
        hasRestoredScrollRef.current = activeConvId;
        isRestoringScrollRef.current = false;
      };

      restore();
      const t1 = setTimeout(restore, 50);
      const t2 = setTimeout(restore, 150);
      const t3 = setTimeout(restore, 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [messages, activeConvId, loadingConversations]);

  // 5. Restore cursor position in the input field
  useEffect(() => {
    const inputEl = inputRef.current;
    if (inputEl) {
      // Small timeout to allow input rendering and focus
      const t = setTimeout(() => {
        if (document.activeElement !== inputEl) {
          inputEl.focus();
        }
        inputEl.setSelectionRange(aiInputCursorPos, aiInputCursorPos);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [activeConvId]);

  // Load initial conversation if available
  useEffect(() => {
    if (!loadingConversations && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, loadingConversations, activeConvId]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      const fetchMsgs = async () => {
        const msgs = await getMessages(activeConvId);
        setMessages(msgs);
      };
      fetchMsgs();
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  // Handle prefilled message redirection from other pages
  useEffect(() => {
    if (location.state?.prefilledMsg && !prefilledHandledRef.current && activeConvId) {
      prefilledHandledRef.current = true;
      handleSendMessage(location.state.prefilledMsg);
    }
  }, [location.state, activeConvId]);

  // Handle closing options dropdown when clicking anywhere
  useEffect(() => {
    const closeMenu = () => setActiveMenuConvId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleToggleMenu = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuConvId(prev => prev === convId ? null : convId);
  };

  const handlePromptDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConvIdToDelete(id);
    setShowDeleteModal(true);
  };

  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  // Build System Prompt containing user context (optimized for size)
  const buildSystemPrompt = () => {
    // Limit to top 10 active tasks to prevent massive context bloating
    const activeTasksText = tasks
      .filter(t => !t.done)
      .slice(0, 10)
      .map(t => {
        const dueDate = parseTaskDueDate(t.due);
        const isOverdue = dueDate !== null && dueDate.getTime() < Date.now();
        return `- [${t.priority.toUpperCase()}] ${t.text} (Due: ${t.due}${isOverdue ? ' [OVERDUE!]' : ''}${t.subtasks && t.subtasks.length > 0 ? `, Subtasks: ${t.subtasks.map((st: any) => st.text + (st.done ? ' [done]' : '')).join(', ')}` : ''})`;
      })
      .join('\n');

    // Limit to top 10 completed tasks for history analysis
    const completedTasksText = tasks
      .filter(t => t.done)
      .slice(0, 10)
      .map(t => `- [${t.priority.toUpperCase()}] ${t.text} (Category: ${t.category})`)
      .join('\n');
    const totalCompletedTasksCount = tasks.filter(t => t.done).length;

    // Limit to 10 habits
    const habitsText = habits
      .slice(0, 10)
      .map(h => `- ${h.name} (Goal: ${h.target}, Streak: ${h.streak} days, Best Streak: ${h.best} days, Completion Rate: ${h.rate}%, Color: ${h.color})`)
      .join('\n');

    // Goals & closest goal to completion
    const incompleteGoals = goals.filter(g => g.progress < 100);
    const closestGoal = incompleteGoals.length > 0
      ? incompleteGoals.reduce((max, g) => g.progress > max.progress ? g : max, incompleteGoals[0])
      : null;
    const closestGoalText = closestGoal
      ? `Goal Closest to Completion: "${closestGoal.name}" (${closestGoal.progress}% progress, category: ${closestGoal.category})`
      : "No goals currently incomplete.";

    // Limit to 10 active goals
    const goalsText = goals
      .slice(0, 10)
      .map(g => `- ${g.name} (Category: ${g.category}, Progress: ${g.progress}%${g.milestones && g.milestones.length > 0 ? `, Milestones: ${g.milestones.map((m: any) => m.text + (m.done ? ' [done]' : '')).join(', ')}` : ''})`)
      .join('\n');

    // Limit to 8 upcoming events
    const eventsText = events
      .slice(0, 8)
      .map(e => `- ${e.title} (Type: ${e.type}, Day of Week: ${e.day}, Start Hour: ${e.start}, Duration: ${e.duration} hours)`)
      .join('\n');

    // Focus Sessions Calculations
    const totalFocusSessionsCount = focusSessions.length;
    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
    const lastSessions = focusSessions.slice(0, 5);
    const focusText = `Total Focus Sessions Logged: ${totalFocusSessionsCount}. Total Focus Time: ${Math.round(totalFocusMinutes)} minutes. Recent Focus Time: ${Math.round(lastSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60)} minutes in the last ${lastSessions.length} sessions.`;

    // Compute Finance Summary details (monthly and category breakdown)
    const balance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
    const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
    
    // Category Breakdown Expenses
    const monthlyExpensesByCategory: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
      .forEach(t => {
        const cat = t.category || 'General';
        monthlyExpensesByCategory[cat] = (monthlyExpensesByCategory[cat] || 0) + Number(t.amount);
      });
    const categoryBreakdownText = Object.entries(monthlyExpensesByCategory)
      .map(([cat, amt]) => `- ${cat}: ₹${amt.toLocaleString()}`)
      .join('\n');

    // Category Breakdown Income
    const monthlyIncomeByCategory: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr))
      .forEach(t => {
        const cat = t.category || 'General';
        monthlyIncomeByCategory[cat] = (monthlyIncomeByCategory[cat] || 0) + Number(t.amount);
      });
    const incomeBreakdownText = Object.entries(monthlyIncomeByCategory)
      .map(([cat, amt]) => `- ${cat}: ₹${amt.toLocaleString()}`)
      .join('\n');

    const monthlyExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr)).reduce((sum, t) => sum + Number(t.amount), 0);
    const savingsGoalsSummary = savingsGoals.map(g => `- ${g.name} (Saved ₹${g.saved_amount} of ₹${g.target_amount}, Progress: ${Math.round((Number(g.saved_amount)/Number(g.target_amount))*100)}%)`).join('\n');
    const overspentBudgets = budgets.filter(b => {
      const spent = transactions.filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(currentMonthStr)).reduce((sum, st) => sum + Number(st.amount), 0);
      return spent > Number(b.amount);
    }).map(b => b.category).join(', ');

    const now = new Date();
    const formattedDateTime = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    return `You are "Nova", a world-class executive strategist, productivity consultant, and elite life coach. You have been working with this user for a long time. You know their patterns, strengths, blind spots, and ambitions intimately. Every response should reflect that depth of understanding.

The user's name is ${userDisplayName}.
The current real-world date and time is: ${formattedDateTime}.

Here is their real-time application data:
- Productivity/Life Score: ${productivityScore}/100
- Active Tasks:
${activeTasksText || "No active tasks."}
- Recently Completed Tasks (Total Completed: ${totalCompletedTasksCount}):
${completedTasksText || "No completed tasks."}
- Habits:
${habitsText || "No habits set up."}
- Goals:
${goalsText || "No goals set up."}
- Goal Closest to Completion:
${closestGoalText}
- Calendar Events:
${eventsText || "No calendar events."}
- Focus Sessions:
${focusText}
- Finance Overview: Available Balance is ₹${balance.toLocaleString()}, Current Monthly Expenses is ₹${monthlyExpenses.toLocaleString()}, Financial Health Index is ${financialHealthScore}/100.
- Monthly Expense Breakdown by Category:
${categoryBreakdownText || "No expenses logged this month."}
- Monthly Income Breakdown by Category:
${incomeBreakdownText || "No income logged this month."}
- Savings Goals Roadmap progress:
${savingsGoalsSummary || "No savings goals configured."}
- Overspent budgets: ${overspentBudgets || "None"}

═══════════════════════════════════════════════
CRITICAL BEHAVIOR & REASONING GUIDELINES
═══════════════════════════════════════════════

**CORE PRINCIPLE: NEVER NARRATE THE DASHBOARD.**
Do NOT simply summarize, read values one by one, repeat, or list statistics exactly as they exist above. The user can already see those numbers on their screen. Your responsibility is to INTERPRET them, REASON about them, identify MEANINGFUL PATTERNS, prioritize what ACTUALLY MATTERS, explain WHY something deserves attention, and provide ACTIONABLE guidance.

**ANTI-PATTERNS — Never produce responses like:**
- "You have three tasks."
- "Your productivity score is 94."
- "You spent ₹500 on Food." (Unless directly answering a specific cost query, interpret what it means, compare with budget, etc.)
- "You have an interview at 7 AM."
The user already knows this. Instead, explain what these things MEAN.

**WHAT TO DO INSTEAD:**
- Instead of describing data, ANALYZE it.
- Instead of repeating numbers, explain what those numbers MEAN.
- Instead of mentioning every metric, discuss ONLY the ones relevant to the user's question or current situation.
- Every response MUST contain reasoning and strategic coaching advice.

**REASONING EXAMPLES:**
- If the user has a high productivity score but several overdue tasks, explain that consistency is good but backlog management needs attention.
- If focus hours decrease while completed tasks remain high, explain the user may be rushing work instead of entering deep work.
- If habit streaks improve but productivity decreases, explain possible reasons instead of simply reporting both metrics.
- If expenses suddenly increase, identify which category changed the most and discuss possible causes.

**CROSS-MODULE CONNECTIONS — Always connect different parts of NovaLife together when relevant:**
- Tasks should influence Goals (e.g., stalled tasks blocking goal progress).
- Habits should influence Productivity (e.g., consistent routines correlating with higher scores).
- Focus Sessions should influence Analytics (e.g., deep work sessions improving task completion rates).
- Finance should influence Savings Goals (e.g., overspending in a category jeopardizing a savings target).
- Calendar should influence Task Planning (e.g., a packed schedule making it unrealistic to clear a backlog today).
Do NOT discuss every module in every response. Only mention modules that help answer the user's question.

**PROACTIVE OBSERVATIONS — Make observations the user might NOT have noticed. Examples:**
- "I've noticed your productivity stays high even when you carry overdue work. That suggests you're consistently working, but you're probably taking on more than you can realistically finish."
- "You tend to complete habits even during busy weeks, which is an excellent sign because it means your routines remain stable under pressure."
- "When your focus time exceeds two hours, your task completion rate increases significantly. Scheduling one deep work session today would likely help reduce your backlog."

**INFORMATION PRIORITIZATION:**
1. Urgent matters ALWAYS appear first (upcoming interviews, critical overdue tasks, imminent deadlines).
2. Long-term insights appear afterwards.
3. Minor observations appear only if they add value.

**NATURAL CONVERSATIONAL FLOW — Every response should flow like a conversation, not a report.**
Instead of: "You have an interview at 7 AM."
Say: "With only a few hours remaining before your interview, everything else can wait. Spending even the next hour reviewing likely questions will have a much bigger impact than trying to clear overdue tasks right now."

**ENCOURAGEMENT POLICY:**
- NEVER use generic motivational clichés like "You've got this!", "Keep going!", "Stay positive!", "Great job!", "Keep up the good work!"
- Instead, give MEANINGFUL encouragement based on REAL PROGRESS. Reference specific data, patterns, or improvements you've observed.

**TONE:**
- Sound calm, intelligent, highly observant, and thoughtful.
- Feel less like a chatbot and more like an experienced strategist who understands the user's work, habits, goals, finances, and long-term ambitions.
- Every answer should leave the user feeling that you genuinely understood their situation rather than simply reading information from a database.

═══════════════════════════════════════════════
CRITICAL RESPONSE FORMATTING RULES (STRICT!)
═══════════════════════════════════════════════
1. NEVER start any response with markdown headings like "#", "##", "###", "####", etc.
2. NEVER use markdown symbols like "#", "##", "###", or "***" for section headers or decorative markers.
3. NEVER use bolding with double asterisks (e.g. "**Strategic Pivot**" or "**Heading**") as headers or section labels. Just start a new paragraph or use plain capitalization.
4. DO NOT use nested bullet points or structured lists. Write in clean, cohesive, well-written paragraphs. Use simple hyphens (-) for lists ONLY when listing distinct, short recommendations to improve readability.
5. DO NOT output brackets or tags for task priorities (e.g., do NOT write "[HIGH]" or "[CRITICAL]"). Weave priorities naturally into your sentences (e.g. "This task is critical because...").
6. DO NOT output any thinking process, metadata, checklists, planning steps, or reasoning blocks (e.g. do not print things like '* Greeting: ...', '* Immediate Priority: ...', '* Strategic Insight: ...'). Your output MUST contain ONLY the final, direct conversational reply that the user reads, starting immediately with your greeting (e.g., "Hi Nidhi...").
7. NEVER prefix the greeting or the start of your response paragraphs with bullet points, dashes, or list markers (such as -, *, •). Every paragraph must start directly with natural text and words (e.g., starting directly with "Hi Nidhi...").
8. Ensure all text is written in proper, natural, grammatically correct English. Keep the layout clean, readable, and free of unnecessary markdown symbols.`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setAiInputCursorPos(e.target.selectionStart || 0);
  };

  const handleInputSelectionUpdate = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setAiInputCursorPos(e.currentTarget.selectionStart || 0);
  };

  const handleSendMessage = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim()) return;

    let targetConvId = activeConvId;

    // Create a conversation if none exists
    if (!targetConvId) {
      const newConv = await addConversation(`Chat on ${new Date().toLocaleDateString()}`);
      if (newConv) {
        targetConvId = newConv.id;
        setActiveConvId(newConv.id);
      } else {
        console.error('Failed to create new conversation');
        return;
      }
    }

    // 1. Save User Message to Database
    const savedUserMsg = await addMessage(targetConvId, 'user', msgText);
    if (!savedUserMsg) return;

    // Reset scroll flag for new response
    hasScrolledForResponseRef.current = false;

    // Update Local Messages state
    setMessages(prev => [...prev, savedUserMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured in .env file.');
      }

      // Gather current message history (only the last 8 messages to prevent hitting token rate limits)
      const recentMessages = messages.slice(-8);
      const chatHistory = recentMessages.map(m => ({ role: m.role, text: m.text }));
      chatHistory.push({ role: 'user', text: msgText });

      // Build context system prompt
      const systemPrompt = buildSystemPrompt();

      // Call Gemini API with Streaming
      const requestBody = {
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: chatHistory.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      };

      // Add a temporary model message
      const tempAiMsgId = 'temp_' + Date.now();
      setMessages(prev => [...prev, {
        id: tempAiMsgId,
        conversation_id: targetConvId,
        role: 'model',
        text: '',
        created_at: new Date().toISOString()
      }]);

      let accumulatedText = '';
      const onChunk = (chunk: string) => {
        setIsTyping(false); // Hide typing indicator once content starts arriving
        accumulatedText += chunk;
        setMessages(prev =>
          prev.map(m =>
            m.id === tempAiMsgId ? { ...m, text: accumulatedText } : m
          )
        );
      };

      await streamGeminiContent(apiKey, requestBody, onChunk);

      // Save Model Message to Database
      const savedAiMsg = await addMessage(targetConvId, 'model', accumulatedText);
      if (savedAiMsg) {
        setMessages(prev =>
          prev.map(m => (m.id === tempAiMsgId ? savedAiMsg : m))
        );
      }
    } catch (err: any) {
      console.error('Gemini call error:', err);
      // Remove temp message if it exists and is empty
      setMessages(prev => prev.filter(m => !String(m.id).startsWith('temp_') && m.text !== ''));
      // Fallback message
      const errorMsg: Message = {
        id: 'err_' + Date.now(),
        conversation_id: targetConvId,
        role: 'model',
        text: `⚠️ **AI Coach Connection Failed:** ${err.message || 'Check your internet connection or Gemini API key.'}`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCreateNewChat = async () => {
    const defaultTitle = `Chat ${conversations.length + 1}`;
    const newConv = await addConversation(defaultTitle);
    if (newConv) {
      setActiveConvId(newConv.id);
    }
  };

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitleInput(conv.title);
  };

  const handleSaveRename = async (id: string) => {
    if (editTitleInput.trim() && editTitleInput !== conversations.find(c => c.id === id)?.title) {
      await updateConversation(id, { title: editTitleInput.trim() });
    }
    setEditingConvId(null);
  };

  const handleTogglePin = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateConversation(conv.id, { pinned: !conv.pinned });
  };


  // Filter conversations
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConvs = filteredConversations.filter(c => c.pinned);
  const recentConvs = filteredConversations.filter(c => !c.pinned);

  if (!user) {
    return (
      <div className="ai-assistant-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', minHeight: '60vh' }}>
        <div className="widget glass-card-static" style={{ padding: '40px', textAlign: 'center', maxWidth: '480px' }}>
          <h3>🔒 Authentication Required</h3>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>Please log in to access your personal AI Life Coach.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-assistant-page">
      {/* ─── ChatGPT-style Sidebar ─── */}
      <div className="ai-sidebar">
        <button className="new-chat-btn" onClick={handleCreateNewChat}>
          <span>＋ New Chat</span>
        </button>

        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="sidebar-lists-container">
          {pinnedConvs.length > 0 && (
            <div className="sidebar-section">
              <span 
                className="sidebar-section-header collapsible" 
                onClick={() => setAiPinnedExpanded(!aiPinnedExpanded)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
              >
                <span>📌 Pinned Chats</span>
                <span style={{ fontSize: '9px', opacity: 0.7 }}>{aiPinnedExpanded ? '▼' : '▶'}</span>
              </span>
              {aiPinnedExpanded && pinnedConvs.map(conv => (
                <div
                  key={conv.id}
                  className={`sidebar-chat-item ${activeConvId === conv.id ? 'active' : ''}`}
                  onClick={() => setActiveConvId(conv.id)}
                >
                  {editingConvId === conv.id ? (
                    <input
                      type="text"
                      className="chat-item-rename-input"
                      value={editTitleInput}
                      onChange={e => setEditTitleInput(e.target.value)}
                      onBlur={() => handleSaveRename(conv.id)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveRename(conv.id)}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className="chat-item-title">💬 {conv.title}</span>
                      <div className="chat-item-actions" onClick={e => e.stopPropagation()}>
                        <button 
                          className={`chat-action-btn pin-btn ${conv.pinned ? 'pinned' : ''}`}
                          onClick={(e) => handleTogglePin(conv, e)} 
                          title={conv.pinned ? "Unpin Chat" : "Pin Chat"}
                        >
                          📌
                        </button>
                        <div className="menu-container" style={{ position: 'relative' }}>
                          <button 
                            className="chat-action-btn dots-btn" 
                            onClick={(e) => handleToggleMenu(conv.id, e)} 
                            title="Chat Options"
                          >
                            ⋮
                          </button>
                          {activeMenuConvId === conv.id && (
                            <div className="chat-options-dropdown">
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setActiveMenuConvId(null); 
                                  handleStartRename(conv, e); 
                                }}
                              >
                                ✏️ Rename
                              </button>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setActiveMenuConvId(null); 
                                  handlePromptDelete(conv.id, e); 
                                }}
                                className="delete-option"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="sidebar-section">
            <span 
              className="sidebar-section-header collapsible" 
              onClick={() => setAiRecentExpanded(!aiRecentExpanded)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
            >
              <span>🕒 Recent Chats</span>
              <span style={{ fontSize: '9px', opacity: 0.7 }}>{aiRecentExpanded ? '▼' : '▶'}</span>
            </span>
            {aiRecentExpanded && (
              loadingConversations ? (
                <p className="sidebar-loading-text">Loading chats...</p>
              ) : recentConvs.length === 0 && pinnedConvs.length === 0 ? (
                <p className="sidebar-empty-text">No conversations yet.</p>
              ) : (
                recentConvs.map(conv => (
                  <div
                    key={conv.id}
                    className={`sidebar-chat-item ${activeConvId === conv.id ? 'active' : ''}`}
                    onClick={() => setActiveConvId(conv.id)}
                  >
                    {editingConvId === conv.id ? (
                      <input
                        type="text"
                        className="chat-item-rename-input"
                        value={editTitleInput}
                        onChange={e => setEditTitleInput(e.target.value)}
                        onBlur={() => handleSaveRename(conv.id)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveRename(conv.id)}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="chat-item-title">💬 {conv.title}</span>
                        <div className="chat-item-actions" onClick={e => e.stopPropagation()}>
                          <button 
                            className={`chat-action-btn pin-btn ${conv.pinned ? 'pinned' : ''}`}
                            onClick={(e) => handleTogglePin(conv, e)} 
                            title={conv.pinned ? "Unpin Chat" : "Pin Chat"}
                          >
                            📌
                          </button>
                          <div className="menu-container" style={{ position: 'relative' }}>
                            <button 
                              className="chat-action-btn dots-btn" 
                              onClick={(e) => handleToggleMenu(conv.id, e)} 
                              title="Chat Options"
                            >
                              ⋮
                            </button>
                            {activeMenuConvId === conv.id && (
                              <div className="chat-options-dropdown">
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setActiveMenuConvId(null); 
                                    handleStartRename(conv, e); 
                                  }}
                                >
                                  ✏️ Rename
                                </button>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setActiveMenuConvId(null); 
                                    handlePromptDelete(conv.id, e); 
                                  }}
                                  className="delete-option"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Chat Window ─── */}
      <div className="ai-chat-main">
        {/* Chat Messages */}
        <div className="ai-messages-area" ref={chatAreaRef}>
          {messages.length === 0 && !isTyping ? (
            <div className="empty-chat-coach" style={{ textAlign: 'center', margin: 'auto', padding: '40px', maxWidth: '500px' }}>
              <div className="ai-coach-logo" style={{ fontSize: '50px', marginBottom: '20px' }}>🤖</div>
              <h3>Nova AI Life Coach</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '12px', lineHeight: '1.6' }}>
                Welcome, {userDisplayName}! I am your personal productivity intelligence companion.
                Ask me to plan your day, analyze your productivity metrics, check for missed deadlines, or create custom revision schedules.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isLast = i === messages.length - 1;
              return (
                <div 
                  key={msg.id || i} 
                  ref={isLast ? lastMessageRef : null}
                  className={`ai-msg ${msg.role === 'model' ? 'ai' : 'user'}`}
                >
                  {msg.role === 'model' && (
                    <div className="ai-msg-avatar">
                      <div className="ai-avatar-inner" style={{ width: 28, height: 28 }}></div>
                    </div>
                  )}
                  <div className="ai-msg-content">
                    <div className="ai-msg-bubble">
                      <div>{renderMarkdown(msg.text)}</div>
                    </div>
                    <span className="ai-msg-timestamp" style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginTop: '4px', textAlign: msg.role === 'model' ? 'left' : 'right' }}>
                      {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="ai-msg ai">
              <div className="ai-msg-avatar">
                <div className="ai-avatar-inner" style={{ width: 28, height: 28 }}></div>
              </div>
              <div className="ai-msg-content">
                <div className="ai-msg-bubble typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="ai-suggestions-bar">
          {suggestions.map((s, i) => (
            <button key={i} className="ai-suggestion-chip" onClick={() => handleSendMessage(s)}>
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="ai-input-bar">
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onSelect={handleInputSelectionUpdate}
            onKeyUp={handleInputSelectionUpdate}
            onMouseUp={handleInputSelectionUpdate}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Nova AI Coach anything..."
          />
          <button className="ai-send-btn" onClick={() => handleSendMessage()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="task-detail-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="task-detail-panel widget delete-confirm-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: 'bold' }}>Delete Conversation</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
              Are you sure you want to permanently delete this chat? All message history will be lost.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={async () => {
                  if (convIdToDelete) {
                    await deleteConversation(convIdToDelete);
                    if (activeConvId === convIdToDelete) {
                      setActiveConvId(null);
                      setMessages([]);
                    }
                  }
                  setShowDeleteModal(false);
                  setConvIdToDelete(null);
                }} 
                style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)', color: 'white', flex: 1 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
