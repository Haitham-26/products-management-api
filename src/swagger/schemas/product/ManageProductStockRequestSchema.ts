import { SwaggerTypes } from "../../types/SwggaerTypes";

const ManageProductStockRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["productId", "stockChange"],
  properties: {
    productId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    stockChange: {
      type: SwaggerTypes.INTEGER,
      example: -20,
    },
  },
};

export default ManageProductStockRequestSchema;
