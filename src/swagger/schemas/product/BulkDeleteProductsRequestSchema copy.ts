import { SwaggerTypes } from "../../types/SwggaerTypes";

const BulkDeleteProductsRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["productIds"],
  properties: {
    productIds: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.STRING,
        example: "6a9d...",
      },
    },
  },
};

export default BulkDeleteProductsRequestSchema;
