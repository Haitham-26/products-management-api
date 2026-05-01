import { GenericWithUserId } from "../../shared/dto/GenericWithUserId";
import { CreateUpdateOrderItem } from "../types/CreateUpdateOrderItem";

export interface UpdateOrderDto extends GenericWithUserId {
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  items?: CreateUpdateOrderItem[];
  note?: string;
}
