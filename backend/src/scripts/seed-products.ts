import "dotenv/config";
import { prisma } from "../lib/prisma";
import seed from "../../prisma/seed-products.json";

// Loads the sample catalogue (names, descriptions, prices, images). Starts with no ratings or reviews, since those must come from real customers.
// Idempotent: products that already exist (by id) are left untouched, so re-running never resets live stock.
// Run: npm run seed-products
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  let created = 0;
  for (const p of seed) {
    if (await prisma.product.findUnique({ where: { id: p.id } })) continue;
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          id: p.id,
          sku: `LM-${String(p.id).padStart(4, "0")}`,
          name: p.title,
          category: p.category,
          description: p.desc,
          price: p.sizes.length ? Math.min(...p.sizes.map((s) => s.price)) : p.price,
          stock: p.stock,
          expiry: p.expiry ? new Date(p.expiry) : null,
          image: `/products/${slug(p.imageKey)}.jpg`,
          concerns: p.concerns,
          rating: 0,
          ratingCount: 0,
          sizes: { create: p.sizes.map((s) => ({ label: s.label, price: s.price, stock: s.stock })) },
        },
        include: { sizes: true },
      });
      const opening = product.sizes.length
        ? product.sizes.map((s) => ({ sizeId: s.id, quantity: s.stock }))
        : [{ sizeId: null, quantity: product.stock }];
      await tx.stockMovement.createMany({
        data: opening
          .filter((o) => o.quantity > 0)
          .map((o) => ({ productId: product.id, sizeId: o.sizeId, quantity: o.quantity, reason: "IMPORT" as const, note: "Opening stock" })),
      });
    });
    created++;
  }
  // Explicit ids were inserted, so move the serial past them or the next create collides.
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Product"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "Product"))`);
  console.log(`Seeded ${created} new product(s); ${seed.length - created} already existed.`);
}

main().finally(() => prisma.$disconnect());
