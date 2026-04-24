import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchDrugs, useCheckSafety, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, User, GitBranch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  drug_name:           z.string().min(1, "Select a drug"),
  weight_kg:           z.coerce.number().min(1).default(70),
  age_years:           z.coerce.number().min(0).default(45),
  renal_impairment:    z.boolean().default(false),
  allergies:           z.string().default(""),
  current_medications: z.string().default(""),
  conditions:          z.string().default(""),
});
type FV = z.infer<typeof schema>;

const sevBadge: Record<string, string> = {
  major:    "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  moderate: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  minor:    "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
};

export default function SafetyChecker() {
  const { data: drugs } = useSearchDrugs({ q: "" }, { query: { queryKey: getSearchDrugsQueryKey({ q: "" }) } });

  const form = useForm<FV>({
    resolver: zodResolver(schema),
    defaultValues: { drug_name: "", weight_kg: 70, age_years: 45, renal_impairment: false, allergies: "", current_medications: "", conditions: "" },
  });

  const { mutate: check, data: result, isPending, reset } = useCheckSafety();

  const onSubmit = (v: FV) => {
    check({
      data: {
        drug_name: v.drug_name,
        patient: {
          weight_kg: v.weight_kg,
          age_years: v.age_years,
          renal_impairment: v.renal_impairment,
          allergies: v.allergies ? v.allergies.split(",").map(s => s.trim()).filter(Boolean) : [],
          conditions: v.conditions ? v.conditions.split(",").map(s => s.trim()).filter(Boolean) : [],
          current_medications: v.current_medications ? v.current_medications.split(",").map(s => s.trim()).filter(Boolean) : [],
        },
      },
    });
  };

  const isClean = result && !result.has_absolute_contraindication && !result.has_major_interaction && result.contraindications.length === 0 && result.interactions.length === 0;
  const absoluteContraindications = result?.contraindications.filter(c => c.absolute) ?? [];
  const relativeContraindications = result?.contraindications.filter(c => !c.absolute) ?? [];

  return (
    <div className="min-h-full p-7 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
          <ShieldAlert className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-none">Safety Checker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Contraindications, interactions and patient-specific risks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 bg-card border border-border rounded-xl p-4">
              <FormField control={form.control} name="drug_name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Drug to check</FormLabel>
                  <Select onValueChange={v => { field.onChange(v); reset(); }} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select drug…" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drugs?.map(d => <SelectItem key={d.name} value={d.name} className="text-sm">{d.display_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="pt-1 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Patient
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <FormField control={form.control} name="weight_kg" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Weight (kg)</FormLabel>
                      <FormControl><Input {...field} type="number" className="h-8 text-sm" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="age_years" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Age (years)</FormLabel>
                      <FormControl><Input {...field} type="number" className="h-8 text-sm" /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              <FormField control={form.control} name="renal_impairment" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">Renal impairment</FormLabel>
                </FormItem>
              )} />

              {([
                { name: "allergies"           as const, label: "Allergies",           ph: "penicillin, NSAIDs…" },
                { name: "current_medications" as const, label: "Current medications", ph: "aspirin, metformin…" },
                { name: "conditions"          as const, label: "Conditions",          ph: "diabetes, CKD…" },
              ]).map(({ name, label, ph }) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{label} (comma-separated)</FormLabel>
                    <FormControl><Input {...field} placeholder={ph} className="h-8 text-sm" /></FormControl>
                  </FormItem>
                )} />
              ))}

              <Button type="submit" disabled={isPending} className="w-full h-8 mt-1">
                {isPending ? "Checking…" : "Check Safety"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                {/* Status */}
                <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                  result.has_absolute_contraindication ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                  : isClean ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                  : "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
                }`}>
                  {result.has_absolute_contraindication
                    ? <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
                    : isClean
                    ? <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />}
                  <div>
                    <p className={`text-sm font-bold ${result.has_absolute_contraindication ? "text-red-700 dark:text-red-300" : isClean ? "text-emerald-700 dark:text-emerald-300" : "text-orange-700 dark:text-orange-300"}`}>
                      {result.has_absolute_contraindication ? "CONTRAINDICATED" : isClean ? "No issues found" : "Caution required"}
                    </p>
                    <p className="text-xs text-muted-foreground">{result.display_name}</p>
                  </div>
                </div>

                {/* Absolute contraindications */}
                {absoluteContraindications.length > 0 && (
                  <div className="bg-card border border-red-200 dark:border-red-900/40 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2.5">Absolute Contraindications</p>
                    <ul className="space-y-1.5">
                      {absoluteContraindications.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />{c.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Relative contraindications */}
                {relativeContraindications.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Relative Contraindications</p>
                    <ul className="space-y-1.5">
                      {relativeContraindications.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />{c.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interactions */}
                {result.interactions.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <GitBranch className="h-3 w-3" /> Interactions
                    </p>
                    <div className="space-y-2">
                      {result.interactions.map((ix, i) => {
                        const sev = (ix.severity || "minor").toLowerCase();
                        return (
                          <div key={i} className={`p-2.5 rounded-lg border text-xs ${sevBadge[sev] ?? sevBadge.minor}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">{ix.drug_a} + {ix.drug_b}</span>
                              <Badge variant="outline" className="text-[10px] h-4 capitalize">{ix.severity}</Badge>
                            </div>
                            <p className="opacity-90">{ix.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isClean && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    No contraindications or significant interactions detected.
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-16">
                <ShieldAlert className="h-10 w-10 text-muted-foreground/25" />
                <p className="text-sm">Select a drug and fill in the patient profile</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
