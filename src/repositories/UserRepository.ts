import { singleton } from "tsyringe";
import User from "../models/User";
@singleton()
export default class UserRepository {
  create(data:any){ return User.create(data); }
  findByEmail(email:string){ return User.findOne({ email }); }
  findById(id:string){ return User.findById(id); }
  save(user:any){ return user.save(); }
}
