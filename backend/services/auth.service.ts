import { connectDB } from "@/backend/config/db";
import { User } from "@/backend/models/User";
import { verifyPassword } from "@/backend/utils/password";
import { signAuthToken } from "@/backend/utils/jwt";
import { ApiError } from "@/backend/utils/ApiError";

export interface LoginInput {
  email: string;
  password: string;
}

export async function login({ email, password }: LoginInput) {
  await connectDB();

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user) throw new ApiError(401, "Invalid email or password");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password");

  const token = signAuthToken({ sub: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}
