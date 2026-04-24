import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Activity, Beaker, Calculator, ShieldAlert, Search,
  Sun, Moon, Home, GitBranch, ChevronLeft, ChevronRight,
  FlaskConical, Stethoscope
} from "lucide-react";

const navItems = [
  { href: "/",            label: "Dashboard",    icon: Home,        color: "text-slate-400" },
  { href: "/drugs",       label: "Drug Search",  icon: Search,      color: "text-blue-400" },
  { href: "/dose",        label: "Dose Calc",    icon: Calculator,  color: "text-violet-400" },
  { href: "/drip",        label: "Drip Calc",    icon: Beaker,      color: "text-cyan-400" },
  { href: "/vitals",      label: "Vitals Scorer",icon: Activity,    color: "text-emerald-400" },
  { href: "/safety",      label: "Safety Check", icon: ShieldAlert, color: "text-orange-400" },
  { href: "/interactions",label: "Interactions", icon: GitBranch,   color: "text-rose-400" },
];

function NavItem({ item, isActive, collapsed }: {
  item: typeof navItems[0];
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <div className={`
        relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
        transition-colors duration-150 group
        ${isActive
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:text-white hover:bg-white/6"}
        ${collapsed ? "justify-center px-2" : ""}
      `}>
        {isActive && (
          <motion.div
            layoutId="nav-pill"
            className="absolute inset-0 rounded-lg bg-white/10 border border-white/15"
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          />
        )}
        <Icon className={`h-4 w-4 relative z-10 shrink-0 transition-colors ${isActive ? "text-white" : item.color + " group-hover:text-white"}`} />
        {!collapsed && (
          <span className={`relative z-10 text-sm font-medium tracking-tight truncate ${isActive ? "text-white" : ""}`}>
            {item.label}
          </span>
        )}
        {collapsed && isActive && (
          <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-700">
            {item.label}
          </div>
        )}
      </div>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar — always deep navy */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="relative flex flex-col shrink-0 overflow-hidden"
        style={{ background: "hsl(222 47% 5%)" }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center shrink-0 px-3 border-b border-white/8">
          <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? "justify-center w-full" : ""}`}>
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
              <FlaskConical className="h-3.5 w-3.5 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0"
                >
                  <div className="text-white font-bold text-sm tracking-tight leading-none">ClinicalIQ</div>
                  <div className="text-slate-500 text-[10px] font-medium tracking-widest uppercase mt-0.5">Decision Support</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute top-[52px] -right-3 z-20 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3 text-muted-foreground" />
            : <ChevronLeft  className="h-3 w-3 text-muted-foreground" />}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          <ul className={`space-y-0.5 ${collapsed ? "px-1.5" : "px-2"}`}>
            {navItems.map(item => (
              <li key={item.href}>
                <NavItem
                  item={item}
                  isActive={location === item.href}
                  collapsed={collapsed}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom controls */}
        <div className={`border-t border-white/8 ${collapsed ? "p-1.5" : "p-2"} space-y-1`}>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`
              w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm
              text-slate-400 hover:text-white hover:bg-white/6 transition-colors
              ${collapsed ? "justify-center" : ""}
            `}
          >
            {isDark
              ? <Sun  className="h-4 w-4 shrink-0" />
              : <Moon className="h-4 w-4 shrink-0" />}
            {!collapsed && <span className="text-xs font-medium">{isDark ? "Light mode" : "Dark mode"}</span>}
          </button>

          {!collapsed && (
            <div className="px-2 pt-1 pb-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                <Stethoscope className="h-3 w-3" />
                Educational use only
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background min-w-0">
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
