import { SwaggerTypes } from "../../types/SwggaerTypes";

const GenericWithInvitationIdRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["invitationId"],
  properties: {
    invitationId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
  },
};

export default GenericWithInvitationIdRequestSchema;
