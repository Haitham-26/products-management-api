import { SwaggerTypes } from "../../types/SwaggerTypes";

const UpdateReturnRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["returnId"],
  properties: {
    returnId: { type: SwaggerTypes.STRING, example: "6a9d..." },
    returnReason: { type: SwaggerTypes.STRING, example: "Wrong products" },
  },
};

export default UpdateReturnRequestSchema;
