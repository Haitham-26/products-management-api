import { OrderVisibility } from "../../../types/order/types/OrderVisibility.enum";
import { SwaggerTypes } from "../../types/SwggaerTypes";

const BulkManageOrdersVisibilityRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["orderIds", "visibility"],
  properties: {
    orderIds: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.STRING,
        example: "6a9d...",
      },
    },
    visibility: {
      type: SwaggerTypes.BOOLEAN,
      enum: Object.values(OrderVisibility),
      example: OrderVisibility.ACTIVE,
    },
  },
};

export default BulkManageOrdersVisibilityRequestSchema;
