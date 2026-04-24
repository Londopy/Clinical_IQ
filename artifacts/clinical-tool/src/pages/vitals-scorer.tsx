import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAssessVitals } from "@workspace/api-client-react";
import { Activity, HeartPulse, Thermometer, BrainCircuit, ArrowRight, AlertOctagon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const vitalsSchema = z.object({
  respiratory_rate: z.coerce.number().min(0, "Required"),
  spo2: z.coerce.number().min(0).max(100, "Max 100"),
  on_oxygen: z.boolean().default(false),
  systolic_bp: z.coerce.number().min(0, "Required"),
  heart_rate: z.coerce.number().min(0, "Required"),
  temperature: z.coerce.number().min(20).max(45, "Check temp"),
  consciousness: z.enum(["A", "C", "V", "P", "U"]),
  gcs_eye: z.coerce.number().optional(),
  gcs_verbal: z.coerce.number().optional(),
  gcs_motor: z.coerce.number().optional(),
});

type VitalsFormValues = z.infer<typeof vitalsSchema>;

export default function VitalsScorer() {
  const form = useForm<VitalsFormValues>({
    resolver: zodResolver(vitalsSchema),
    defaultValues: {
      respiratory_rate: 16,
      spo2: 98,
      on_oxygen: false,
      systolic_bp: 120,
      heart_rate: 80,
      temperature: 37.0,
      consciousness: "A",
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
    <div className="flex h-full w-full bg-muted/20">
      <div className="w-1/2 max-w-xl border-r border-border bg-background p-6 overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Vitals Scorer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Input patient vitals to calculate NEWS2, qSOFA, and GCS simultaneously.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Respiratory */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <Activity className="w-4 h-4" /> Respiratory
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="respiratory_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resp Rate (bpm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spo2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SpO2 (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="on_oxygen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/30">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Supplemental Oxygen</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Hemodynamics */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <HeartPulse className="w-4 h-4" /> Hemodynamics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="systolic_bp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Systolic BP (mmHg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="heart_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heart Rate (bpm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Other */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <Thermometer className="w-4 h-4" /> Other
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temp (°C)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consciousness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ACVPU</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">Alert (A)</SelectItem>
                          <SelectItem value="C">Confusion (C)</SelectItem>
                          <SelectItem value="V">Voice (V)</SelectItem>
                          <SelectItem value="P">Pain (P)</SelectItem>
                          <SelectItem value="U">Unresponsive (U)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 mt-4 border-t border-border">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Glasgow Coma Scale (Optional)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="gcs_eye"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eye (1-4)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="4" {...field} value={field.value || ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gcs_verbal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verbal (1-5)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="5" {...field} value={field.value || ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gcs_motor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motor (1-6)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="6" {...field} value={field.value || ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full text-md font-bold" disabled={isPending}>
              {isPending ? "Scoring..." : "Calculate Scores"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </Form>
      </div>

      {/* Results Pane */}
      <div className="flex-1 p-8 bg-muted/10 overflow-y-auto">
        {result ? (
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* NEWS2 Card */}
            <Card className={`border-l-4 shadow-sm ${
              result.news2.risk === 'High' ? 'border-l-destructive' : 
              result.news2.risk === 'Medium' ? 'border-l-orange-500' : 'border-l-green-500'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>NEWS2 Score</span>
                  <span className="text-3xl font-mono font-bold">{result.news2.total}</span>
                </CardTitle>
                <CardDescription className="text-base font-medium text-foreground">
                  {result.news2.risk} Risk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md text-sm border border-border">
                  {result.news2.interpretation}
                </div>
              </CardContent>
            </Card>

            {/* qSOFA Card */}
            <Card className={`border-l-4 shadow-sm ${
              result.qsofa.sepsis_alert ? 'border-l-destructive' : 'border-l-muted-foreground'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>qSOFA Score</span>
                    {result.qsofa.sepsis_alert && (
                      <AlertOctagon className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <span className="text-3xl font-mono font-bold">{result.qsofa.total}/3</span>
                </CardTitle>
                <CardDescription className="text-base font-medium text-foreground">
                  {result.qsofa.sepsis_alert ? "High Risk of Sepsis" : "Low Risk"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`p-4 rounded-md text-sm border ${
                  result.qsofa.sepsis_alert ? 'bg-red-50 border-red-200 text-red-900' : 'bg-muted border-border'
                }`}>
                  {result.qsofa.interpretation}
                </div>
              </CardContent>
            </Card>

            {/* GCS Card (if calculated) */}
            {result.gcs && (
              <Card className="border-l-4 border-l-primary shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center justify-between">
                    <span>GCS Score</span>
                    <span className="text-3xl font-mono font-bold">{result.gcs.total}</span>
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-foreground">
                    {result.gcs.severity}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-muted p-2 rounded">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">Eye</div>
                      <div className="font-mono font-bold text-lg">{result.gcs.eye_descriptor}</div>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">Verbal</div>
                      <div className="font-mono font-bold text-lg">{result.gcs.verbal_descriptor}</div>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">Motor</div>
                      <div className="font-mono font-bold text-lg">{result.gcs.motor_descriptor}</div>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-md text-sm border border-border">
                    {result.gcs.interpretation}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <BrainCircuit className="w-16 h-16 mb-4 text-muted/50" />
            <h3 className="text-xl font-bold text-foreground mb-2">Awaiting Vitals</h3>
            <p className="text-center max-w-sm text-sm">
              Enter patient vital signs to instantly calculate clinical risk scores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
