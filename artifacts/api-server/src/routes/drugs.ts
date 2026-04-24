import { Router, type IRouter } from "express";
import { runPython } from "../lib/python.js";
import { SearchDrugsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/drugs", async (req, res): Promise<void> => {
  const parsed = SearchDrugsQueryParams.safeParse(req.query);
  const q = parsed.success ? (parsed.data.q ?? "") : "";
  const tag = parsed.success ? (parsed.data.tag ?? null) : null;

  try {
    const result = await runPython("drugs.py", { action: "search", q, tag });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Drug search failed");
    res.status(500).json({ error: "Drug search failed" });
  }
});

router.get("/drugs/stats", async (_req, res): Promise<void> => {
  try {
    const result = await runPython("drugs.py", { action: "stats" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Stats failed" });
  }
});

router.get("/drugs/:name", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.name)
    ? req.params.name[0]
    : req.params.name;
  try {
    const result = await runPython("drugs.py", { action: "get", name: raw });
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("not found")) {
      res.status(404).json({ error: msg });
    } else {
      req.log.error({ err }, "Drug lookup failed");
      res.status(500).json({ error: "Drug lookup failed" });
    }
  }
});

export default router;
