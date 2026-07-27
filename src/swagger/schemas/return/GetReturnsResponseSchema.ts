import { ReturnStatus } from "../../../types/return/types/ReturnStatus.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";
import ResponseMetaSchema from "../shared/ResponseMetaSchema";

const ReturnItemSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    productId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    productMainImage: {
      type: SwaggerTypes.STRING,
      example: "https://example.com/image.jpg",
    },
    productName: {
      type: SwaggerTypes.STRING,
      example: "Iphone 14",
    },
    returnedQuantity: {
      type: SwaggerTypes.INTEGER,
      example: 5,
    },
    restockedQuantity: {
      type: SwaggerTypes.INTEGER,
      example: 1,
    },
    totalRevenue: {
      type: SwaggerTypes.NUMBER,
      example: 1000,
    },
    totalProfit: {
      type: SwaggerTypes.NUMBER,
      example: 200,
    },
  },
};

const GetReturnsResponseSchema = {
  type: SwaggerTypes.OBJECT,
  properties: {
    data: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.OBJECT,
        properties: {
          _id: {
            type: SwaggerTypes.STRING,
            example: "6a9d...",
          },
          userId: {
            type: SwaggerTypes.STRING,
            example: "6a9d...",
          },
          orderId: {
            type: SwaggerTypes.STRING,
            example: "6a9d...",
          },
          items: {
            type: SwaggerTypes.ARRAY,
            items: ReturnItemSchema,
          },
          totalReturnRevenue: {
            type: SwaggerTypes.NUMBER,
            example: 1500,
          },
          totalReturnProfit: {
            type: SwaggerTypes.NUMBER,
            example: 500,
          },
          status: {
            type: SwaggerTypes.STRING,
            enum: Object.values(ReturnStatus),
            example: ReturnStatus.ACTIVE,
          },
          returnReason: {
            type: SwaggerTypes.STRING,
            example: "Defective products",
          },
          returnedAt: {
            type: SwaggerTypes.STRING,
            format: "date-time",
          },
          canceledAt: {
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
    meta: ResponseMetaSchema,
  },
};

export default GetReturnsResponseSchema;
