import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAssessVitals } from "@workspace/api-client-react";
import { Activity, HeartPulse, Thermometer, BrainCircuit, ArrowRight, AlertOctagon } from "lucide-react";
import { motion, animate } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const vitalsSchema = z.object({
  respiratory_rate: z.coerce.number().min(0),
  spo2: z.coerce.number().min(0).max(100),
  on_oxygen: z.boolean().default(false),
  systolic_bp: z.coerce.number().min(0),
  heart_rate: z.coerce.number().min(0),
  temperature: z.coerce.number().min(20).max(45),
  consciousness: z.enum(["A", "C", "V", "P", "U"]),
  gcs_eye: z.coerce.number().optional(),
  gcs_verbal: z.coerce.number().optional(),
  gcs_motor: z.coerce.number().optional(),
});

type VitalsFormValues = z.infer<typeof vitalsSchema>;

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(0, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate(v) { el.textContent = Math.round(v).toString(); },
    });
    return () => controls.stop();
  }, [value]);
  return <span ref={ref}>0</span>;
}

function ScoreRing({ score, max, risk, size = 120 }: { score: number; max: number; risk: string; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / max, 1);
  const strokeColor = risk === "High" || risk === "LOW" ? "#ef4444"
    : risk === "Medium" || risk === "MEDIUM" ? "#f97316"
    : "#22c55e";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={8} className="text-muted/30" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={strokeColor} strokeWidth={8}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold font-mono leading-none" style={{ color: strokeColor }}>
          <AnimatedNumber value={score} />
        </div>
        <div className="text-[10px] text-muted-foreground font-medium">/{max}</div>
      </div>
    </div>
  );
}

const riskColors = {
  High: "border-l-red-500",
  Medium: "border-l-orange-500",
  Low: "border-l-green-500",
  HIGH: "border-l-red-500",
  LOW: "border-l-red-500",
};

export default function VitalsScorer() {
  const form = useForm<VitalsFormValues>({
    resolver: zodResolver(vitalsSchema),
    defaultValues: {
      respiratory_rate: 16, spo2: 98, on_oxygen: false,
      systolic_bp: 120, heart_rate: 80, temperature: 37.0, consciousness: "A",
    },
  });

  const { mutate: assessVitals, data: result, isPending } = useAssessVitals();

  const onSubmit = (data: VitalsFormValues) => {
    assessVitals({
      data: {
        ...data,
        gcs_eye: data.gcs_eye || null,
        gcs_verbal: data.gcs_verbal || null,
        gcs_motor: data.gcs_motor || null,
      }
    });
  };

  return (
    <div className="flex h-full w-full bg-muted/20 dark:bg-background">
      <div className="w-1/2 max-w-lg border-r border-border bg-background p-6 overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Vitals Scorer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">NEWS2 + qSOFA + GCS from one set of vitals.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Respiratory</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="respiratory_rate" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Resp Rate (bpm)</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="spo2" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">SpO₂ (%)</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="on_oxygen" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 mt-3 bg-muted/20">
                  <FormLabel className="text-sm cursor-pointer">Supplemental Oxygen</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><HeartPulse className="h-3.5 w-3.5" /> Haemodynamics</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="systolic_bp" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Systolic BP (mmHg)</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="heart_rate" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Heart Rate (bpm)</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Thermometer className="h-3.5 w-3.5" /> Other</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <FormField control={form.control} name="temperature" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Temp (°C)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="consciousness" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">ACVPU</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="A">Alert</SelectItem>
                        <SelectItem value="C">Confused</SelectItem>
                        <SelectItem value="V">Voice</SelectItem>
                        <SelectItem value="P">Pain</SelectItem>
                        <SelectItem value="U">Unresponsive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/10">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5" /> GCS (Optional)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="gcs_eye" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Eye (1–4)</FormLabel><FormControl><Input type="number" min="1" max="4" {...field} value={field.value || ""} className="h-9" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="gcs_verbal" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Verbal (1–5)</FormLabel><FormControl><Input type="number" min="1" max="5" {...field} value={field.value || ""} className="h-9" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="gcs_motor" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Motor (1–6)</FormLabel><FormControl><Input type="number" min="1" max="6" {...field} value={field.value || ""} className="h-9" /></FormControl></FormItem>
                )} />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full font-bold" disabled={isPending}>
              {isPending ? "Scoring..." : "Calculate Scores"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {result ? (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* NEWS2 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card border-l-4 border border-border rounded-xl p-5 shadow-sm ${riskColors[result.news2.risk as keyof typeof riskColors] ?? "border-l-muted-foreground"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">NEWS2 Score</div>
                  <div className="text-lg font-bold text-foreground mb-1">{result.news2.risk} Risk</div>
                  <p className="text-sm text-muted-foreground">{result.news2.interpretation}</p>
                </div>
                <ScoreRing score={result.news2.total} max={20} risk={result.news2.risk} />
              </div>
            </motion.div>

            {/* qSOFA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`bg-card border-l-4 border border-border rounded-xl p-5 shadow-sm ${result.qsofa.sepsis_alert ? "border-l-red-500" : "border-l-green-500"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">qSOFA Score</div>
                    {result.qsofa.sepsis_alert && <AlertOctagon className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="text-lg font-bold text-foreground mb-1">
                    {result.qsofa.sepsis_alert ? "⚠ Sepsis Alert" : "Low Sepsis Risk"}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.qsofa.interpretation}</p>
                </div>
                <ScoreRing score={result.qsofa.total} max={3} risk={result.qsofa.sepsis_alert ? "High" : "Low"} />
              </div>
            </motion.div>

            {/* GCS */}
            {result.gcs && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border-l-4 border-l-primary border border-border rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Glasgow Coma Scale</div>
                    <div className="text-lg font-bold text-foreground mb-2">{result.gcs.severity}</div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: "Eye", value: result.gcs.eye_descriptor },
                        { label: "Verbal", value: result.gcs.verbal_descriptor },
                        { label: "Motor", value: result.gcs.motor_descriptor },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-muted/50 rounded-lg p-2 text-center">
                          <div className="text-[10px] text-muted-foreground font-semibold uppercase">{label}</div>
                          <div className="text-xs font-bold mt-0.5 truncate">{value}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{result.gcs.interpretation}</p>
                  </div>
                  <ScoreRing score={result.gcs.total} max={15} risk={result.gcs.total <= 8 ? "High" : result.gcs.total <= 12 ? "Medium" : "Low"} />
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
              <BrainCircuit className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-1">Awaiting Vitals</h3>
              <p className="text-sm max-w-xs">Enter vitals to see animated NEWS2, qSOFA, and GCS scores.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
