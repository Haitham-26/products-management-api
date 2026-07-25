export interface CreateReturnDto {
  orderId: string;
  returnReason: string;
  items: {
    productId: string;
    /**
     * The total quantity of returned items including the restocked quantity
     */
    returnedQuantity: number;
    restockedQuantity: number;
  }[];
}
