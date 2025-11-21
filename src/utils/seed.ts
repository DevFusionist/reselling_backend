import Product from "../models/Product";
import User from "../models/User";
import bcrypt from "bcrypt";
export const seed = async ()=> {
  const c = await Product.countDocuments();
  if (c===0) {
    await Product.create([{ title:"Trendy Phone Case", basePrice:200, stock:100 },{ title:"Earbuds", basePrice:600, stock:50 }]);
    console.log("seeded products");
  }
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const u = await User.findOne({ email: adminEmail });
    if (!u) {
      const hash = await bcrypt.hash(adminPassword,10);
      await User.create({ name:"Admin", email: adminEmail, passwordHash: hash, role:"admin" });
      console.log("seeded admin");
    }
  }
};
