import { SwaggerTypes } from "../../types/SwaggerTypes";

const ResetPasswordRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["userId", "currentPassword", "newPassword"],
  properties: {
    userId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    currentPassword: {
      type: SwaggerTypes.STRING,
      example: "currentpassword123",
    },
    newPassword: {
      type: SwaggerTypes.STRING,
      example: "newpassword123",
    },
  },
};

export default ResetPasswordRequestSchema;
