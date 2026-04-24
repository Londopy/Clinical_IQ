import React, { useState } from "react";
import { useSearchDrugs, useGetDrugStats, useGetDrug, getGetDrugQueryKey, getSearchDrugsQueryKey, getGetDrugStatsQueryKey } from "@workspace/api-client-react";
import { Search, Pill, AlertTriangle, CheckCircle, Info, Beaker, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DrugSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);

  const { data: searchResults, isLoading: isSearchLoading } = useSearchDrugs(
    { q: searchTerm },
    { query: { enabled: true, queryKey: getSearchDrugsQueryKey({ q: searchTerm }) } }
  );

  const { data: drugDetail, isLoading: isDetailLoading } = useGetDrug(
    selectedDrug || "",
    { query: { enabled: !!selectedDrug, queryKey: getGetDrugQueryKey(selectedDrug || "") } }
  );

  const { data: stats } = useGetDrugStats({ query: { queryKey: getGetDrugStatsQueryKey() } });

  return (
    <div className="flex h-full w-full">
      {/* List Pane */}
      <div className="w-1/3 border-r border-border flex flex-col bg-card shrink-0">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-xl font-bold mb-4 tracking-tight">Drug Database</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search drugs by name or indication..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {stats && (
            <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
              <span>{stats.total_drugs} drugs</span>
              <span>•</span>
              <span>{stats.controlled_count} controlled</span>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isSearchLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 rounded-md border border-transparent">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : searchResults?.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No drugs found matching "{searchTerm}"
              </div>
            ) : (
              searchResults?.map((drug) => (
                <button
                  key={drug.name}
                  onClick={() => setSelectedDrug(drug.name)}
                  className={`w-full text-left p-3 rounded-md transition-colors border ${
                    selectedDrug === drug.name 
                      ? "bg-primary/10 border-primary/20" 
                      : "bg-transparent border-transparent hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">{drug.display_name}</span>
                    {drug.controlled_substance && (
                      <Badge variant="outline" className="text-[10px] py-0 h-4 border-orange-500 text-orange-600 bg-orange-50">
                        {drug.controlled_substance}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{drug.drug_class}</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">{drug.indication}</div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail Pane */}
      <div className="flex-1 bg-background overflow-y-auto">
        {selectedDrug ? (
          isDetailLoading ? (
            <div className="p-8 space-y-6">
              <div>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-5 w-1/4" />
              </div>
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          ) : drugDetail ? (
            <div className="p-8 max-w-4xl mx-auto space-y-8">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">{drugDetail.display_name}</h1>
                  <div className="flex gap-2">
                    {drugDetail.controlled_substance && (
                      <Badge variant="destructive" className="bg-orange-500">
                        Controlled: {drugDetail.controlled_substance}
                      </Badge>
                    )}
                    {drugDetail.pregnancy_category && (
                      <Badge variant="secondary">Pregnancy: {drugDetail.pregnancy_category}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                  <span className="capitalize">{drugDetail.drug_class}</span>
                  {drugDetail.brand_names.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{drugDetail.brand_names.join(", ")}</span>
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {drugDetail.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="bg-primary/5">{tag}</Badge>
                  ))}
                  {drugDetail.routes.map(route => (
                    <Badge key={route} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                      {route}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b border-border bg-muted/20">
                    <CardTitle className="text-sm font-medium flex items-center text-muted-foreground uppercase tracking-wider">
                      <Info className="w-4 h-4 mr-2" /> Indication & Mechanism
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <div className="text-sm font-semibold mb-1">Indication</div>
                      <div className="text-sm">{drugDetail.indication}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1">Mechanism of Action</div>
                      <div className="text-sm text-muted-foreground">{drugDetail.mechanism}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-destructive/20">
                  <CardHeader className="pb-3 border-b border-destructive/10 bg-destructive/5">
                    <CardTitle className="text-sm font-medium flex items-center text-destructive uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 mr-2" /> Clinical Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {drugDetail.contraindications.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-destructive mb-1">Contraindications</div>
                        <ul className="list-disc list-inside text-sm space-y-1 pl-4">
                          {drugDetail.contraindications.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="flex gap-4">
                      {drugDetail.renal_caution && (
                        <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Renal Caution
                        </div>
                      )}
                      {drugDetail.hepatic_caution && (
                        <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Hepatic Caution
                        </div>
                      )}
                    </div>
                    {drugDetail.reversal_agent && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="text-sm font-semibold text-primary mb-1 flex items-center">
                          <Shield className="w-4 h-4 mr-1" /> Reversal Agent
                        </div>
                        <div className="text-sm font-medium">{drugDetail.reversal_agent}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
            <Beaker className="w-16 h-16 mb-4 text-muted" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Select a Drug</h3>
            <p className="text-sm max-w-md">
              Search and select a medication from the database to view detailed clinical information, indications, mechanisms, and safety warnings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
