#!/usr/bin/env python3
import sys
import json
from drugdose import Patient, get_drug, full_safety_check

def main():
    req = json.loads(sys.stdin.read())
    drug_name = req["drug_name"]
    p = req["patient"]
    route = req.get("route") or None

    patient = Patient(
        weight_kg=float(p["weight_kg"]),
        age_years=float(p["age_years"]),
        allergies=p.get("allergies", []),
        current_medications=p.get("current_medications", []),
        conditions=p.get("conditions", []),
        renal_impairment=bool(p.get("renal_impairment", False)),
    )

    drug = get_drug(drug_name)
    if drug is None:
        print(json.dumps({"error": f"Drug '{drug_name}' not found"}))
        sys.exit(1)

    cis, ixs = full_safety_check(drug, patient, route=route)

    ci_list = [{"absolute": ci.absolute, "detail": ci.detail} for ci in cis]
    ix_list = [
        {
            "drug_a": ix.drug_a,
            "drug_b": ix.drug_b,
            "severity": ix.severity,
            "description": ix.description,
            "management": ix.management,
        }
        for ix in ixs
    ]

    print(json.dumps({
        "drug_name": drug.name,
        "display_name": drug.display_name,
        "contraindications": ci_list,
        "interactions": ix_list,
        "has_absolute_contraindication": any(ci.absolute for ci in cis),
        "has_major_interaction": any(ix.severity == "major" for ix in ixs),
    }))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
