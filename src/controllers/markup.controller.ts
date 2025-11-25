import { Context } from "hono";
import { markupService } from "../services/markup.service";
import { SetMarkupDTO, MarkupListDTO } from "../dtos/markup.dto";
import { success, failure } from "../utils/apiResponse";

export const markupController = {
  async setMarkup(c: Context) {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = SetMarkupDTO.safeParse(body);
    if (!parsed.success) {
      return c.json(failure("Invalid input", "VALIDATION_ERROR"), 400);
    }

    const markup = await markupService.setMarkup(user.sub, parsed.data);
    return c.json(success(markup, "Markup set successfully"));
  },

  async getMarkup(c: Context) {
    const user = c.get("user");
    const productId = Number(c.req.param("productId"));
    if (!productId || isNaN(productId)) {
      return c.json(failure("Invalid product ID", "VALIDATION_ERROR"), 400);
    }

    const result = await markupService.getMarkup(user.sub, productId);
    return c.json(success(result));
  },

  async listMarkups(c: Context) {
    const user = c.get("user");
    const query = c.req.query();
    const parsed = MarkupListDTO.safeParse(query);
    if (!parsed.success) {
      return c.json(failure("Invalid query parameters", "VALIDATION_ERROR"), 400);
    }

    const result = await markupService.listMarkups(user.sub, parsed.data);
    return c.json(success(result));
  },

  async deleteMarkup(c: Context) {
    const user = c.get("user");
    const productId = Number(c.req.param("productId"));
    if (!productId || isNaN(productId)) {
      return c.json(failure("Invalid product ID", "VALIDATION_ERROR"), 400);
    }

    await markupService.deleteMarkup(user.sub, productId);
    return c.json(success(null, "Markup deleted successfully"));
  }
};

