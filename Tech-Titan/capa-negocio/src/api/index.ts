import { Router, json } from "express";
import pcBuilderRouter    from "./routes/pc-builder";
import userBuildsRouter   from "./routes/user-builds";
import adminHardwareRouter from "./routes/admin-hardware";
import currenciesRouter   from "./routes/currencies";

const router = Router();

router.use(json());
router.use("/store/pc-builder",      pcBuilderRouter);
router.use("/store/user-builds",     userBuildsRouter);
router.use("/store/currencies",      currenciesRouter);
router.use("/store/admin/hardware",  adminHardwareRouter);

export default router;
