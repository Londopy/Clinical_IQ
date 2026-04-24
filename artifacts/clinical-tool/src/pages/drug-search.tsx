import React, { useState } from "react";
import { useSearchDrugs, useGetDrugStats, useGetDrug, getGetDrugQueryKey, getSearchDrugsQueryKey, getGetDrugStatsQueryKey } from "@workspace/api-client-react";
import { Search, AlertTriangle, Info, Shield, X, ChevronRight, Pill, Tag, Syringe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const TAGS = ["analgesic","cardiac","sedation","antibiotic","reversal","anticoagulant","vasopressor","pediatric","controlled"];

function Section({ title, icon: Icon, children, danger }: {
  title: string; icon: React.ElementType; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className={`rounded-xl border overflow-hidden ${danger ? "border-red-200 dark:border-red-900/40" : "border-border"}`}>
      <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${danger ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40" : "bg-muted/40 border-border"}`}>
        <Icon className={`h-3.5 w-3.5 ${danger ? "text-red-500" : "text-muted-foreground"}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${danger ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DrugSearch() {
  const [q, setQ]             = useState("");
  const [selectedDrug, setSel] = useState<string | null>(null);
  const [tag, setTag]          = useState<string | null>(null);

  const { data: results, isLoading: searching } = useSearchDrugs(
    { q, tag: tag ?? undefined },
    { query: { queryKey: getSearchDrugsQueryKey({ q, tag: tag ?? undefined }) } }
  );

  const { data: detail, isLoading: loadingDetail } = useGetDrug(
    selectedDrug || "",
    { query: { enabled: !!selectedDrug, queryKey: getGetDrugQueryKey(selectedDrug || "") } }
  );

  const { data: stats } = useGetDrugStats({ query: { queryKey: getGetDrugStatsQueryKey() } });

  return (
    <div className="flex h-full w-full">
      {/* ── List pane ─────────────────────────────── */}
      <div className="w-72 border-r border-border flex flex-col bg-card shrink-0">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Drug Database</span>
            {stats && (
              <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                {stats.total_drugs}
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Name or indication…"
              className="pl-8 h-8 text-sm bg-background"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {TAGS.map(t => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? null : t)}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                  tag === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
            {tag && (
              <button onClick={() => setTag(null)} className="flex items-center gap-0.5 text-[10px] text-primary hover:underline px-1">
                <X className="h-2.5 w-2.5" /> clear
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-px">
            {searching
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="p-2.5 rounded-lg space-y-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              : results?.length === 0
              ? <p className="text-center text-xs text-muted-foreground py-8">No drugs found</p>
              : results?.map((drug, i) => (
                  <motion.button
                    key={drug.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    onClick={() => setSel(drug.name)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                      selectedDrug === drug.name
                        ? "bg-primary/10 dark:bg-primary/20 border border-primary/25"
                        : "hover:bg-muted/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-xs text-foreground truncate">{drug.display_name}</span>
                      {drug.controlled_substance && (
                        <span className="text-[9px] font-bold px-1 py-0 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 shrink-0">
                          C
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">{drug.drug_class}</div>
                  </motion.button>
                ))
            }
          </div>
        </ScrollArea>
      </div>

      {/* ── Detail pane ────────────────────────────── */}
      <div className="flex-1 bg-background overflow-y-auto">
        <AnimatePresence mode="wait">
          {!selectedDrug ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Pill className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-sm">Select a drug</p>
                <p className="text-xs max-w-xs mt-1">Search or filter by category, then click a drug to view its full clinical profile.</p>
              </div>
            </motion.div>
          ) : loadingDetail ? (
            <div className="p-8 space-y-4 max-w-2xl">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          ) : detail ? (
            <motion.div
              key={selectedDrug}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="p-7 max-w-2xl"
            >
              {/* Header */}
              <div className="mb-5">
                <div className="flex items-start gap-3 mb-2">
                  <h1 className="text-xl font-bold text-foreground flex-1 leading-tight">{detail.display_name}</h1>
                  <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                    {detail.controlled_substance && (
                      <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-xs">{detail.controlled_substance}</Badge>
                    )}
                    {detail.pregnancy_category && (
                      <Badge variant="secondary" className="text-xs">Cat {detail.pregnancy_category}</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {detail.drug_class}
                  {detail.brand_names.length > 0 && (
                    <span className="text-muted-foreground/60"> · {detail.brand_names.join(", ")}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {detail.tags.map(t => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/8 dark:bg-primary/15 text-primary border border-primary/15 font-medium flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" />{t}
                    </span>
                  ))}
                  {detail.routes.map(r => (
                    <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium flex items-center gap-1">
                      <Syringe className="h-2.5 w-2.5" />{r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Section title="Indication & Mechanism" icon={Info}>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">Indication</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{detail.indication}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">Mechanism</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{detail.mechanism}</p>
                    </div>
                  </div>
                </Section>

                <Section title="Clinical Safety" icon={AlertTriangle} danger>
                  <div className="space-y-3">
                    {detail.contraindications.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1.5">Contraindications</p>
                        <ul className="space-y-1">
                          {detail.contraindications.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <ChevronRight className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {detail.renal_caution && (
                        <span className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                          <AlertTriangle className="h-2.5 w-2.5" /> Renal caution
                        </span>
                      )}
                      {detail.hepatic_caution && (
                        <span className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                          <AlertTriangle className="h-2.5 w-2.5" /> Hepatic caution
                        </span>
                      )}
                    </div>
                    {detail.reversal_agent && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1.5">
                          <Shield className="h-3 w-3" /> Reversal Agent
                        </p>
                        <div className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {detail.reversal_agent}
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
