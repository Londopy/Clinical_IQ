#!/usr/bin/env python3
import sys
import json
from drugdose import get_all_drugs, search_drugs, get_drug

def drug_to_summary(drug):
    return {
        "name": drug.name,
        "display_name": drug.display_name,
        "drug_class": drug.drug_class,
        "indication": drug.indication,
        "routes": drug.available_routes,
        "tags": drug.tags,
        "controlled_substance": drug.controlled_substance,
        "reversal_agent": drug.reversal_agent,
    }

def drug_to_detail(drug):
    return {
        "name": drug.name,
        "display_name": drug.display_name,
        "brand_names": drug.brand_names,
        "drug_class": drug.drug_class,
        "indication": drug.indication,
        "mechanism": drug.mechanism,
        "routes": drug.available_routes,
        "contraindications": drug.contraindications,
        "pregnancy_category": drug.pregnancy_category,
        "controlled_substance": drug.controlled_substance,
        "renal_caution": drug.renal_caution,
        "hepatic_caution": drug.hepatic_caution,
        "reversal_agent": drug.reversal_agent,
        "tags": drug.tags,
    }

def main():
    req = json.loads(sys.stdin.read())
    action = req.get("action")

    if action == "search":
        q = req.get("q", "")
        tag = req.get("tag") or None
        results = search_drugs(q, tag=tag)
        print(json.dumps([drug_to_summary(d) for d in results]))

    elif action == "get":
        name = req.get("name", "")
        drug = get_drug(name)
        if drug is None:
            print(json.dumps({"error": f"Drug '{name}' not found"}))
        else:
            print(json.dumps(drug_to_detail(drug)))

    elif action == "stats":
        all_drugs = get_all_drugs()
        classes = list({d.drug_class for d in all_drugs.values() if d.drug_class})
        tag_counts: dict[str, int] = {}
        for d in all_drugs.values():
            for t in d.tags:
                tag_counts[t] = tag_counts.get(t, 0) + 1
        top_tags = sorted(tag_counts, key=lambda t: -tag_counts[t])
        controlled = sum(1 for d in all_drugs.values() if d.controlled_substance)
        reversals = sum(1 for d in all_drugs.values() if d.reversal_agent)
        print(json.dumps({
            "total_drugs": len(all_drugs),
            "drug_classes": classes,
            "top_tags": top_tags,
            "controlled_count": controlled,
            "reversal_agent_count": reversals,
        }))

    else:
        print(json.dumps({"error": "Unknown action"}))

if __name__ == "__main__":
    main()
