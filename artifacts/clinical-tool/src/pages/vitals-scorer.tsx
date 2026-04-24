import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAssessVitals } from "@workspace/api-client-react";
import { Activity, AlertOctagon } from "lucide-react";
import { motion, animate, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  respiratory_rate: z.coerce.number().min(0),
  spo2:             z.coerce.number().min(0).max(100),
  on_oxygen:        z.boolean().default(false),
  systolic_bp:      z.coerce.number().min(0),
  heart_rate:       z.coerce.number().min(0),
  temperature:      z.coerce.number().min(20).max(45),
  consciousness:    z.enum(["A","C","V","P","U"]),
  gcs_eye:          z.coerce.number().optional(),
  gcs_verbal:       z.coerce.number().optional(),
  gcs_motor:        z.coerce.number().optional(),
});
type FV = z.infer<typeof schema>;

function AnimNum({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ctrl = animate(0, value, { duration: 0.7, ease: "easeOut", onUpdate(v) { el.textContent = Math.round(v).toString(); } });
    return () => ctrl.stop();
  }, [value]);
  return <span ref={ref}>0</span>;
}

// news2.risk is "Low" | "Medium" | "High" | "Very High"
// qsofa risk derived from sepsis_alert
// gcs severity is "Mild" | "Moderate" | "Severe"
const riskStyle = (risk: string) => {
  const r = (risk || "").toLowerCase();
  if (r === "high" || r === "very high" || r === "severe")
    return { stroke: "#ef4444", label: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" };
  if (r === "medium" || r === "moderate")
    return { stroke: "#f97316", label: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" };
  return { stroke: "#22c55e", label: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" };
};

function ScoreCard({ title, score, max, risk, note }: { title: string; score: number; max: number; risk: string; note?: string }) {
  const s = riskStyle(risk);
  const r = 28; const circ = 2 * Math.PI * r;
  const pct = Math.min(score / max, 1);
  return (
    <div className={`bg-card border rounded-xl p-4 flex gap-4 items-center ${s.bg}`}>
      <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
        <svg width={72} height={72} className="-rotate-90">
          <circle cx={36} cy={36} r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-muted/30" />
          <motion.circle cx={36} cy={36} r={r} fill="none" stroke={s.stroke} strokeWidth={6}
            strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 0.8, ease: "easeOut" }} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold font-mono" style={{ color: s.stroke }}><AnimNum value={score} /></span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">Score {score} / {max}</p>
        <p className={`text-xs font-semibold mt-1 ${s.label}`}>{risk}</p>
        {note && <p className="text-xs text-muted-foreground mt-0.5 italic">{note}</p>}
      </div>
    </div>
  );
}

export default function VitalsScorer() {
  const form = useForm<FV>({
    resolver: zodResolver(schema),
    defaultValues: { respiratory_rate: 18, spo2: 97, on_oxygen: false, systolic_bp: 120, heart_rate: 78, temperature: 37.0, consciousness: "A" },
  });

  const { mutate: assess, data: result, isPending, reset: resetResult } = useAssessVitals();

  const onSubmit = (v: FV) => {
    assess({
      data: {
        respiratory_rate: v.respiratory_rate,
        spo2: v.spo2,
        on_oxygen: v.on_oxygen,
        systolic_bp: v.systolic_bp,
        heart_rate: v.heart_rate,
        temperature: v.temperature,
        consciousness: v.consciousness,
        gcs_eye: v.gcs_eye ?? null,
        gcs_verbal: v.gcs_verbal ?? null,
        gcs_motor: v.gcs_motor ?? null,
      },
    });
  };

  return (
    <div className="min-h-full p-7 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
          <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-none">Vitals Scorer</h1>
          <p className="text-xs text-muted-foreground mt-0.5">NEWS2 · qSOFA · GCS — simultaneous risk stratification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Vital Signs</p>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { name: "respiratory_rate" as const, label: "RR (/min)"   },
                  { name: "spo2"             as const, label: "SpO₂ (%)"    },
                  { name: "systolic_bp"      as const, label: "Systolic BP" },
                  { name: "heart_rate"       as const, label: "Heart rate"  },
                  { name: "temperature"      as const, label: "Temp (°C)"   },
                ]).map(({ name, label }) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">{label}</FormLabel>
                      <FormControl><Input {...field} type="number" step="0.1" className="h-8 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
                <FormField control={form.control} name="consciousness" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Consciousness</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[["A","Alert"],["C","Confused"],["V","Voice"],["P","Pain"],["U","Unresponsive"]].map(([v,l]) => (
                          <SelectItem key={v} value={v} className="text-sm">{v} — {l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="on_oxygen" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 pt-1">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">On supplemental O₂</FormLabel>
                </FormItem>
              )} />

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">GCS (optional)</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { name: "gcs_eye"    as const, label: "Eye (1-4)"    },
                    { name: "gcs_verbal" as const, label: "Verbal (1-5)" },
                    { name: "gcs_motor"  as const, label: "Motor (1-6)"  },
                  ]).map(({ name, label }) => (
                    <FormField key={name} control={form.control} name={name} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px]">{label}</FormLabel>
                        <FormControl><Input {...field} type="number" className="h-8 text-sm" /></FormControl>
                      </FormItem>
                    )} />
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={isPending} className="w-full h-8 mt-1">
                {isPending ? "Scoring…" : "Calculate Scores"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scores</p>
                  <button onClick={() => resetResult()} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Reset</button>
                </div>

                <ScoreCard title="NEWS2" score={result.news2.total} max={20} risk={result.news2.risk}
                  note={result.news2.interpretation} />
                <ScoreCard title="qSOFA" score={result.qsofa.total} max={3}
                  risk={result.qsofa.sepsis_alert ? "High" : result.qsofa.total >= 1 ? "Medium" : "Low"}
                  note={result.qsofa.interpretation} />
                {result.gcs && (
                  <ScoreCard title="GCS" score={result.gcs.total} max={15} risk={result.gcs.severity}
                    note={result.gcs.interpretation} />
                )}

                {(result.news2.risk === "High" || result.news2.risk === "Very High") && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 mt-2">
                    <AlertOctagon className="h-4 w-4 shrink-0" />
                    High-risk NEWS2 — consider urgent clinical review
                  </div>
                )}
                {result.qsofa.sepsis_alert && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-xs text-orange-700 dark:text-orange-300">
                    <AlertOctagon className="h-4 w-4 shrink-0" />
                    qSOFA positive — assess for sepsis
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-16">
                <Activity className="h-10 w-10 text-muted-foreground/25" />
                <p className="text-sm">Enter vitals and calculate scores</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
