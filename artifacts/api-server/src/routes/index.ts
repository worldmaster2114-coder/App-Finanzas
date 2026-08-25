import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import financeRouter from "./finance";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/finance", financeRouter);

export default router;
