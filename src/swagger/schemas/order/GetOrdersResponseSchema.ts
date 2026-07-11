import { OrderStatus } from "../../../types/order/types/OrderStatus.enum";
import { ProductDiscountTypes } from "../../../types/product/types/ProductDiscountTypes.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";
import ResponseMetaSchema from "../shared/ResponseMetaSchema";

const GetOrdersResponseSchema = {
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
          identifier: {
            type: SwaggerTypes.STRING,
            example: "ORD-0001",
          },
          customerName: {
            type: SwaggerTypes.STRING,
            example: "Haitham Waki",
          },
          customerPhone: {
            type: SwaggerTypes.STRING,
            example: "+123456789",
          },
          customerEmail: {
            type: SwaggerTypes.STRING,
            format: "email",
            example: "haitham@example.com",
          },
          userId: {
            type: SwaggerTypes.STRING,
            example: "6a9d...",
          },
          items: {
            type: SwaggerTypes.ARRAY,
            items: {
              type: SwaggerTypes.OBJECT,
              properties: {
                productId: {
                  type: SwaggerTypes.STRING,
                  example: "6a9d...",
                },
                productName: {
                  type: SwaggerTypes.STRING,
                  example: "Iphone 14",
                },
                productMainImage: {
                  type: SwaggerTypes.STRING,
                  example: "https://example.com/image.jpg",
                },
                productGalleryImages: {
                  type: SwaggerTypes.ARRAY,
                  items: {
                    type: SwaggerTypes.STRING,
                    example: "https://example.com/image.jpg",
                  },
                },
                quantity: {
                  type: SwaggerTypes.INTEGER,
                  example: 1,
                },
                priceAtPurchase: {
                  type: SwaggerTypes.NUMBER,
                  example: 1000,
                },
                discountAtPurchase: {
                  type: SwaggerTypes.OBJECT,
                  properties: {
                    type: {
                      type: SwaggerTypes.STRING,
                      enum: Object.values(ProductDiscountTypes),
                      example: ProductDiscountTypes.PERCENTAGE,
                    },
                    value: {
                      type: SwaggerTypes.NUMBER,
                      example: 10,
                    },
                  },
                },
                finalPrice: {
                  type: SwaggerTypes.NUMBER,
                  example: 900,
                },
              },
            },
          },
          note: {
            type: SwaggerTypes.STRING,
            example:
              "The customer wants the product to be delivered as soon as possible.",
          },
          status: {
            type: SwaggerTypes.STRING,
            enum: Object.values(OrderStatus),
            example: OrderStatus.PENDING,
          },
          totalPriceAtPurchase: {
            type: SwaggerTypes.NUMBER,
            example: 900,
          },
          isArchived: {
            type: SwaggerTypes.BOOLEAN,
            example: false,
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

export default GetOrdersResponseSchema;
