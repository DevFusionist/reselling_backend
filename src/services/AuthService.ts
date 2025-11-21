import { inject, injectable } from "tsyringe";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

@injectable()
export default class AuthService {
  constructor(@inject("IUserRepository") private userRepo: any){}
  async register(name:string,email:string,password:string,role="customer"){
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new Error("Email exists");
    const hash = await bcrypt.hash(password,10);
    const user = await this.userRepo.create({ name,email,passwordHash:hash,role });
    const secret: string = process.env.JWT_SECRET || "secret";
    const token = jwt.sign({ id: String(user._id) }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as SignOptions);
    return { user, token };
  }
  async login(email:string,password:string){
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error("Invalid");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid");
    const secret: string = process.env.JWT_SECRET || "secret";
    const token = jwt.sign({ id: String(user._id) }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as SignOptions);
    return { user, token };
  }
}
