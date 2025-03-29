import { useEffect, useState, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface Transaction {
  id: string;
  detail: string;
  amount: number;
  category: Category;
  date: string;
  tags?: string[];
}

enum Category {
  Food = "Food",
  Travel = "Travel",
  Tuition = "Tuition",
  Bills = "Bills",
  Recharge = "Recharge",
  Other = "Other",
}

type FilterType = {
  category?: Category;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"];

export default function AdvancedExpenseTracker() {
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formInput, setFormInput] = useState({
    detail: "",
    amount: 0,
    category: Category.Other,
    tags: "",
  });
  const [filters, setFilters] = useState<FilterType>({});
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load initial data
  useEffect(() => {
    const savedData = localStorage.getItem("advanced_transactions");
    if (savedData) {
      setTransactions(JSON.parse(savedData));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem("advanced_transactions", JSON.stringify(transactions));
    }
  }, [transactions]);

  const addTransaction = useCallback(() => {
    if (!formInput.detail.trim() || formInput.amount <= 0) {
      alert("Please fill all required fields with valid values");
      return;
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      detail: formInput.detail,
      amount: formInput.amount,
      category: formInput.category,
      date: new Date().toISOString(),
      tags: formInput.tags.split(",").map(tag => tag.trim()).filter(Boolean),
    };

    setTransactions(prev => [...prev, newTransaction]);
    setFormInput({ detail: "", amount: 0, category: Category.Other, tags: "" });
  }, [formInput]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply filters
    if (filters.category) {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters.minAmount) {
      result = result.filter(t => t.amount >= filters.minAmount);
    }
    if (filters.maxAmount) {
      result = result.filter(t => t.amount <= filters.maxAmount);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(t => 
        t.detail.toLowerCase().includes(term) || 
        t.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "amount":
          return multiplier * (a.amount - b.amount);
        case "category":
          return multiplier * a.category.localeCompare(b.category);
        case "date":
          return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
        default:
          return 0;
      }
    });

    return result;
  }, [transactions, filters, sortBy, sortOrder]);

  const chartData = useMemo(() => {
    const categoryTotals = filteredAndSortedTransactions.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<Category, number>);

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredAndSortedTransactions]);

  const total = useMemo(() => 
    filteredAndSortedTransactions.reduce((sum, t) => sum + t.amount, 0),
    [filteredAndSortedTransactions]
  );

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ color: "#2c3e50", textAlign: "center" }}>
        Advanced Expense Dashboard
      </h1>

      {/* Input Form */}
      <div style={{ background: "#f5f6fa", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gap: "15px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <input
            type="text"
            placeholder="Description"
            value={formInput.detail}
            onChange={e => setFormInput(prev => ({ ...prev, detail: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Amount"
            value={formInput.amount || ""}
            onChange={e => setFormInput(prev => ({ ...prev, amount: Number(e.target.value) }))}
          />
          <select
            value={formInput.category}
            onChange={e => setFormInput(prev => ({ ...prev, category: e.target.value as Category }))}
          >
            {Object.values(Category).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={formInput.tags}
            onChange={e => setFormInput(prev => ({ ...prev, tags: e.target.value }))}
          />
          <button onClick={addTransaction} style={{ background: "#27ae60" }}>Add Transaction</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "15px", flexWrap: "wrap" }}>
        <select onChange={e => setFilters(prev => ({ ...prev, category: e.target.value as Category || undefined }))}>
          <option value="">All Categories</option>
          {Object.values(Category).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min Amount"
          onChange={e => setFilters(prev => ({ ...prev, minAmount: Number(e.target.value) || undefined }))}
        />
        <input
          type="number"
          placeholder="Max Amount"
          onChange={e => setFilters(prev => ({ ...prev, maxAmount: Number(e.target.value) || undefined }))}
        />
        <input
          type="text"
          placeholder="Search..."
          onChange={e => setFilters(prev => ({ ...prev, searchTerm: e.target.value || undefined }))}
        />
        <select onChange={e => setSortBy(e.target.value as any)}>
          <option value="date">Date</option>
          <option value="amount">Amount</option>
          <option value="category">Category</option>
        </select>
        <button onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}>
          {sortOrder === "asc" ? "↑" : "↓"}
        </button>
      </div>

      {/* Transactions List */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Transactions ({filteredAndSortedTransactions.length})</h3>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {filteredAndSortedTransactions.map(t => (
            <div key={t.id} style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
              <span>{new Date(t.date).toLocaleDateString()} - </span>
              <span>{t.category}: </span>
              <span>{t.detail} </span>
              <span style={{ color: "#e74c3c" }}>${t.amount}</span>
              {t.tags?.length && (
                <span> [{t.tags.join(", ")}]</span>
              )}
              <button 
                onClick={() => deleteTransaction(t.id)}
                style={{ marginLeft: "10px", background: "#c0392b" }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chart and Total */}
      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <h3>Total: ${total.toFixed(2)}</h3>
        </div>
        <PieChart width={400} height={300}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
}