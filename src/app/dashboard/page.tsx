"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getExpenses,
  getSummary,
  deleteExpense,
  createExpense,
  getMe,
  updateBudget,
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

function getBudgetStatus(spent: number, budget: number) {
  if (!budget) return null;
  const pct = (spent / budget) * 100;
  if (pct >= 100)
    return {
      level: "over",
      color: "var(--danger)",
      bg: "var(--danger-light)",
      border: "#f5c6c2",
      label: "Over budget!",
      emoji: "🚨",
      barColor: "#c0392b",
    };
  if (pct >= 85)
    return {
      level: "danger",
      color: "var(--danger)",
      bg: "var(--danger-light)",
      border: "#f5c6c2",
      label: "Almost out!",
      emoji: "⚠️",
      barColor: "#e74c3c",
    };
  if (pct >= 60)
    return {
      level: "warning",
      color: "var(--warning)",
      bg: "var(--warning-light)",
      border: "#f5e4b0",
      label: "Spending up",
      emoji: "📊",
      barColor: "#f39c12",
    };
  return {
    level: "good",
    color: "var(--success)",
    bg: "var(--success-light)",
    border: "#b8dfc9",
    label: "On track",
    emoji: "✅",
    barColor: "#2a7a4b",
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, byCategory: [] });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    init();
  }, []);

  const init = async () => {
    try {
      // Always fetch fresh user data from DB — budget included
      const meRes = await getMe();
      const freshUser = meRes.data;
      setUser(freshUser);
      localStorage.setItem("user", JSON.stringify(freshUser));
      if (freshUser.monthlyBudget) setBudget(freshUser.monthlyBudget);
      await fetchData();
    } catch {
      router.replace("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    const [expRes, sumRes] = await Promise.all([getExpenses(), getSummary()]);
    setExpenses(expRes.data.slice(0, 10));
    setSummary(sumRes.data);
    setAlertDismissed(false);
  };

  const saveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (!val || val <= 0) return;
    setBudgetSaving(true);
    try {
      const res = await updateBudget(val); // saves to MongoDB
      setBudget(res.data.monthlyBudget);
      setUser((u: any) => ({ ...u, monthlyBudget: res.data.monthlyBudget }));
      setShowBudget(false);
      setBudgetInput("");
    } finally {
      setBudgetSaving(false);
    }
  };

  const removeBudget = async () => {
    setBudgetSaving(true);
    try {
      await updateBudget(0);
      setBudget(0);
      setUser((u: any) => ({ ...u, monthlyBudget: 0 }));
      setShowBudget(false);
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    fetchData();
  };
 

  const status = getBudgetStatus(summary.total, budget);
  const budgetPct = budget ? Math.min((summary.total / budget) * 100, 100) : 0;
  const remaining = budget - summary.total;

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ color: "var(--muted)", fontSize: "14px" }}>
          Loading...
        </div>
      </div>
    );

  return (
    <div style={{ maxWidth: "920px", margin: "0 auto", padding: "36px 24px" }}>
      {/* Alert Banner */}
      {status && !alertDismissed && status.level !== "good" && (
        <div
          className="fade-up"
          style={{
            background: status.bg,
            border: `1px solid ${status.border}`,
            borderLeft: `4px solid ${status.color}`,
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "18px" }}>{status.emoji}</span>
            <div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: status.color,
                }}
              >
                {status.label}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginTop: "2px",
                }}
              >
                {status.level === "over"
                  ? `₹${Math.abs(remaining).toLocaleString()} over your ₹${budget.toLocaleString()} monthly budget`
                  : `₹${remaining.toLocaleString()} remaining of your ₹${budget.toLocaleString()} budget`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontSize: "18px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div
        className="fade-up"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "36px",
        }}
      >
        <div>
          <h1
            className="serif"
            style={{
              fontSize: "38px",
              color: "var(--accent)",
              letterSpacing: "-1px",
            }}
          >
            Expanse
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "13px",
              marginTop: "3px",
            }}
          >
            Hey {user?.name?.split(" ")[0]} 👋 —{" "}
            {new Date().toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div
        className="fade-up-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "16px",
            padding: "22px 24px",
          }}
        >
          <p
            style={{
              color: "var(--muted)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Spent this month
          </p>
          <p
            className="serif"
            style={{
              fontSize: "32px",
              marginTop: "6px",
              color: status ? status.color : "var(--text)",
            }}
          >
            ₹{summary.total.toLocaleString()}
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              marginTop: "4px",
            }}
          >
            {expenses.length} transactions
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: `1.5px solid ${budget && status ? status.border : "var(--border)"}`,
            borderRadius: "16px",
            padding: "22px 24px",
            position: "relative",
          }}
        >
          <p
            style={{
              color: "var(--muted)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Monthly limit
          </p>
          {budget ? (
            <>
              <p
                className="serif"
                style={{ fontSize: "32px", marginTop: "6px" }}
              >
                ₹{budget.toLocaleString()}
              </p>
              <button
                onClick={() => {
                  setBudgetInput(budget.toString());
                  setShowBudget(true);
                }}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "var(--surface2)",
                  border: "1.5px solid var(--border)",
                  color: "var(--muted)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                }}
              >
                Edit
              </button>
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  marginTop: "8px",
                }}
              >
                No limit set
              </p>
              <button
                onClick={() => setShowBudget(true)}
                style={{
                  marginTop: "10px",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                Set limit
              </button>
            </>
          )}
        </div>

        <div
          style={{
            background:
              budget && remaining < 0
                ? "var(--danger-light)"
                : "var(--surface)",
            border: `1.5px solid ${budget && remaining < 0 ? "#f5c6c2" : "var(--border)"}`,
            borderRadius: "16px",
            padding: "22px 24px",
          }}
        >
          <p
            style={{
              color: "var(--muted)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {budget ? "Remaining" : "Top category"}
          </p>
          <p
            className="serif"
            style={{
              fontSize: "32px",
              marginTop: "6px",
              color: budget
                ? remaining < 0
                  ? "var(--danger)"
                  : "var(--success)"
                : "var(--text)",
            }}
          >
            {budget
              ? remaining < 0
                ? `-₹${Math.abs(remaining).toLocaleString()}`
                : `₹${remaining.toLocaleString()}`
              : summary.byCategory[0]?._id || "—"}
          </p>
          {budget && (
            <p
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                marginTop: "4px",
              }}
            >
              {Math.round(budgetPct)}% of budget used
            </p>
          )}
        </div>
      </div>

      {/* Budget progress bar */}
      {budget > 0 && (
        <div
          className="fade-up-2"
          style={{
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "14px",
            padding: "18px 24px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Budget progress
            </span>
            <span
              style={{
                fontSize: "12px",
                color: status?.color,
                fontWeight: 500,
              }}
            >
              {status?.emoji} {status?.label} · {Math.round(budgetPct)}%
            </span>
          </div>
          <div
            style={{
              background: "var(--surface2)",
              borderRadius: "99px",
              height: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${budgetPct}%`,
                height: "8px",
                borderRadius: "99px",
                background: status?.barColor || "var(--accent)",
                transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "6px",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>₹0</span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
              ₹{budget.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {summary.byCategory.length > 0 && (
        <div
          className="fade-up-3"
          style={{
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "16px",
            padding: "22px 24px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "16px",
            }}
          >
            Spending by category
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {summary.byCategory.map((cat: any) => {
              const pct = Math.round((cat.total / summary.total) * 100);
              const color = CATEGORY_COLORS[cat._id] || "#7f8c8d";
              const bg = CATEGORY_BG[cat._id] || "#f4f4f4";
              return (
                <div
                  key={cat._id}
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
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
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <span style={{ fontSize: "13px" }}>{cat._id}</span>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                        ₹{cat.total.toLocaleString()}{" "}
                        <span style={{ fontSize: "11px" }}>({pct}%)</span>
                      </span>
                    </div>
                    <div
                      style={{
                        background: "var(--surface2)",
                        borderRadius: "99px",
                        height: "5px",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "5px",
                          background: color,
                          borderRadius: "99px",
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent expenses */}
      <div className="fade-up-4">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Recent expenses
          </p>
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
              boxShadow: "0 2px 8px rgba(42,122,75,0.2)",
            }}
          >
            + Add expense
          </button>
        </div>

        {expenses.length === 0 ? (
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
              No expenses yet
            </p>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Click "+ Add expense" to get started
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {expenses.map((exp: any) => {
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
                          day: "numeric",
                          month: "short",
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

      {/* Budget Modal */}
      {showBudget && (
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
              maxWidth: "380px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 500 }}>
                Set monthly limit
              </h3>
              <button
                onClick={() => setShowBudget(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: "20px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                marginBottom: "24px",
              }}
            >
              Saved to your account — persists across logins.
            </p>

            <div style={{ marginBottom: "20px" }}>
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
                Monthly budget (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 20000"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                autoFocus
              />
            </div>

            <div
              style={{
                background: "var(--surface2)",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--muted)",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Alert thresholds
              </p>
              {[
                {
                  pct: 60,
                  color: "#b8860b",
                  bg: "#fdf8ee",
                  label: "Spending up — 60%",
                },
                {
                  pct: 85,
                  color: "#c0392b",
                  bg: "#fdf0ee",
                  label: "Almost out — 85%",
                },
                {
                  pct: 100,
                  color: "#922b21",
                  bg: "#fdf0ee",
                  label: "Over budget — 100%",
                },
              ].map((a) => (
                <div
                  key={a.pct}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "6px",
                      background: a.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: a.color,
                      }}
                    />
                  </div>
                  <span
                    style={{ fontSize: "12px", color: "var(--text)", flex: 1 }}
                  >
                    {a.label}
                  </span>
                  {budgetInput && parseFloat(budgetInput) > 0 && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: a.color,
                        fontWeight: 500,
                      }}
                    >
                      ₹
                      {Math.round(
                        (parseFloat(budgetInput) * a.pct) / 100,
                      ).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {budget > 0 && (
                <button
                  onClick={removeBudget}
                  disabled={budgetSaving}
                  style={{
                    flex: 1,
                    background: "var(--surface2)",
                    border: "1.5px solid var(--border)",
                    color: "var(--muted)",
                    borderRadius: "8px",
                    padding: "11px",
                    fontSize: "13px",
                  }}
                >
                  Remove
                </button>
              )}
              <button
                onClick={saveBudget}
                disabled={budgetSaving}
                style={{
                  flex: 2,
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  fontWeight: 500,
                  fontSize: "14px",
                  opacity: budgetSaving ? 0.7 : 1,
                }}
              >
                {budgetSaving ? "Saving..." : "Save limit →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <AddExpenseModal
          onClose={() => {
            setShowAdd(false);
            fetchData();
          }}
        />
      )}
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
              lineHeight: 1,
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
              marginTop: "4px",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 2px 8px rgba(42,122,75,0.25)",
            }}
          >
            {loading ? "Saving..." : "Save expense →"}
          </button>
        </form>
      </div>
    </div>
  );
}
