import { SwaggerTypes } from "../../types/SwaggerTypes";

const UpdateCategoryRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    name: {
      type: SwaggerTypes.STRING,
      example: "Phones",
    },
    description: {
      type: SwaggerTypes.STRING,
      example: "All phones are listed under this category",
    },
  },
};

export default UpdateCategoryRequestSchema;
