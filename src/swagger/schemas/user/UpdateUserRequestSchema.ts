import { SwaggerTypes } from "../../types/SwggaerTypes";

const UpdateUserRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    name: {
      type: SwaggerTypes.STRING,
      example: "Haitham Waki",
    },
    email: {
      type: SwaggerTypes.STRING,
      format: "email",
      example: "haitham@example.com",
    },
    company: {
      type: SwaggerTypes.STRING,
      example: "Inventix",
    },
    avatar: {
      type: SwaggerTypes.STRING,
      format: "binary",
    },
  },
};

export default UpdateUserRequestSchema;
