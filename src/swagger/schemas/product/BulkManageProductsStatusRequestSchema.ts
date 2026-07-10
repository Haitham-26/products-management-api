import { ProductStatus } from "../../../types/product/types/ProductStatus.enum";
import { SwaggerTypes } from "../../types/SwggaerTypes";

const BulkManageProductsStatusRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["productIds", "status"],
  properties: {
    productIds: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.STRING,
        example: "6a9d...",
      },
    },
    status: {
      type: SwaggerTypes.STRING,
      enum: Object.values(ProductStatus),
      example: ProductStatus.DRAFT,
    },
  },
};

export default BulkManageProductsStatusRequestSchema;
