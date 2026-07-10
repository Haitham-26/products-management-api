import { SwaggerTypes } from "../../types/SwggaerTypes";

const DeleteProductRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["productId"],
  properties: {
    productId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
  },
};

export default DeleteProductRequestSchema;
