#!/usr/bin/env python3
import sys
import json
from drugdose import get_drug, full_safety_check, Patient

def main():
    req = json.loads(sys.stdin.read())
    drug_names = req.get("drug_names", [])

    if len(drug_names) < 2:
        print(json.dumps({"error": "At least 2 drugs required"}))
        return

    drugs = {}
    not_found = []
    for name in drug_names:
        d = get_drug(name)
        if d:
            drugs[name] = d
        else:
            not_found.append(name)

    seen_pairs = set()
    all_interactions = []

    for name, drug in drugs.items():
        other_meds = [n for n in drugs.keys() if n != name]
        patient = Patient(
            weight_kg=70,
            age_years=45,
            current_medications=other_meds,
        )
        _, interactions = full_safety_check(drug, patient)
        for ix in interactions:
            pair = tuple(sorted([ix.drug_a.lower(), ix.drug_b.lower()]))
            if pair not in seen_pairs:
                seen_pairs.add(pair)
                all_interactions.append({
                    "drug_a": ix.drug_a,
                    "drug_b": ix.drug_b,
                    "severity": ix.severity,
                    "description": ix.description,
                    "management": ix.management,
                })

    severity_order = {"major": 0, "moderate": 1, "minor": 2}
    all_interactions.sort(key=lambda x: severity_order.get(x["severity"].lower(), 3))

    print(json.dumps({
        "drugs_checked": list(drugs.keys()),
        "not_found": not_found,
        "interaction_count": len(all_interactions),
        "has_major": any(ix["severity"].lower() == "major" for ix in all_interactions),
        "has_moderate": any(ix["severity"].lower() == "moderate" for ix in all_interactions),
        "interactions": all_interactions,
    }))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
