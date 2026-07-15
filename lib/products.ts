// Source of truth for pricing. The client cart sends item NAMES only for
// pricing purposes — /api/checkout looks up the real price here and ignores
// whatever price the client sent. (site-security rule #1: prices live on
// the server.) Keyed by exact product name as used in addToCart() calls.

export const PRODUCTS: Record<string, { cents: number; category: string }> = {
  // Specialty soaps — $55
  "Elizabeth's Power": { cents: 5500, category: "Specialty Soap" },
  "Alma's Grace": { cents: 5500, category: "Specialty Soap" },
  "Jamaican Ruby": { cents: 5500, category: "Specialty Soap" },
  "Alice's Way": { cents: 5500, category: "Specialty Soap" },
  "Y-Rose (Eczema)": { cents: 5500, category: "Specialty Soap" },

  // Body butters — $30
  "Elizabeth's Power Body Butter": { cents: 3000, category: "Body Butter" },
  "Alma's Grace Body Butter": { cents: 3000, category: "Body Butter" },
  "Jamaican Ruby Body Butter": { cents: 3000, category: "Body Butter" },
  "Alice's Way Body Butter": { cents: 3000, category: "Body Butter" },
  "Y-Rose Body Butter": { cents: 3000, category: "Body Butter" },

  // Regular soaps — $25
  Eucalyptus: { cents: 2500, category: "Regular Soap" },
  Peppermint: { cents: 2500, category: "Regular Soap" },
  "Tea Tree": { cents: 2500, category: "Regular Soap" },
  Lavender: { cents: 2500, category: "Regular Soap" },
  Chamomile: { cents: 2500, category: "Regular Soap" },
  Lemongrass: { cents: 2500, category: "Regular Soap" },
  "Frankincense & Myrrh": { cents: 2500, category: "Regular Soap" },
  "Oatmeal / Milk & Honey": { cents: 2500, category: "Regular Soap" },
  "Goat Milk": { cents: 2500, category: "Regular Soap" },
  Coconut: { cents: 2500, category: "Regular Soap" },
};

export type CartInput = { name: string; qty: number };

// Validates a client-submitted cart against the real catalog and returns
// server-computed line items + total. Throws on any unknown product name.
export function priceCart(cart: CartInput[]) {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error("Cart is empty");
  }
  let amountCents = 0;
  const lineItems = cart.map((item) => {
    const product = PRODUCTS[item.name];
    if (!product) throw new Error(`Unknown product: ${item.name}`);
    const qty = Math.max(1, Math.min(50, Math.floor(item.qty)));
    amountCents += product.cents * qty;
    return {
      name: item.name,
      price: product.cents / 100,
      qty,
    };
  });
  return { lineItems, amountCents };
}
