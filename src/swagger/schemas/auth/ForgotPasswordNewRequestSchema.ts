import { SwaggerTypes } from "../../types/SwggaerTypes";

const ForgotPasswordNewRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["email", "token", "newPassword"],
  properties: {
    email: {
      type: SwaggerTypes.STRING,
      format: "email",
      example: "john@example.com",
    },
    token: {
      type: SwaggerTypes.STRING,
      example: "123456",
    },
    newPassword: {
      type: SwaggerTypes.STRING,
      example: "password123",
    },
  },
};

export default ForgotPasswordNewRequestSchema;
