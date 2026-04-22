import { GenericWithUserId } from "../../shared/dto/GenericWithUserId";
import { CreateUpdateOrderItem } from "../types/CreateUpdateOrderItem";

export interface CreateOrderDto extends GenericWithUserId {
  items: CreateUpdateOrderItem[];
  note?: string;
}
