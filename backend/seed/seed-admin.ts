/**
 * Creates (or resets the password of) the admin and accountant login users. Safe to re-run —
 * it upserts by email rather than wiping the users collection.
 * Run with `npm run seed:admin`.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { connectDB } from "@/backend/config/db";
import { User } from "@/backend/models/User";
import { hashPassword } from "@/backend/utils/password";

const USERS = [
  { email: "admin2026@gmail.com", password: "admin@2026", role: "admin" },
  // Accountant: everything except the Dashboard.
  { email: "accountant2026@gmail.com", password: "accountant@2026", role: "accountant" },
] as const;

async function main() {
  await connectDB();

  for (const { email, password, role } of USERS) {
    const passwordHash = await hashPassword(password);
    await User.findOneAndUpdate(
      { email },
      { email, passwordHash, role },
      { upsert: true, returnDocument: "after" }
    );
    console.log(`${role} user ready: ${email}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
