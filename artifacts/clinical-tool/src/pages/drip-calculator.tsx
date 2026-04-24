import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchDrugs, useCalculateDrip, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { Beaker, Timer, Droplets, UserRound, ArrowRight, AlertTriangle, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  drug_name: z.string().min(1),
  weight_kg: z.coerce.number().min(1),
  age_years: z.coerce.number().min(0),
  ordered_dose: z.coerce.number().min(0.01),
  dose_unit: z.string().min(1),
  bag_volume_ml: z.coerce.number().min(1).default(250),
  concentration_mg_ml: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof schema>;
const UNITS = ["mcg/kg/min", "mcg/min", "mg/hr", "mg/min", "units/hr"];

export default function DripCalculator() {
  const [copied, setCopied] = useState(false);
  const { data: drugs } = useSearchDrugs({ q: "" }, { query: { queryKey: getSearchDrugsQueryKey({ q: "" }) } });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { drug_name: "", weight_kg: 70, age_years: 45, ordered_dose: 0, dose_unit: "mcg/kg/min", bag_volume_ml: 250 },
  });

  const { mutate: calculateDrip, data: result, isPending } = useCalculateDrip();

  const onSubmit = (data: FormValues) => {
    calculateDrip({
      data: {
        drug_name: data.drug_name,
        ordered_dose: data.ordered_dose,
        dose_unit: data.dose_unit,
        bag_volume_ml: data.bag_volume_ml,
        concentration_mg_ml: data.concentration_mg_ml || null,
        patient: { weight_kg: data.weight_kg, age_years: data.age_years }
      }
    });
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.display_name}: ${result.rate_ml_per_hr} mL/hr — Duration: ${result.duration_hr}hr — Conc: ${result.concentration_mg_ml} mg/mL`);
    setCopied(true);
    toast.success("Result copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full w-full bg-muted/20 dark:bg-background">
      <div className="w-1/2 max-w-lg border-r border-border bg-background p-6 overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Beaker className="w-6 h-6 text-primary" />
            Drip Calculator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">IV pump rates with bag duration and concentration.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Patient</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="weight_kg" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="age_years" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Age (years)</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" /> Infusion Setup</h3>
              <FormField control={form.control} name="drug_name" render={({ field }) => (
                <FormItem className="mb-3">
                  <FormLabel className="text-xs">Medication</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select drug" /></SelectTrigger></FormControl>
                    <SelectContent>{drugs?.map(d => <SelectItem key={d.name} value={d.name}>{d.display_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3 mb-3 p-4 rounded-lg bg-muted/20 border border-border">
                <FormField control={form.control} name="ordered_dose" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Ordered Dose</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dose_unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="bag_volume_ml" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Bag Volume (mL)</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="concentration_mg_ml" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Conc. (mg/mL) — optional</FormLabel><FormControl><Input type="number" step="0.1" placeholder="Auto" {...field} value={field.value || ""} className="h-9" /></FormControl></FormItem>
                )} />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full font-bold" disabled={isPending}>
              {isPending ? "Calculating..." : "Calculate Pump Rate"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-4">
              <div className={`bg-card border-2 rounded-xl overflow-hidden shadow-sm ${result.rate_exceeded ? "border-red-400 dark:border-red-700" : "border-primary/20"}`}>
                <div className={`px-5 py-4 flex items-center justify-between border-b ${result.rate_exceeded ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900" : "bg-primary/5 border-primary/10"}`}>
                  <div>
                    <div className="font-bold text-lg text-foreground">{result.display_name} Infusion</div>
                    <div className="text-sm text-muted-foreground">{result.summary}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.rate_exceeded && (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 px-2 py-1 rounded-full border border-red-200 dark:border-red-800">
                        <AlertTriangle className="h-3 w-3" /> Max Rate
                      </span>
                    )}
                    <button onClick={copyResult} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`rounded-xl p-5 text-center ${result.rate_exceeded ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"}`}>
                      <div className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-1">Set Pump Rate</div>
                      <div className="text-4xl font-bold font-mono">{result.rate_ml_per_hr}</div>
                      <div className="text-sm opacity-80">mL/hr</div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-5 text-center border border-border relative overflow-hidden">
                      <Timer className="absolute -right-3 -bottom-3 h-16 w-16 text-muted/20" />
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 relative z-10">Bag Duration</div>
                      <div className="text-4xl font-bold font-mono text-foreground relative z-10">{result.duration_hr ?? "–"}</div>
                      <div className="text-sm text-muted-foreground relative z-10">hours</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/30 border border-border rounded-lg px-3 py-2 flex justify-between">
                      <span className="text-muted-foreground text-xs">Concentration</span>
                      <span className="font-bold font-mono text-xs">{result.concentration_mg_ml} mg/mL</span>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg px-3 py-2 flex justify-between">
                      <span className="text-muted-foreground text-xs">Rate/min</span>
                      <span className="font-bold font-mono text-xs">{result.rate_ml_per_min} mL/min</span>
                    </div>
                  </div>
                </div>
              </div>

              {result.warnings.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-orange-200 dark:border-orange-900 rounded-xl overflow-hidden">
                  <div className="bg-orange-500 text-white px-4 py-2.5 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Warnings</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {result.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-3 bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg border border-orange-100 dark:border-orange-900/50">
                        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">{w}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Droplets className="w-9 h-9 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground mb-1">Awaiting Parameters</h3>
                <p className="text-sm max-w-xs">Enter patient weight, drug, and ordered dose to calculate IV pump settings.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
