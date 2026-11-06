/**
 * Creates (or resets the password of) the admin login user. Safe to re-run —
 * it upserts by email rather than wiping the users collection.
 * Run with `npm run seed:admin`.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { connectDB } from "@/backend/config/db";
import { User } from "@/backend/models/User";
import { hashPassword } from "@/backend/utils/password";

const ADMIN_EMAIL = "admin2026@gmail.com";
const ADMIN_PASSWORD = "admin@2026";

async function main() {
  await connectDB();

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { email: ADMIN_EMAIL, passwordHash },
    { upsert: true, returnDocument: "after" }
  );

  console.log(`Admin user ready: ${ADMIN_EMAIL}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
