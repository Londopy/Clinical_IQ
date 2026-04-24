import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchDrugs, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { useMutation } from "@tanstack/react-query";
import {
  GitBranch, Plus, X, AlertTriangle, CheckCircle2, Zap,
  ChevronDown, ChevronUp, Search, Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InteractionResult = {
  drugs_checked: string[];
  not_found: string[];
  interaction_count: number;
  has_major: boolean;
  has_moderate: boolean;
  interactions: Array<{
    drug_a: string;
    drug_b: string;
    severity: string;
    description: string;
    management: string;
  }>;
};

function checkInteractions(drug_names: string[]): Promise<InteractionResult> {
  return customFetch<InteractionResult>("/api/clinical/interactions", {
    method: "POST",
    body: JSON.stringify({ drug_names }),
    headers: { "Content-Type": "application/json" },
  });
}

const severityConfig = {
  major: { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300", icon: "text-red-500", label: "Major" },
  moderate: { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300", icon: "text-orange-500", label: "Moderate" },
  minor: { bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300", icon: "text-yellow-500", label: "Minor" },
};

function InteractionCard({ ix, index }: { ix: InteractionResult["interactions"][0]; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const cfg = severityConfig[ix.severity.toLowerCase() as keyof typeof severityConfig] ?? severityConfig.minor;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}
    >
      <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <AlertTriangle className={`h-4 w-4 shrink-0 ${cfg.icon}`} />
          <div>
            <span className="font-semibold text-sm text-foreground">{ix.drug_a} + {ix.drug_b}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
              <p className="text-sm text-foreground/80">{ix.description}</p>
              <div className="bg-background/70 rounded-lg p-3 border border-border/50">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Info className="h-3 w-3" /> Management
                </div>
                <p className="text-sm text-foreground">{ix.management}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function InteractionsChecker() {
  const [selectedDrugs, setSelectedDrugs] = useState<Array<{ name: string; display_name: string }>>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: drugs } = useSearchDrugs(
    { q: search },
    { query: { enabled: search.length > 0, queryKey: getSearchDrugsQueryKey({ q: search }) } }
  );

  const { mutate: check, data: result, isPending, reset } = useMutation({
    mutationFn: (names: string[]) => checkInteractions(names),
  });

  const addDrug = (drug: { name: string; display_name: string }) => {
    if (!selectedDrugs.find(d => d.name === drug.name)) {
      setSelectedDrugs(prev => [...prev, drug]);
    }
    setSearch("");
    setShowDropdown(false);
    reset();
  };

  const removeDrug = (name: string) => {
    setSelectedDrugs(prev => prev.filter(d => d.name !== name));
    reset();
  };

  const handleCheck = () => {
    if (selectedDrugs.length >= 2) {
      check(selectedDrugs.map(d => d.name));
    }
  };

  const majorCount = result?.interactions.filter(i => i.severity.toLowerCase() === "major").length ?? 0;
  const moderateCount = result?.interactions.filter(i => i.severity.toLowerCase() === "moderate").length ?? 0;
  const minorCount = result?.interactions.filter(i => i.severity.toLowerCase() === "minor").length ?? 0;

  return (
    <div className="flex h-full w-full bg-muted/20 dark:bg-background">
      {/* Left: Input */}
      <div className="w-1/2 max-w-lg border-r border-border bg-background p-6 overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-primary" />
            Interactions Checker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add multiple drugs to check all pairwise interactions simultaneously.
          </p>
        </div>

        {/* Drug search input */}
        <div className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search and add drugs..."
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => search && setShowDropdown(true)}
            />
          </div>
          {showDropdown && drugs && drugs.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 bg-popover border border-border rounded-lg shadow-lg mt-1 max-h-56 overflow-y-auto">
              {drugs.filter(d => !selectedDrugs.find(s => s.name === d.name)).slice(0, 8).map(drug => (
                <button
                  key={drug.name}
                  onClick={() => addDrug({ name: drug.name, display_name: drug.display_name })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{drug.display_name}</div>
                    <div className="text-xs text-muted-foreground">{drug.drug_class}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected drug chips */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Selected Drugs ({selectedDrugs.length})
          </div>
          {selectedDrugs.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
              Search and add at least 2 drugs above
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {selectedDrugs.map(drug => (
                  <motion.div
                    key={drug.name}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 text-sm font-medium"
                  >
                    {drug.display_name}
                    <button onClick={() => removeDrug(drug.name)} className="hover:text-red-500 transition-colors ml-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <Button
          onClick={handleCheck}
          disabled={selectedDrugs.length < 2 || isPending}
          size="lg"
          className="w-full font-bold"
        >
          {isPending ? "Checking Interactions..." : `Check ${selectedDrugs.length >= 2 ? selectedDrugs.length : ""} Drug Interactions`}
          <GitBranch className="ml-2 h-4 w-4" />
        </Button>

        {selectedDrugs.length === 1 && (
          <p className="text-center text-xs text-muted-foreground mt-2">Add at least one more drug to check interactions</p>
        )}
      </div>

      {/* Right: Results */}
      <div className="flex-1 p-6 overflow-y-auto">
        {result ? (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Summary banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl border-2 p-5 flex items-center gap-4 ${
                result.has_major
                  ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700"
                  : result.has_moderate
                    ? "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700"
                    : result.interaction_count === 0
                      ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700"
                      : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700"
              }`}
            >
              <div className="shrink-0">
                {result.interaction_count === 0
                  ? <CheckCircle2 className="h-10 w-10 text-green-500" />
                  : <AlertTriangle className={`h-10 w-10 ${result.has_major ? "text-red-500" : "text-orange-500"}`} />
                }
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg text-foreground mb-0.5">
                  {result.interaction_count === 0
                    ? "No Interactions Found"
                    : `${result.interaction_count} Interaction${result.interaction_count > 1 ? "s" : ""} Found`}
                </div>
                <div className="text-sm text-muted-foreground">
                  Checked {result.drugs_checked.length} drugs: {result.drugs_checked.join(", ")}
                </div>
              </div>
              {result.interaction_count > 0 && (
                <div className="flex gap-2 shrink-0">
                  {majorCount > 0 && <div className="text-center"><div className="text-xl font-bold text-red-600 dark:text-red-400 font-mono">{majorCount}</div><div className="text-[10px] text-muted-foreground">Major</div></div>}
                  {moderateCount > 0 && <div className="text-center"><div className="text-xl font-bold text-orange-600 dark:text-orange-400 font-mono">{moderateCount}</div><div className="text-[10px] text-muted-foreground">Moderate</div></div>}
                  {minorCount > 0 && <div className="text-center"><div className="text-xl font-bold text-yellow-600 dark:text-yellow-400 font-mono">{minorCount}</div><div className="text-[10px] text-muted-foreground">Minor</div></div>}
                </div>
              )}
            </motion.div>

            {/* Interaction cards */}
            {result.interactions.map((ix, i) => (
              <InteractionCard key={`${ix.drug_a}-${ix.drug_b}`} ix={ix} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
              <GitBranch className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Interaction Matrix</h3>
              <p className="text-sm max-w-xs">Add two or more drugs on the left to check all pairwise interactions at once.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
