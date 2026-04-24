import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchDrugs, useCalculateDose, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { Calculator, AlertTriangle, Info, UserRound, ArrowRight, Syringe, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

const schema = z.object({
  drug_name: z.string().min(1),
  weight_kg: z.coerce.number().min(1),
  age_years: z.coerce.number().min(0),
  route: z.string().optional(),
  renal_impairment: z.boolean().default(false),
  allergies: z.string(),
  dose_fraction: z.number().min(0.25).max(2).default(1.0),
});

type FormValues = z.infer<typeof schema>;

export default function DoseCalculator() {
  const [searchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const { data: drugs } = useSearchDrugs({ q: searchTerm }, { query: { queryKey: getSearchDrugsQueryKey({ q: searchTerm }) } });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { drug_name: "", weight_kg: 70, age_years: 45, renal_impairment: false, allergies: "", dose_fraction: 1.0 },
  });

  const { mutate: calculateDose, data: result, isPending } = useCalculateDose();

  const onSubmit = (data: FormValues) => {
    calculateDose({
      data: {
        drug_name: data.drug_name,
        route: data.route,
        dose_fraction: data.dose_fraction,
        patient: {
          weight_kg: data.weight_kg,
          age_years: data.age_years,
          renal_impairment: data.renal_impairment,
          allergies: data.allergies ? data.allergies.split(",").map(s => s.trim()) : [],
        }
      }
    });
  };

  const selectedDrugName = form.watch("drug_name");
  const selectedDrug = drugs?.find(d => d.name === selectedDrugName);
  const doseFraction = form.watch("dose_fraction");

  const fractionLabels: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾", 1.0: "Full", 1.25: "1¼", 1.5: "1½", 2.0: "2×" };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.display_name} (${result.route}): ${result.dose_display} ${result.dose_unit} = ${result.volume_ml}mL — ${result.frequency}`);
    setCopied(true);
    toast.success("Result copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full w-full bg-muted/20 dark:bg-background">
      {/* Form */}
      <div className="w-1/2 max-w-lg border-r border-border bg-background p-6 overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Dose Calculator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Weight-based dosing with patient safety checks.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Patient</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <FormField control={form.control} name="weight_kg" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="age_years" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Age (years)</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="allergies" render={({ field }) => (
                <FormItem className="mb-3"><FormLabel className="text-xs">Allergies (comma separated)</FormLabel><FormControl><Input placeholder="e.g. Penicillin, Sulfa" {...field} className="h-9" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="renal_impairment" render={({ field }) => (
                <FormItem className="flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/20">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" /></FormControl>
                  <div>
                    <FormLabel className="text-sm font-medium cursor-pointer">Renal Impairment (CKD/AKI)</FormLabel>
                    <p className="text-xs text-muted-foreground">Adjusts dosing warnings for nephrotoxic drugs</p>
                  </div>
                </FormItem>
              )} />
            </div>

            {/* Medication */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Syringe className="h-3.5 w-3.5" /> Medication</h3>
              <FormField control={form.control} name="drug_name" render={({ field }) => (
                <FormItem className="mb-3">
                  <FormLabel className="text-xs">Drug</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Select a drug" /></SelectTrigger></FormControl>
                    <SelectContent>{drugs?.map(d => <SelectItem key={d.name} value={d.name}>{d.display_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {selectedDrug && (
                <FormField control={form.control} name="route" render={({ field }) => (
                  <FormItem className="mb-3">
                    <FormLabel className="text-xs">Route</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="Default" /></SelectTrigger></FormControl>
                      <SelectContent>{selectedDrug.routes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
              )}
              {/* Dose fraction */}
              <FormField control={form.control} name="dose_fraction" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-xs">Dose Fraction</FormLabel>
                    <span className="text-sm font-bold text-primary">{fractionLabels[field.value] ?? `${field.value}×`}</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0.25} max={2} step={0.25}
                      value={[field.value]}
                      onValueChange={([v]) => field.onChange(v)}
                      className="w-full"
                    />
                  </FormControl>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>¼</span><span>½</span><span>¾</span><span>Full</span><span>1¼</span><span>1½</span><span>2×</span>
                  </div>
                </FormItem>
              )} />
            </div>

            <Button type="submit" size="lg" className="w-full font-bold" disabled={isPending}>
              {isPending ? "Calculating..." : "Calculate Dose"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>

      {/* Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-4">
              {/* Primary result card */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-primary/5 border-b border-primary/10 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg text-foreground">{result.display_name}</div>
                    <div className="text-sm text-muted-foreground">{result.summary}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{result.route}</Badge>
                    <button onClick={copyResult} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-primary rounded-xl p-5 text-center text-primary-foreground">
                      <div className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-1">Dose</div>
                      <div className="text-3xl font-bold font-mono">{result.dose_display}</div>
                      <div className="text-sm opacity-80">{result.dose_unit}</div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-5 text-center border border-border">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Volume</div>
                      <div className="text-3xl font-bold font-mono text-foreground">{result.volume_ml}</div>
                      <div className="text-sm text-muted-foreground">mL</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5 text-blue-800 dark:text-blue-300 text-sm">
                    <Info className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Frequency: {result.frequency}</span>
                  </div>
                </div>
              </div>

              {/* Contraindications */}
              {result.contraindications.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-red-200 dark:border-red-900 rounded-xl overflow-hidden">
                  <div className="bg-red-500 text-white px-4 py-2.5 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Contraindications</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {result.contraindications.map((c, i) => (
                      <div key={i} className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          {c.absolute && <Badge variant="destructive" className="mb-1 text-[10px] h-4">ABSOLUTE</Badge>}
                          <p className="text-sm text-foreground">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Interactions */}
              {result.interactions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-orange-200 dark:border-orange-900 rounded-xl overflow-hidden">
                  <div className="bg-orange-500 text-white px-4 py-2.5 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Drug Interactions</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {result.interactions.map((ix, i) => (
                      <div key={i} className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-foreground">{ix.drug_a} + {ix.drug_b}</span>
                          <Badge variant="outline" className="border-orange-400 text-orange-700 dark:text-orange-300 text-xs uppercase">{ix.severity}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{ix.description}</p>
                        <div className="bg-background/70 rounded p-2 text-xs text-foreground border border-border/50">
                          <span className="font-semibold">Management: </span>{ix.management}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Calculator className="w-9 h-9 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground mb-1">Awaiting Parameters</h3>
                <p className="text-sm max-w-xs">Enter patient details and select a drug to calculate weight-based dosing.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
