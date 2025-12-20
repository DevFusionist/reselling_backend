import { shareLinkRepo } from "../repositories/shareLink.repo";
import { productRepo } from "../repositories/product.repo";
import { CreateShareLinkInput } from "../dtos/shareLink.dto";

export const shareLinkService = {
  async createShareLink(creatorId: number, input: CreateShareLinkInput) {
    // Verify product exists
    const productResult = await productRepo.findById(input.product_id);
    if (!productResult) {
      throw { status: 404, message: "Product not found", code: "NOT_FOUND" };
    }

    // Handle both old format (direct product) and new format (product with images)
    const product = (productResult as any).product || productResult;

    const link = await shareLinkRepo.create(creatorId, input);
    
    const basePrice = Number(product.base_price);
    const marginAmount = Number(link.margin_amount);
    const finalPrice = basePrice + marginAmount;

    return {
      ...link,
      product,
      base_price: basePrice,
      margin_amount: marginAmount,
      final_price: finalPrice,
      share_url: `/share/${link.code}`
    };
  },

  async getShareLinkByCode(code: string) {
    const result = await shareLinkRepo.findByCode(code);
    if (!result) {
      throw { status: 404, message: "Share link not found or expired", code: "NOT_FOUND" };
    }

    // Repository already returns the transformed data with calculated final price
    // product.base_price already contains the final price (base_price + margin)
    return result;
  },

  async listShareLinks(creatorId: number) {
    const links = await shareLinkRepo.findByCreator(creatorId);
    
    return links.map((link: any) => {
      const basePrice = Number(link.product.base_price);
      const marginAmount = Number(link.margin_amount);
      return {
        ...link,
        base_price: basePrice,
        margin_amount: marginAmount,
        final_price: basePrice + marginAmount,
        share_url: `/share/${link.code}`
      };
    });
  },

  async deleteShareLink(code: string, creatorId: number) {
    const link = await shareLinkRepo.findByCode(code);
    if (!link || (link as any).creator_id !== creatorId) {
      throw { status: 404, message: "Share link not found", code: "NOT_FOUND" };
    }
    await shareLinkRepo.delete(code, creatorId);
  }
};

