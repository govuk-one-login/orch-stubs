import * as crypto from "crypto";
import {
  DecryptCommandInput,
  DecryptCommandOutput,
  EncryptionAlgorithmSpec,
  KMS,
} from "@aws-sdk/client-kms";
import { getAwsRegion, getKmsKeyId } from "./config";
import { DecryptionError } from "./errors";
import { base64DecodeToUint8Array } from "./encoding";

const kmsClient = new KMS({
  region: getAwsRegion(),
});
const encryptionAlgorithm = EncryptionAlgorithmSpec.RSAES_OAEP_SHA_256;
const kmsKeyId = getKmsKeyId();

export const decrypt = async (encryptedJwe?: string): Promise<string> => {
  if (!encryptedJwe) {
    throw new DecryptionError("Invalid JWE input: JWE must be defined");
  }

  if (typeof encryptedJwe !== "string") {
    throw new DecryptionError("Invalid JWE input: JWE must be a string");
  }

  const jweComponents = encryptedJwe.split(".");

  if (jweComponents.length !== 5) {
    throw new DecryptionError("Invalid JWE input: 5 component parts expected");
  }

  try {
    const [protectedHeader, encryptedKey, iv, ciphertext, tag] = jweComponents;

    const contentEncryptionKey: Uint8Array =
      await getContentEncryptionKey(encryptedKey);
    const decryptedPayload: Uint8Array = await decryptPayloadUsingCek(
      contentEncryptionKey,
      protectedHeader,
      iv,
      ciphertext,
      tag
    );
    return new TextDecoder().decode(decryptedPayload);
  } catch (error) {
    throw new DecryptionError(
      "Error decrypting JWE",
      error instanceof Error ? error : undefined
    );
  }
};

const getContentEncryptionKey = async (
  encryptedKey: string
): Promise<Uint8Array> => {
  const inputs: DecryptCommandInput = {
    CiphertextBlob: base64DecodeToUint8Array(encryptedKey),
    EncryptionAlgorithm: encryptionAlgorithm,
    KeyId: kmsKeyId,
  };

  const decryptResponse: DecryptCommandOutput = await kmsClient.decrypt(inputs);
  return decryptResponse.Plaintext!;
};

const decryptPayloadUsingCek = async (
  contentEncryptionKeyData: Uint8Array,
  protectedHeader: string,
  iv: string,
  ciphertext: string,
  tag: string
): Promise<Uint8Array> => {
  const webcrypto = crypto.webcrypto as unknown as Crypto;
  const cryptoKey = await webcrypto.subtle.importKey(
    "raw",
    contentEncryptionKeyData,
    "AES-GCM",
    false,
    ["decrypt"]
  );
  const decryptedBuffer = await webcrypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64DecodeToUint8Array(iv),
      additionalData: new Uint8Array(Buffer.from(protectedHeader)),
      tagLength: 128,
    },
    cryptoKey,
    Buffer.concat([
      new Uint8Array(base64DecodeToUint8Array(ciphertext)),
      new Uint8Array(base64DecodeToUint8Array(tag)),
    ])
  );

  return new Uint8Array(decryptedBuffer);
};
