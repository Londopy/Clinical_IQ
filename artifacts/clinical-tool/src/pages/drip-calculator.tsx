import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchDrugs, useCalculateDrip, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { Beaker, Timer, Droplets, UserRound, ArrowRight, AlertTriangle, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const dripFormSchema = z.object({
  drug_name: z.string().min(1, "Please select a drug"),
  weight_kg: z.coerce.number().min(1, "Weight must be positive"),
  age_years: z.coerce.number().min(0, "Age must be valid"),
  ordered_dose: z.coerce.number().min(0.01, "Dose required"),
  dose_unit: z.string().min(1, "Unit required"),
  bag_volume_ml: z.coerce.number().min(1, "Volume required").default(250),
  concentration_mg_ml: z.coerce.number().optional(),
});

type DripFormValues = z.infer<typeof dripFormSchema>;

const COMMON_UNITS = [
  "mcg/kg/min",
  "mcg/min",
  "mg/hr",
  "mg/min",
  "units/hr"
];

export default function DripCalculator() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: drugs } = useSearchDrugs({ q: searchTerm }, { query: { queryKey: getSearchDrugsQueryKey({ q: searchTerm }) }});
  
  const form = useForm<DripFormValues>({
    resolver: zodResolver(dripFormSchema),
    defaultValues: {
      drug_name: "",
      weight_kg: 70,
      age_years: 45,
      ordered_dose: 0,
      dose_unit: "mcg/kg/min",
      bag_volume_ml: 250,
    },
  });

  const { mutate: calculateDrip, data: result, isPending } = useCalculateDrip();

  const onSubmit = (data: DripFormValues) => {
    calculateDrip({
      data: {
        drug_name: data.drug_name,
        ordered_dose: data.ordered_dose,
        dose_unit: data.dose_unit,
        bag_volume_ml: data.bag_volume_ml,
        concentration_mg_ml: data.concentration_mg_ml || null,
        patient: {
          weight_kg: data.weight_kg,
          age_years: data.age_years,
        }
      }
    });
  };

  return (
    <div className="flex h-full w-full bg-muted/20">
      {/* Form Pane */}
      <div className="w-1/2 max-w-xl border-r border-border bg-background p-6 overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Beaker className="w-6 h-6 text-primary" />
            Drip Calculator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calculate IV infusion pump rates based on ordered dose and bag concentration.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Patient Vitals Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <UserRound className="w-5 h-5" /> Patient Vitals
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="70" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age (years) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="45" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Infusion Setup Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <Droplets className="w-5 h-5" /> Infusion Setup
              </h3>
              
              <FormField
                control={form.control}
                name="drug_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select infusion drug" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drugs?.map((drug) => (
                          <SelectItem key={drug.name} value={drug.name}>
                            {drug.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-muted/10">
                <FormField
                  control={form.control}
                  name="ordered_dose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordered Dose <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dose_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dose Unit <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMMON_UNITS.map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bag_volume_ml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bag Volume (mL) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="250" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="concentration_mg_ml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concentration (mg/mL)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="Auto-calc if blank" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to use standard concentration.</p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full text-md font-bold" disabled={isPending}>
              {isPending ? "Calculating Rate..." : "Calculate Pump Rate"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </Form>
      </div>

      {/* Results Pane */}
      <div className="flex-1 p-8 bg-muted/10 overflow-y-auto">
        {result ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className={`border-2 shadow-md ${result.rate_exceeded ? 'border-destructive' : 'border-primary/20'}`}>
              <CardHeader className={`${result.rate_exceeded ? 'bg-destructive/10' : 'bg-primary/5'} pb-4 border-b ${result.rate_exceeded ? 'border-destructive/20' : 'border-primary/10'}`}>
                <CardTitle className="text-2xl flex items-center justify-between">
                  <span>{result.display_name} Infusion</span>
                  {result.rate_exceeded && (
                    <span className="text-sm bg-destructive text-white px-3 py-1 rounded-full flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" /> Max Rate Exceeded
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-base text-foreground font-medium">
                  {result.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Primary Output: Pump Rate */}
                  <div className={`rounded-lg p-6 flex flex-col justify-center items-center text-center shadow-inner ${
                    result.rate_exceeded 
                      ? 'bg-destructive text-destructive-foreground' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    <span className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Set Pump Rate</span>
                    <span className="text-5xl font-bold font-mono tracking-tight">{result.rate_ml_per_hr} <span className="text-xl ml-1">mL/hr</span></span>
                  </div>
                  
                  {/* Secondary Output: Duration */}
                  <div className="bg-white border-2 border-border rounded-lg p-6 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden">
                    <Timer className="absolute -right-4 -bottom-4 w-24 h-24 text-muted/20" />
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1 relative z-10">Bag Duration</span>
                    <span className="text-4xl font-bold font-mono tracking-tight text-foreground relative z-10">
                      {result.duration_hr ? result.duration_hr : "--"} <span className="text-xl ml-1 text-muted-foreground">hrs</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-muted/30 p-3 rounded border border-border flex justify-between">
                    <span className="text-muted-foreground">Concentration:</span>
                    <span className="font-bold font-mono">{result.concentration_mg_ml} mg/mL</span>
                  </div>
                  <div className="bg-muted/30 p-3 rounded border border-border flex justify-between">
                    <span className="text-muted-foreground">Rate/Min:</span>
                    <span className="font-bold font-mono">{result.rate_ml_per_min} mL/min</span>
                  </div>
                </div>

              </CardContent>
            </Card>

            {result.warnings.length > 0 && (
              <Card className="border-orange-500 shadow-sm">
                <CardHeader className="bg-orange-500 text-white py-3">
                  <CardTitle className="text-sm font-bold flex items-center tracking-wider uppercase">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Clinical Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start bg-orange-50 text-orange-900 p-3 rounded-md border border-orange-100">
                      <div className="mt-0.5 mr-3">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium">{w}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Droplets className="w-16 h-16 mb-4 text-muted/50" />
            <h3 className="text-xl font-bold text-foreground mb-2">Awaiting Parameters</h3>
            <p className="text-center max-w-sm text-sm">
              Enter patient weight, select a medication, and specify the ordered dose to calculate infusion pump settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
