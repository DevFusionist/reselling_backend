import { inject, injectable } from "tsyringe";
import ProductRepository from "../repositories/ProductRepository";
@injectable()
export default class ProductService {
  constructor(@inject("IProductRepository") private repo: any){}
  create(d:any){ return this.repo.create(d); }
  list(q?:string, limit=20){ const f:any={}; if(q) f.title = { $regex:q,$options:"i"}; return this.repo.find(f,limit); }
  getById(id:string){ return this.repo.findById(id); }
}
