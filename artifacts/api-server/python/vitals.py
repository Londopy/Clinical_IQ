#!/usr/bin/env python3
import sys
import json
import vitalscore as vs

def main():
    req = json.loads(sys.stdin.read())

    news2 = vs.score_news2(
        respiratory_rate=int(req["respiratory_rate"]),
        spo2=float(req["spo2"]),
        on_oxygen=bool(req["on_oxygen"]),
        systolic_bp=int(req["systolic_bp"]),
        heart_rate=int(req["heart_rate"]),
        consciousness=str(req["consciousness"]),
        temperature=float(req["temperature"]),
    )

    gcs_eye = req.get("gcs_eye")
    gcs_verbal = req.get("gcs_verbal")
    gcs_motor = req.get("gcs_motor")

    gcs_data = None
    if gcs_eye is not None and gcs_verbal is not None and gcs_motor is not None:
        gcs = vs.score_gcs(eye=int(gcs_eye), verbal=int(gcs_verbal), motor=int(gcs_motor))
        gcs_data = {
            "total": gcs.total,
            "severity": gcs.severity,
            "interpretation": gcs.interpretation,
            "eye_descriptor": gcs.eye_descriptor,
            "verbal_descriptor": gcs.verbal_descriptor,
            "motor_descriptor": gcs.motor_descriptor,
        }

    qsofa_gcs = gcs_eye + gcs_verbal + gcs_motor if (gcs_eye and gcs_verbal and gcs_motor) else 15
    qsofa = vs.score_qsofa(
        gcs=int(qsofa_gcs),
        respiratory_rate=int(req["respiratory_rate"]),
        systolic_bp=int(req["systolic_bp"]),
    )

    result = {
        "news2": {
            "total": news2.total,
            "risk": str(news2.risk.value) if hasattr(news2.risk, "value") else str(news2.risk),
            "interpretation": news2.interpretation,
        },
        "qsofa": {
            "total": qsofa.total,
            "sepsis_alert": qsofa.sepsis_alert,
            "interpretation": qsofa.interpretation,
        },
    }
    if gcs_data:
        result["gcs"] = gcs_data

    print(json.dumps(result))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
