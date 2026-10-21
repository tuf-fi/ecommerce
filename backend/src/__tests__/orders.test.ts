import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { customerActor, staffActor } from "../services/audit.service";
import { changeOrderStatus, createOrder } from "../services/orders.service";

const run = randomUUID().slice(0, 8);
let staff: { id: number; name: string };
const customers: { id: number; name: string; email: string }[] = [];
const productIds: number[] = [];
const voucherCodes: string[] = [];

async function newCustomer() {
  const c = await prisma.customer.create({ data: { email: `t-${run}-${customers.length}@test.dev`, name: `Tester ${customers.length}`, passwordHash: "x" } });
  customers.push(c);
  return c;
}

async function newProduct(stock: number, price = 100) {
  const p = await prisma.product.create({ data: { sku: `T-${run}-${productIds.length}`, name: `Test product ${productIds.length}`, category: "Test", price, stock } });
  productIds.push(p.id);
  return p;
}

function place(customer: { id: number; name: string; email: string }, productId: number, qty = 1, voucherCode?: string) {
  return createOrder({
    actor: customerActor(customer),
    customerId: customer.id,
    lines: [{ productId, qty }],
    shipName: customer.name,
    shipEmail: customer.email,
    shipPhone: "09171234567",
    shipAddress: "1 Test St, Makati City, Metro Manila",
    customerEmail: customer.email,
    voucherCode,
  });
}

const stockOf = async (id: number) => (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;

before(async () => {
  staff = await prisma.staffMember.create({ data: { email: `staff-${run}@test.dev`, name: "Test Staff", passwordHash: "x", role: "ADMINISTRATOR" } });
});

// Rows are left behind on purpose: order history is append-only, and every run uses its own unique names in the throwaway test database.
after(async () => {
  await prisma.$disconnect();
});

describe("stock", () => {
  it("never oversells when orders arrive at the same moment", async () => {
    const product = await newProduct(3);
    const buyers = [];
    for (let i = 0; i < 5; i++) buyers.push(await newCustomer());
    const results = await Promise.allSettled(buyers.map((b) => place(b, product.id)));
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 3);
    assert.equal(await stockOf(product.id), 0);
  });

  it("puts the units back when an unpaid order is cancelled", async () => {
    const product = await newProduct(5);
    const buyer = await newCustomer();
    const order = await place(buyer, product.id, 2);
    assert.equal(await stockOf(product.id), 3);
    await changeOrderStatus(order.number, "CANCELLED", customerActor(buyer));
    assert.equal(await stockOf(product.id), 5);
  });

  it("does not return stock twice if the same cancel runs twice", async () => {
    const product = await newProduct(5);
    const buyer = await newCustomer();
    const order = await place(buyer, product.id, 1);
    const results = await Promise.allSettled([
      changeOrderStatus(order.number, "CANCELLED", staffActor(staff)),
      changeOrderStatus(order.number, "CANCELLED", staffActor(staff)),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(await stockOf(product.id), 5);
  });
});

describe("order status", () => {
  it("refuses a move that skips steps", async () => {
    const product = await newProduct(2);
    const buyer = await newCustomer();
    const order = await place(buyer, product.id);
    await assert.rejects(changeOrderStatus(order.number, "DELIVERED", staffActor(staff)), { status: 409 });
  });

  it("lets a customer cancel only their own order", async () => {
    const product = await newProduct(2);
    const owner = await newCustomer();
    const other = await newCustomer();
    const order = await place(owner, product.id);
    await assert.rejects(changeOrderStatus(order.number, "CANCELLED", customerActor(other)), { status: 404 });
  });
});

describe("discount codes", () => {
  async function newVoucher(maxUses: number | null) {
    const code = `T${run}${voucherCodes.length}`.toUpperCase();
    voucherCodes.push(code);
    await prisma.voucher.create({ data: { code, description: "test", percentOff: 10, maxUses } });
    return code;
  }
  const usesOf = async (code: string) => (await prisma.voucher.findUniqueOrThrow({ where: { code } })).uses;

  it("takes 10% off and lets a customer use a code only once", async () => {
    const product = await newProduct(5, 1000);
    const buyer = await newCustomer();
    const code = await newVoucher(null);
    const order = await place(buyer, product.id, 1, code);
    assert.equal(order.discount, 100);
    assert.equal(order.total, 900);
    await assert.rejects(place(buyer, product.id, 1, code), { status: 400 });
  });

  it("lets only one of two simultaneous orders win a single-use code", async () => {
    const product = await newProduct(5);
    const a = await newCustomer();
    const b = await newCustomer();
    const code = await newVoucher(1);
    const results = await Promise.allSettled([place(a, product.id, 1, code), place(b, product.id, 1, code)]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(await usesOf(code), 1);
  });

  it("does not spend the code when the order fails for lack of stock", async () => {
    const product = await newProduct(1);
    const buyer = await newCustomer();
    const code = await newVoucher(1);
    await assert.rejects(place(buyer, product.id, 2, code), { status: 409 });
    assert.equal(await usesOf(code), 0);
    assert.equal(await stockOf(product.id), 1);
  });

  it("gives the code back when the unpaid order is cancelled", async () => {
    const product = await newProduct(5);
    const a = await newCustomer();
    const b = await newCustomer();
    const code = await newVoucher(1);
    const order = await place(a, product.id, 1, code);
    await changeOrderStatus(order.number, "CANCELLED", customerActor(a));
    assert.equal(await usesOf(code), 0);
    const second = await place(b, product.id, 1, code);
    assert.equal(second.voucherCode, code);
  });
});
