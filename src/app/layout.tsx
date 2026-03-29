"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/expenses",  label: "Expenses",  icon: "≡" },
  { href: "/charts",    label: "Charts",    icon: "◎" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const logout = () => { localStorage.clear(); router.replace("/auth/login"); };

  if (pathname.startsWith("/auth")) return null;

  if (!mounted) return (
    <aside style={{
      position:"fixed", top:0, left:0, height:"100vh", width:"200px",
      background:"var(--surface)", borderRight:"1.5px solid var(--border)", zIndex:40,
    }} />
  );

  return (
    <>
      <style>{`
        .sidebar { display: flex; }
        .mobile-nav { display: none; }
        .main-content { padding-left: 200px; }

        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .mobile-nav { display: flex !important; }
          .main-content { padding-left: 0 !important; padding-bottom: 80px; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="sidebar" style={{
        position:"fixed", top:0, left:0, height:"100vh", width:"200px",
        background:"var(--surface)", borderRight:"1.5px solid var(--border)",
        flexDirection:"column", padding:"32px 0", zIndex:40,
      }}>
        {/* Logo */}
        <div style={{ padding:"0 24px", marginBottom:"40px" }}>
          <h1 className="serif" style={{ fontSize:"26px", color:"var(--accent)", letterSpacing:"-0.5px" }}>
            Expanse
          </h1>
          <p style={{ fontSize:"11px", color:"var(--muted)", marginTop:"2px" }}>expense tracker</p>
        </div>

        {/* Nav links */}
        <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:"4px", padding:"0 12px" }}>
          {links.map(link => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} style={{ textDecoration:"none" }}>
                <div style={{
                  display:"flex", alignItems:"center", gap:"10px",
                  padding:"10px 12px", borderRadius:"10px",
                  background: active ? "var(--accent-light)" : "transparent",
                  color:      active ? "var(--accent)"       : "var(--muted)",
                  fontSize:"13px", fontWeight: active ? 500 : 400,
                  transition:"all 0.15s",
                  border: active ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface2)"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <span style={{ fontSize:"16px", lineHeight:1 }}>{link.icon}</span>
                  {link.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user + logout */}
        <div style={{ padding:"0 12px" }}>
          <div style={{ borderTop:"1.5px solid var(--border)", paddingTop:"16px" }}>
            <UserInfo />
            <button onClick={logout} style={{
              width:"100%", marginTop:"8px", padding:"9px 12px",
              background:"none", border:"1.5px solid var(--border)",
              borderRadius:"10px", color:"var(--muted)", fontSize:"12px",
              textAlign:"left", display:"flex", alignItems:"center", gap:"8px", cursor:"pointer",
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background="var(--danger-light)"; el.style.color="var(--danger)"; el.style.borderColor="#f5c6c2"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background="none"; el.style.color="var(--muted)"; el.style.borderColor="var(--border)"; }}>
              <span style={{ fontSize:"14px" }}>→</span> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="mobile-nav" style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:"var(--surface)", borderTop:"1.5px solid var(--border)",
        padding:"8px 0 16px", zIndex:40,
        justifyContent:"space-around", alignItems:"center",
      }}>
        {links.map(link => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} style={{ textDecoration:"none" }}>
              <div style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:"3px",
                padding:"6px 20px", borderRadius:"10px",
                background: active ? "var(--accent-light)" : "transparent",
                minWidth:"64px",
              }}>
                <span style={{ fontSize:"20px", lineHeight:1 }}>{link.icon}</span>
                <span style={{ fontSize:"10px", color: active ? "var(--accent)" : "var(--muted)", fontWeight: active ? 500 : 400 }}>
                  {link.label}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Logout on mobile */}
        <button onClick={logout} style={{
          display:"flex", flexDirection:"column", alignItems:"center", gap:"3px",
          padding:"6px 20px", background:"none", border:"none", minWidth:"64px",
        }}>
          <span style={{ fontSize:"20px", lineHeight:1 }}>→</span>
          <span style={{ fontSize:"10px", color:"var(--muted)" }}>Logout</span>
        </button>
      </nav>
    </>
  );
}

function UserInfo() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    try { const u = localStorage.getItem("user"); if (u) setUser(JSON.parse(u)); } catch {}
  }, []);

  if (!user?.name) return null;
  const initials = user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 12px" }}>
      <div style={{
        width:"30px", height:"30px", borderRadius:"50%",
        background:"var(--accent-light)", border:"1.5px solid var(--accent)",
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
      }}>
        <span style={{ fontSize:"11px", fontWeight:500, color:"var(--accent)" }}>{initials}</span>
      </div>
      <div style={{ overflow:"hidden" }}>
        <p style={{ fontSize:"12px", fontWeight:500, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</p>
        <p style={{ fontSize:"10px", color:"var(--muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.email}</p>
      </div>
    </div>
  );
}