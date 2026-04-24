import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Activity, Beaker, Calculator, ShieldAlert, Search,
  Sun, Moon, Home, GitBranch, ChevronLeft, ChevronRight,
  FlaskConical
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/drugs", label: "Drug Search", icon: Search },
  { href: "/dose", label: "Dose Calc", icon: Calculator },
  { href: "/drip", label: "Drip Calc", icon: Beaker },
  { href: "/vitals", label: "Vitals Scorer", icon: Activity },
  { href: "/safety", label: "Safety Checker", icon: ShieldAlert },
  { href: "/interactions", label: "Interactions", icon: GitBranch },
];

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
        >
          <motion.div key={isDark ? "moon" : "sun"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="shrink-0">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.div>
          {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
        </button>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{isDark ? "Light Mode" : "Dark Mode"}</TooltipContent>}
    </Tooltip>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="relative border-r border-border bg-sidebar flex flex-col shrink-0 overflow-hidden"
      >
        <div className="h-16 flex items-center border-b border-border bg-sidebar-primary text-sidebar-primary-foreground shrink-0 overflow-hidden">
          <div className={`flex items-center gap-2.5 ${collapsed ? "px-4" : "px-5"} transition-all duration-250`}>
            <div className="shrink-0 w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <FlaskConical className="h-4 w-4 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }} className="flex flex-col leading-tight">
                  <span className="font-bold text-base tracking-tight text-white">ClinicalIQ</span>
                  <span className="text-[10px] text-white/60 font-medium tracking-wider uppercase">Decision Support</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button onClick={() => setCollapsed(!collapsed)} className="absolute top-[52px] -right-3 z-10 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors">
          {collapsed ? <ChevronRight className="h-3 w-3 text-muted-foreground" /> : <ChevronLeft className="h-3 w-3 text-muted-foreground" />}
        </button>

        <nav className="flex-1 overflow-y-auto py-3 overflow-x-hidden">
          <ul className={`space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <li key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.href} className={`flex items-center rounded-lg text-sm font-medium transition-all duration-150 relative group ${collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5 gap-3"} ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}>
                        {isActive && <motion.div layoutId="activeNav" className="absolute inset-0 rounded-lg bg-sidebar-primary" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
                        <Icon className={`h-4 w-4 relative z-10 shrink-0 ${isActive ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground"}`} />
                        {!collapsed && <span className="relative z-10">{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`border-t border-border ${collapsed ? "p-2" : "p-3"} space-y-1`}>
          <ThemeToggle collapsed={collapsed} />
          {!collapsed && (
            <div className="px-3 pt-1 text-[10px] text-muted-foreground/60 leading-relaxed">
              Educational use only.<br />Verify all calculations.
            </div>
          )}
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background min-w-0">
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={location} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: "easeOut" }} className="h-full">
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
