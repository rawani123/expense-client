"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await register(form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="fade-up" style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ marginBottom: "48px" }}>
          <h1 className="serif" style={{ fontSize: "36px", color: "var(--accent)", letterSpacing: "-1px" }}>Expanse</h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>track every rupee, every day</p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 500, marginBottom: "24px" }}>Create account</h2>

          {error && (
            <div style={{ background: "#ff5c5c22", border: "1px solid var(--danger)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</label>
              <input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
              <input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <button type="submit" disabled={loading}
              style={{ background: "var(--accent)", color: "#fff", borderRadius: "8px", padding: "12px", fontWeight: 500, fontSize: "14px", border: "none", marginTop: "8px", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating..." : "Get started →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent)", textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}