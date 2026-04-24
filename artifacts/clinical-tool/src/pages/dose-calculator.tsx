import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchDrugs, useCalculateDose, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { Calculator, AlertTriangle, Syringe, Info, UserRound, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const doseFormSchema = z.object({
  drug_name: z.string().min(1, "Please select a drug"),
  weight_kg: z.coerce.number().min(1, "Weight must be positive"),
  age_years: z.coerce.number().min(0, "Age must be valid"),
  route: z.string().optional(),
  renal_impairment: z.boolean().default(false),
  allergies: z.string(),
});

type DoseFormValues = z.infer<typeof doseFormSchema>;

export default function DoseCalculator() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: drugs } = useSearchDrugs({ q: searchTerm }, { query: { queryKey: getSearchDrugsQueryKey({ q: searchTerm }) }});
  
  const form = useForm<DoseFormValues>({
    resolver: zodResolver(doseFormSchema),
    defaultValues: {
      drug_name: "",
      weight_kg: 70,
      age_years: 45,
      renal_impairment: false,
      allergies: "",
    },
  });

  const { mutate: calculateDose, data: result, isPending } = useCalculateDose();

  const onSubmit = (data: DoseFormValues) => {
    calculateDose({
      data: {
        drug_name: data.drug_name,
        route: data.route,
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
  const selectedDrugDetail = drugs?.find(d => d.name === selectedDrugName);

  return (
    <div className="flex h-full w-full bg-muted/20">
      {/* Form Pane */}
      <div className="w-1/2 max-w-xl border-r border-border bg-background p-6 overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Dose Calculator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calculate exact weight-based dosing and identify potential warnings.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Patient Vitals Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <UserRound className="w-5 h-5" /> Patient Profile
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

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies (comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Penicillin, Sulfa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="renal_impairment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Known Renal Impairment</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Check if patient has CKD or AKI. May adjust dosing warnings.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Drug Selection Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <Syringe className="w-5 h-5" /> Medication
              </h3>
              
              <FormField
                control={form.control}
                name="drug_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Drug <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a medication" />
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

              {selectedDrugDetail && (
                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Default Route" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedDrugDetail.routes.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button type="submit" size="lg" className="w-full text-md font-bold" disabled={isPending}>
              {isPending ? "Calculating..." : "Calculate Dose"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </Form>
      </div>

      {/* Results Pane */}
      <div className="flex-1 p-8 bg-muted/10 overflow-y-auto">
        {result ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-2 border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                <CardTitle className="text-2xl flex items-center justify-between">
                  <span>{result.display_name} Dose</span>
                  <Badge variant="outline" className="bg-white">{result.route}</Badge>
                </CardTitle>
                <CardDescription className="text-base text-foreground font-medium">
                  {result.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-primary text-primary-foreground rounded-lg p-6 flex flex-col justify-center items-center text-center shadow-inner">
                    <span className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wider mb-1">Target Dose</span>
                    <span className="text-4xl font-bold font-mono tracking-tight">{result.dose_display} <span className="text-xl ml-1">{result.dose_unit}</span></span>
                  </div>
                  
                  <div className="bg-white border-2 border-border rounded-lg p-6 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Administer Volume</span>
                    <span className="text-4xl font-bold font-mono tracking-tight text-foreground">{result.volume_ml} <span className="text-xl ml-1 text-muted-foreground">mL</span></span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-sm font-medium">
                  <Info className="w-4 h-4 mr-2" />
                  Frequency: {result.frequency}
                </div>
              </CardContent>
            </Card>

            {result.contraindications.length > 0 && (
              <Card className="border-destructive shadow-sm">
                <CardHeader className="bg-destructive text-destructive-foreground py-3">
                  <CardTitle className="text-sm font-bold flex items-center tracking-wider uppercase">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Contraindications
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {result.contraindications.map((c, i) => (
                    <div key={i} className="flex items-start bg-red-50 text-red-900 p-3 rounded-md border border-red-100">
                      <div className="mt-0.5 mr-3">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      </div>
                      <div>
                        {c.absolute && <Badge variant="destructive" className="mb-1 text-[10px]">ABSOLUTE</Badge>}
                        <p className="text-sm font-medium">{c.detail}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {result.interactions.length > 0 && (
              <Card className="border-orange-500 shadow-sm">
                <CardHeader className="bg-orange-500 text-white py-3">
                  <CardTitle className="text-sm font-bold flex items-center tracking-wider uppercase">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Drug Interactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {result.interactions.map((i, idx) => (
                    <div key={idx} className="border border-orange-200 rounded-md p-4 bg-orange-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-orange-900">
                          {i.drug_a} + {i.drug_b}
                        </div>
                        <Badge variant="outline" className="border-orange-500 text-orange-700 bg-white">
                          {i.severity} Severity
                        </Badge>
                      </div>
                      <p className="text-sm text-orange-800 mb-2">{i.description}</p>
                      <div className="text-xs bg-white p-2 rounded border border-orange-100 text-orange-900">
                        <span className="font-semibold block mb-1">Management:</span>
                        {i.management}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Calculator className="w-16 h-16 mb-4 text-muted/50" />
            <h3 className="text-xl font-bold text-foreground mb-2">Awaiting Parameters</h3>
            <p className="text-center max-w-sm text-sm">
              Enter patient weight, age, and select a medication on the left to calculate an accurate, safe dosage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
