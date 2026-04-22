import { GenericWithUserId } from "../../shared/dto/GenericWithUserId";
import { CreateUpdateOrderItem } from "../types/CreateUpdateOrderItem";

export interface UpdateOrderDto extends GenericWithUserId {
  orderId: string;
  items?: CreateUpdateOrderItem[];
  note?: string;
}
