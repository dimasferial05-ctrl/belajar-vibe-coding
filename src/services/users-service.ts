import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class UserAlreadyExistsError extends Error {
  constructor(message = "Email sudah terdaftar") {
    super(message);
    this.name = "UserAlreadyExistsError";
  }
}

export async function registerUser(input: RegisterUserInput) {
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUsers.length > 0) {
    throw new UserAlreadyExistsError("Email sudah terdaftar");
  }

  const hashedPassword = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  await db.insert(users).values({
    name: input.name,
    email: input.email,
    password: hashedPassword,
  });

  return { data: "OK" };
}
