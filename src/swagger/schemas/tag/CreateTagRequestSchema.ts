import { SwaggerTypes } from "../../types/SwggaerTypes";

const CreateTagRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId", "name"],
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
      example: "We add this tag to premium products",
    },
  },
};

export default CreateTagRequestSchema;
