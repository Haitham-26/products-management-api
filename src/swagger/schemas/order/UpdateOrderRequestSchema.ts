import { SwaggerTypes } from "../../types/SwaggerTypes";

const UpdateOrderRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["customerName", "items"],
  properties: {
    customerName: {
      type: SwaggerTypes.STRING,
      example: "Haitham Waki",
    },
    customerPhone: {
      type: SwaggerTypes.STRING,
      example: "+123456789",
    },
    customerEmail: {
      type: SwaggerTypes.STRING,
      format: "email",
      example: "haitham@example.com",
    },
    customerAddress: {
      type: SwaggerTypes.STRING,
      example: "123 Main St, Anytown, USA",
    },
    items: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.OBJECT,
        required: ["productId", "quantity"],
        properties: {
          productId: {
            type: SwaggerTypes.STRING,
            example: "6a9d...",
          },
          quantity: {
            type: SwaggerTypes.INTEGER,
            example: 1,
          },
        },
      },
    },
    note: {
      type: SwaggerTypes.STRING,
      example:
        "The customer wants the product to be delivered as soon as possible.",
    },
  },
};

export default UpdateOrderRequestSchema;
