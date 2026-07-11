import { SwaggerTypes } from "../../types/SwaggerTypes";

const RemoveMemberRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["memberId"],
  properties: {
    memberId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
  },
};

export default RemoveMemberRequestSchema;
