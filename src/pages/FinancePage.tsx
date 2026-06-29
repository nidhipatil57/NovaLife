import React, { useState, useMemo, useEffect } from 'react';
import { useDataContext, type Transaction, type SavingsGoal, type Bill } from '../context/DataContext';
import { CustomSelect } from '../components/ui/CustomSelect';
import { jsPDF } from 'jspdf';
import './FinancePage.css';

// Categories Configuration
const INCOME_CATEGORIES = [
  'Salary', 'Freelancing', 'Internship', 'Scholarship', 'Business', 'Pocket Money', 'Investments', 'Other'
];

const EXPENSE_CATEGORIES = [
  'Food', 'Shopping', 'Travel', 'Transportation', 'Fuel', 'Rent', 'Education', 'Books', 
  'Subscriptions', 'Entertainment', 'Medical', 'Bills', 'Groceries', 'Electronics', 'Investment', 
  'Family', 'Gifts', 'Savings', 'Custom'
];

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'PayPal', 'Other'];

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

const getExpenseCategoryIcon = (category: string): string => {
  switch (category) {
    case 'Food': return '🍕';
    case 'Shopping': return '🛍️';
    case 'Travel': return '✈️';
    case 'Transportation': return '🚗';
    case 'Fuel': return '⛽';
    case 'Rent': return '🏠';
    case 'Education': return '🎓';
    case 'Books': return '📚';
    case 'Subscriptions': return '📱';
    case 'Entertainment': return '🎬';
    case 'Medical': return '🏥';
    case 'Bills': return '💵';
    case 'Groceries': return '🛒';
    case 'Electronics': return '💻';
    case 'Investment': return '📈';
    case 'Family': return '👨‍👩‍👧‍👦';
    case 'Gifts': return '🎁';
    case 'Savings': return '🐖';
    default: return '⚙️';
  }
};

const getIncomeCategoryIcon = (category: string): string => {
  switch (category) {
    case 'Salary': return '💼';
    case 'Freelancing': return '💻';
    case 'Internship': return '🎓';
    case 'Scholarship': return '📜';
    case 'Business': return '🏢';
    case 'Pocket Money': return '🪙';
    case 'Investments': return '📈';
    default: return '⚙️';
  }
};

const getPaymentMethodIcon = (method: string): string => {
  switch (method) {
    case 'Cash': return '💵';
    case 'Credit Card': return '💳';
    case 'Debit Card': return '💳';
    case 'UPI': return '📱';
    case 'Net Banking': return '🏦';
    case 'PayPal': return '🌐';
    default: return '⚙️';
  }
};

const incomeCategoryOptions = INCOME_CATEGORIES.map(c => ({ label: c, value: c, icon: getIncomeCategoryIcon(c) }));
const expenseCategoryOptions = EXPENSE_CATEGORIES.map(c => ({ label: c, value: c, icon: getExpenseCategoryIcon(c) }));
const paymentMethodOptions = PAYMENT_METHODS.map(m => ({ label: m, value: m, icon: getPaymentMethodIcon(m) }));
const monthSelectOptions = MONTHS.map(m => ({ label: m.label, value: m.value }));
const yearSelectOptions = YEARS.map(y => ({ label: y, value: y }));
const budgetCategoryOptions = EXPENSE_CATEGORIES.map(c => ({ label: c, value: c, icon: getExpenseCategoryIcon(c) }));

const goalColorOptions = [
  { label: 'Blue Glow', value: 'var(--accent-blue)', icon: '🔵' },
  { label: 'Purple Glow', value: 'var(--accent-purple)', icon: '🟣' },
  { label: 'Cyan Glow', value: 'var(--accent-cyan)', icon: '🟢' },
  { label: 'Orange Glow', value: 'var(--accent-orange)', icon: '🟠' },
  { label: 'Red Glow', value: 'var(--accent-red)', icon: '🔴' },
  { label: 'Green Glow', value: 'var(--accent-green)', icon: '🟢' },
];

