import { ProductDiscountTypes } from "../../../types/product/types/ProductDiscountTypes.enum";
import { SwaggerTypes } from "../../types/SwaggerTypes";

const UpdateProductRequestSchema = {
  type: SwaggerTypes.OBJECT,
  required: ["name", "price", "quantity"],
  properties: {
    name: {
      type: SwaggerTypes.STRING,
      example: "Iphone 14",
    },
    description: {
      type: SwaggerTypes.STRING,
      example: "It has 3 different colors, blue, black and white",
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
    categoryId: {
      type: SwaggerTypes.STRING,
      example: "6a9d...",
    },
    tags: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.STRING,
        example: "6a9d...",
      },
    },
    mainImage: {
      type: SwaggerTypes.STRING,
      format: "binary",
    },
    galleryImages: {
      type: SwaggerTypes.ARRAY,
      items: {
        type: SwaggerTypes.STRING,
        format: "binary",
      },
    },
  },
};

export default UpdateProductRequestSchema;
