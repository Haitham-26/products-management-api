import { SwaggerTypes } from "../../types/SwaggerTypes";

const DeleteTagRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId", "tagId"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    tagId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
  },
};

export default DeleteTagRequestSchema;
