import { container } from "tsyringe";
import Redis from "ioredis";
import UserRepository from "../repositories/UserRepository";
import ProductRepository from "../repositories/ProductRepository";
import ResellerLinkRepository from "../repositories/ResellerLinkRepository";
import OrderRepository from "../repositories/OrderRepository";
import WalletTransactionRepository from "../repositories/WalletTransactionRepository";
import AuthService from "../services/AuthService";
import ProductService from "../services/ProductService";
import ResellerService from "../services/ResellerService";
import OrderService from "../services/OrderService";

export const createContainer = (opts: { redisClient?: Redis } = {}) => {
  if (opts.redisClient) container.registerInstance("RedisClient", opts.redisClient);

  container.register("IUserRepository", { useClass: UserRepository });
  container.register("IProductRepository", { useClass: ProductRepository });
  container.register("IResellerLinkRepository", { useClass: ResellerLinkRepository });
  container.register("IOrderRepository", { useClass: OrderRepository });
  container.register("IWalletTransactionRepository", { useClass: WalletTransactionRepository });

  container.register("IAuthService", { useClass: AuthService });
  container.register("IProductService", { useClass: ProductService });
  container.register("IResellerService", { useClass: ResellerService });
  container.register("IOrderService", { useClass: OrderService });
};
