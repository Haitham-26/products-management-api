import { OrderStatus } from "../../../types/order/types/OrderStatus.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";

const BulkManageOrdersStatusRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["orderIds", "status"],
  properties: {
    orderIds: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.STRING,
        example: "6a9d...",
      },
    },
    status: {
      type: SwaggerTypes.STRING,
      enum: Object.values(OrderStatus),
      example: OrderStatus.PENDING,
    },
  },
};

export default BulkManageOrdersStatusRequestSchema;
