import { SwaggerTypes } from "../../types/SwggaerTypes";

const DeleteCategoryRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId", "categoryId"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    categoryId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
  },
};

export default DeleteCategoryRequestSchema;
