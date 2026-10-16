import "dotenv/config";

// Integration tests run against their own database, never the real one: the name must end in _test.
const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL?.replace(/\/([^/?]+)(\?|$)/, "/$1_test$2");
if (!base) throw new Error("DATABASE_URL is not set");
const dbName = new URL(base).pathname.slice(1);
if (!dbName.endsWith("_test")) throw new Error(`Refusing to run tests against "${dbName}": the test database name must end in _test`);
process.env.DATABASE_URL = base;
process.env.JWT_SECRET ??= "test-secret-value";
