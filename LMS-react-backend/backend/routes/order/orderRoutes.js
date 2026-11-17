import express from "express";
import { getAllOrders, getDashOrderStats } from "../../controllers/order/orderController.js";

const OrderRouter = express.Router();

// GET all orders
OrderRouter.get("/", getAllOrders);
OrderRouter.get("/stats", getDashOrderStats);

export default OrderRouter;