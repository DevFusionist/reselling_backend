import { singleton } from "tsyringe";
import Product from "../models/Product";
@singleton()
export default class ProductRepository {
  create(data:any){ return Product.create(data); }
  findById(id:string){ return Product.findById(id); }
  find(filter:any={}, limit=20){ return Product.find(filter).limit(limit); }
}
