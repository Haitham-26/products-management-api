import { InvitationStatus } from "../../../types/users-permissions/types/InvitationStatus.enum";
import { SwaggerTypes } from "../../types/SwggaerTypes";

const GetOwnerInvitationsResponseSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    invitations: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.OBJECT,
        properties: {
          _id: {
            type: SwaggerTypes.STRING,
            example: "6a9d...",
          },
          inviterId: {
            type: SwaggerTypes.STRING,
            example: "6a9d...",
          },
          inviteeEmail: {
            type: SwaggerTypes.STRING,
            format: "email",
            example: "haitham@example.com",
          },
          status: {
            type: SwaggerTypes.STRING,
            enum: Object.values(InvitationStatus),
            example: InvitationStatus.PENDING,
          },
          sentAt: {
            type: SwaggerTypes.STRING,
            format: "date-time",
          },
          createdAt: {
            type: SwaggerTypes.STRING,
            format: "date-time",
          },
          updatedAt: {
            type: SwaggerTypes.STRING,
            format: "date-time",
          },
        },
      },
    },
  },
};

export default GetOwnerInvitationsResponseSchema;
