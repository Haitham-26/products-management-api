import { SwaggerTypes } from "../../types/SwaggerTypes";

const CancelReturnRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["returnId"],
  properties: {
    returnId: { type: SwaggerTypes.STRING, example: "6a9d..." },
  },
};

export default CancelReturnRequestSchema;
