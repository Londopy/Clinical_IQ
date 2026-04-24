import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchDrugs, useCalculateDose, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { Calculator, AlertTriangle, Copy, Check, User, Syringe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

const schema = z.object({
  drug_name:        z.string().min(1, "Select a drug"),
  weight_kg:        z.coerce.number().min(1).max(300),
  age_years:        z.coerce.number().min(0).max(120),
  route:            z.string().optional(),
  renal_impairment: z.boolean().default(false),
  allergies:        z.string().default(""),
  dose_fraction:    z.number().min(0.25).max(2).default(1),
});
type FV = z.infer<typeof schema>;

const FRAC_LABELS: Record<string, string> = {
  "0.25": "¼", "0.5": "½", "0.75": "¾", "1": "Full", "1.25": "1¼", "1.5": "1½", "2": "2×",
};

export default function DoseCalculator() {
  const [copied, setCopied] = useState(false);
  const { data: drugs } = useSearchDrugs({ q: "" }, { query: { queryKey: getSearchDrugsQueryKey({ q: "" }) } });

  const form = useForm<FV>({
    resolver: zodResolver(schema),
    defaultValues: { drug_name: "", weight_kg: 70, age_years: 45, renal_impairment: false, allergies: "", dose_fraction: 1 },
  });

  const { mutate: calculate, data: result, isPending, reset } = useCalculateDose();

  const onSubmit = (v: FV) => {
    calculate({
      data: {
        drug_name: v.drug_name,
        route: v.route,
        dose_fraction: v.dose_fraction,
        patient: {
          weight_kg: v.weight_kg,
          age_years: v.age_years,
          renal_impairment: v.renal_impairment,
          allergies: v.allergies ? v.allergies.split(",").map(s => s.trim()).filter(Boolean) : [],
          conditions: [],
          current_medications: [],
        },
      },
    });
  };

  const copyResult = () => {
    if (!result) return;
    const text = `${result.display_name} — ${result.dose_display} ${result.dose_unit} via ${result.route}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fraction = form.watch("dose_fraction");
  const fracLabel = FRAC_LABELS[String(fraction)] ?? `${fraction}×`;

  return (
    <div className="min-h-full p-7 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
          <Calculator className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-none">Dose Calculator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Weight-based dosing with patient-aware safety checks</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Drug section */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Syringe className="h-3 w-3" /> Drug Selection
            </p>

            <FormField control={form.control} name="drug_name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Drug</FormLabel>
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

            <FormField control={form.control} name="route" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Route (optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["IV","IM","PO","SC","SL","IN","PR","TOP"].map(r => (
                      <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="dose_fraction" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs">Dose fraction</FormLabel>
                  <span className="text-sm font-bold text-primary">{fracLabel}</span>
                </div>
                <FormControl>
                  <Slider min={0.25} max={2} step={0.25} value={[field.value]}
                    onValueChange={([v]) => field.onChange(v)} className="mt-1" />
                </FormControl>
                <div className="flex justify-between text-[10px] text-muted-foreground px-0.5 mt-0.5">
                  {["¼","½","¾","Full","1¼","1½","2×"].map(l => <span key={l}>{l}</span>)}
                </div>
              </FormItem>
            )} />
          </div>

          {/* Patient section */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3 w-3" /> Patient Profile
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="weight_kg" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Weight (kg)</FormLabel>
                  <FormControl><Input {...field} type="number" className="h-9 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="age_years" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Age (years)</FormLabel>
                  <FormControl><Input {...field} type="number" className="h-9 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="renal_impairment" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="text-sm font-normal cursor-pointer">Renal impairment</FormLabel>
              </FormItem>
            )} />
            <FormField control={form.control} name="allergies" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Allergies (comma-separated)</FormLabel>
                <FormControl><Input {...field} placeholder="e.g. penicillin, sulfonamides" className="h-9 text-sm" /></FormControl>
              </FormItem>
            )} />
          </div>

          <Button type="submit" disabled={isPending} className="w-full h-9">
            {isPending ? "Calculating…" : "Calculate Dose"}
          </Button>
        </form>
      </Form>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-5 bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Result</span>
              <button onClick={copyResult} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-5">
              <div className="text-center py-2 mb-4">
                <div className="text-4xl font-bold text-foreground font-mono">
                  {result.dose_display}
                  <span className="text-lg font-semibold text-muted-foreground ml-1.5">{result.dose_unit}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">{result.display_name} · {result.route}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{result.frequency}</div>
              </div>

              {result.contraindications.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-1.5">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Contraindications / Cautions
                  </p>
                  {result.contraindications.map((c, i) => (
                    <p key={i} className="text-xs text-red-700 dark:text-red-300 pl-5">{c.detail}</p>
                  ))}
                </div>
              )}

              {result.interactions.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 space-y-1.5">
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Interactions
                  </p>
                  {result.interactions.map((ix, i) => (
                    <p key={i} className="text-xs text-orange-700 dark:text-orange-300 pl-5">{ix.drug_b}: {ix.description}</p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
