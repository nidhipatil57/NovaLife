import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../../context/DataContext';
import { callGeminiWithRetry } from '../../utils/aiClient';
import './VoiceAssistant.css';

interface VoiceHistoryItem {
  query: string;
  response: string;
  timestamp: string;
}

export default function VoiceAssistant() {
  const {
    addTask,
    addTransaction,
    addEvent,
    addGoal,
    addHabit,
    addFocusSession,
    tasks,
    habits,
    goals,
    events,
    focusSessions,
    productivityScore,
    transactions,
    financialHealthScore,
    savingsGoals,
    budgets
  } = useDataContext();

  const navigate = useNavigate();

  // Dialog and Overlay states
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'understanding' | 'processing' | 'answering'>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('novalife_voice_muted') === 'true';
  });

  // Searchable Voice command history states
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [voiceHistory, setVoiceHistory] = useState<VoiceHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('novalife_voice_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Waveform heights state
  const [waveHeights, setWaveHeights] = useState<number[]>([15, 15, 15, 15, 15, 15, 15, 15, 15, 15]);

  // Audio Speech Recognition and Synthesis Refs
  const recognitionRef = useRef<any>(null);
  const activeConversationRef = useRef<{ role: 'user' | 'model'; text: string }[]>([]);
  const isMutedRef = useRef(isMuted);

  // Sync mute ref
  useEffect(() => {
    isMutedRef.current = isMuted;
    localStorage.setItem('novalife_voice_muted', String(isMuted));
  }, [isMuted]);

  // Waveform animation loop
  useEffect(() => {
    let intervalId: any;
    if (status === 'listening') {
      intervalId = setInterval(() => {
        setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 55) + 12));
      }, 90);
    } else if (status === 'processing' || status === 'understanding') {
      intervalId = setInterval(() => {
        setWaveHeights(prev =>
          prev.map((_, i) => {
            const time = Date.now() * 0.005;
            return Math.floor(Math.sin(time + i * 0.5) * 20) + 30;
          })
        );
      }, 50);
    } else {
      setWaveHeights([15, 15, 15, 15, 15, 15, 15, 15, 15, 15]);
    }
    return () => clearInterval(intervalId);
  }, [status]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setStatus('listening');
      setTranscript('');
      setInterimTranscript('');
    };

    rec.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }

      if (finalStr) {
        setTranscript(prev => prev + finalStr);
      }
      setInterimTranscript(interimStr);
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== 'no-speech') {
        setStatus('idle');
      }
    };

    rec.onend = () => {
      // If we got a final transcript, process it!
      setStatus(prev => {
        if (prev === 'listening') {
          // If ended without error and transcript is present, move to understanding
          return 'understanding';
        }
        return prev;
      });
    };

    recognitionRef.current = rec;
  }, []);

  // Process command when transcript is final and status goes to understanding
  useEffect(() => {
    if (status === 'understanding') {
      const fullTranscript = transcript.trim();
      if (fullTranscript) {
        handleProcessCommand(fullTranscript);
      } else {
        setStatus('idle');
      }
    }
  }, [status, transcript]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        window.speechSynthesis.cancel(); // Stop any speech output
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Already listening or failed to start:", e);
      }
    } else {
      alert("Microphone recognition is not supported in this browser. Please use Chrome or Safari.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setStatus('idle');
  };

  const handleMicToggle = () => {
    if (status === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleOpenOverlay = () => {
    setIsOpen(true);
    // Auto start listening when opening the voice overlay
    setTimeout(startListening, 300);
  };

  const handleCloseOverlay = () => {
    stopListening();
    window.speechSynthesis.cancel();
    setIsOpen(false);
    activeConversationRef.current = []; // Clear current continuous session history
  };

  // Speaks out text
  const speakText = (text: string) => {
    if (isMutedRef.current) {
      // If muted, restart listening after a short reading window delay
      setTimeout(() => {
        if (isOpen) {
          startListening();
        }
      }, 2500);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip emojis out of text for cleaner synthesis
    const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => {
      // Auto-restart listening for continuous hands-free conversation
      if (isOpen) {
        startListening();
      }
    };
    utterance.onerror = () => {
      if (isOpen) {
        startListening();
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  // AI Voice intent processor powered by Gemini API
  const handleProcessCommand = async (commandText: string) => {
    setStatus('processing');
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured in .env file.');
      }

      // 1. Gather all required context data
      const now = new Date();
      const formattedDateTime = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      
      const activeTasks = tasks.filter(t => !t.done).slice(0, 10).map(t => ({ text: t.text, priority: t.priority, due: t.due, category: t.category }));
      const completedTasks = tasks.filter(t => t.done).slice(0, 5).map(t => t.text);
      const habitsSummary = habits.slice(0, 5).map(h => ({ name: h.name, target: h.target, streak: h.streak, rate: h.rate }));
      const goalsSummary = goals.slice(0, 5).map(g => ({ name: g.name, category: g.category, progress: g.progress }));
      
      // Calendar
      const eventsSummary = events.slice(0, 8).map(e => ({ title: e.title, start: e.start, duration: e.duration, day: e.day, type: e.type, weekOffset: e.weekOffset }));
      
      // Finance
      const balance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
      const currentMonthStr = now.toISOString().substring(0, 7);
      const monthlyExpenses = transactions.filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonthStr)).reduce((sum, t) => sum + Number(t.amount), 0);
      const overspentBudgets = budgets.filter(b => {
        const spent = transactions.filter(t => t.type === 'expense' && t.category === b.category && t.date && t.date.startsWith(currentMonthStr)).reduce((sum, st) => sum + Number(st.amount), 0);
        return spent > Number(b.amount);
      }).map(b => b.category);

      const categoryExpenses: Record<string, number> = {};
      transactions.filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonthStr)).forEach(t => {
        const cat = t.category || 'General';
        categoryExpenses[cat] = (categoryExpenses[cat] || 0) + Number(t.amount);
      });

      const categoryIncome: Record<string, number> = {};
      transactions.filter(t => t.type === 'income' && t.date && t.date.startsWith(currentMonthStr)).forEach(t => {
        const cat = t.category || 'General';
        categoryIncome[cat] = (categoryIncome[cat] || 0) + Number(t.amount);
      });



      // 2. Build history contents
      const chatHistory = [...activeConversationRef.current, { role: 'user', text: commandText }];
      
      const systemPrompt = `You are "Nova", the global voice assistant for NovaLife. You are a premium AI productivity coach.
The current real-world date and time is: ${formattedDateTime}.

You are given the user's real-time application context:
- Productivity Score: ${productivityScore}/100
- Financial Health Score: ${financialHealthScore}/100
- Current Balance: ₹${balance.toLocaleString()}
- Current Monthly Expenses: ₹${monthlyExpenses.toLocaleString()}
- Overspent budgets: ${overspentBudgets.join(', ') || 'None'}
- Active Tasks: ${JSON.stringify(activeTasks)}
- Completed Tasks: ${JSON.stringify(completedTasks)}
- Habits: ${JSON.stringify(habitsSummary)}
- Goals: ${JSON.stringify(goalsSummary)}
- Calendar Events: ${JSON.stringify(eventsSummary)}
- Focus Sessions Logged: ${focusSessions.length}
- Financial category-wise Expenses: ${JSON.stringify(categoryExpenses)}
- Financial category-wise Income: ${JSON.stringify(categoryIncome)}
- Savings Goals: ${JSON.stringify(savingsGoals.map(g => ({ name: g.name, target: g.target_amount, saved: g.saved_amount })))}

You must parse the user's spoken command and decide what action to take. You must respond ONLY with a single JSON object. Do NOT include any markdown packaging (such as \`\`\`json) or markdown block formatting around the JSON. Your output must start with '{' and end with '}'.

The JSON schema must be:
{
  "response": "The natural language spoken response to say back to the user.",
  "action": "ADD_TASK" | "ADD_TRANSACTION" | "ADD_EVENT" | "ADD_GOAL" | "ADD_HABIT" | "START_FOCUS_SESSION" | "ANSWER_QUESTION" | "WAIT_FOR_CLARIFICATION",
  "params": { ... },
  "followUp": true | false,
  "navigate": "/tasks" | "/calendar" | "/finance" | "/goals" | "/habits" | "/focus" | "/analytics" | null
}

Intent Param Schemas:
- For "ADD_TASK":
  "params": { "text": "Task text", "priority": "low"|"medium"|"high"|"critical", "due": "due date representation, e.g. Today or 2026-06-30T16:00", "category": "General"|"Academic"|"Work"|"Health"|"Personal"|"Career"|"Finance" }
  Set navigate to "/tasks".
- For "ADD_TRANSACTION":
  "params": { "type": "expense"|"income", "amount": number, "category": "Food"|"Shopping"|"Travel"|"Transportation"|"Rent"|"Salary"|etc, "merchant": "Merchant name if any", "notes": "Notes if any" }
  Set navigate to "/finance".
- For "ADD_EVENT":
  "params": { "title": "Event title", "start": numeric hour (0-23.75, e.g. 16.0 for 4 PM), "duration": number of hours (e.g. 1.0), "day": day of week (0=Sun, 1=Mon, ..., 6=Sat), "type": "focus"|"study"|"meeting"|"break"|"personal"|"work"|"health", "weekOffset": number }
  Set navigate to "/calendar".
- For "ADD_GOAL":
  "params": { "name": "Goal name", "category": "Personal"|"Career"|"Academic"|"Health"|"Finance", "notes": "notes if any" }
  Set navigate to "/goals".
- For "ADD_HABIT":
  "params": { "name": "Habit name", "target": "frequency/amount, e.g. Daily or 3 times a week", "notes": "notes if any" }
  Set navigate to "/habits".
- For "START_FOCUS_SESSION":
  "params": { "name": "Session title", "duration": number of seconds (e.g. 3600 for 1 hour), "room": "Select most suitable Focus room based on history, or default like 'Rainy Library' or 'Cosy Cafe'" }
  Set navigate to "/focus".
- For "ANSWER_QUESTION":
  Use the provided real-time context data to answer their question. The answer must be natural and conversational. Avoid markdown titles or formatting symbols like "#" or "##" in the response text.
- For "WAIT_FOR_CLARIFICATION":
  Use this when the command is ambiguous or missing required fields. Output the followUp question in "response". Include "partialIntent" and "partialParams" inside the "params" object if applicable so context is maintained.

CRITICAL FORMATTING:
1. Speak natural, conversational English as a premium AI productivity coach.
2. If an action is successfully matched, confirm it immediately with a quick, elegant summary (e.g. "I've added the expense of ₹450 under Food.").
3. Your response must contain ONLY the valid JSON object. No preambles, no explanation text outside the JSON.`;

      const requestBody = {
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: chatHistory.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      };

      const result = await callGeminiWithRetry(apiKey, requestBody);
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse JSON response
      let payload: any = {};
      try {
        payload = JSON.parse(responseText.trim());
      } catch (err) {
        // Fallback matching if JSON contains text markdown blocks
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          payload = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse AI response: " + responseText);
        }
      }

      const { response, action, params, followUp, navigate: navigatePath } = payload;

      setAiResponse(response);
      setStatus('answering');

      // 3. Execute Action based on Intent
      if (!followUp && action) {
        await executeResolvedAction(action, params);
      }

      // 4. Save to history
      const historyItem: VoiceHistoryItem = {
        query: commandText,
        response: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setVoiceHistory(prev => {
        const next = [historyItem, ...prev].slice(0, 50); // limit to 50
        localStorage.setItem('novalife_voice_history', JSON.stringify(next));
        return next;
      });

      // 5. Speak response and handle continuity
      activeConversationRef.current.push({ role: 'user', text: commandText });
      activeConversationRef.current.push({ role: 'model', text: response });
      
      speakText(response);

      // 6. Navigation
      if (navigatePath) {
        setTimeout(() => {
          navigate(navigatePath);
        }, 1200);
      }

    } catch (err: any) {
      console.error("Voice process error:", err);
      const errMsg = "Sorry, I had trouble processing that request. Please try again.";
      setAiResponse(errMsg);
      setStatus('idle');
      speakText(errMsg);
    }
  };

  const executeResolvedAction = async (action: string, params: any) => {
    try {
      switch (action) {
        case 'ADD_TASK':
          await addTask({
            text: params.text || 'Unnamed Task',
            done: false,
            priority: params.priority || 'medium',
            due: params.due || 'No due date',
            category: params.category || 'General',
            subtasks: [],
            risk: 0,
            aiGenerated: true,
            notes: 'Added via Voice Assistant',
            sessionsCount: 0,
            activityLog: [{ action: 'Created via AI Voice Assistant', timestamp: new Date().toISOString() }]
          });
          break;

        case 'ADD_TRANSACTION':
          await addTransaction({
            type: params.type || 'expense',
            amount: Number(params.amount || 0),
            category: params.category || 'Food',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            merchant: params.merchant || 'None',
            payment_method: 'UPI',
            notes: params.notes || 'Recorded via Voice Assistant',
            recurring: false,
            recurring_frequency: '',
            tags: [],
            receipt_url: ''
          });
          break;

        case 'ADD_EVENT':
          await addEvent({
            title: params.title || 'Focus Session',
            start: Number(params.start || 9),
            duration: Number(params.duration || 1),
            day: Number(params.day !== undefined ? params.day : new Date().getDay()),
            color: params.color || 'var(--accent-blue)',
            type: params.type || 'focus',
            weekOffset: Number(params.weekOffset || 0)
          });
          break;

        case 'ADD_GOAL':
          await addGoal({
            name: params.name || 'New Goal',
            category: params.category || 'Personal',
            progress: 0,
            color: 'var(--accent-blue)',
            milestones: [],
            completed_by: '',
            completed_dates: [],
            streak: 0,
            notes: params.notes || 'Created via Voice Assistant',
            ai_generated: true
          });
          break;

        case 'ADD_HABIT':
          await addHabit({
            name: params.name || 'New Habit',
            target: params.target || 'Daily',
            streak: 0,
            best: 0,
            rate: 0,
            week: [false, false, false, false, false, false, false],
            color: 'var(--accent-blue)',
            notes: params.notes || 'Created via Voice Assistant'
          });
          break;

        case 'START_FOCUS_SESSION':
          await addFocusSession({
            name: params.name || 'Deep Work',
            duration: Number(params.duration || 1800), // in seconds
            notes: 'Started via AI Voice Assistant',
            room: params.room || 'Rainy Library'
          });
          break;

        default:
          console.warn("Unknown intent action:", action);
      }
    } catch (e) {
      console.error("Failed to execute voice action:", e);
    }
  };

  const handleHistorySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchHistoryQuery(e.target.value);
  };

  const filteredHistory = voiceHistory.filter(item =>
    item.query.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
    item.response.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  return (
    <>
      {/* Floating Microphone FAB */}
      <button 
        className="voice-assistant-fab" 
        onClick={handleOpenOverlay}
        title="Open AI Voice Assistant"
      >
        🎙️
      </button>

      {/* Voice Assistant Modal Overlay */}
      {isOpen && (
        <div className="voice-assistant-overlay" onClick={handleCloseOverlay}>
          <div className="voice-assistant-modal" onClick={e => e.stopPropagation()}>
            
            {/* Header Controls */}
            <div className="voice-modal-header">
              <button 
                className={`voice-control-btn ${isMuted ? '' : 'active'}`}
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute Voice Feedback" : "Mute Voice Feedback"}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button 
                className={`voice-control-btn ${showHistory ? 'active' : ''}`}
                onClick={() => setShowHistory(!showHistory)}
                title="View Interaction History"
              >
                📜
              </button>
              <button 
                className="voice-control-btn" 
                onClick={handleCloseOverlay}
                title="Close Assistant"
              >
                ✕
              </button>
            </div>

            {/* Status Messages */}
            <div className="voice-status">
              {status === 'listening' && "Listening..."}
              {status === 'understanding' && "Understanding..."}
              {status === 'processing' && "Processing your request..."}
              {status === 'answering' && "Responding..."}
              {status === 'idle' && "Tap Mic to Speak"}
            </div>

            {/* Audio Waveform */}
            <div className={`voice-waveform ${status === 'listening' ? 'listening' : ''} ${status === 'processing' || status === 'understanding' ? 'processing' : ''}`}>
              {waveHeights.map((h, i) => (
                <div 
                  key={i} 
                  className="voice-wave-bar" 
                  style={{ height: `${h}px` }} 
                />
              ))}
            </div>

            {/* Transcript Area */}
            <div className="voice-transcript-container">
              {interimTranscript || transcript ? (
                <span className={`voice-live-text ${interimTranscript ? 'interim' : ''}`}>
                  {transcript} {interimTranscript}
                </span>
              ) : (
                <span className="voice-placeholder-text">
                  "Start a 60-minute deep work session" or "How much did I spend on food this month?"
                </span>
              )}
            </div>

            {/* AI Text Response Bubble */}
            {aiResponse && (
              <div className="voice-response-container">
                <div className="voice-response-label">Nova Assistant</div>
                <div className="voice-response-text">{aiResponse}</div>
              </div>
            )}

            {/* Big Mic Button */}
            <button 
              className={`voice-modal-mic-btn ${status === 'listening' ? 'listening' : ''}`}
              onClick={handleMicToggle}
              title={status === 'listening' ? "Tap to Pause" : "Tap to Speak"}
            >
              🎙️
            </button>

            {/* History Panel */}
            {showHistory && (
              <div className="voice-history-panel">
                <input
                  type="text"
                  className="voice-history-search"
                  placeholder="Search interaction history..."
                  value={searchHistoryQuery}
                  onChange={handleHistorySearchChange}
                />
                <div className="voice-history-list">
                  {filteredHistory.length === 0 ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No voice commands match search criteria.
                    </p>
                  ) : (
                    filteredHistory.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="voice-history-item"
                        onClick={() => {
                          setAiResponse(item.response);
                          speakText(item.response);
                        }}
                      >
                        <div className="voice-history-query">🗣️ "{item.query}"</div>
                        <div className="voice-history-response">{item.response}</div>
                        <div className="voice-history-time">{item.timestamp}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
