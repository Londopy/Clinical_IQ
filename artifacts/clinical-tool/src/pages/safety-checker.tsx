import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchDrugs, useCheckSafety, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { ShieldAlert, ShieldCheck, UserRound, ArrowRight, Pill, AlertTriangle, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const safetySchema = z.object({
  drug_name: z.string().min(1, "Please select a drug"),
  weight_kg: z.coerce.number().min(1, "Required").default(70),
  age_years: z.coerce.number().min(0, "Required").default(45),
  renal_impairment: z.boolean().default(false),
  allergies: z.string(),
  current_medications: z.string(),
  conditions: z.string(),
});

type SafetyFormValues = z.infer<typeof safetySchema>;

export default function SafetyChecker() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: drugs } = useSearchDrugs({ q: searchTerm }, { query: { queryKey: getSearchDrugsQueryKey({ q: searchTerm }) }});
  
  const form = useForm<SafetyFormValues>({
    resolver: zodResolver(safetySchema),
    defaultValues: {
      drug_name: "",
      weight_kg: 70,
      age_years: 45,
      renal_impairment: false,
      allergies: "",
      current_medications: "",
      conditions: "",
    },
  });

  const { mutate: checkSafety, data: result, isPending } = useCheckSafety();

  const onSubmit = (data: SafetyFormValues) => {
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
    <div className="flex h-full w-full bg-muted/20">
      <div className="w-1/2 max-w-xl border-r border-border bg-background p-6 overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Safety Checker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verify contraindications and drug interactions against a complete patient profile.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <Pill className="w-5 h-5" /> Target Medication
              </h3>
              
              <FormField
                control={form.control}
                name="drug_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication to Check <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select medication" />
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
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <UserRound className="w-5 h-5" /> Patient Profile
              </h3>
              
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
                  name="current_medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications (comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Amiodarone, Warfarin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="conditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Conditions (comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Asthma, CHF" {...field} />
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
                          Critical for nephrotoxic drugs.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full text-md font-bold" disabled={isPending}>
              {isPending ? "Checking..." : "Run Safety Check"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </Form>
      </div>

      {/* Results Pane */}
      <div className="flex-1 p-8 bg-muted/10 overflow-y-auto">
        {result ? (
          <div className="max-w-2xl mx-auto space-y-6">
            
            <div className={`p-6 rounded-lg border-2 shadow-md flex items-center justify-between ${
              result.has_absolute_contraindication 
                ? 'bg-destructive/10 border-destructive text-destructive' 
                : result.has_major_interaction 
                  ? 'bg-orange-500/10 border-orange-500 text-orange-700'
                  : 'bg-green-500/10 border-green-500 text-green-700'
            }`}>
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {result.has_absolute_contraindication ? "DO NOT ADMINISTER" :
                   result.has_major_interaction ? "PROCEED WITH CAUTION" :
                   "NO MAJOR FLAGS DETECTED"}
                </h2>
                <p className="font-medium opacity-80">
                  Checking {result.display_name} against patient profile.
                </p>
              </div>
              <div>
                {result.has_absolute_contraindication ? (
                  <AlertTriangle className="w-12 h-12" />
                ) : result.has_major_interaction ? (
                  <AlertTriangle className="w-12 h-12" />
                ) : (
                  <ShieldCheck className="w-12 h-12" />
                )}
              </div>
            </div>

            {/* Contraindications */}
            {result.contraindications.length > 0 && (
              <Card className="border-destructive shadow-sm">
                <CardHeader className="bg-destructive text-destructive-foreground py-3">
                  <CardTitle className="text-sm font-bold flex items-center tracking-wider uppercase">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Contraindications Found ({result.contraindications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {result.contraindications.map((c, i) => (
                    <div key={i} className="flex items-start bg-red-50 text-red-900 p-4 rounded-md border border-red-100">
                      <div className="mt-0.5 mr-3">
                        <AlertTriangle className={`w-5 h-5 ${c.absolute ? 'text-destructive' : 'text-red-400'}`} />
                      </div>
                      <div>
                        {c.absolute && <Badge variant="destructive" className="mb-2">ABSOLUTE</Badge>}
                        <p className="text-base font-medium">{c.detail}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Interactions */}
            {result.interactions.length > 0 && (
              <Card className="border-orange-500 shadow-sm">
                <CardHeader className="bg-orange-500 text-white py-3">
                  <CardTitle className="text-sm font-bold flex items-center tracking-wider uppercase">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Drug Interactions ({result.interactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {result.interactions.map((i, idx) => (
                    <div key={idx} className="border border-orange-200 rounded-md p-4 bg-orange-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-orange-900 text-lg">
                          {i.drug_a} + {i.drug_b}
                        </div>
                        <Badge variant="outline" className="border-orange-500 text-orange-700 bg-white uppercase font-bold">
                          {i.severity} Severity
                        </Badge>
                      </div>
                      <p className="text-base text-orange-800 mb-4">{i.description}</p>
                      <div className="text-sm bg-white p-3 rounded border border-orange-200 text-orange-900">
                        <span className="font-semibold block mb-1 text-xs uppercase tracking-wider text-orange-600">Management</span>
                        {i.management}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {result.contraindications.length === 0 && result.interactions.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                <ShieldCheck className="w-12 h-12 text-green-500 mb-3" />
                <h3 className="text-lg font-bold text-green-900 mb-1">Clear to Proceed</h3>
                <p className="text-center text-green-700/80 text-sm max-w-xs">
                  No documented contraindications or severe interactions found based on the provided patient profile.
                </p>
              </div>
            )}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShieldAlert className="w-16 h-16 mb-4 text-muted/50" />
            <h3 className="text-xl font-bold text-foreground mb-2">Awaiting Data</h3>
            <p className="text-center max-w-sm text-sm">
              Select a drug and input patient details (allergies, meds, conditions) to run a comprehensive safety check.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
