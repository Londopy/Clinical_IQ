import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchDrugs, useCalculateDrip, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { Beaker, AlertTriangle, Copy, Check, Droplets } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DOSE_UNITS = ["mcg/kg/min", "mcg/min", "mg/kg/hr", "mg/hr", "units/hr", "mL/hr"];

const schema = z.object({
  drug_name:           z.string().min(1, "Select a drug"),
  weight_kg:           z.coerce.number().min(1).max(300),
  ordered_dose:        z.coerce.number().min(0),
  dose_unit:           z.string().min(1),
  concentration_mg_ml: z.coerce.number().min(0).optional(),
  bag_volume_ml:       z.coerce.number().min(1).default(250),
});
type FV = z.infer<typeof schema>;

export default function DripCalculator() {
  const [copied, setCopied] = useState(false);
  const { data: drugs } = useSearchDrugs({ q: "" }, { query: { queryKey: getSearchDrugsQueryKey({ q: "" }) } });

  const form = useForm<FV>({
    resolver: zodResolver(schema),
    defaultValues: { drug_name: "", weight_kg: 70, ordered_dose: 5, dose_unit: "mcg/kg/min", bag_volume_ml: 250 },
  });

  const { mutate: calculate, data: result, isPending, reset } = useCalculateDrip();

  const onSubmit = (v: FV) => {
    calculate({
      data: {
        drug_name: v.drug_name,
        patient: { weight_kg: v.weight_kg, age_years: 45 },
        ordered_dose: v.ordered_dose,
        dose_unit: v.dose_unit,
        concentration_mg_ml: v.concentration_mg_ml ?? null,
        bag_volume_ml: v.bag_volume_ml,
      },
    });
  };

  const copyResult = () => {
    if (!result) return;
    const text = `${result.display_name}: ${result.rate_ml_per_hr} mL/hr`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-full p-7 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center">
          <Beaker className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-none">Drip Calculator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">IV pump rates from weight, dose and concentration</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="h-3 w-3" /> Infusion Parameters
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

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="weight_kg" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Weight (kg)</FormLabel>
                  <FormControl><Input {...field} type="number" step="0.1" className="h-9 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="ordered_dose" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Ordered dose</FormLabel>
                  <FormControl><Input {...field} type="number" step="0.1" className="h-9 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dose_unit" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Dose unit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOSE_UNITS.map(u => <SelectItem key={u} value={u} className="text-sm">{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="concentration_mg_ml" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Concentration (mg/mL)</FormLabel>
                  <FormControl><Input {...field} type="number" step="0.01" placeholder="optional" className="h-9 text-sm" /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="bag_volume_ml" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Bag volume (mL)</FormLabel>
                  <FormControl><Input {...field} type="number" className="h-9 text-sm" /></FormControl>
                </FormItem>
              )} />
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full h-9">
            {isPending ? "Calculating…" : "Calculate Rate"}
          </Button>
        </form>
      </Form>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-5 bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Infusion Rate</span>
              <button onClick={copyResult} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-3xl font-bold text-foreground font-mono">{result.rate_ml_per_hr}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">mL / hr</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground font-mono">{result.rate_ml_per_min.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">mL / min</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground font-mono">{result.duration_hr ?? "—"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">hr bag lasts</div>
                </div>
              </div>

              {result.rate_exceeded && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Max rate exceeded — verify with pharmacist before administration
                </div>
              )}
              {result.warnings.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />{w}
                    </div>
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
