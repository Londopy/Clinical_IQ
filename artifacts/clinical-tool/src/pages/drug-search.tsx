import React, { useState } from "react";
import { useSearchDrugs, useGetDrugStats, useGetDrug, getGetDrugQueryKey, getSearchDrugsQueryKey, getGetDrugStatsQueryKey } from "@workspace/api-client-react";
import { Search, AlertTriangle, Info, Shield, Tag, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const QUICK_TAGS = ["analgesic", "cardiac", "sedation", "antibiotic", "reversal", "anticoagulant", "vasopressor", "pediatric", "controlled"];

export default function DrugSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: searchResults, isLoading: isSearchLoading } = useSearchDrugs(
    { q: searchTerm, tag: activeTag ?? undefined },
    { query: { queryKey: getSearchDrugsQueryKey({ q: searchTerm, tag: activeTag ?? undefined }) } }
  );

  const { data: drugDetail, isLoading: isDetailLoading } = useGetDrug(
    selectedDrug || "",
    { query: { enabled: !!selectedDrug, queryKey: getGetDrugQueryKey(selectedDrug || "") } }
  );

  const { data: stats } = useGetDrugStats({ query: { queryKey: getGetDrugStatsQueryKey() } });

  return (
    <div className="flex h-full w-full">
      {/* List Pane */}
      <div className="w-80 border-r border-border flex flex-col bg-card shrink-0">
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold tracking-tight">Drug Database</h2>
            {stats && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                {stats.total_drugs} drugs
              </span>
            )}
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or indication..."
              className="pl-9 h-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Tag filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                  activeTag === tag
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {activeTag && (
            <button onClick={() => setActiveTag(null)} className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
              <X className="h-3 w-3" /> Clear filter
            </button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {isSearchLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg"><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></div>
              ))
            ) : searchResults?.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No drugs found</div>
            ) : (
              searchResults?.map((drug, i) => (
                <motion.button
                  key={drug.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedDrug(drug.name)}
                  className={`w-full text-left p-3 rounded-lg transition-all border ${
                    selectedDrug === drug.name
                      ? "bg-primary/10 border-primary/30 dark:bg-primary/20"
                      : "bg-transparent border-transparent hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-foreground truncate pr-2">{drug.display_name}</span>
                    {drug.controlled_substance && (
                      <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-950/30 shrink-0">
                        Ctrl
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{drug.drug_class}</div>
                </motion.button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail Pane */}
      <div className="flex-1 bg-background overflow-y-auto">
        <AnimatePresence mode="wait">
          {selectedDrug ? (
            isDetailLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : drugDetail ? (
              <motion.div
                key={selectedDrug}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-8 max-w-3xl"
              >
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-foreground leading-tight flex-1">{drugDetail.display_name}</h1>
                    <div className="flex gap-2 shrink-0 mt-0.5">
                      {drugDetail.controlled_substance && (
                        <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-xs">
                          {drugDetail.controlled_substance}
                        </Badge>
                      )}
                      {drugDetail.pregnancy_category && (
                        <Badge variant="secondary" className="text-xs">Preg: {drugDetail.pregnancy_category}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-muted-foreground mb-3 text-sm">
                    {drugDetail.drug_class}
                    {drugDetail.brand_names.length > 0 && (
                      <span className="ml-2 text-muted-foreground/60">• {drugDetail.brand_names.join(", ")}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {drugDetail.tags.map(tag => (
                      <span key={tag} className="text-xs bg-primary/8 text-primary border border-primary/15 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                    ))}
                    {drugDetail.routes.map(route => (
                      <span key={route} className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium">{route}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Indication & Mechanism */}
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Indication & Mechanism</span>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <div className="text-xs font-semibold text-foreground mb-1">Indication</div>
                        <p className="text-sm text-muted-foreground">{drugDetail.indication}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground mb-1">Mechanism of Action</div>
                        <p className="text-sm text-muted-foreground">{drugDetail.mechanism}</p>
                      </div>
                    </div>
                  </div>

                  {/* Safety */}
                  <div className="bg-card border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/50 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Clinical Safety</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {drugDetail.contraindications.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-foreground mb-1.5">Contraindications</div>
                          <ul className="space-y-1">
                            {drugDetail.contraindications.map((c, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                                <ChevronRight className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {drugDetail.renal_caution && (
                          <span className="flex items-center gap-1 text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded border border-orange-200 dark:border-orange-800">
                            <AlertTriangle className="h-3 w-3" /> Renal Caution
                          </span>
                        )}
                        {drugDetail.hepatic_caution && (
                          <span className="flex items-center gap-1 text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded border border-orange-200 dark:border-orange-800">
                            <AlertTriangle className="h-3 w-3" /> Hepatic Caution
                          </span>
                        )}
                      </div>
                      {drugDetail.reversal_agent && (
                        <div className="mt-2 pt-3 border-t border-border">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                            <Shield className="h-3.5 w-3.5" /> Reversal Agent
                          </div>
                          <div className="text-sm font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded border border-emerald-200 dark:border-emerald-800">
                            {drugDetail.reversal_agent}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 p-8"
            >
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Search className="w-9 h-9 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground mb-1">Select a Drug</h3>
                <p className="text-sm max-w-xs">Search or filter by tag, then select a drug to view its full clinical profile.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
