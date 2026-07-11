import { SwaggerTypes } from "../../types/SwaggerTypes";

const SignUpTokenResendRequestSchema = {
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

export default SignUpTokenResendRequestSchema;
