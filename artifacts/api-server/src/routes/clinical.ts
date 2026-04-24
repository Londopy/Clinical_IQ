import { Router, type IRouter } from "express";
import { runPython } from "../lib/python.js";
import {
  CalculateDoseBody,
  CalculateDripBody,
  AssessVitalsBody,
  CheckSafetyBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/clinical/dose", async (req, res): Promise<void> => {
  const parsed = CalculateDoseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const result = await runPython("dose.py", parsed.data);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.warn({ err }, "Dose calculation failed");
    res.status(400).json({ error: msg });
  }
});

router.post("/clinical/drip", async (req, res): Promise<void> => {
  const parsed = CalculateDripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const result = await runPython("drip.py", parsed.data);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.warn({ err }, "Drip calculation failed");
    res.status(400).json({ error: msg });
  }
});

router.post("/clinical/vitals", async (req, res): Promise<void> => {
  const parsed = AssessVitalsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const result = await runPython("vitals.py", parsed.data);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.warn({ err }, "Vitals assessment failed");
    res.status(400).json({ error: msg });
  }
});

router.post("/clinical/safety", async (req, res): Promise<void> => {
  const parsed = CheckSafetyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const result = await runPython("safety.py", parsed.data);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.warn({ err }, "Safety check failed");
    res.status(400).json({ error: msg });
  }
});

export default router;
