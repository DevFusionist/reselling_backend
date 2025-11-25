import { markupRepo } from "../repositories/markup.repo";
import { productRepo } from "../repositories/product.repo";
import { SetMarkupInput, MarkupListInput } from "../dtos/markup.dto";

export const markupService = {
  async setMarkup(resellerId: number, input: SetMarkupInput) {
    // Verify product exists
    const product = await productRepo.findById(input.product_id);
    if (!product) {
      throw { status: 404, message: "Product not found", code: "NOT_FOUND" };
    }

    return await markupRepo.createOrUpdate(resellerId, input);
  },

  async getMarkup(resellerId: number, productId: number) {
    const markup = await markupRepo.findByResellerAndProduct(resellerId, productId);
    if (!markup) {
      throw { status: 404, message: "Markup not found", code: "NOT_FOUND" };
    }

    const product = await productRepo.findById(productId);
    if (!product) {
      throw { status: 404, message: "Product not found", code: "NOT_FOUND" };
    }

    const basePrice = Number(product.base_price);
    const markupAmount = Number(markup.markup_amount);
    const finalPrice = basePrice + markupAmount;

    return {
      ...markup,
      product,
      base_price: basePrice,
      markup_amount: markupAmount,
      final_price: finalPrice
    };
  },

  async listMarkups(resellerId: number, input: MarkupListInput) {
    const result = await markupRepo.listByReseller(resellerId, input);
    
    // Calculate final prices for each markup
    const markupsWithPrices = result.markups.map((m: any) => {
      const basePrice = Number(m.product.base_price);
      const markupAmount = Number(m.markup_amount);
      return {
        ...m,
        base_price: basePrice,
        markup_amount: markupAmount,
        final_price: basePrice + markupAmount
      };
    });

    return {
      ...result,
      markups: markupsWithPrices
    };
  },

  async deleteMarkup(resellerId: number, productId: number) {
    const markup = await markupRepo.findByResellerAndProduct(resellerId, productId);
    if (!markup) {
      throw { status: 404, message: "Markup not found", code: "NOT_FOUND" };
    }
    await markupRepo.delete(resellerId, productId);
  }
};

