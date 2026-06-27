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
    aiScrollTop: chatScrollTop,
    setAiScrollTop: setChatScrollTop
  } = useDataContext();

  const [isTyping, setIsTyping] = useState(false);
  
  // Renaming state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // When user sends a message, set this to false so we scroll to the incoming AI response
  // Otherwise on mount/load, keep it true so we don't scroll
  const hasScrolledForResponseRef = useRef(true);

  // Auto-scroll chat area: scroll to top of AI message, but bottom of user message
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    
    if (lastMsg.role === 'user') {
      // User sent message: scroll to bottom
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (lastMsg.role === 'model' && !hasScrolledForResponseRef.current && lastMsg.text.length > 0) {
      // AI sent response: scroll so the TOP of the AI bubble is visible at the top of the scrollable container
      hasScrolledForResponseRef.current = true;
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages]);

  // When AI typing indicator starts, scroll to bottom
  useEffect(() => {
    if (isTyping) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isTyping]);

  // Save scroll position on scroll
  const handleScroll = () => {
    if (chatAreaRef.current) {
      setChatScrollTop(chatAreaRef.current.scrollTop);
    }
  };

  // Restore scroll position on mount or when messages load
  useEffect(() => {
    if (chatAreaRef.current && chatScrollTop > 0) {
      chatAreaRef.current.scrollTop = chatScrollTop;
    }
  }, [activeConvId, messages.length]);

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

    // Limit to 5 habits
    const habitsText = habits
      .slice(0, 5)
      .map(h => `- ${h.name} (Goal: ${h.target}, Streak: ${h.streak} days, Completion Rate: ${h.rate}%)`)
      .join('\n');

    // Limit to 5 active goals
    const goalsText = goals
      .filter(g => g.progress < 100)
      .slice(0, 5)
      .map(g => `- ${g.name} (Category: ${g.category}, Progress: ${g.progress}%${g.milestones && g.milestones.length > 0 ? `, Milestones: ${g.milestones.map((m: any) => m.text + (m.done ? ' [done]' : '')).join(', ')}` : ''})`)
      .join('\n');

    // Limit to 8 upcoming events
    const eventsText = events
      .slice(0, 8)
      .map(e => `- ${e.title} (Type: ${e.type}, Day of Week: ${e.day}, Start Hour: ${e.start}, Duration: ${e.duration} hours)`)
      .join('\n');

    const lastSessions = focusSessions.slice(0, 5);
    const focusText = `Total Focus Sessions Logged: ${focusSessions.length}. Recent Focus Time: ${Math.round(lastSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60)} minutes in the last ${lastSessions.length} sessions.`;

    // Compute Finance Summary details
    const balance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
    const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
    const monthlyExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr)).reduce((sum, t) => sum + Number(t.amount), 0);
    const savingsGoalsSummary = savingsGoals.map(g => `- ${g.name} (Saved ₹${g.saved_amount} of ₹${g.target_amount}, Progress: ${Math.round((Number(g.saved_amount)/Number(g.target_amount))*100)}%)`).join('\n');
    const overspentBudgets = budgets.filter(b => {
      const spent = transactions.filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(currentMonthStr)).reduce((sum, st) => sum + Number(st.amount), 0);
      return spent > Number(b.amount);
    }).map(b => b.category).join(', ');

    const now = new Date();
    const formattedDateTime = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    return `You are "Nova", an elite productivity coach and AI life assistant.
The user's name is ${userDisplayName}.
The current real-world date and time is: ${formattedDateTime}.

Here is their real-time application data:
- Productivity/Life Score: ${productivityScore}/100
- Active Tasks:
${activeTasksText || "No active tasks."}
- Habits:
${habitsText || "No habits set up."}
- Goals:
${goalsText || "No goals set up."}
- Calendar Events:
${eventsText || "No calendar events."}
- Focus Sessions:
${focusText}
- Finance Overview: Available Balance is ₹${balance.toLocaleString()}, Current Monthly Expenses is ₹${monthlyExpenses.toLocaleString()}, Financial Health Index is ${financialHealthScore}/100.
- Savings Goals Roadmap progress:
${savingsGoalsSummary || "No savings goals configured."}
- Overspent budgets: ${overspentBudgets || "None"}

CRITICAL FORMATTING INSTRUCTIONS:
1. Always sound like a natural, conversational, intelligent, and premium human life coach. Avoid robotic, template-like, or overly structured answers.
2. DO NOT use markdown symbols like "#", "##", "###", or "***" for section headers or decorative markers. Frame natural titles or just use inline bolding (e.g., "**My Recommendations**") if needed.
3. DO NOT output brackets or tags for task priorities (e.g., do NOT write "[MEDIUM] meeting" or "[HIGH] task"). Instead, seamlessly integrate priorities into your sentences (e.g., "you should complete the meeting, which is of medium priority" or "your high priority task...").
4. Write in cohesive, well-written paragraphs. Use bullet points ONLY when they genuinely improve readability (e.g. listing distinct action items, options, or recommendations).
5. Always analyze the user's actual database records provided above before responding to give hyper-personalized advice. Avoid generic advice or placeholders.
6. If a task has "[OVERDUE!]" next to its due date, point out that it is overdue and prompt the user to complete or reschedule it, without dwelling on it.
7. You have complete access to the user's actual finance information. If they ask about their balance, spending, budgets, or savings goals, answer them accurately using their real transaction records rather than placeholders.`;
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
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          ...chatHistory.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
          }))
        ],
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
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp_') && m.text !== ''));
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

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(id);
    if (activeConvId === id) {
      setActiveConvId(null);
    }
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
              <span className="sidebar-section-header">📌 Pinned Chats</span>
              {pinnedConvs.map(conv => (
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
                      <div className="chat-item-actions">
                        <button onClick={(e) => handleTogglePin(conv, e)} title="Unpin Chat">📌</button>
                        <button onClick={(e) => handleStartRename(conv, e)} title="Rename Chat">✏️</button>
                        <button onClick={(e) => handleDeleteChat(conv.id, e)} title="Delete Chat">🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="sidebar-section">
            <span className="sidebar-section-header">🕒 Recent Chats</span>
            {loadingConversations ? (
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
                      <div className="chat-item-actions">
                        <button onClick={(e) => handleTogglePin(conv, e)} title="Pin Chat">📌</button>
                        <button onClick={(e) => handleStartRename(conv, e)} title="Rename Chat">✏️</button>
                        <button onClick={(e) => handleDeleteChat(conv.id, e)} title="Delete Chat">🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Chat Window ─── */}
      <div className="ai-chat-main">
        {/* Chat Messages */}
        <div className="ai-messages-area" ref={chatAreaRef} onScroll={handleScroll}>
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
            value={input}
            onChange={e => setInput(e.target.value)}
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
    </div>
  );
}
