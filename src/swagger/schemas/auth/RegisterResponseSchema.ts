import { SwaggerTypes } from "../../types/SwggaerTypes";

const RegisterResponseSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    user: {
      type: SwaggerTypes.OBJECT,
    },
    accessToken: {
      type: SwaggerTypes.STRING,
    },
    refreshToken: {
      type: SwaggerTypes.STRING,
    },
  },
};

export default RegisterResponseSchema;
