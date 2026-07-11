import { SwaggerTypes } from "../../types/SwaggerTypes";

const SignUpEmailRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["name", "email", "password"],
  properties: {
    name: {
      type: SwaggerTypes.STRING,
      example: "Haitham Waki",
    },
    company: {
      type: SwaggerTypes.STRING,
      example: "Example Company",
    },
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

export default SignUpEmailRequestSchema;
