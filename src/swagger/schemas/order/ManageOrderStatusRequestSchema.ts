import { OrderStatus } from "../../../types/order/types/OrderStatus.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";

const ManageOrderStatusRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["orderId", "status"],
  properties: {
    orderId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    status: {
      type: SwaggerTypes.STRING,
      enum: Object.values(OrderStatus),
      example: OrderStatus.PENDING,
    },
  },
};

export default ManageOrderStatusRequestSchema;
