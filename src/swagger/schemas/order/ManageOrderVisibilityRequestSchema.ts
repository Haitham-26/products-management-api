import { OrderVisibility } from "../../../types/order/types/OrderVisibility.enum";
import { SwaggerTypes } from "../../types/SwggaerTypes";

const ManageOrderVisibilityRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["orderId", "visibility"],
  properties: {
    orderId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    visibility: {
      type: SwaggerTypes.BOOLEAN,
      enum: Object.values(OrderVisibility),
      example: OrderVisibility.ACTIVE,
    },
  },
};

export default ManageOrderVisibilityRequestSchema;
