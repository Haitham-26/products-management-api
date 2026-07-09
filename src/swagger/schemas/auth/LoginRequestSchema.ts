import { SwaggerTypes } from "../../types/SwggaerTypes";

const LoginRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["email", "password"],
  properties: {
    email: {
      type: SwaggerTypes.STRING,
      format: "email",
      example: "john@example.com",
    },
    password: {
      type: SwaggerTypes.STRING,
      example: "password123",
    },
  },
};

export default LoginRequestSchema;
