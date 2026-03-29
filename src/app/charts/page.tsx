"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from "recharts";
import { getExpenses } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#e67e22", Transport: "#2980b9", Shopping: "#8e44ad",
  Bills: "#c0392b", Health: "#27ae60", Entertainment: "#d35400", Other: "#7f8c8d",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function processMonthly(expenses: any[]) {
  const map: Record<string, number> = {};
  expenses.forEach(e => {
    const d = new Date(e.date);
    // Change label to "Mar 2026" instead of "Mar '26"
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    map[key] = (map[key] || 0) + e.amount;
  });
  return Object.entries(map)
    .map(([month, total]) => ({ month, total }))
    .slice(-8);
}

function processCategory(expenses: any[]) {
  const map: Record<string, number> = {};
  expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function processDaily(expenses: any[]) {
  const map: Record<number, number> = { 0:0,1:0,2:0,3:0,4:0,5:0,6:0 };
  expenses.forEach(e => {
    const day = new Date(e.date).getDay();
    map[day] += e.amount;
  });
  return DAYS.map((day, i) => ({ day, total: map[i] }));
}

function processWeekly(expenses: any[]) {
  const map: Record<string, number> = {};
  expenses.forEach(e => {
    const d = new Date(e.date);
    const week = new Date(d);
    week.setDate(d.getDate() - d.getDay());
    const key = week.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    map[key] = (map[key] || 0) + e.amount;
  });
  return Object.entries(map).map(([week, total]) => ({ week, total })).slice(-10);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e4e0d8", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <p style={{ fontSize: "12px", color: "#8a8880", marginBottom: "4px" }}>{label}</p>
      <p style={{ fontSize: "15px", fontWeight: 500, color: "#1a1a18" }}>₹{payload[0].value.toLocaleString()}</p>
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e4e0d8", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <p style={{ fontSize: "12px", color: "#8a8880", marginBottom: "4px" }}>{payload[0].name}</p>
      <p style={{ fontSize: "15px", fontWeight: 500, color: "#1a1a18" }}>₹{payload[0].value.toLocaleString()}</p>
      <p style={{ fontSize: "12px", color: "#8a8880" }}>{payload[0].payload.pct}% of total</p>
    </div>
  );
};

