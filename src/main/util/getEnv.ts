export const getEnv = (name: string): string => {
  if (!process.env[name]) {
    throw new Error("Unset environment variable: " + name);
  }

  return process.env[name];
};
