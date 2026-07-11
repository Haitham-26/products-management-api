import { SwaggerTypes } from "../../types/SwaggerTypes";

const RefreshTokenResponseSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["accessToken"],
  properties: {
    accessToken: {
      type: SwaggerTypes.STRING,
    },
  },
};

export default RefreshTokenResponseSchema;
