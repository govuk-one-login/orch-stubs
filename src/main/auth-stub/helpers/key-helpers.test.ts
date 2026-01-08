import { generateKeyPairSync, publicEncrypt } from "crypto";
import { getContentEncryptionKey } from "./key-helpers";
import { RSA_PKCS1_OAEP_PADDING } from "constants";

const cekValue = "test";
const kmsKeyId = "test-key-id";

const mockKmsDecrypt = jest.fn().mockImplementation((_DecryptCommandInput) => {
  return Promise.resolve({ Plaintext: cekValue });
});
jest.mock("@aws-sdk/client-kms", () => ({
  ...jest.requireActual("@aws-sdk/client-kms"),
  KMS: jest.fn().mockImplementation(() => {
    return { decrypt: mockKmsDecrypt };
  }),
}));

describe("Key helpers tests", () => {
  let encryptedKey: string;

  beforeEach(() => {
    process.env["AWS_REGION"] = "eu-west-2";
    process.env["ENCRYPTION_KEY_ID"] = kmsKeyId;
    encryptedKey = "test-enc-value";
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("should decrypt CEK using KMS when ENVIRONMENT is not local", async () => {
    process.env["ENVIRONMENT"] = "dev";

    const decryptedKey = await getContentEncryptionKey(
      base64Encode(encryptedKey)
    );

    expect(mockKmsDecrypt).toHaveBeenCalledWith({
      CiphertextBlob: new Uint8Array(Buffer.from(encryptedKey, "utf-8")),
      EncryptionAlgorithm: "RSAES_OAEP_SHA_256",
      KeyId: kmsKeyId,
    });
    expect(decryptedKey).toBe(cekValue);
  });

  it("should not use KMS to decrypt CEK when ENVIRONMENT is local", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });
    const encryptedCek = publicEncrypt(
      {
        key: publicKey,
        padding: RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(cekValue, "utf-8")
    );
    process.env["ENVIRONMENT"] = "local";
    process.env["LOCAL_AUTH_AUTHORIZE_PRIVATE_ENCRYPTION_KEY"] = privateKey;

    const decryptedKey = await getContentEncryptionKey(
      encryptedCek.toString("base64")
    );

    expect(mockKmsDecrypt).not.toHaveBeenCalled();
    expect(decryptedKey.toString()).toBe(cekValue);
  });

  function base64Encode(value: string): string {
    const rawData = Buffer.from(value, "utf-8");
    return rawData.toString("base64");
  }
});
