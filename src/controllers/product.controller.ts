import { RequestContext } from "../utils/RequestContext";
import { StatusCode } from "../types/shared/dto/StatusCode.enum";
import ProductModel, { Product } from "../models/Product.model";
import isString from "lodash/isString";
import isNaN from "lodash/isNaN";
import { Types } from "mongoose";
import isNil from "lodash/isNil";
import CategoryModel from "../models/Category.model";
import { withTransaction } from "../utils/withTransaction";
import isNumber from "lodash/isNumber";
import isUndefined from "lodash/isUndefined";
import TagModel from "../models/Tag.model";
import { ProductDiscountTypes } from "../types/product/types/ProductDiscountTypes.enum";
import { CounterKeys } from "../types/counter/types/CounterKeys.enum";
import { generateIdentifier } from "./counter.controller";
import { ProductStockStatus } from "../types/product/types/ProductStockStatus.enum";
import { getCreatedAtSort } from "../utils/getCreatedAtSort";
import { CreationDateFilters } from "../types/shared/types/CreationDateFilters.enum";
import { escapeSpecialChars } from "../utils/String";
import { ProductStatus } from "../types/product/types/ProductStatus.enum";
import isNull from "lodash/isNull";
import { QueryOptions } from "mongoose";
import { RequestHandler } from "express-serve-static-core";
import { UploadService } from "../services/upload.service";
import { CloudinaryImage } from "../types/shared/types/CloudinaryImage";
import isArray from "lodash/isArray";
import { errorHandler } from "../errors/errorHandler";
import { APIError } from "../errors/APIError";
import { APIErrorKeys } from "../errors/APIError-keys";

export class ProductService {
  constructor() {}

  static calculatePriceAfterDiscount(
    price: number,
    discount?: Product["discount"],
  ) {
    let value = price;

    if (!discount) {
      return value;
    }

    if (discount.type === ProductDiscountTypes.PERCENTAGE) {
      value = price * (1 - discount.value / 100);
    } else {
      value = price - discount.value;
    }

    return Number(value.toFixed(2));
  }
}

