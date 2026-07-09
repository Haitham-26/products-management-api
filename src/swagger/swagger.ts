import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import SignUpEmailRequestSchema from "./schemas/auth/SignUpEmailRequestSchema";
import SignUpTokenRequestSchema from "./schemas/auth/SignUpTokenRequestSchema";
import RegisterResponseSchema from "./schemas/auth/RegisterResponseSchema";
import SignUpTokenResendRequestSchema from "./schemas/auth/SignUpTokenResendRequestSchema";
import LoginRequestSchema from "./schemas/auth/LoginRequestSchema";
import GoogleLoginRequestSchema from "./schemas/auth/GoogleLoginRequestSchema";
import RefreshTokenRequestSchema from "./schemas/auth/RefreshTokenRequestSchema";
import RefreshTokenResponseSchema from "./schemas/auth/RefreshTokenResponseSchema";
import ForgotPasswordEmailRequestSchema from "./schemas/auth/ForgotPasswordEmailRequestSchema";
import ForgotPasswordTokenRequestSchema from "./schemas/auth/ForgotPasswordTokenRequestSchema";
import ForgotPasswordNewRequestSchema from "./schemas/auth/ForgotPasswordNewRequestSchema";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Products Management API",
      version: "1.0.0",
      description: "API documentation",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
    components: {
      schemas: {
        SignUpEmailRequestSchema,
        SignUpTokenRequestSchema,
        RegisterResponseSchema,
        SignUpTokenResendRequestSchema,
        LoginRequestSchema,
        GoogleLoginRequestSchema,
        RefreshTokenRequestSchema,
        RefreshTokenResponseSchema,
        ForgotPasswordEmailRequestSchema,
        ForgotPasswordTokenRequestSchema,
        ForgotPasswordNewRequestSchema,
      },
    },
  },
  apis: ["./src/services/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
