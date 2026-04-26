import bcrypt from "bcryptjs";

const PASSWORD_SALT_ROUNDS = 12;

export const hashPassword = (password: string) => {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
};

export const verifyPassword = (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};
