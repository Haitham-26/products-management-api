import { SwaggerTypes } from "../../types/SwaggerTypes";

const ActivateReturnRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["returnId"],
  properties: {
    returnId: { type: SwaggerTypes.STRING, example: "6a9d..." },
  },
};

export default ActivateReturnRequestSchema;
