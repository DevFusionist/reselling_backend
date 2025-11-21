import { inject, injectable } from "tsyringe";
import ResellerLinkRepository from "../repositories/ResellerLinkRepository";
import { customAlphabet } from "nanoid";
const nano = customAlphabet("0123456789abcdef",12);
@injectable()
export default class ResellerService {
  constructor(@inject("IResellerLinkRepository") private rlRepo: any){}
  async generateLink(productId:string,resellerId:string,margin:number){
    const token = nano();
    return this.rlRepo.create({ productId,resellerId,margin,token });
  }
  validateToken(token:string){ return this.rlRepo.findByToken(token); }
  getLinks(id:string){ return this.rlRepo.findByReseller(id); }
}
