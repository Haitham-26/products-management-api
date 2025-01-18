import Product from "../models/Product.model";
import express from "express";
import { CreateProductDto } from "../types/product/CreateProductDto";
import { UpdateProductDto } from "../types/product/UpdateProductDto";

//Create a product
const createProduct = async (req: express.Request, res: express.Response) => {
  const { name, price, description, quantity } = req.body as CreateProductDto;

  try {
    await Product.create({
      name,
      price,
      description,
      quantity,
    });

    res.status(200).send("Product created successfully");
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: e.message });
  }
};

//Delete a product
const deleteProduct = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    await Product.findByIdAndDelete(id);

    res.status(200).send("Product deleted successfully");
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};

//Get a product by ID
const getProductByID = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const productByID = await Product.findById(id);

    if (!productByID) {
      res.status(404).send(`Could not find product with id ${id}`);
      return;
    }

    res.status(200).send(productByID);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};

//Update a product
const updateProduct = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).send("Product not found");
      return;
    }

    await Product.findByIdAndUpdate(id, req.body as UpdateProductDto);

    res.status(200).send("Product updated successfully");
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};

//Get all products
const getAllProducts = async (req: express.Request, res: express.Response) => {
  try {
    const products = await Product.find({});

    res.status(200).send(products);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
};

export {
  createProduct,
  deleteProduct,
  getProductByID,
  updateProduct,
  getAllProducts,
};
