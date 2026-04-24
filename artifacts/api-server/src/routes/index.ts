import { Router, type IRouter } from "express";
import healthRouter from "./health";
import drugsRouter from "./drugs";
import clinicalRouter from "./clinical";

const router: IRouter = Router();

router.use(healthRouter);
router.use(drugsRouter);
router.use(clinicalRouter);

export default router;
