import { Router, json } from "express";
import pcBuilderRouter  from "./routes/pc-builder";
import userBuildsRouter from "./routes/user-builds";
import adminHardwareRouter from "./routes/admin-hardware";

export default (_rootDirectory: string): Router => {
  const router = Router();

  router.use(json());
  router.use("/store/pc-builder", pcBuilderRouter);
  router.use("/store/user-builds", userBuildsRouter);
  router.use("/store/admin/hardware", adminHardwareRouter);

  return router;
};
