import { GenericWithUserId } from "../../shared/dto/GenericWithUserId";
import { CreateUpdateOrderItem } from "../types/CreateUpdateOrderItem";

export interface CreateOrderDto extends GenericWithUserId {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: CreateUpdateOrderItem[];
  note?: string;
}
