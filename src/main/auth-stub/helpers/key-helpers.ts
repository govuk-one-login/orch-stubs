import { getEnv } from "./env-helper";
import {
  DecryptCommandInput,
  DecryptCommandOutput,
  EncryptionAlgorithmSpec,
  KMS,
} from "@aws-sdk/client-kms";
import { base64DecodeToUint8Array } from "./encoding";
import { getAwsRegion, getKmsKeyId } from "./config";
import { logger } from "../..//logger";
import { CodedError } from "../../helper/result-helper";
import {
  createPrivateKey,
  privateDecrypt,
  constants,
  KeyObject,
} from "node:crypto";

export const getContentEncryptionKey = async (
  encryptedKey: string
): Promise<Uint8Array<ArrayBufferLike>> => {
  const environment = getEnv("ENVIRONMENT");
  if (environment === "local") {
    return await decryptUsingLocalPrivateKey(encryptedKey);
  } else {
    return await decryptUsingKms(encryptedKey);
  }
};

export const getAuthPublicSigningKey = (): string => {
  return getEnv("AUTH_AUTHORIZE_PUBLIC_SIGNING_KEY");
};

export const getAuthJwksUrl = (): string => {
  return getEnv("AUTH_JWKS_URL");
};

async function decryptUsingLocalPrivateKey(encryptedKey: string) {
  const authEncryptionPrivateKey = await getAuthPrivateEncryptionKey();
  const cekBuffer = decryptData(
    base64DecodeToUint8Array(encryptedKey),
    authEncryptionPrivateKey
  );
  return cekBuffer;
}

const getAuthPrivateEncryptionKey = async (): Promise<KeyObject> => {
  const authPrivateKeyPem = getEnv(
    "LOCAL_AUTH_AUTHORIZE_PRIVATE_ENCRYPTION_KEY"
  );

  try {
    return createPrivateKey({
      key: authPrivateKeyPem,
      format: "pem",
      type: "pkcs8",
    });
  } catch (error) {
    logger.error(
      "Failed to parse Auth private encryption key: " + (error as Error).message
    );
    throw new CodedError(500, "Internal Server Error");
  }
};

function decryptData(
  encryptedBuffer: Uint8Array,
  privateKey: KeyObject
): Uint8Array {
  const decryptedData = privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedBuffer
  );

  return decryptedData;
}

async function decryptUsingKms(encryptedKey: string) {
  const kmsClient = new KMS({
    region: getAwsRegion(),
  });

  const encryptionAlgorithm = EncryptionAlgorithmSpec.RSAES_OAEP_SHA_256;
  const kmsKeyId = getKmsKeyId();
  const inputs: DecryptCommandInput = {
    CiphertextBlob: base64DecodeToUint8Array(encryptedKey),
    EncryptionAlgorithm: encryptionAlgorithm,
    KeyId: kmsKeyId,
  };

  const decryptResponse: DecryptCommandOutput = await kmsClient.decrypt(inputs);
  return decryptResponse.Plaintext!;
}