export default function ChartsPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview"|"trends"|"days">("overview");

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.replace("/auth/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      // fetch last 60 days
      const from = new Date(); from.setDate(from.getDate() - 60);
      const res = await getExpenses({ from: from.toISOString() });
      setExpenses(res.data);
    } catch { router.replace("/auth/login"); }
    finally { setLoading(false); }
  };

  const monthly  = processMonthly(expenses);
  const category = processCategory(expenses);
  const daily    = processDaily(expenses);
  const weekly   = processWeekly(expenses);
  const total    = expenses.reduce((s, e) => s + e.amount, 0);
  const avg      = expenses.length ? Math.round(total / expenses.length) : 0;
  const topDay   = daily.reduce((a, b) => a.total > b.total ? a : b, { day: "—", total: 0 });
  const topCat   = category[0] || { name: "—", value: 0 };

  // add pct to pie data
  const pieData = category.map(c => ({
    ...c,
    pct: total ? Math.round((c.value / total) * 100) : 0
  }));

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "trends",   label: "Trends" },
    { key: "days",     label: "By day" },
  ] as const;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <p style={{ color:"var(--muted)", fontSize:"14px" }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ maxWidth:"920px", margin:"0 auto", padding:"36px 24px" }}>

      {/* Header */}
      <div className="fade-up" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"32px" }}>
        <div>
          <Link href="/dashboard" style={{ color:"var(--muted)", fontSize:"13px", textDecoration:"none" }}>← Dashboard</Link>
          <h1 className="serif" style={{ fontSize:"32px", color:"var(--accent)", letterSpacing:"-0.5px", marginTop:"4px" }}>Charts</h1>
          <p style={{ color:"var(--muted)", fontSize:"13px", marginTop:"2px" }}>Last 60 days of spending</p>
        </div>
        <Link href="/expenses" style={{ color:"var(--muted)", fontSize:"13px", textDecoration:"none", padding:"8px 14px", background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"8px" }}>
          All expenses
        </Link>
      </div>

      {/* Summary cards */}
      <div className="fade-up-2" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:"12px", marginBottom:"24px" }}>
        {[
          { label:"Total spent",      value:`₹${total.toLocaleString()}`,        sub:`${expenses.length} transactions` },
          { label:"Avg per expense",  value:`₹${avg.toLocaleString()}`,           sub:"across all categories" },
          { label:"Top category",     value:topCat.name,                          sub:`₹${topCat.value.toLocaleString()}` },
          { label:"Busiest day",      value:topDay.day,                           sub:`₹${topDay.total.toLocaleString()} avg` },
        ].map(card => (
          <div key={card.label} style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"14px", padding:"18px 20px" }}>
            <p style={{ fontSize:"11px", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px" }}>{card.label}</p>
            <p className="serif" style={{ fontSize:"26px", marginTop:"6px", color:"var(--accent)" }}>{card.value}</p>
            <p style={{ fontSize:"11px", color:"var(--muted)", marginTop:"3px" }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="fade-up-2" style={{ display:"flex", gap:"6px", marginBottom:"20px" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              padding:"7px 18px", borderRadius:"99px", fontSize:"13px", border:"1.5px solid",
              borderColor: activeTab === t.key ? "var(--accent)" : "var(--border)",
              background:  activeTab === t.key ? "var(--accent-light)" : "var(--surface)",
              color:       activeTab === t.key ? "var(--accent)" : "var(--muted)",
              fontWeight:  activeTab === t.key ? 500 : 400,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="fade-up">

          {/* Monthly bar chart */}
          <div style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"16px", padding:"24px", marginBottom:"20px" }}>
            <p style={{ fontSize:"11px", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"20px" }}>Monthly spending</p>
            {monthly.length === 0 ? (
              <p style={{ color:"var(--muted)", fontSize:"13px", padding:"24px 0", textAlign:"center" }}>Not enough data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly} barSize={32}>
                  <XAxis dataKey="month" tick={{ fontSize:12, fill:"#8a8880" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:"#f5f3ee" }} />
                  <Bar dataKey="total" fill="var(--accent)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart + legend */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
            <div style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"16px", padding:"24px" }}>
              <p style={{ fontSize:"11px", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"20px" }}>By category</p>
              {pieData.length === 0 ? (
                <p style={{ color:"var(--muted)", fontSize:"13px", padding:"24px 0", textAlign:"center" }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                      dataKey="value" nameKey="name" paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.name] || "#7f8c8d"} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category breakdown list */}
            <div style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"16px", padding:"24px" }}>
              <p style={{ fontSize:"11px", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"16px" }}>Breakdown</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                {pieData.map(cat => (
                  <div key={cat.name} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:CATEGORY_COLORS[cat.name] || "#7f8c8d", flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                        <span style={{ fontSize:"13px" }}>{cat.name}</span>
                        <span style={{ fontSize:"12px", color:"var(--muted)" }}>₹{cat.value.toLocaleString()}</span>
                      </div>
                      <div style={{ background:"var(--surface2)", borderRadius:"99px", height:"4px" }}>
                        <div style={{ width:`${cat.pct}%`, height:"4px", background:CATEGORY_COLORS[cat.name] || "#7f8c8d", borderRadius:"99px" }} />
                      </div>
                    </div>
                    <span style={{ fontSize:"11px", color:"var(--muted)", minWidth:"30px", textAlign:"right" }}>{cat.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRENDS TAB */}
      {activeTab === "trends" && (
        <div className="fade-up">
          <div style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"16px", padding:"24px", marginBottom:"20px" }}>
            <p style={{ fontSize:"11px", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"20px" }}>Weekly spending trend</p>
            {weekly.length < 2 ? (
              <p style={{ color:"var(--muted)", fontSize:"13px", padding:"24px 0", textAlign:"center" }}>Add more expenses to see trends</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize:12, fill:"#8a8880" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2.5}
                    dot={{ fill:"var(--accent)", strokeWidth:0, r:4 }}
                    activeDot={{ r:6, fill:"var(--accent)" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Per-category trend bars */}
          <div style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"16px", padding:"24px" }}>
            <p style={{ fontSize:"11px", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"20px" }}>Category totals (60 days)</p>
            {pieData.length === 0 ? (
              <p style={{ color:"var(--muted)", fontSize:"13px", textAlign:"center", padding:"24px 0" }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, pieData.length * 52)}>
                <BarChart data={pieData} layout="vertical" barSize={20}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize:12, fill:"#8a8880" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:"#f5f3ee" }} />
                  <Bar dataKey="value" radius={[0,6,6,0]}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.name] || "#7f8c8d"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* DAYS TAB */}
      {activeTab === "days" && (
        <div className="fade-up">
          <div style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:"16px", padding:"24px", marginBottom:"20px" }}>
            <p style={{ fontSize:"11px", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px" }}>Spending by day of week</p>
            <p style={{ fontSize:"12px", color:"var(--muted)", marginBottom:"20px" }}>Total cumulative spend per day across last 60 days</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={daily} barSize={40}>
                <XAxis dataKey="day" tick={{ fontSize:12, fill:"#8a8880" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"#f5f3ee" }} />
                <Bar dataKey="total" radius={[6,6,0,0]}>
                  {daily.map((entry, i) => (
                    <Cell key={i} fill={entry.day === topDay.day ? "var(--accent)" : "#d4cfc8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Day cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:"8px" }}>
            {daily.map(d => {
              const isTop = d.day === topDay.day;
              return (
                <div key={d.day} style={{
                  background: isTop ? "var(--accent-light)" : "var(--surface)",
                  border:`1.5px solid ${isTop ? "var(--accent)" : "var(--border)"}`,
                  borderRadius:"12px", padding:"12px 8px", textAlign:"center"
                }}>
                  <p style={{ fontSize:"11px", color: isTop ? "var(--accent)" : "var(--muted)", fontWeight: isTop ? 500 : 400 }}>{d.day}</p>
                  <p style={{ fontSize:"13px", fontWeight:500, marginTop:"6px", color: isTop ? "var(--accent)" : "var(--text)" }}>
                    ₹{Math.round(d.total / 1000) > 0 ? (d.total / 1000).toFixed(1) + "k" : d.total}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}