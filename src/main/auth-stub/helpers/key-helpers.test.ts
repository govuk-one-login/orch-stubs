import * as jose from "jose";
import { generateKeyPairSync, publicEncrypt } from "crypto";
import { getAuthJwks, getContentEncryptionKey } from "./key-helpers.ts";
import { RSA_PKCS1_OAEP_PADDING } from "constants";
import localParams from "../../../../parameters.json" with { type: "json" };
import { createRemoteJWKSet } from "jose";

vi.mock("@aws-sdk/client-kms", async (importActual) => {
  const actual = await importActual<typeof import("@aws-sdk/client-kms")>();

  return {
    ...actual,
    KMS: vi.fn().mockImplementation(function () {
      return { decrypt: mockKmsDecrypt };
    }),
  };
});

vi.mock(import("jose"), async (importActual) => {
  const actual = await importActual<typeof import("jose")>();
  return {
    ...actual,
    createRemoteJWKSet: vi.fn(),
  };
});

const cekValue = "test";
const kmsKeyId = "test-key-id";

const mockKmsDecrypt = vi.fn().mockResolvedValue({ Plaintext: cekValue });

describe("Key helpers tests", () => {
  let encryptedKey: string;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AWS_REGION = "eu-west-2";
    process.env.ENCRYPTION_KEY_ID = kmsKeyId;
    encryptedKey = "test-enc-value";
  });

  it("should decrypt CEK using KMS when ENVIRONMENT is not local", async () => {
    process.env.ENVIRONMENT = "dev";

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
    process.env.ENVIRONMENT = "local";
    process.env.LOCAL_AUTH_AUTHORIZE_PRIVATE_ENCRYPTION_KEY = privateKey;

    const decryptedKey = await getContentEncryptionKey(
      encryptedCek.toString("base64")
    );

    expect(mockKmsDecrypt).not.toHaveBeenCalled();
    expect(decryptedKey.toString()).toBe(cekValue);
  });

  describe("get auth JWKS tests", () => {
    beforeEach(() => {
      process.env.DUMMY_JWKS = "";
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should use dummy JWKS data if present", () => {
      const localJwkSetSpy = vi.spyOn(jose, "createLocalJWKSet");
      process.env.DUMMY_JWKS = localParams.Parameters.DUMMY_JWKS;
      getAuthJwks();

      expect(localJwkSetSpy).toHaveBeenCalledWith(
        JSON.parse(localParams.Parameters.DUMMY_JWKS)
      );
    });

    it("should use JWKS URL if dummy data not present", () => {
      const mockedCreateRemoteJWKSet = vi.mocked(createRemoteJWKSet);
      process.env.AUTH_JWKS_URL =
        "http://test.example.com/.well-known/jwks.json";
      getAuthJwks();

      expect(mockedCreateRemoteJWKSet).toHaveBeenCalledWith(
        new URL("http://test.example.com/.well-known/jwks.json"),
        {
          timeoutDuration: 10 * 1000,
        }
      );
    });
  });

  function base64Encode(value: string): string {
    const rawData = Buffer.from(value, "utf-8");
    return rawData.toString("base64");
  }
});
