import { singleton } from "tsyringe";
import WalletTransaction from "../models/WalletTransaction";
@singleton()
export default class WalletTransactionRepository {
  create(data:any){ return WalletTransaction.create(data); }
}
