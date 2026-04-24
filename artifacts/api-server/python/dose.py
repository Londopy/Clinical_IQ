#!/usr/bin/env python3
import sys
import json
from drugdose import Patient, calculate_dose

def main():
    req = json.loads(sys.stdin.read())
    p = req["patient"]
    patient = Patient(
        weight_kg=float(p["weight_kg"]),
        age_years=float(p["age_years"]),
        allergies=p.get("allergies", []),
        current_medications=p.get("current_medications", []),
        conditions=p.get("conditions", []),
        renal_impairment=bool(p.get("renal_impairment", False)),
    )
    route = req.get("route", "IV")
    dose_fraction = float(req.get("dose_fraction", 1.0))

    result = calculate_dose(req["drug_name"], patient, route=route, dose_fraction=dose_fraction)

    cis = [{"absolute": ci.absolute, "detail": ci.detail} for ci in result.contraindications]
    ixs = [
        {
            "drug_a": ix.drug_a,
            "drug_b": ix.drug_b,
            "severity": ix.severity,
            "description": ix.description,
            "management": ix.management,
        }
        for ix in result.interactions
    ]

    print(json.dumps({
        "summary": result.summary(),
        "drug_name": result.drug_name,
        "display_name": result.display_name,
        "route": result.route,
        "dose_display": result.dose_display,
        "dose_unit": result.dose_unit,
        "volume_ml": result.volume_ml,
        "frequency": result.frequency,
        "contraindications": cis,
        "interactions": ixs,
    }))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
