import { SwaggerTypes } from "../../types/SwggaerTypes";

const BulkDeleteCategoriesRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId", "categoryIds"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    categoryIds: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.STRING,
        example: "6a9d...",
      },
    },
  },
};

export default BulkDeleteCategoriesRequestSchema;
