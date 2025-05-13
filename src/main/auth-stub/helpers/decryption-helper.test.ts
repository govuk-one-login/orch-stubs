import { decrypt } from "./decryption-helper";

describe("KMS decryption service", () => {
  it("should throw a DecryptionError with error detail when an invalid JWE is input (undefined)", async () => {
    const action = async () => await decrypt(undefined);
    await expect(action()).rejects.toThrow(
      "Invalid JWE input: JWE must be defined"
    );
  });

  it("should throw a DecryptionError with error detail when an invalid JWE is input (number)", async () => {
    const action = async () => await decrypt(5 as unknown as string);
    await expect(action()).rejects.toThrow(
      "Invalid JWE input: JWE must be a string"
    );
  });

  it("should throw a DecryptionError with error detail when an invalid JWE is input (too short)", async () => {
    const action = async () => await decrypt("a.b.c");
    await expect(action()).rejects.toThrow(
      "Invalid JWE input: 5 component parts expected"
    );
  });
});
