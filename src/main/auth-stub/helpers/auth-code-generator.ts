import { getRandomValues } from "crypto";

export const generateAuthCode = (): string => {
  const bytes = new Uint8Array(32);
  getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64");
};
