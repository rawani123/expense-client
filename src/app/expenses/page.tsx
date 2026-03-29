"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getExpenses,
  deleteExpense,
  createExpense,
  updateExpense,
} from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#e67e22",
  Transport: "#2980b9",
  Shopping: "#8e44ad",
  Bills: "#c0392b",
  Health: "#27ae60",
  Entertainment: "#d35400",
  Other: "#7f8c8d",
};
const CATEGORY_BG: Record<string, string> = {
  Food: "#fdf3e8",
  Transport: "#eaf4fd",
  Shopping: "#f5eefa",
  Bills: "#fdf0ee",
  Health: "#e8f8f0",
  Entertainment: "#fef0e6",
  Other: "#f4f4f4",
};
const CATEGORIES = [
  "All",
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Other",
];

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingExp, setEditingExp] = useState<any>(null);
  const [category, setCategory] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/auth/login");
      return;
    }
    fetchExpenses();
  }, [category, from, to]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (category !== "All") params.category = category;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await getExpenses(params);
      setExpenses(res.data);
      setTotal(res.data.reduce((s: number, e: any) => s + e.amount, 0));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    fetchExpenses();
  };

  const exportCSV = () => {
    const header = "Date,Description,Category,Amount\n";
    const rows = filtered
      .map(
        (e: any) =>
          `${new Date(e.date).toLocaleDateString("en-IN")},${e.description},${e.category},${e.amount}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
  };

  const filtered = expenses.filter((e) =>
    search ? e.description.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div style={{ maxWidth: "920px", margin: "0 auto", padding: "36px 24px" }}>
      {/* Header */}
      <div
        className="fade-up"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "4px",
            }}
          >
            <Link
              href="/dashboard"
              style={{
                color: "var(--muted)",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              ← Dashboard
            </Link>
          </div>
          <h1
            className="serif"
            style={{
              fontSize: "32px",
              color: "var(--accent)",
              letterSpacing: "-0.5px",
            }}
          >
            All Expenses
          </h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={exportCSV}
            style={{
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              color: "var(--text)",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="fade-up-2"
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                display: "block",
                marginBottom: "5px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Search
            </label>
            <input
              placeholder="Search description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                display: "block",
                marginBottom: "5px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                display: "block",
                marginBottom: "5px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: "5px 14px",
                borderRadius: "99px",
                fontSize: "12px",
                border: "1.5px solid",
                borderColor: category === c ? "var(--accent)" : "var(--border)",
                background:
                  category === c ? "var(--accent-light)" : "var(--surface2)",
                color: category === c ? "var(--accent)" : "var(--muted)",
                fontWeight: category === c ? 500 : 400,
              }}
            >
              {c}
            </button>
          ))}
          {(from || to || category !== "All" || search) && (
            <button
              onClick={() => {
                setFrom("");
                setTo("");
                setCategory("All");
                setSearch("");
              }}
              style={{
                padding: "5px 14px",
                borderRadius: "99px",
                fontSize: "12px",
                border: "1.5px solid var(--border)",
                background: "none",
                color: "var(--danger)",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div
        className="fade-up-2"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <p style={{ fontSize: "12px", color: "var(--muted)" }}>
          {filtered.length} expense{filtered.length !== 1 ? "s" : ""}{" "}
          {category !== "All" ? `in ${category}` : ""}
        </p>
        <p style={{ fontSize: "14px", fontWeight: 500 }}>
          Total:{" "}
          <span style={{ color: "var(--accent)" }}>
            ₹{filtered.reduce((s, e) => s + e.amount, 0).toLocaleString()}
          </span>
        </p>
      </div>

      {/* Expense list */}
      <div className="fade-up-3">
        {loading ? (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: "14px",
            }}
          >
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: "var(--surface)",
              border: "1.5px dashed var(--border)",
              borderRadius: "16px",
              padding: "48px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>
              No expenses found
            </p>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {filtered.map((exp: any) => {
              const color = CATEGORY_COLORS[exp.category] || "#7f8c8d";
              const bg = CATEGORY_BG[exp.category] || "#f4f4f4";
              return (
                <div
                  key={exp._id}
                  style={{
                    background: "var(--surface)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--accent)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: color,
                        }}
                      />
                    </div>
                    <div>
                      <p style={{ fontSize: "14px" }}>{exp.description}</p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--muted)",
                          marginTop: "2px",
                        }}
                      >
                        {exp.category} ·{" "}
                        {new Date(exp.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <span style={{ fontWeight: 500, fontSize: "15px" }}>
                      ₹{exp.amount.toLocaleString()}
                    </span>

                    {/* Edit button */}
                    <button
                      onClick={() => setEditingExp(exp)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        fontSize: "14px",
                        lineHeight: 1,
                        padding: "4px 6px",
                        borderRadius: "6px",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--accent-light)";
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "none";
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--muted)";
                      }}
                    >
                      ✎
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(exp._id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        fontSize: "18px",
                        lineHeight: 1,
                        padding: "4px 6px",
                        borderRadius: "6px",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--danger-light)";
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--danger)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "none";
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--muted)";
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd    && <AddExpenseModal   onClose={() => { setShowAdd(false);    fetchExpenses(); }} />}
{editingExp && <EditExpenseModal  expense={editingExp} onClose={() => { setEditingExp(null); fetchExpenses(); }} />}
    </div>
  );
}

function AddExpenseModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    amount: "",
    description: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createExpense({ ...form, amount: parseFloat(form.amount) });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,26,24,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 50,
      }}
    >
      <div
        className="fade-up"
        style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: 500 }}>Add expense</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontSize: "20px",
            }}
          >
            ×
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                display: "block",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Amount (₹)
            </label>
            <input
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              min="1"
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                display: "block",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Description
            </label>
            <input
              placeholder="What did you spend on?"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                display: "block",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {[
                "Food",
                "Transport",
                "Shopping",
                "Bills",
                "Health",
                "Entertainment",
                "Other",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                display: "block",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "13px",
              fontWeight: 500,
              fontSize: "14px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving..." : "Save expense →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditExpenseModal({ expense, onClose }: { expense: any; onClose: () => void }) {
  const [form, setForm] = useState({
    amount:      String(expense.amount),
    description: expense.description,
    category:    expense.category,
    date:        new Date(expense.date).toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await updateExpense(expense._id, { ...form, amount: parseFloat(form.amount) });
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,26,24,0.4)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", zIndex:50 }}>
      <div className="fade-up" style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"20px", padding:"32px", width:"100%", maxWidth:"420px", boxShadow:"0 20px 60px rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
          <h3 style={{ fontSize:"18px", fontWeight:500 }}>Edit expense</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--muted)", fontSize:"20px" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div>
            <label style={{ fontSize:"11px", color:"var(--muted)", display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="1" />
          </div>
          <div>
            <label style={{ fontSize:"11px", color:"var(--muted)", display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label style={{ fontSize:"11px", color:"var(--muted)", display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {["Food","Transport","Shopping","Bills","Health","Entertainment","Other"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize:"11px", color:"var(--muted)", display:"block", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div style={{ display:"flex", gap:"10px", marginTop:"4px" }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, background:"var(--surface2)", border:"1.5px solid var(--border)", color:"var(--muted)", borderRadius:"8px", padding:"11px", fontSize:"13px" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ flex:2, background:"var(--accent)", color:"#fff", border:"none", borderRadius:"8px", padding:"12px", fontWeight:500, fontSize:"14px", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Save changes →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
