import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { error } from "console";
import { v4 as uuid } from "uuid";

export interface Product {
  id: string;
  productName: string;
  code: string;
  price: number;
  model: string;
}

export class ProductRepository {
  private ddbClient: DocumentClient;
  private productsDdb: string;

  constructor(ddbClient: DocumentClient, productsDdb: string) {
    this.ddbClient = ddbClient;
    this.productsDdb = productsDdb;
  }

  async getAllProducts(): Promise<Product[]> {
    const data = await this.ddbClient
      .scan({
        TableName: this.productsDdb,
      })
      .promise();

    return data.Items as Product[];
  }

  async getProductById(productId: string): Promise<Product> {
    const data = await this.ddbClient
      .get({
        TableName: this.productsDdb,
        Key: {
          id: productId,
        },
      })
      .promise();

    if (!data.Item) {
      throw new Error(`Product id: ${productId} not found.`);
    }

    return data.Item as Product;
  }

  async createProduct(product: Product): Promise<Product> {
    product.id = uuid();

    console.log({
      prodctId: product.id,
      ddbClient: this.ddbClient,
      productDdb: this.productsDdb,
    });
    let productCreated;
    try {
      productCreated = await this.ddbClient
        .put({
          TableName: this.productsDdb,
          Item: product,
        })
        .promise();
    } catch (error) {
      console.log({ error });
    }
    console.log(
      `createProduct: ${product} and ${JSON.stringify(productCreated)}`
    );

    return product;
  }

  async deleteProduct(productId: string): Promise<Product> {
    const data = await this.ddbClient
      .delete({
        TableName: this.productsDdb,
        Key: {
          id: productId,
        },
        ReturnValues: "ALL_OLD",
      })
      .promise();

    if (!data.Attributes) {
      throw new Error(`Product id: ${productId} not found.`);
    }

    return data.Attributes as Product;
  }

  async updateProduct(productId: string, product: Product): Promise<Product> {
    const data = await this.ddbClient
      .update({
        TableName: this.productsDdb,
        Key: {
          id: productId,
        },
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "UPDATED_NEW",
        UpdateExpression:
          "set   productName = :n, code = :c, price = :p, model = :m",
        ExpressionAttributeValues: {
          ":n": product.productName,
          ":c": product.code,
          ":p": product.price,
          ":m": product.model,
        },
      })
      .promise();

    data.Attributes!.id = productId;
    return data.Attributes as Product;
    ("");
  }
}