const createProduct: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      quantity,
      discount,
      categoryId,
      tags,
      minStock,
    } = req.body;

    const files = req.files as unknown as {
      mainImage?: Express.Multer.File[];
      galleryImages?: Express.Multer.File[];
    };

    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const mainImageFile = files?.mainImage?.[0];
    const galleryImageFiles = files?.galleryImages || [];

    let mainImageToUpload: CloudinaryImage | undefined = undefined;
    let galleryImagesToUpload: CloudinaryImage[] = [];

    if (mainImageFile) {
      const image = await UploadService.uploadImage(
        mainImageFile,
        "products/main",
      );

      mainImageToUpload = {
        publicId: image.public_id,
        secureUrl: image.secure_url,
      };
    }

    if (galleryImageFiles?.length) {
      const images = await Promise.all(
        galleryImageFiles.map((file) =>
          UploadService.uploadImage(file, "products/gallery"),
        ),
      );

      images.forEach((image) => {
        galleryImagesToUpload.push({
          publicId: image.public_id,
          secureUrl: image.secure_url,
        });
      });
    }

    try {
      await withTransaction(async (session) => {
        const identifier = await generateIdentifier(
          req,
          CounterKeys.PRODUCT,
          session,
        );

        await ProductModel.create(
          [
            {
              identifier,
              name,
              description,
              price,
              quantity,
              discount,
              priceAfterDiscount: ProductService.calculatePriceAfterDiscount(
                price,
                discount,
              ),
              userId: scopeId,
              categoryId: categoryId
                ? new Types.ObjectId(categoryId as string)
                : undefined,
              tags: tags
                ?.filter((tagId: string) => Types.ObjectId.isValid(tagId))
                ?.map((tagId: string) => new Types.ObjectId(tagId)),
              minStock: isNumber(minStock) ? Number(minStock) : undefined,
              mainImage: mainImageToUpload,
              galleryImages: galleryImagesToUpload.length
                ? galleryImagesToUpload
                : undefined,
            },
          ],
          { session },
        );

        if (categoryId) {
          await CategoryModel.updateOne(
            { _id: new Types.ObjectId(categoryId as string), userId: scopeId },
            { $inc: { usageCount: 1 } },
            { session },
          );
        }

        if (tags?.length) {
          await TagModel.updateMany(
            {
              userId: scopeId,
              _id: {
                $in: tags,
              },
            },
            { $inc: { usageCount: 1 } },
            { session },
          );
        }
      });
    } catch (txError) {
      // Clean up anything we already
      // uploaded to Cloudinary before the DB write, so we don't leak assets
      // that no product document ever ends up referencing.

      const uploadedPublicIdsForCleanup = [
        ...(mainImageToUpload?.publicId ? [mainImageToUpload.publicId] : []),
        ...(galleryImagesToUpload?.length
          ? galleryImagesToUpload.map((image) => image.publicId)
          : []),
      ];

      await Promise.all(
        uploadedPublicIdsForCleanup.map((publicId) =>
          UploadService.deleteImage(publicId),
        ),
      );

      throw new APIError({
        message: APIErrorKeys.internal,
        status: StatusCode.INTERNAL_ERROR,
      });
    }

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const getProducts: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const {
      categoryId,
      tagIds,
      keyword,
      showDraft,
      creationDate,
      minBasePrice,
      maxBasePrice,
      minFinalPrice,
      maxFinalPrice,
      minQuantity,
      maxQuantity,
      discountType,
      stockStatus,
      meta,
    } = req.query;

    const { page, limit } = JSON.parse(JSON.stringify(meta) || "{}");

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * pageSize;

    const query: QueryOptions = {
      userId: scopeId,
      isDeleted: { $ne: true },
    };

    if (showDraft !== "true") {
      query.status = { $ne: ProductStatus.DRAFT };
    }

    if (categoryId && Types.ObjectId.isValid(categoryId as string)) {
      query.categoryId = new Types.ObjectId(categoryId as string);
    }

    if (tagIds) {
      const raw = Array.isArray(tagIds) ? tagIds : [tagIds];
      const ids = (raw as string[])
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      if (ids.length) {
        query.tags = { $in: ids };
      }
    }

    if (isString(keyword)) {
      const escapedKeyword = escapeSpecialChars(keyword);

      query.$or = [
        { name: { $regex: escapedKeyword || "", $options: "i" } },
        { description: { $regex: escapedKeyword || "", $options: "i" } },
        { identifier: { $regex: escapedKeyword || "", $options: "i" } },
      ];
    }

    if (!isNil(minBasePrice) || !isNil(maxBasePrice)) {
      query.price = {};
      if (minBasePrice) {
        query.price.$gte = Number(minBasePrice);
      }
      if (maxBasePrice) {
        query.price.$lte = Number(maxBasePrice);
      }
    }

    if (!isNil(minFinalPrice) || !isNil(maxFinalPrice)) {
      query.priceAfterDiscount = {};
      if (minFinalPrice) {
        query.priceAfterDiscount.$gte = Number(minFinalPrice);
      }
      if (maxFinalPrice) {
        query.priceAfterDiscount.$lte = Number(maxFinalPrice);
      }
    }

    if (!isNil(minQuantity) || !isNil(maxQuantity)) {
      query.quantity = {};
      if (minQuantity) {
        query.quantity.$gte = Number(minQuantity);
      }
      if (maxQuantity) {
        query.quantity.$lte = Number(maxQuantity);
      }
    }

    if (stockStatus) {
      if (stockStatus === ProductStockStatus.OUT_OF_STOCK) {
        query.quantity = 0;
      } else if (stockStatus === ProductStockStatus.LOW_STOCK) {
        query.$expr = {
          $and: [
            { $gt: ["$quantity", 0] },
            {
              $lte: ["$quantity", { $ifNull: ["$minStock", 10] }],
            },
          ],
        };
      } else if (stockStatus === ProductStockStatus.IN_STOCK) {
        query.$expr = {
          $gt: ["$quantity", { $ifNull: ["$minStock", 10] }],
        };
      }
    }

    if (discountType) {
      query["discount.type"] = discountType;
    }

    const [total, products] = await Promise.all([
      ProductModel.countDocuments(query),
      ProductModel.find(query)
        .populate({
          path: "category",
          select: "name",
          match: { isDeleted: { $ne: true } },
        })
        .populate({
          path: "tags",
          select: "name",
          match: { isDeleted: { $ne: true } },
        })
        .sort({
          createdAt: getCreatedAtSort(creationDate as CreationDateFilters),
        })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.status(200).json({
      data: products,
      meta: {
        total,
        page: currentPage,
        limit: pageSize,
      },
    });
  } catch (e) {
    errorHandler(e, res);
  }
};

