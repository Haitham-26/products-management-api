import { SwaggerTypes } from "../../types/SwaggerTypes";

const CreateReturnRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["orderId", "returnReason", "items"],
  properties: {
    orderId: { type: SwaggerTypes.STRING, example: "6a9d..." },
    returnReason: { type: SwaggerTypes.STRING, example: "Damaged" },
    items: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.OBJECT,
        required: ["productId", "returnedQuantity", "restockedQuantity"],
        properties: {
          productId: { type: SwaggerTypes.STRING, example: "6a9d..." },
          returnedQuantity: { type: SwaggerTypes.INTEGER, example: 5 },
          restockedQuantity: { type: SwaggerTypes.INTEGER, example: 1 },
        },
      },
    },
  },
};

export default CreateReturnRequestSchema;
