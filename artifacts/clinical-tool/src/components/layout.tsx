import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, Beaker, Calculator, ShieldAlert, Search } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Drug Search", icon: Search },
    { href: "/dose", label: "Dose Calc", icon: Calculator },
    { href: "/drip", label: "Drip Calc", icon: Beaker },
    { href: "/vitals", label: "Vitals Scorer", icon: Activity },
    { href: "/safety", label: "Safety Checker", icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border bg-sidebar-primary text-sidebar-primary-foreground">
          <Activity className="h-6 w-6 mr-2" />
          <h1 className="font-bold text-lg tracking-tight">ClinicalIQ</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-3 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          <p>For educational use only.</p>
          <p>Verify all calculations.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
