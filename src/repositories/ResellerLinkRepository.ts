import { singleton } from "tsyringe";
import ResellerLink from "../models/ResellerLink";
@singleton()
export default class ResellerLinkRepository {
  create(data:any){ return ResellerLink.create(data); }
  findByToken(token:string){ return ResellerLink.findOne({ token }); }
  findByReseller(resellerId:string){ return ResellerLink.find({ resellerId }).populate('productId'); }
}
