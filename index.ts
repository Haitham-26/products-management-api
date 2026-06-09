import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import userRouter from "./src/services/user.service";
import authRouter from "./src/services/auth.service";
import { globalLimiter } from "./src/middlewares/rateLimiter";
import productRouter from "./src/services/product.service";
import categoryRouter from "./src/services/category.service";
import tagRouter from "./src/services/tag.service";
import orderRouter from "./src/services/order.service";
import settingsRouter from "./src/services/settings.service";
import dashboardRouter from "./src/services/dashboard.service";
import usersPermissionsRouter from "./src/services/users-permissions.service";
import { startCronJobs } from "./src/cron";

require("dotenv").config();

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);
app.use(globalLimiter);

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/settings", settingsRouter);
app.use("/products", productRouter);
app.use("/categories", categoryRouter);
app.use("/tags", tagRouter);
app.use("/orders", orderRouter);
app.use("/dashboard", dashboardRouter);
app.use("/users-permissions", usersPermissionsRouter);

app.use("/healthcheck", (req, res) => {
  res.status(200).send("Healthy");
});

mongoose
  .connect(process.env.DB!)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });

    startCronJobs();

    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
