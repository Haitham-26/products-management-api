import { SwaggerTypes } from "../../types/SwaggerTypes";

const ForgotPasswordEmailRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["email"],
  properties: {
    email: {
      type: SwaggerTypes.STRING,
      format: "email",
      example: "john@example.com",
    },
  },
};

export default ForgotPasswordEmailRequestSchema;
