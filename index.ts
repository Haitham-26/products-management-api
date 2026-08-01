import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import userRouter from "./src/routes/user.routes";
import authRouter from "./src/routes/auth.routes";
import { globalLimiter } from "./src/middlewares/rateLimiter";
import productRouter from "./src/routes/product.routes";
import categoryRouter from "./src/routes/category.routes";
import tagRouter from "./src/routes/tag.routes";
import orderRouter from "./src/routes/order.routes";
import settingsRouter from "./src/routes/settings.routes";
import dashboardRouter from "./src/routes/dashboard.routes";
import organizationRouter from "./src/routes/organization.routes";
import { startCronJobs } from "./src/cron";
import { multerErrorHandler } from "./src/utils/multerErrorHandler";
import { setupSwagger } from "./src/swagger/swagger";
import cookieParser from "cookie-parser";
import returnRouter from "./src/routes/return.routes";

require("dotenv").config();

const app = express();
app.use(cookieParser());

setupSwagger(app);

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.static("public"));

app.use(
  cors({
    origin: ["http://localhost:5173", "https://i-inventix.vercel.app"],
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
app.use("/api/returns", returnRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/organization", organizationRouter);

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
