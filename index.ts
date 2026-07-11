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
import membersInvitationRouter from "./src/services/member-invitation.service";
import { startCronJobs } from "./src/cron";
import { multerErrorHandler } from "./src/utils/multerErrorHandler";

require("dotenv").config();

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.static("public"));

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);
app.use(globalLimiter);

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/tags", tagRouter);
app.use("/api/orders", orderRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users-permissions", membersInvitationRouter);

app.use(multerErrorHandler);

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