const billCategoryOptions = [
  { label: 'Electricity', value: 'Electricity', icon: '⚡' },
  { label: 'Internet', value: 'Internet', icon: '🌐' },
  { label: 'Rent', value: 'Rent', icon: '🏠' },
  { label: 'Credit Card', value: 'Credit Card', icon: '💳' },
  { label: 'Insurance', value: 'Insurance', icon: '🛡️' },
  { label: 'Phone recharge', value: 'Phone recharge', icon: '📱' },
  { label: 'Water bill', value: 'Water bill', icon: '💧' },
  { label: 'Other Bill', value: 'Other', icon: '📝' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 2) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${MONTH_NAMES[monthIdx] || parts[1]} ${year}`;
}

function parseAmount(val: string): number {
  if (!val) return 0;
  const clean = val.replace(/,/g, '').trim();
  return Number(clean);
}

function isValidAmount(val: string): boolean {
  if (!val) return false;
  const clean = val.replace(/,/g, '').trim();
  return !isNaN(Number(clean)) && clean.length > 0;
}

export default function FinancePage() {
  const {
    transactions,
    loadingTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    budgets,
    addBudget,
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    bills,
    addBill,
    updateBill,
    deleteBill,
    financialHealthScore,
    financeFilterType: filterType,
    setFinanceFilterType: setFilterType,
    financeFilterCategory: filterCategory,
    setFinanceFilterCategory: setFilterCategory,
    financeFilterPeriod: filterPeriod,
    setFinanceFilterPeriod: setFilterPeriod,
    financeFilterMethod: filterMethod,
    setFinanceFilterMethod: setFilterMethod,
    financeSearchQuery: searchQuery,
    setFinanceSearchQuery: setSearchQuery
  } = useDataContext();

  // Navigation / Modal States
  const [showTxModal, setShowTxModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Form Fields for Transactions
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food');
  const [txMonth, setTxMonth] = useState(new Date().toISOString().substring(5, 7)); // '06'
  const [txYear, setTxYear] = useState(new Date().toISOString().substring(0, 4)); // '2026'
  const [txMerchant, setTxMerchant] = useState('');
  const [txMethod, setTxMethod] = useState('UPI');
  const [txNotes, setTxNotes] = useState('');
  const [txRecurring, setTxRecurring] = useState(false);
  const [txFrequency, setTxFrequency] = useState('monthly');
  const [txTagsInput, setTxTagsInput] = useState('');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // Form Fields for Budgets
  const [budgetCategory, setBudgetCategory] = useState('Food');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetMonth, setBudgetMonth] = useState(new Date().toISOString().substring(5, 7));
  const [budgetYear, setBudgetYear] = useState(new Date().toISOString().substring(0, 4));

  // Form Fields for Savings Goals
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalSavedAmount, setGoalSavedAmount] = useState('0');
  const [goalMonth, setGoalMonth] = useState(new Date().toISOString().substring(5, 7));
  const [goalYear, setGoalYear] = useState(new Date().toISOString().substring(0, 4));
  const [goalColor, setGoalColor] = useState('var(--accent-blue)');
  const [goalNotes, setGoalNotes] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  // Form Fields for Bills
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billMonth, setBillMonth] = useState(new Date().toISOString().substring(5, 7));
  const [billYear, setBillYear] = useState(new Date().toISOString().substring(0, 4));
  const [billCategory, setBillCategory] = useState('Utilities');
  const [billRecurring, setBillRecurring] = useState(false);

  // Search & Filter States are bound to DataContext global state

  // Receipt Scanner States
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  // AI Financial Insights States
  const [aiInsight, setAiInsight] = useState('Analyzing transactions history for coaching tips...');
  const [loadingAiAdvice, setLoadingAiAdvice] = useState(false);

  // Calculate dynamic dashboard stats
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === 'income') income += amt;
      else expense += amt;
    });

    const balance = income - expense;
    
    const totalSaved = savingsGoals.reduce((sum, g) => sum + Number(g.saved_amount), 0);
    
    // Remaining Budget
    const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
    const totalBudget = budgets
      .filter(b => b.month_year === currentMonthStr)
      .reduce((sum, b) => sum + Number(b.amount), 0);
      
    const currentMonthExpenses = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const budgetRemaining = Math.max(0, totalBudget - currentMonthExpenses);

    // Goal Progress
    const totalGoalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);
    const goalProgressPct = totalGoalTarget > 0 ? Math.round((totalSaved / totalGoalTarget) * 100) : 0;

    return { balance, income, expense, totalSaved, budgetRemaining, totalBudget, currentMonthExpenses, goalProgressPct };
  }, [transactions, budgets, savingsGoals]);

  // Autocomplete Category heuristics based on merchant names
  const handleMerchantChange = (val: string) => {
    setTxMerchant(val);
    if (txType === 'expense') {
      const lower = val.toLowerCase().trim();
      if (lower.includes('pizza') || lower.includes('hut') || lower.includes('mcdonald') || lower.includes('burger') || lower.includes('food') || lower.includes('starbucks') || lower.includes('restaurant') || lower.includes('cafe')) {
        setTxCategory('Food');
      } else if (lower.includes('uber') || lower.includes('ola') || lower.includes('cab') || lower.includes('transport') || lower.includes('bus') || lower.includes('metro') || lower.includes('train')) {
        setTxCategory('Transportation');
      } else if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('prime') || lower.includes('youtube') || lower.includes('hulu') || lower.includes('game') || lower.includes('steam')) {
        setTxCategory('Subscriptions');
      } else if (lower.includes('rent') || lower.includes('apartment') || lower.includes('landlord')) {
        setTxCategory('Rent');
      } else if (lower.includes('book') || lower.includes('library') || lower.includes('course') || lower.includes('udemy') || lower.includes('coursera') || lower.includes('education') || lower.includes('tuition')) {
        setTxCategory('Education');
      } else if (lower.includes('hospital') || lower.includes('doctor') || lower.includes('medical') || lower.includes('pharmacy') || lower.includes('medicine')) {
        setTxCategory('Medical');
      } else if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('walmart') || lower.includes('target') || lower.includes('shopping') || lower.includes('mall') || lower.includes('myntra')) {
        setTxCategory('Shopping');
      } else if (lower.includes('travel') || lower.includes('flight') || lower.includes('hotel') || lower.includes('airbnb') || lower.includes('booking') || lower.includes('makemytrip')) {
        setTxCategory('Travel');
      } else if (lower.includes('grocery') || lower.includes('supermarket') || lower.includes('groceries') || lower.includes('mart') || lower.includes('reliance fresh')) {
        setTxCategory('Groceries');
      }
    }
  };

  // Convert File to Base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Receipt Scanner Action calling Gemini API (multi-modal input)
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setIsScanningReceipt(true);
    setScanMessage('Scanning receipt details using Gemini AI OCR...');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is not configured');
      }

      // Convert image to base64
      const base64Image = await fileToBase64(file);
      
      const prompt = `Analyze this receipt image and extract:
1. Amount (number only, e.g. 1450.50)
2. Merchant/Store name (string, e.g. McDonald's)
3. Date (format as YYYY-MM-DD, e.g. 2026-06-25)
4. Items purchased (array of strings, e.g. ["Burger", "Fries"])
5. Estimated taxes (number, e.g. 72.50)
6. Category (suggest one of these categories: Food, Shopping, Travel, Transportation, Rent, Education, Books, Subscriptions, Entertainment, Groceries, Electronics, General)

You must respond with a JSON object exactly matching this schema:
{
  "amount": number,
  "merchant": "string",
  "date": "string",
  "items": ["string"],
  "taxes": number,
  "category": "string"
}
Do not write any explanations outside the JSON object. Do not wrap the JSON in markdown blocks.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: file.type, data: base64Image } }
            ]
          }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(text.trim());

      if (parsed.amount) setTxAmount(String(parsed.amount));
      if (parsed.merchant) setTxMerchant(parsed.merchant);
      if (parsed.date) {
        const parts = parsed.date.split('-');
        if (parts.length >= 2) {
          setTxYear(parts[0]);
          setTxMonth(parts[1]);
        }
      }
      if (parsed.category) setTxCategory(parsed.category);
      if (parsed.items) {
        setTxNotes(`Items: ${parsed.items.join(', ')}. Est Tax: ₹${parsed.taxes || 0}`);
      }
      setScanMessage('Scan completed successfully! Review fields below.');
    } catch (err: any) {
      console.error('OCR scan failed:', err);
      // Premium Mock parsing fallback for local demonstration
      setTimeout(() => {
        setTxAmount('2450.00');
        setTxMerchant('Whole Foods Market');
        setTxYear(new Date().toISOString().substring(0, 4));
        setTxMonth(new Date().toISOString().substring(5, 7));
        setTxCategory('Groceries');
        setTxNotes('Items: Organic Milk, Avocados, Chicken Breast. Extracted via Mock Scanner.');
        setScanMessage('⚠️ API scan failed. Pre-filled with mock receipt data for demonstration.');
      }, 1000);
    } finally {
      setIsScanningReceipt(false);
    }
  };

  // Run AI Financial Recommendations
  const runFinanceCoaching = async () => {
    if (transactions.length === 0) return;
    setLoadingAiAdvice(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key is not configured');

      const systemPrompt = `You are "Nova", an elite personal financial companion and wealth strategist. Analyze the user's finances:
- Transactions: ${JSON.stringify(transactions.map(t => ({ type: t.type, amount: t.amount, category: t.category, merchant: t.merchant, date: t.date })))}
- Budgets: ${JSON.stringify(budgets)}
- Savings Goals: ${JSON.stringify(savingsGoals.map(g => ({ name: g.name, target: g.target_amount, saved: g.saved_amount })))}
- Upcoming Bills: ${JSON.stringify(bills.map(b => ({ title: b.title, amount: b.amount, due: b.due_date, paid: b.paid })))}
- Financial Health Score: ${financialHealthScore}/100

Context of current date: ${new Date().toLocaleDateString()}.

Provide an intelligent, hyper-personalized financial analysis.
You MUST respond with a JSON object exactly matching this schema. Do not write any explanations outside the JSON object. Do not wrap the JSON in markdown formatting.

{
  "insightOfDay": "A single premium, conversational, highly engaging advice statement, e.g. 'You spent 25% more on food this month. Reducing McDonald visits will save ₹1,500.'",
  "recommendations": [
    "Coaching recommendation 1 (e.g. Cancel unused Netflix subscription to save ₹499/mo)",
    "Coaching recommendation 2 (e.g. Move ₹500 into your laptop savings goal today)",
    "Coaching recommendation 3 (e.g. Delay clothes shopping as rent bill approaches)"
  ]
}
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(text.trim());
        if (parsed.insightOfDay) setAiInsight(parsed.insightOfDay);
      }
    } catch (e) {
      console.error('Coaching failed:', e);
      // Fallback recommendations based on real transactions in state
      const foodSpend = transactions
        .filter(t => t.type === 'expense' && t.category === 'Food')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      setAiInsight(foodSpend > 3000
        ? `⚠️ You've spent ₹${foodSpend} on food delivery this month. Scheduling meals earlier may reduce eating out.`
        : `📈 Great work! You are staying within your average spending limits this week.`
      );
    } finally {
      setLoadingAiAdvice(false);
    }
  };

  // Trigger coaching suggestions when transactions list changes
  useEffect(() => {
    runFinanceCoaching();
  }, [transactions.length, budgets.length, bills.length]);

  // Handle transaction form submits
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount(txAmount)) return;

    const payload = {
      type: txType,
      amount: parseAmount(txAmount),
      category: txCategory,
      date: `${txYear}-${txMonth}`,
      time: '',
      merchant: txMerchant || (txType === 'income' ? 'Income Deposit' : 'Merchant Store'),
      payment_method: txMethod,
      notes: txNotes,
      recurring: txRecurring,
      recurring_frequency: txRecurring ? txFrequency : '',
      tags: txTagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0),
      receipt_url: receiptFile ? 'receipt_uploaded' : ''
    };

    if (selectedTxId) {
      await updateTransaction(selectedTxId, payload);
    } else {
      await addTransaction(payload);
    }

    // Reset Form
    setTxAmount('');
    setTxMerchant('');
    setTxNotes('');
    setTxTagsInput('');
    setTxRecurring(false);
    setReceiptFile(null);
    setScanMessage('');
    setShowTxModal(false);
    setSelectedTxId(null);
  };

  const handleEditTxClick = (t: Transaction) => {
    setSelectedTxId(t.id);
    setTxType(t.type);
    setTxAmount(String(t.amount));
    setTxCategory(t.category);
    
    // Extract Month and Year
    const parts = t.date.split('-');
    if (parts.length >= 2) {
      setTxYear(parts[0]);
      setTxMonth(parts[1]);
    }
    
    setTxMerchant(t.merchant);
    setTxMethod(t.payment_method);
    setTxNotes(t.notes);
    setTxRecurring(t.recurring);
    setTxFrequency(t.recurring_frequency || 'monthly');
    setTxTagsInput(t.tags?.join(', ') || '');
    setShowTxModal(true);
  };

  // Budget Submits
  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount(budgetAmount)) return;
    
    await addBudget({
      category: budgetCategory,
      amount: parseAmount(budgetAmount),
      month_year: `${budgetYear}-${budgetMonth}`
    });
    
    setBudgetAmount('');
    setShowBudgetModal(false);
  };

  // Savings Goal Submits
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !isValidAmount(goalTargetAmount)) return;

    await addSavingsGoal({
      name: goalName,
      target_amount: parseAmount(goalTargetAmount),
      saved_amount: isValidAmount(goalSavedAmount) ? parseAmount(goalSavedAmount) : 0,
      target_date: `${goalYear}-${goalMonth}`,
      color: goalColor,
      notes: goalNotes
    });

    setGoalName('');
    setGoalTargetAmount('');
    setGoalSavedAmount('0');
    setGoalNotes('');
    setShowGoalModal(false);
  };

  // Contribution submits
  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !isValidAmount(contributionAmount)) return;
    
    const newSaved = Number(selectedGoal.saved_amount) + parseAmount(contributionAmount);
    
    // Add contribution transaction
    await addTransaction({
      type: 'expense',
      amount: parseAmount(contributionAmount),
      category: 'Savings',
      date: new Date().toISOString().substring(0, 7),
      time: '',
      merchant: `Goal: ${selectedGoal.name}`,
      payment_method: 'UPI',
      notes: `Savings contribution for ${selectedGoal.name}`,
      recurring: false,
      recurring_frequency: '',
      tags: ['savings', 'contribution'],
      receipt_url: ''
    });

    await updateSavingsGoal(selectedGoal.id, {
      saved_amount: newSaved
    });

    setContributionAmount('');
    setSelectedGoal(null);
  };

  // Bill reminder submits
  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle || !isValidAmount(billAmount)) return;

    await addBill({
      title: billTitle,
      amount: parseAmount(billAmount),
      due_date: `${billYear}-${billMonth}`,
      category: billCategory,
      paid: false,
      recurring: billRecurring
    });

    setBillTitle('');
    setBillAmount('');
    setBillRecurring(false);
    setShowBillModal(false);
  };

  const handlePayBill = async (b: Bill) => {
    // Record expense transaction
    await addTransaction({
      type: 'expense',
      amount: b.amount,
      category: 'Bills',
      date: new Date().toISOString().substring(0, 7),
      time: '',
      merchant: b.title,
      payment_method: 'UPI',
      notes: `Bill payment for ${b.title}`,
      recurring: b.recurring,
      recurring_frequency: b.recurring ? 'monthly' : '',
      tags: ['bill-pay'],
      receipt_url: ''
    });

    // Mark bill paid
    await updateBill(b.id, { paid: true });
  };

  // Export transactions helper
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Type,Amount,Category,Date,Merchant,Payment Method,Notes"].join(",") + "\n"
      + transactions.map(t => [t.type, t.amount, t.category, t.date, t.merchant, t.payment_method, t.notes].join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `novalife_transactions_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered transactions computed list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesQuery = 
          t.merchant.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          String(t.amount).includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Type Filter
      if (filterType !== 'all' && t.type !== filterType) return false;

      // 3. Category Filter
      if (filterCategory !== 'All' && t.category !== filterCategory) return false;

      // 4. Payment Method Filter
      if (filterMethod !== 'All' && t.payment_method !== filterMethod) return false;

      // 5. Period Filter
      if (filterPeriod !== 'all') {
        const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
        if (filterPeriod === 'month') {
          return t.date === currentMonthStr;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, filterType, filterCategory, filterMethod, filterPeriod]);

  // Compute category-wise spending totals for Pie chart
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    let totalExpenses = 0;
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const amt = Number(t.amount);
        map[t.category] = (map[t.category] || 0) + amt;
        totalExpenses += amt;
      }
    });

    const colors: Record<string, string> = {
      Food: 'var(--accent-red)',
      Shopping: 'var(--accent-purple)',
      Travel: 'var(--accent-orange)',
      Transportation: 'var(--accent-cyan)',
      Rent: '#ec4899',
      Education: 'var(--accent-blue)',
      Subscriptions: 'var(--accent-blue-light)',
      Entertainment: '#14b8a6',
      Groceries: '#f59e0b',
      General: 'var(--text-secondary)'
    };

    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      color: colors[category] || 'var(--accent-blue)'
    })).sort((a,b) => b.amount - a.amount);
  }, [transactions]);

  // Subscription analysis list
  const subscriptions = useMemo(() => {
    const list = transactions.filter(t => t.category === 'Subscriptions' || t.recurring || t.tags.includes('subscription'));
    const uniqueMap: Record<string, Transaction> = {};
    list.forEach(item => {
      const name = item.merchant.toLowerCase().trim();
      if (!uniqueMap[name] || new Date(item.date) > new Date(uniqueMap[name].date)) {
        uniqueMap[name] = item;
      }
    });
    return Object.values(uniqueMap);
  }, [transactions]);

  const totalMonthlySubscriptionCost = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0);

  const downloadPdfReport = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [14, 22, 40]; // Dark blue #0E1628
      const accentColor = [59, 130, 246]; // Blue #3B82F6
      const greenColor = [16, 185, 129]; // Green #10B981
      const redColor = [239, 68, 68]; // Red #EF4444
      const textColor = [51, 51, 51]; // Dark grey
      const lightBg = [245, 246, 248]; // Light grey background for tables

      // ─── Header Section ───
      // Decorative top bar
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 0, 210, 8, 'F');

      // Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('NovaLife Financial Report', 20, 25);

      // Subtitle
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);
      doc.text('Detailed performance analytics calculated automatically', 20, 31);

      // Metadata (Date, day, time)
      const now = new Date();
      const dayName = now.toLocaleDateString(undefined, { weekday: 'long' });
      const dateStr = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
      doc.text(`Generated on: ${dayName}, ${dateStr} at ${timeStr}`, 20, 37);

      // Horizontal separator line
      doc.setDrawColor(220, 224, 230);
      doc.setLineWidth(0.5);
      doc.line(20, 42, 190, 42);

      // ─── Financial Performance Summary Table ───
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Monthly Financial Performance Summary', 20, 52);

      // Table Header Background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(20, 58, 170, 10, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('Metric Description', 25, 64);
      doc.text('Value', 150, 64);

      // Table Rows
      const rows = [
        { label: 'Total Income Generated', val: `₹${totals.income.toLocaleString()}`, color: greenColor },
        { label: 'Total Expenses Logged', val: `-₹${totals.expense.toLocaleString()}`, color: redColor },
        { label: 'Net Monthly Savings', val: `₹${totals.balance.toLocaleString()}`, color: primaryColor },
        { label: 'Financial Health Score', val: `${financialHealthScore} / 100`, color: accentColor },
        { label: 'Total Monthly Subscription Fees', val: `₹${totalMonthlySubscriptionCost.toLocaleString()}`, color: primaryColor }
      ];

      let yPos = 68;
      rows.forEach((row, i) => {
        // Zebra striping background
        if (i % 2 === 0) {
          doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
          doc.rect(20, yPos, 170, 10, 'F');
        }

        // Cell border
        doc.setDrawColor(235, 238, 242);
        doc.rect(20, yPos, 170, 10, 'S');

        // Text
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(row.label, 25, yPos + 6);

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(row.color[0], row.color[1], row.color[2]);
        doc.text(row.val, 150, yPos + 6);

        yPos += 10;
      });

      // ─── Nova's Financial Advice ───
      yPos += 12;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Nova's Personalized Financial Advice", 20, yPos);

      yPos += 6;
      // Background box for AI Advice
      doc.setFillColor(245, 243, 255); // Very light purple
      doc.setDrawColor(216, 180, 254); // Light purple border
      
      const adviceText = loadingAiAdvice ? 'Nova is analyzing your recent cash flows...' : aiInsight;
      
      // Split text into lines for word wrapping in PDF
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const splitAdvice = doc.splitTextToSize(adviceText, 160);
      const boxHeight = splitAdvice.length * 5 + 10;
      
      doc.rect(20, yPos, 170, boxHeight, 'FD');

      // Draw advice text lines
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      let adviceY = yPos + 7;
      splitAdvice.forEach((line: string) => {
        doc.text(line, 25, adviceY);
        adviceY += 5;
      });

      // ─── Footer Section ───
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text('NovaLife Productivity & Financial Engine — All rights reserved.', 20, 280);
      doc.text('Page 1 of 1', 180, 280);

      // Save PDF
      const filename = `NovaLife_Financial_Report_${now.toISOString().substring(0, 10)}.pdf`;
      doc.save(filename);
      setShowReportModal(false);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  return (
    <div className="finance-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>💰 <span className="gradient-text">AI Finance Hub</span></h2>
          <p>Optimize your net worth with premium transaction analytics and intelligent coach guidelines.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary btn-sm" onClick={handleExport}>📥 Export CSV</button>
          <button className="btn-secondary btn-sm" onClick={() => setShowReportModal(true)}>📊 Monthly Report</button>
          <button className="btn-primary btn-sm" onClick={() => { setSelectedTxId(null); setTxAmount(''); setTxMerchant(''); setTxNotes(''); setTxTagsInput(''); setTxRecurring(false); setShowTxModal(true); }}>+ Add Record</button>
        </div>
      </div>

      {/* Overviewsummary row */}
      <div className="finance-overview-grid">
        <div className="finance-card balance">
          <div className="finance-card-title">💵 Available Balance</div>
          <div className="finance-card-value">₹{totals.balance.toLocaleString()}</div>
          <div className="finance-card-change" style={{ color: totals.balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {totals.balance >= 0 ? '📈 Positive Cashflow' : '📉 Cash deficit'}
          </div>
        </div>

        <div className="finance-card">
          <div className="finance-card-title">📥 Monthly Income</div>
          <div className="finance-card-value" style={{ color: 'var(--accent-green)' }}>₹{totals.income.toLocaleString()}</div>
          <div className="finance-card-change" style={{ color: 'var(--text-tertiary)' }}>Total logged sources</div>
        </div>

        <div className="finance-card">
          <div className="finance-card-title">📤 Monthly Expenses</div>
          <div className="finance-card-value" style={{ color: 'var(--accent-red)' }}>₹{totals.expense.toLocaleString()}</div>
          <div className="finance-card-change" style={{ color: 'var(--text-tertiary)' }}>Total spending transactions</div>
        </div>

        <div className="finance-card">
          <div className="finance-card-title">🛡️ Financial Health</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <div className="finance-card-value" style={{ color: financialHealthScore >= 80 ? 'var(--accent-green)' : financialHealthScore >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)', margin: 0 }}>
              {financialHealthScore}
            </div>
            <div className="score-circle-wrapper">
              <svg viewBox="0 0 36 36" className="score-circle-svg">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                  stroke={financialHealthScore >= 80 ? 'var(--accent-green)' : financialHealthScore >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)'}
                  strokeWidth="3" strokeDasharray={`${financialHealthScore}, 100`} />
              </svg>
            </div>
          </div>
          <div className="finance-card-change" style={{ color: 'var(--text-tertiary)' }}>Index calculated automatically</div>
        </div>
      </div>

      {/* Main Two Column layout */}
      <div className="finance-main-grid">
        {/* Left Side: Analytics & Transactions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Category spending distribution */}
            <div className="chart-container widget">
              <h5 className="finance-section-title">📊 Category-wise Distribution</h5>
              {categorySpending.length === 0 ? (
                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  No expense records logged to build distribution map.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '180px' }}>
                  {/* Inline SVG Pie/Donut Chart */}
                  <svg width="150" height="150" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="4"></circle>
                    {(() => {
                      let accumulatedPercent = 0;
                      return categorySpending.map((item, idx) => {
                        const strokeDash = `${item.percentage} ${100 - item.percentage}`;
                        const offset = 100 - accumulatedPercent;
                        accumulatedPercent += item.percentage;
                        return (
                          <circle
                            key={idx}
                            cx="21"
                            cy="21"
                            r="15.91549430918954"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="5"
                            strokeDasharray={strokeDash}
                            strokeDashoffset={offset}
                          >
                            <title>{item.category}: {item.percentage}%</title>
                          </circle>
                        );
                      });
                    })()}
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '180px', flex: 1 }}>
                    {categorySpending.slice(0, 5).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{item.category}</span>
                        </div>
                        <span style={{ fontWeight: 'bold' }}>{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Income vs Expenses Cashflow */}
            <div className="chart-container widget">
              <h5 className="finance-section-title">📉 Cash Flow analytics</h5>
              <div style={{ height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '130px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  {/* Income Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: totals.income > 0 ? `${Math.min(100, Math.round((totals.income / Math.max(totals.income, totals.expense)) * 100))}px` : '4px',
                      background: 'linear-gradient(to top, rgba(16,185,129,0.1), var(--accent-green))',
                      boxShadow: '0 0 12px rgba(16,185,129,0.2)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease'
                    }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Income</span>
                  </div>

                  {/* Expense Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: totals.expense > 0 ? `${Math.min(100, Math.round((totals.expense / Math.max(totals.income, totals.expense)) * 100))}px` : '4px',
                      background: 'linear-gradient(to top, rgba(239,68,68,0.1), var(--accent-red))',
                      boxShadow: '0 0 12px rgba(239,68,68,0.2)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease'
                    }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Expenses</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  <span>Net Savings:</span>
                  <span style={{ color: totals.balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold' }}>
                    ₹{totals.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Transactions List */}
          <div className="widget">
            <h5 className="finance-section-title">📝 Transaction Tracker</h5>

            {/* Filter Tools Panel */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search description, notes or amount..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontSize: '12px',
                  outline: 'none',
                  minWidth: '220px',
                  flex: 1
                }}
              />

              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value as any)}
                style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '12px', borderRadius: '4px', outline: 'none' }}
              >
                <option value="all">All Types</option>
                <option value="income">Incomes</option>
                <option value="expense">Expenses</option>
              </select>

              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '12px', borderRadius: '4px', outline: 'none' }}
              >
                <option value="All">All Categories</option>
                {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select 
                value={filterPeriod} 
                onChange={e => setFilterPeriod(e.target.value as any)}
                style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '12px', borderRadius: '4px', outline: 'none' }}
              >
                <option value="all">All Periods</option>
                <option value="month">This Month</option>
              </select>

              <select 
                value={filterMethod} 
                onChange={e => setFilterMethod(e.target.value)}
                style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '12px', borderRadius: '4px', outline: 'none' }}
              >
                <option value="All">All Methods</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* List Table */}
            <div className="tx-table-container">
              {loadingTransactions ? (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>Syncing transactions with PostgreSQL...</p>
              ) : filteredTransactions.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '36px', color: 'var(--text-tertiary)' }}>No matching financial records found.</p>
              ) : (
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Merchant / Details</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="tx-row">
                        <td>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{t.merchant}</div>
                          {t.notes && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{t.notes}</div>}
                          {t.tags && t.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                              {t.tags.map((tag, idx) => (
                                <span key={idx} style={{ fontSize: '9px', padding: '1px 4px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', color: 'var(--text-secondary)' }}>#{tag}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`tx-type-badge ${t.type}`}>{t.type}</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{t.category}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t.payment_method}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{formatMonthYear(t.date)}</td>
                        <td style={{ fontWeight: 'bold', color: t.type === 'income' ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                          {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn-secondary btn-xs" onClick={() => handleEditTxClick(t)}>Edit</button>
                            <button 
                              className="btn-secondary btn-xs" 
                              onClick={() => deleteTransaction(t.id)} 
                              style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.03)' }}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Budgets, Goals, Bills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Budget section */}
          <div className="widget">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h5 className="finance-section-title" style={{ margin: 0 }}>📊 Category Budgets</h5>
              <button className="btn-secondary btn-xs" onClick={() => setShowBudgetModal(true)}>+ Set Budget</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {budgets.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>No category budgets set for this month.</p>
              ) : (
                budgets.map((b) => {
                  const currentMonthStr = new Date().toISOString().substring(0, 7);
                  const spent = transactions
                    .filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(currentMonthStr))
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                  const progress = Math.min(100, Math.round((spent / Number(b.amount)) * 100));
                  const isOver = spent > Number(b.amount);
                  
                  return (
                    <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>{b.category}</span>
                          {isOver && <span style={{ color: 'var(--accent-red)', fontSize: '10px', marginLeft: '6px' }}>⚠️ Limit Exceeded!</span>}
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          ₹{spent.toLocaleString()} / ₹{b.amount.toLocaleString()} ({progress}%)
                        </span>
                      </div>
                      <div className="progress-bar-glow">
                        <div className="progress-fill-glow" style={{ 
                          width: `${progress}%`, 
                          background: isOver ? 'var(--accent-red)' : progress > 80 ? 'var(--accent-orange)' : 'var(--accent-blue)',
                          boxShadow: `0 0 8px ${isOver ? 'var(--accent-red)' : 'var(--accent-blue)'}`
                        }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Savings goals section */}
          <div className="widget">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h5 className="finance-section-title" style={{ margin: 0 }}>🎯 Savings Goals</h5>
              <button className="btn-secondary btn-xs" onClick={() => setShowGoalModal(true)}>+ New Goal</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {savingsGoals.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>No savings goals created.</p>
              ) : (
                savingsGoals.map((g) => {
                  const progress = Math.min(100, Math.round((Number(g.saved_amount) / Number(g.target_amount)) * 100));
                  return (
                    <div key={g.id} style={{ padding: '18px 20px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{g.name}</div>
                          {g.target_date && <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Target: {formatMonthYear(g.target_date)}</div>}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: g.color }}>{progress}%</span>
                      </div>

                      <div className="progress-bar-glow" style={{ marginBottom: '14px' }}>
                        <div className="progress-fill-glow" style={{ width: `${progress}%`, background: g.color, boxShadow: `0 0 8px ${g.color}` }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <span>Saved: <strong style={{ color: 'white' }}>₹{Number(g.saved_amount).toLocaleString()}</strong></span>
                          <span>Target: <strong style={{ color: 'white' }}>₹{Number(g.target_amount).toLocaleString()}</strong></span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                          <button className="btn-secondary btn-xs" style={{ flex: 1, padding: '6px 12px', fontSize: '11px' }} onClick={() => { setSelectedGoal(g); setContributionAmount(''); }}>+ Add Funds</button>
                          <button className="btn-secondary btn-xs" style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)', padding: '6px 10px' }} onClick={() => deleteSavingsGoal(g.id)}>✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bill Reminders section */}
          <div className="widget">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h5 className="finance-section-title" style={{ margin: 0 }}>🔔 Upcoming Bills</h5>
              <button className="btn-secondary btn-xs" onClick={() => setShowBillModal(true)}>+ Add Reminder</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bills.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>No upcoming bill reminders tracked.</p>
              ) : (
                bills.map((b) => {
                  const isOverdue = new Date(b.due_date).getTime() < Date.now() && !b.paid;
                  return (
                    <div key={b.id} className={`bill-row ${isOverdue ? 'bill-overdue' : ''} ${b.paid ? 'bill-paid' : ''}`}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', textDecoration: b.paid ? 'line-through' : 'none' }}>{b.title}</div>
                        <div style={{ fontSize: '10px', color: isOverdue ? 'var(--accent-red)' : 'var(--text-tertiary)', marginTop: '2px' }}>
                          Due: {formatMonthYear(b.due_date)} {isOverdue && ' (Overdue!)'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>₹{b.amount.toLocaleString()}</span>
                        {!b.paid ? (
                          <button className="btn-secondary btn-xs" onClick={() => handlePayBill(b)}>Pay</button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--accent-green)' }}>✓ Paid</span>
                        )}
                        <button className="btn-secondary btn-xs" style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} onClick={() => deleteBill(b.id)}>✕</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ──────────────── MODAL DIALOGS ──────────────── */}

      {/* Transaction Modal Overlay */}
      {showTxModal && (
        <div className="task-detail-overlay" onClick={() => setShowTxModal(false)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <button className="detail-close" onClick={() => setShowTxModal(false)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '20px' }}>
              <h3>{selectedTxId ? 'Edit Financial Record' : 'Record New Transaction'}</h3>
              <p>Add source of income or expense item</p>
            </div>

            {/* Receipt upload box */}
            {!selectedTxId && (
              <div className="receipt-dropzone" style={{ marginBottom: '16px' }}>
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  <span>{isScanningReceipt ? '⏳ Scanning Receipt...' : '📸 AI OCR Receipt Auto-scan'}</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>Drop receipt or click to upload (Gemini analyzes image details)</p>
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} style={{ display: 'none' }} />
                </label>
                {scanMessage && <div style={{ fontSize: '11px', color: 'var(--accent-blue-light)', marginTop: '8px', fontWeight: 'bold' }}>{scanMessage}</div>}
              </div>
            )}

            <form onSubmit={handleTxSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className={`btn-secondary btn-sm ${txType === 'expense' ? 'active' : ''}`} style={{ flex: 1, background: txType === 'expense' ? 'rgba(239,68,68,0.1)' : 'transparent', borderColor: txType === 'expense' ? 'var(--accent-red)' : undefined }} onClick={() => { setTxType('expense'); setTxCategory('Food'); }}>Expense</button>
                <button type="button" className={`btn-secondary btn-sm ${txType === 'income' ? 'active' : ''}`} style={{ flex: 1, background: txType === 'income' ? 'rgba(16,185,129,0.1)' : 'transparent', borderColor: txType === 'income' ? 'var(--accent-green)' : undefined }} onClick={() => { setTxType('income'); setTxCategory('Salary'); }}>Income</button>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Amount (₹)</label>
                  <input type="text" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="0.00" required style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Category</label>
                  <CustomSelect
                    options={txType === 'income' ? incomeCategoryOptions : expenseCategoryOptions}
                    value={txCategory}
                    onChange={setTxCategory}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Merchant / Source</label>
                  <input type="text" value={txMerchant} onChange={e => handleMerchantChange(e.target.value)} placeholder="e.g. Pizza Hut, Salary Depot" required style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Payment Method</label>
                  <CustomSelect
                    options={paymentMethodOptions}
                    value={txMethod}
                    onChange={setTxMethod}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Month</label>
                    <CustomSelect
                      options={monthSelectOptions}
                      value={txMonth}
                      onChange={setTxMonth}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Year</label>
                    <CustomSelect
                      options={yearSelectOptions}
                      value={txYear}
                      onChange={setTxYear}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tags (comma separated)</label>
                <input type="text" value={txTagsInput} onChange={e => setTxTagsInput(e.target.value)} placeholder="e.g. food, delivery, weekend" style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Notes</label>
                <textarea value={txNotes} onChange={e => setTxNotes(e.target.value)} placeholder="Add transaction details here..." style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', minHeight: '60px', fontFamily: 'inherit' }} />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <input type="checkbox" checked={txRecurring} onChange={e => setTxRecurring(e.target.checked)} id="tx-rec-cb" />
                <label htmlFor="tx-rec-cb" style={{ fontSize: '12px' }}>Is Recurring Monthly Transaction</label>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '12px', padding: '12px' }}>Save Transaction</button>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal Overlay */}
      {showBudgetModal && (
        <div className="task-detail-overlay" onClick={() => setShowBudgetModal(false)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="detail-close" onClick={() => setShowBudgetModal(false)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '20px' }}>
              <h3>Set Category Budget</h3>
              <p>Allocate maximum monthly limit</p>
            </div>
            <form onSubmit={handleBudgetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Category</label>
                <CustomSelect
                  options={budgetCategoryOptions}
                  value={budgetCategory}
                  onChange={setBudgetCategory}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Budget Limit (₹)</label>
                <input type="text" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} placeholder="e.g. 5000" required style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
              </div>
              
              <div className="form-grid">
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Month</label>
                  <CustomSelect
                    options={monthSelectOptions}
                    value={budgetMonth}
                    onChange={setBudgetMonth}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Year</label>
                  <CustomSelect
                    options={yearSelectOptions}
                    value={budgetYear}
                    onChange={setBudgetYear}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>Save Budget</button>
            </form>
          </div>
        </div>
      )}

      {/* Savings Goal Modal Overlay */}
      {showGoalModal && (
        <div className="task-detail-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button className="detail-close" onClick={() => setShowGoalModal(false)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '20px' }}>
              <h3>Create Savings Goal Roadmap</h3>
              <p>Set a target milestone for capital growth</p>
            </div>
            <form onSubmit={handleGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Goal Name</label>
                <input type="text" value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g. New Laptop, Japan Trip" required style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Target Amount (₹)</label>
                  <input type="text" value={goalTargetAmount} onChange={e => setGoalTargetAmount(e.target.value)} placeholder="e.g. 80000" required style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Initial Saved (₹)</label>
                  <input type="text" value={goalSavedAmount} onChange={e => setGoalSavedAmount(e.target.value)} placeholder="0" style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Target Month</label>
                  <CustomSelect
                    options={monthSelectOptions}
                    value={goalMonth}
                    onChange={setGoalMonth}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Target Year</label>
                  <CustomSelect
                    options={yearSelectOptions}
                    value={goalYear}
                    onChange={setGoalYear}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Theme Color</label>
                <CustomSelect
                  options={goalColorOptions}
                  value={goalColor}
                  onChange={setGoalColor}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Goal Roadmap Notes</label>
                <textarea value={goalNotes} onChange={e => setGoalNotes(e.target.value)} placeholder="Outline items, key links or plans..." style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', minHeight: '50px', fontFamily: 'inherit' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>Create Savings Roadmap</button>
            </form>
          </div>
        </div>
      )}

      {/* Goal contribution fund overlay */}
      {selectedGoal && (
        <div className="task-detail-overlay" onClick={() => setSelectedGoal(null)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="detail-close" onClick={() => setSelectedGoal(null)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '20px' }}>
              <h3>Add Savings Contribution</h3>
              <p>Add funds to: <strong>{selectedGoal.name}</strong></p>
            </div>
            <form onSubmit={handleContributionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Amount to Contribute (₹)</label>
                <input type="text" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} placeholder="e.g. 500" required style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
              </div>
              
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', borderLeft: `3px solid ${selectedGoal.color}` }}>
                🤖 Nova Suggestion: Saving ₹250 every day will help you reach this goal 3 months earlier!
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>Record Contribution</button>
            </form>
          </div>
        </div>
      )}

      {/* Bill Reminder Modal Overlay */}
      {showBillModal && (
        <div className="task-detail-overlay" onClick={() => setShowBillModal(false)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="detail-close" onClick={() => setShowBillModal(false)}>✕</button>
            <div className="detail-header" style={{ marginBottom: '20px' }}>
              <h3>Add Bill Reminder</h3>
              <p>Never miss a deadline and protect your credit score</p>
            </div>
            <form onSubmit={handleBillSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Bill Title</label>
                <input type="text" value={billTitle} onChange={e => setBillTitle(e.target.value)} placeholder="e.g. Broadband, Rent, Phone Recharge" required style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Amount Due (₹)</label>
                <input type="text" value={billAmount} onChange={e => setBillAmount(e.target.value)} placeholder="0.00" required style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }} />
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Due Month</label>
                  <CustomSelect
                    options={monthSelectOptions}
                    value={billMonth}
                    onChange={setBillMonth}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Due Year</label>
                  <CustomSelect
                    options={yearSelectOptions}
                    value={billYear}
                    onChange={setBillYear}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Category</label>
                <CustomSelect
                  options={billCategoryOptions}
                  value={billCategory}
                  onChange={setBillCategory}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={billRecurring} onChange={e => setBillRecurring(e.target.checked)} id="bill-rec-cb" />
                <label htmlFor="bill-rec-cb" style={{ fontSize: '12px' }}>Is Recurring Bill</label>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>Save Bill Reminder</button>
            </form>
          </div>
        </div>
      )}

      {/* Monthly Report Summary Modal */}
      {showReportModal && (
        <div className="task-detail-overlay" onClick={() => setShowReportModal(false)}>
          <div className="task-detail-panel widget" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', padding: '30px' }}>
            <button className="detail-close" onClick={() => setShowReportModal(false)}>✕</button>
            <div className="detail-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3>📊 Monthly Financial Summary Report</h3>
              <p>Detailed performance analytics calculated automatically</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Income Generated:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>₹{totals.income.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Expenses Logged:</span>
                <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>-₹{totals.expense.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Net Monthly Savings:</span>
                <span style={{ fontWeight: 'bold' }}>₹{totals.balance.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Financial Health Score:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-blue-light)' }}>{financialHealthScore} / 100</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Monthly Subscription Fees:</span>
                <span style={{ fontWeight: 'bold' }}>₹{totalMonthlySubscriptionCost.toLocaleString()}</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '8px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="ai-avatar-inner" style={{ width: '18px', height: '18px' }} />
                  <span>Nova's Financial Advice:</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
                  {loadingAiAdvice ? 'Nova is analyzing your recent cash flows...' : aiInsight}
                </p>
              </div>
            </div>

            <button className="btn-primary" onClick={downloadPdfReport} style={{ marginTop: '24px', width: '100%', padding: '12px' }}>Download Report</button>
          </div>
        </div>
      )}

    </div>
  );
}
