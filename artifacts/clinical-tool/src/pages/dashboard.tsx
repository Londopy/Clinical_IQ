import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetDrugStats } from "@workspace/api-client-react";
import {
  Search, Calculator, Beaker, Activity, ShieldAlert, GitBranch,
  Pill, Shield, Zap, ArrowUpRight, HeartPulse, FlaskConical
} from "lucide-react";

const tools = [
  { href: "/drugs",        label: "Drug Search",    description: "Full clinical profiles, mechanisms, contraindications & reversal agents for 49 emergency drugs.", icon: Search,     soft: "bg-blue-50 dark:bg-blue-950/40",    text: "text-blue-600 dark:text-blue-400" },
  { href: "/dose",         label: "Dose Calculator",description: "Weight-based dosing with renal adjustment, allergy screening and dose-fraction control.", icon: Calculator, soft: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-600 dark:text-violet-400" },
  { href: "/drip",         label: "Drip Calculator",description: "IV pump rates with bag duration, concentration and max-rate warnings.", icon: Beaker,     soft: "bg-cyan-50 dark:bg-cyan-950/40",    text: "text-cyan-600 dark:text-cyan-400" },
  { href: "/vitals",       label: "Vitals Scorer",  description: "Simultaneous NEWS2, qSOFA and GCS from one set of vitals. Instant risk stratification.", icon: Activity,   soft: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
  { href: "/safety",       label: "Safety Checker", description: "Full contraindication and interaction profile against a complete patient picture.", icon: ShieldAlert, soft: "bg-orange-50 dark:bg-orange-950/40",  text: "text-orange-600 dark:text-orange-400" },
  { href: "/interactions", label: "Interactions",   description: "Pairwise drug-drug interaction check across an entire medication list at once.", icon: GitBranch,  soft: "bg-rose-50 dark:bg-rose-950/40",    text: "text-rose-600 dark:text-rose-400" },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp   = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.25 } } };

function StatBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <div className="text-xl font-bold text-foreground leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useGetDrugStats();

  return (
    <div className="min-h-full p-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">ClinicalIQ</h1>
            <p className="text-sm text-muted-foreground">Emergency medicine decision support</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-xl mt-4 leading-relaxed text-sm">
          Point-of-care tools for clinicians — drug lookup, dose calculations, drip rates,
          early warning scores and safety screening in one place.
        </p>
      </motion.div>

      {stats && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatBadge icon={Pill}       label="Total drugs"      value={stats.total_drugs} />
          <StatBadge icon={Zap}        label="Controlled subs." value={stats.controlled_count} />
          <StatBadge icon={Shield}     label="Reversal agents"  value={stats.reversal_agent_count} />
          <StatBadge icon={HeartPulse} label="Drug classes"     value={stats.drug_classes.length} />
        </motion.div>
      )}

      <motion.div variants={stagger} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map(tool => {
          const Icon = tool.icon;
          return (
            <motion.div key={tool.href} variants={fadeUp}>
              <Link href={tool.href}>
                <div className="group relative bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${tool.soft} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${tool.text}`} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1.5">{tool.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{tool.description}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-10 text-xs text-muted-foreground/60 max-w-md leading-relaxed">
        For educational purposes only. Always verify doses with current formularies and
        consult senior clinicians before administration.
      </motion.p>
    </div>
  );
}
