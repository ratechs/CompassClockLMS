import OrderRouter from "./orderRoutes.js";
import express from "express";

const managementRouter = express.Router();

// Mount the OrderRouter at the root path
managementRouter.use("/orders", OrderRouter);

export default managementRouter;