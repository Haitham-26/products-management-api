import { SwaggerTypes } from "../../types/SwaggerTypes";

const CreateCategoryRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId", "name"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    name: {
      type: SwaggerTypes.STRING,
      example: "Electronics",
    },
    description: {
      type: SwaggerTypes.STRING,
      example: "All electronic products are listed under this category",
    },
  },
};

export default CreateCategoryRequestSchema;
