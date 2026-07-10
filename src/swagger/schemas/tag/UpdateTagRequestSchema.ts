import { SwaggerTypes } from "../../types/SwggaerTypes";

const UpdateTagRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    name: {
      type: SwaggerTypes.STRING,
      example: "Premium",
    },
    description: {
      type: SwaggerTypes.STRING,
      example: "This tag is added to premium products",
    },
  },
};

export default UpdateTagRequestSchema;
