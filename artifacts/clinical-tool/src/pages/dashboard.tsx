import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetDrugStats } from "@workspace/api-client-react";
import {
  Search, Calculator, Beaker, Activity, ShieldAlert, GitBranch,
  Pill, FlaskConical, ArrowRight, Zap, Shield, HeartPulse
} from "lucide-react";

const tools = [
  {
    href: "/drugs",
    label: "Drug Search",
    description: "Browse 49 emergency drugs with full clinical detail, mechanisms, and reversal agents.",
    icon: Search,
    color: "from-blue-500 to-blue-600",
    lightBg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    href: "/dose",
    label: "Dose Calculator",
    description: "Weight-based dosing with patient-aware safety checks, renal adjustments, and allergy screening.",
    icon: Calculator,
    color: "from-violet-500 to-violet-600",
    lightBg: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    href: "/drip",
    label: "Drip Calculator",
    description: "IV pump rates in mL/hr with bag duration, concentration, and max rate warnings.",
    icon: Beaker,
    color: "from-cyan-500 to-cyan-600",
    lightBg: "bg-cyan-50 dark:bg-cyan-950/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    href: "/vitals",
    label: "Vitals Scorer",
    description: "Simultaneous NEWS2, qSOFA, and GCS from one set of vitals. Instant risk stratification.",
    icon: Activity,
    color: "from-emerald-500 to-emerald-600",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/safety",
    label: "Safety Checker",
    description: "Full contraindication and drug interaction profile against a complete patient profile.",
    icon: ShieldAlert,
    color: "from-orange-500 to-orange-600",
    lightBg: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    href: "/interactions",
    label: "Interactions Checker",
    description: "Check pairwise drug-drug interactions across an entire medication list at once.",
    icon: GitBranch,
    color: "from-rose-500 to-rose-600",
    lightBg: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3 } },
};

export default function Dashboard() {
  const { data: stats } = useGetDrugStats();

  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-muted/30 p-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <FlaskConical className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">ClinicalIQ</h1>
            <p className="text-sm text-muted-foreground">Emergency Medicine Decision Support</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed mt-4">
          Fast, reliable clinical tools for paramedics, nurses, and clinicians at the bedside.
          Powered by the <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">drugdose</code> and{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">vitalscore</code> Python libraries.
        </p>

        {/* Stats bar */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-6 mt-6"
          >
            {[
              { icon: Pill, label: "Drugs", value: stats.total_drugs, color: "text-primary" },
              { icon: Shield, label: "Controlled", value: stats.controlled_count, color: "text-orange-500" },
              { icon: Zap, label: "With Reversal", value: stats.reversal_agent_count, color: "text-emerald-500" },
              { icon: HeartPulse, label: "Drug Classes", value: stats.drug_classes?.length ?? 0, color: "text-violet-500" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2.5 shadow-sm">
                <Icon className={`h-4 w-4 ${color}`} />
                <div>
                  <div className="text-xl font-bold font-mono leading-none">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Tool grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.div key={tool.href} variants={item}>
              <Link href={tool.href}>
                <div className="group h-full bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg ${tool.lightBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-5 w-5 ${tool.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground text-sm">{tool.label}</h3>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs"
      >
        <strong>For educational use only.</strong> Always verify clinical calculations independently before administering any medication.
      </motion.div>
    </div>
  );
}
