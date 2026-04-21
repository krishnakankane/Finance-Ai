import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import goalsRouter from "./goals";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";
import aiRouter from "./ai";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(transactionsRouter);
router.use(budgetsRouter);
router.use(goalsRouter);
router.use(dashboardRouter);
router.use(reportsRouter);
router.use(aiRouter);
router.use(notificationsRouter);

export default router;
