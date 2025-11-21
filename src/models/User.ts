import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({
  name: String, email: { type: String, unique: true }, passwordHash: String, role: { type: String, default: "customer" }, walletBalance: { type: Number, default:0 }
},{ timestamps: true});
export default mongoose.models.User || mongoose.model("User", UserSchema);
