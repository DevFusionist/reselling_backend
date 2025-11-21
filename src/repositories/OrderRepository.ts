import { singleton } from "tsyringe";
import Order from "../models/Order";
@singleton()
export default class OrderRepository {
  create(data:any){ return Order.create(data); }
  findById(id:string){ return Order.findById(id); }
  update(id:string,data:any){ return Order.findByIdAndUpdate(id,data,{ new:true }); }
}
