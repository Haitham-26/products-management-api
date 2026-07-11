import { SwaggerTypes } from "../../types/SwaggerTypes";

const ForgotPasswordTokenRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["email", "token"],
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
  },
};

export default ForgotPasswordTokenRequestSchema;