const deleteProduct: RequestHandler = async (req, res) => {
  try {
    const { product, scopeId } = RequestContext<{
      product: Product;
      scopeId: string;
    }>(req);

    await withTransaction(async (session) => {
      await ProductModel.updateOne(
        { _id: product._id, userId: scopeId },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { session },
      );

      if (product.categoryId) {
        await CategoryModel.updateOne(
          { _id: product.categoryId, userId: scopeId },
          { $inc: { usageCount: -1 } },
          { session },
        );
      }

      if (product.tags?.length) {
        await TagModel.updateMany(
          { userId: scopeId, _id: { $in: product.tags.map((tag) => tag._id) } },
          { $inc: { usageCount: -1 } },
          { session },
        );
      }
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const deleteBulkProducts: RequestHandler = async (req, res) => {
  try {
    const { products, scopeId } = RequestContext<{
      products: Product[];
      scopeId: string;
    }>(req);
    const { productIds } = req.body;

    await withTransaction(async (session) => {
      await ProductModel.updateMany(
        { _id: { $in: productIds }, userId: scopeId },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { session },
      );

      const categoryOperations = products
        .filter((product) => product.categoryId)
        .map((product) => ({
          updateOne: {
            filter: { _id: product.categoryId, userId: scopeId },
            update: { $inc: { usageCount: -1 } },
          },
        }));

      if (categoryOperations.length) {
        await CategoryModel.bulkWrite(categoryOperations, { session });
      }

      const tagOperations = products
        .filter((product) => product?.tags?.length)
        .map((product) => ({
          updateMany: {
            filter: {
              userId: scopeId,
              _id: { $in: product.tags!.map((tag) => tag._id) },
            },
            update: { $inc: { usageCount: -1 } },
          },
        }));

      if (tagOperations.length) {
        await TagModel.bulkWrite(tagOperations, { session });
      }
    });

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const updateProduct: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { productId, mainImage, galleryImages } = req.body;

    const {
      name,
      description,
      price,
      quantity,
      discount,
      categoryId,
      tags,
      minStock,
      status,
    } = req.body;

    const { product } = RequestContext<{ product: Product }>(req);

    const updateDto: Partial<Product> = {};

    if (isString(name)) {
      updateDto.name = name;
    }
    if (isString(description)) {
      updateDto.description = description;
    }

    if (Object.values(ProductStatus).includes(status as ProductStatus)) {
      updateDto.status = status;
    }

    if (!isNaN(price) && isNull(price)) {
      updateDto.price = Number(price);
    }
    if (!isNaN(quantity) && isNull(quantity)) {
      updateDto.quantity = Number(quantity);
    }
    if (!isUndefined(minStock) && !isNaN(minStock)) {
      updateDto.minStock = Number(minStock);
    }

    if (discount) {
      updateDto.discount = discount;
    }

    if (!isUndefined(price) || !isUndefined(discount)) {
      const finalPrice = !isNaN(price) ? Number(price) : product.price;
      const finalDiscount = discount ?? product.discount;

      updateDto.priceAfterDiscount = ProductService.calculatePriceAfterDiscount(
        finalPrice,
        finalDiscount,
      );
    }

    if (!isUndefined(categoryId)) {
      updateDto.categoryId = categoryId
        ? new Types.ObjectId(categoryId as string)
        : null;
    }

    if (Array.isArray(tags)) {
      updateDto.tags = tags.map((tag) => new Types.ObjectId(tag));
    }

    const files = req.files as unknown as {
      mainImage?: Express.Multer.File[];
      galleryImages?: Express.Multer.File[];
    };

    const mainImageFile = files?.mainImage?.[0];
    const galleryImageFiles = files?.galleryImages || [];

    // ---- 1. Do all Cloudinary UPLOADS up front (outside the transaction) ----
    // We need the resulting publicId/secureUrl to write into updateDto, so
    // these have to happen before the DB write.

    let mainImageToUpload: CloudinaryImage | null | undefined = undefined;
    const uploadedPublicIdsForCleanup: string[] = [];

    if (isNull(mainImage)) {
      // User explicitly removed the main image — no upload needed here,
      // just mark it for deletion later.
      mainImageToUpload = null;
    } else if (mainImageFile) {
      const uploadedImage = await UploadService.uploadImage(mainImageFile);
      mainImageToUpload = {
        publicId: uploadedImage.public_id,
        secureUrl: uploadedImage.secure_url,
      };
      uploadedPublicIdsForCleanup.push(uploadedImage.public_id);
    }

    let newGalleryImagesToUpload: CloudinaryImage[] = [];
    if (galleryImageFiles.length) {
      const uploadedImages = await Promise.all(
        galleryImageFiles.map((file) =>
          UploadService.uploadImage(file, "products/gallery"),
        ),
      );

      newGalleryImagesToUpload = uploadedImages.map((image) => ({
        publicId: image.public_id,
        secureUrl: image.secure_url,
      }));
      uploadedPublicIdsForCleanup.push(
        ...newGalleryImagesToUpload.map((i) => i.publicId),
      );
    }

    // ---- 2. Figure out which OLD images need deleting (but don't delete yet) ----

    const bodyGalleryImages: string[] = galleryImages;
    const galleryPublicIdsToDeleteAfterCommit: string[] = [];

    if (product.mainImage?.publicId && mainImageToUpload !== undefined) {
      // Either replaced or explicitly removed -> old one is going away
      galleryPublicIdsToDeleteAfterCommit.push(product.mainImage.publicId);
      // (kept in a separate concept below; see mainImagePublicIdToDeleteAfterCommit)
    }

    const mainImagePublicIdToDeleteAfterCommit =
      mainImageToUpload !== undefined && product.mainImage?.publicId
        ? product.mainImage.publicId
        : null;

    if (isArray(bodyGalleryImages)) {
      const imagesToDelete = product.galleryImages?.filter(
        (image) => !bodyGalleryImages?.includes(image.secureUrl),
      );

      if (imagesToDelete?.length) {
        galleryPublicIdsToDeleteAfterCommit.push(
          ...imagesToDelete.map((image) => image.publicId),
        );
      }
    }

    updateDto.mainImage = mainImageToUpload;
    updateDto.galleryImages = [
      ...(product?.galleryImages?.length
        ? product.galleryImages.filter(
            (image) =>
              !galleryPublicIdsToDeleteAfterCommit.includes(image.publicId),
          )
        : []),
      ...newGalleryImagesToUpload,
    ];

    try {
      await withTransaction(async (session) => {
        const oldCategoryId = product?.categoryId || null;

        let newCategoryId: Types.ObjectId | null = oldCategoryId;
        if (!isUndefined(categoryId)) {
          newCategoryId = categoryId
            ? new Types.ObjectId(categoryId as string)
            : null;
        }

        const oldTags: Types.ObjectId[] =
          product?.tags?.map((tag) => tag._id) || [];
        let addedTags: Types.ObjectId[] = [];
        let removedTags: Types.ObjectId[] = [];

        if (Array.isArray(tags)) {
          const newTags = tags.map((tag: string) => new Types.ObjectId(tag));
          removedTags = oldTags.filter(
            (oldTag) => !newTags.some((newTag) => newTag.equals(oldTag)),
          );
          addedTags = newTags.filter(
            (newTag) => !oldTags.some((oldTag) => oldTag.equals(newTag)),
          );
        }

        await ProductModel.findOneAndUpdate(
          { _id: productId, userId: scopeId },
          { $set: updateDto },
          { session },
        );

        if (
          !oldCategoryId?.equals(newCategoryId as any) &&
          !(!oldCategoryId && !newCategoryId)
        ) {
          if (oldCategoryId) {
            await CategoryModel.updateOne(
              { _id: oldCategoryId, userId: scopeId },
              { $inc: { usageCount: -1 } },
              { session },
            );
          }
          if (newCategoryId) {
            await CategoryModel.updateOne(
              { _id: newCategoryId, userId: scopeId },
              { $inc: { usageCount: 1 } },
              { session },
            );
          }
        }

        if (removedTags.length) {
          await TagModel.updateMany(
            { _id: { $in: removedTags }, userId: scopeId },
            { $inc: { usageCount: -1 } },
            { session },
          );
        }

        if (addedTags.length) {
          await TagModel.updateMany(
            { _id: { $in: addedTags }, userId: scopeId },
            { $inc: { usageCount: 1 } },
            { session },
          );
        }
      });
    } catch (txError) {
      // Clean up anything we already
      // uploaded to Cloudinary before the DB write, so we don't leak assets
      // that no product document ever ends up referencing.
      await Promise.all(
        uploadedPublicIdsForCleanup.map((publicId) =>
          UploadService.deleteImage(publicId).catch(() => {}),
        ),
      );

      throw new APIError({
        message: APIErrorKeys.internal,
        status: StatusCode.INTERNAL_ERROR,
      });
    }

    const publicIdsToDelete = [
      ...(mainImagePublicIdToDeleteAfterCommit
        ? [mainImagePublicIdToDeleteAfterCommit]
        : []),
      ...galleryPublicIdsToDeleteAfterCommit,
    ];

    if (publicIdsToDelete.length) {
      await Promise.all(
        publicIdsToDelete.map((publicId) =>
          UploadService.deleteImage(publicId),
        ),
      );
    }

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const bulkManageProductStatus: RequestHandler = async (req, res) => {
  try {
    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { productIds, status } = req.body;

    await ProductModel.updateMany(
      { _id: { $in: productIds }, userId: scopeId },
      { $set: { status } },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

const manageProductStock: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.body;

    const { scopeId } = RequestContext<{ scopeId: string }>(req);

    const { stockChange } = req.body;

    await ProductModel.updateOne(
      { _id: productId, userId: scopeId },
      { $inc: { quantity: Number(stockChange) } },
    );

    res.status(StatusCode.OK).send();
  } catch (e) {
    errorHandler(e, res);
  }
};

export {
  createProduct,
  getProducts,
  deleteProduct,
  deleteBulkProducts,
  updateProduct,
  bulkManageProductStatus,
  manageProductStock,
};
