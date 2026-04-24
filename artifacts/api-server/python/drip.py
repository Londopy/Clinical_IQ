#!/usr/bin/env python3
import sys
import json
from drugdose import Patient, calculate_drip

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

    conc = req.get("concentration_mg_ml")
    bag = float(req.get("bag_volume_ml", 250.0))

    kwargs = {}
    if conc is not None:
        kwargs["concentration_mg_ml"] = float(conc)

    result = calculate_drip(
        req["drug_name"],
        patient,
        ordered_dose=float(req["ordered_dose"]),
        dose_unit=req["dose_unit"],
        bag_volume_ml=bag,
        **kwargs,
    )

    print(json.dumps({
        "summary": result.summary(),
        "drug_name": result.drug_name,
        "display_name": result.display_name,
        "rate_ml_per_hr": result.rate_ml_per_hr,
        "rate_ml_per_min": result.rate_ml_per_min,
        "duration_hr": result.duration_hr,
        "bag_volume_ml": result.bag_volume_ml,
        "concentration_mg_ml": result.concentration_mg_ml,
        "warnings": result.warnings,
        "rate_exceeded": result.rate_exceeded,
    }))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
