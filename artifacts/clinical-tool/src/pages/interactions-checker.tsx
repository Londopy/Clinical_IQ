import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchDrugs, getSearchDrugsQueryKey } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { useMutation } from "@tanstack/react-query";
import { GitBranch, Plus, X, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Search, Zap, Shield, AlertOctagon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Interaction = {
  drug_a: string; drug_b: string; severity: string;
  description: string; management: string;
};
type InteractionResult = {
  drugs_checked: string[]; not_found: string[];
  interaction_count: number; has_major: boolean; has_moderate: boolean;
  interactions: Interaction[];
};

function checkInteractions(drug_names: string[]): Promise<InteractionResult> {
  return customFetch<InteractionResult>("/api/clinical/interactions", {
    method: "POST",
    body: JSON.stringify({ drug_names }),
    headers: { "Content-Type": "application/json" },
  });
}

const sevStyle = {
  major:    { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", text: "text-red-700 dark:text-red-300", badge: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300", icon: <AlertOctagon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /> },
  moderate: { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300", icon: <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" /> },
  minor:    { bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800", text: "text-yellow-700 dark:text-yellow-300", badge: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300", icon: <Shield className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" /> },
};

function InteractionCard({ ix, index }: { ix: Interaction; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const cfg = sevStyle[ix.severity.toLowerCase() as keyof typeof sevStyle] ?? sevStyle.minor;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}
    >
      <button className="w-full flex items-center justify-between p-3.5 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2.5">
          {cfg.icon}
          <span className={`font-semibold text-sm ${cfg.text}`}>{ix.drug_a} + {ix.drug_b}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{ix.severity}</span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5 border-t border-black/5 dark:border-white/5 pt-3">
              <p className="text-xs text-foreground/80 leading-relaxed">{ix.description}</p>
              <div className="bg-background/60 rounded-lg p-3 border border-black/5 dark:border-white/5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Management</p>
                <p className="text-xs text-foreground">{ix.management}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function InteractionsChecker() {
  const [selectedDrugs, setSel] = useState<Array<{ name: string; display_name: string }>>([]);
  const [search, setSearch]     = useState("");
  const [showDrop, setShowDrop] = useState(false);

  const { data: searchResults } = useSearchDrugs(
    { q: search },
    { query: { enabled: search.length > 0, queryKey: getSearchDrugsQueryKey({ q: search }) } }
  );

  const { mutate: check, data: result, isPending, reset } = useMutation({
    mutationFn: (names: string[]) => checkInteractions(names),
  });

  const addDrug = (drug: { name: string; display_name: string }) => {
    if (!selectedDrugs.find(d => d.name === drug.name)) {
      setSel(p => [...p, drug]);
    }
    setSearch(""); setShowDrop(false); reset();
  };
  const removeDrug = (name: string) => { setSel(p => p.filter(d => d.name !== name)); reset(); };

  const noInteractions = result && result.interaction_count === 0;

  return (
    <div className="min-h-full p-7 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
          <GitBranch className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-none">Interactions Checker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Pairwise drug-drug interaction check across a full medication list</p>
        </div>
      </div>

      {/* Drug selector */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Medication List</p>

        {/* Chips */}
        {selectedDrugs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedDrugs.map(d => (
              <motion.span
                key={d.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 text-xs font-medium text-primary"
              >
                {d.display_name}
                <button onClick={() => removeDrug(d.name)} className="hover:text-foreground transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search and add drug…"
              className="pl-8 h-9 text-sm bg-background"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDrop(true); }}
              onFocus={() => search && setShowDrop(true)}
            />
          </div>
          <AnimatePresence>
            {showDrop && searchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
              >
                {searchResults.slice(0, 8).map(d => (
                  <button
                    key={d.name}
                    onClick={() => addDrug(d)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/60 transition-colors border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium">{d.display_name}</span>
                    <span className="text-xs text-muted-foreground">{d.drug_class}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">{selectedDrugs.length < 2 ? `Add ${2 - selectedDrugs.length} more drug${selectedDrugs.length === 1 ? "" : "s"} to check` : `${selectedDrugs.length} drugs selected`}</p>
          <Button
            onClick={() => check(selectedDrugs.map(d => d.name))}
            disabled={selectedDrugs.length < 2 || isPending}
            size="sm" className="h-8 gap-1.5"
          >
            <Zap className="h-3.5 w-3.5" />
            {isPending ? "Checking…" : "Check Interactions"}
          </Button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Summary */}
            <div className={`flex items-center justify-between p-3.5 rounded-xl border ${
              result.has_major    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              : result.has_moderate ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
              : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
            }`}>
              <div className="flex items-center gap-2.5">
                {noInteractions
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : result.has_major
                  ? <AlertOctagon className="h-5 w-5 text-red-500" />
                  : <AlertTriangle className="h-5 w-5 text-orange-500" />}
                <div>
                  <p className={`text-sm font-bold ${noInteractions ? "text-emerald-700 dark:text-emerald-300" : result.has_major ? "text-red-700 dark:text-red-300" : "text-orange-700 dark:text-orange-300"}`}>
                    {noInteractions ? "No interactions found" : `${result.interaction_count} interaction${result.interaction_count !== 1 ? "s" : ""} found`}
                  </p>
                  <p className="text-xs text-muted-foreground">{result.drugs_checked.length} drugs checked</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {result.has_major    && <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs">Major</Badge>}
                {result.has_moderate && <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-xs">Moderate</Badge>}
              </div>
            </div>

            {result.not_found.length > 0 && (
              <p className="text-xs text-muted-foreground px-1">
                Not found: {result.not_found.join(", ")}
              </p>
            )}

            {result.interactions.map((ix, i) => (
              <InteractionCard key={i} ix={ix} index={i} />
            ))}

            {noInteractions && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                No clinically significant interactions detected between the selected drugs.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
