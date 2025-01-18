import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import productRouter from "./src/services/product.service";
import userRouter from "./src/services/user.service";

require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/products", productRouter);
app.use("/users", userRouter);

mongoose
  .connect(process.env.DB)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });

    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
