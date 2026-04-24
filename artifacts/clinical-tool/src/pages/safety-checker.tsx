import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchDrugs, useCheckSafety, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { ShieldAlert, ShieldCheck, UserRound, ArrowRight, Pill, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  drug_name: z.string().min(1),
  weight_kg: z.coerce.number().min(1).default(70),
  age_years: z.coerce.number().min(0).default(45),
  renal_impairment: z.boolean().default(false),
  allergies: z.string(),
  current_medications: z.string(),
  conditions: z.string(),
});
type FormValues = z.infer<typeof schema>;

export default function SafetyChecker() {
  const { data: drugs } = useSearchDrugs({ q: "" }, { query: { queryKey: getSearchDrugsQueryKey({ q: "" }) } });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { drug_name: "", weight_kg: 70, age_years: 45, renal_impairment: false, allergies: "", current_medications: "", conditions: "" },
  });

  const { mutate: checkSafety, data: result, isPending } = useCheckSafety();

  const onSubmit = (data: FormValues) => {
    checkSafety({
      data: {
        drug_name: data.drug_name,
        patient: {
          weight_kg: data.weight_kg,
          age_years: data.age_years,
          renal_impairment: data.renal_impairment,
          allergies: data.allergies ? data.allergies.split(",").map(s => s.trim()) : [],
          current_medications: data.current_medications ? data.current_medications.split(",").map(s => s.trim()) : [],
          conditions: data.conditions ? data.conditions.split(",").map(s => s.trim()) : [],
        }
      }
    });
  };

  return (
    <div className="flex h-full w-full bg-muted/20 dark:bg-background">
      <div className="w-1/2 max-w-lg border-r border-border bg-background p-6 overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Safety Checker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Full contraindication + interaction screen against a patient profile.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Pill className="h-3.5 w-3.5" /> Target Drug</h3>
              <FormField control={form.control} name="drug_name" render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select medication to check" /></SelectTrigger></FormControl>
                    <SelectContent>{drugs?.map(d => <SelectItem key={d.name} value={d.name}>{d.display_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Patient Profile</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <FormField control={form.control} name="weight_kg" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="h-9" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="age_years" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Age (years)</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl></FormItem>
                )} />
              </div>
              <div className="space-y-3">
                <FormField control={form.control} name="allergies" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Allergies (comma separated)</FormLabel><FormControl><Input placeholder="e.g. Penicillin, Sulfa" {...field} className="h-9" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="current_medications" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Current Medications</FormLabel><FormControl><Input placeholder="e.g. Amiodarone, Warfarin" {...field} className="h-9" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="conditions" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs">Medical Conditions</FormLabel><FormControl><Input placeholder="e.g. Asthma, CHF, CKD" {...field} className="h-9" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="renal_impairment" render={({ field }) => (
                  <FormItem className="flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/20">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" /></FormControl>
                    <div>
                      <FormLabel className="text-sm font-medium cursor-pointer">Renal Impairment</FormLabel>
                      <p className="text-xs text-muted-foreground">Critical for nephrotoxic drugs</p>
                    </div>
                  </FormItem>
                )} />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full font-bold" disabled={isPending}>
              {isPending ? "Checking..." : "Run Safety Check"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-4">
              {/* Status banner */}
              <div className={`rounded-xl border-2 p-5 flex items-center gap-4 ${
                result.has_absolute_contraindication
                  ? "bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-700"
                  : result.has_major_interaction
                    ? "bg-orange-50 dark:bg-orange-950/30 border-orange-400 dark:border-orange-700"
                    : "bg-green-50 dark:bg-green-950/30 border-green-400 dark:border-green-700"
              }`}>
                <div className="shrink-0">
                  {result.has_absolute_contraindication || result.has_major_interaction
                    ? <AlertTriangle className={`h-12 w-12 ${result.has_absolute_contraindication ? "text-red-500" : "text-orange-500"}`} />
                    : <ShieldCheck className="h-12 w-12 text-green-500" />
                  }
                </div>
                <div>
                  <div className="font-bold text-xl text-foreground mb-0.5">
                    {result.has_absolute_contraindication ? "DO NOT ADMINISTER"
                      : result.has_major_interaction ? "PROCEED WITH CAUTION"
                      : "NO MAJOR FLAGS"}
                  </div>
                  <div className="text-sm text-muted-foreground">{result.display_name} — {result.contraindications.length} contraindications, {result.interactions.length} interactions</div>
                </div>
              </div>

              {/* Contraindications */}
              {result.contraindications.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-red-200 dark:border-red-900 rounded-xl overflow-hidden">
                  <div className="bg-red-500 text-white px-4 py-2.5 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Contraindications ({result.contraindications.length})</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {result.contraindications.map((c, i) => (
                      <div key={i} className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
                        <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${c.absolute ? "text-red-500" : "text-red-300"}`} />
                        <div>
                          {c.absolute && <Badge variant="destructive" className="mb-1.5 text-[10px]">ABSOLUTE</Badge>}
                          <p className="text-sm text-foreground">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Interactions */}
              {result.interactions.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="bg-card border border-orange-200 dark:border-orange-900 rounded-xl overflow-hidden">
                  <div className="bg-orange-500 text-white px-4 py-2.5 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Interactions ({result.interactions.length})</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {result.interactions.map((ix, i) => (
                      <div key={i} className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-foreground">{ix.drug_a} + {ix.drug_b}</span>
                          <Badge variant="outline" className="border-orange-400 text-orange-700 dark:text-orange-300 text-xs uppercase font-bold">{ix.severity}</Badge>
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

              {result.contraindications.length === 0 && result.interactions.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-green-300 dark:border-green-800 rounded-xl bg-green-50/50 dark:bg-green-950/20">
                  <ShieldCheck className="h-12 w-12 text-green-500 mb-3" />
                  <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-1">Clear to Proceed</h3>
                  <p className="text-center text-green-700/80 dark:text-green-400/80 text-sm max-w-xs">
                    No documented contraindications or interactions found for this patient profile.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                <ShieldAlert className="w-9 h-9 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground mb-1">Awaiting Data</h3>
                <p className="text-sm max-w-xs">Select a drug and enter the patient profile to run a full safety screen.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
