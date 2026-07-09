import { SwaggerTypes } from "../../types/SwggaerTypes";

const SignUpTokenRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["token", "email"],
  properties: {
    token: {
      type: SwaggerTypes.STRING,
      example: "123456",
    },
    email: {
      type: SwaggerTypes.STRING,
      format: "email",
      example: "john@example.com",
    },
  },
};

export default SignUpTokenRequestSchema;
