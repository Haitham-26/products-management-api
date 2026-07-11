import { ProductDiscountTypes } from "../../../types/product/types/ProductDiscountTypes.enum";
import { ProductStatus } from "../../../types/product/types/ProductStatus.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";
import ResponseMetaSchema from "../shared/ResponseMetaSchema";

const GetProductsResponseSchema = {
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
            example: "PRD-0001",
          },
          name: {
            type: SwaggerTypes.STRING,
            example: "Iphone 14",
          },
          description: {
            type: SwaggerTypes.STRING,
            example: "It has 3 different colors, blue, black and white",
          },
          status: {
            type: SwaggerTypes.STRING,
            enum: Object.values(ProductStatus),
            example: ProductStatus.PUBLISHED,
          },
          price: {
            type: SwaggerTypes.NUMBER,
            example: 1000,
          },
          quantity: {
            type: SwaggerTypes.INTEGER,
            example: 10,
          },
          discount: {
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
          priceAfterDiscount: {
            type: SwaggerTypes.NUMBER,
            example: 900,
          },
          category: {
            type: SwaggerTypes.OBJECT,
            properties: {
              name: {
                type: SwaggerTypes.STRING,
                example: "Electronics",
              },
            },
          },
          tags: {
            type: SwaggerTypes.ARRAY,
            items: {
              type: SwaggerTypes.OBJECT,
              properties: {
                name: {
                  type: SwaggerTypes.STRING,
                  example: "Premium",
                },
              },
            },
          },
          minStock: {
            type: SwaggerTypes.INTEGER,
            example: 10,
          },
          mainImage: {
            type: SwaggerTypes.OBJECT,
            properties: {
              publicId: {
                type: SwaggerTypes.STRING,
                example: "products/main/id...",
              },
              secureUrl: {
                type: SwaggerTypes.STRING,
                example: "https://example.com/image.jpg",
              },
            },
          },
          galleryImages: {
            type: SwaggerTypes.ARRAY,
            items: {
              type: SwaggerTypes.OBJECT,
              properties: {
                publicId: {
                  type: SwaggerTypes.STRING,
                  example: "products/gallery/id...",
                },
                secureUrl: {
                  type: SwaggerTypes.STRING,
                  example: "https://example.com/image.jpg",
                },
              },
            },
          },
          createdAt: {
            type: SwaggerTypes.STRING,
            format: "date-time",
          },
          updatedAt: {
            type: SwaggerTypes.STRING,
            format: "date-time",
          },

          meta: ResponseMetaSchema,
        },
      },
    },
  },
};

export default GetProductsResponseSchema;
