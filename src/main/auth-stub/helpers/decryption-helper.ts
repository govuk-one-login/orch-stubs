import crypto from "crypto";
import { base64DecodeToUint8Array } from "./encoding";
import { getContentEncryptionKey } from "./key-helpers";
import { CodedError } from "../../helper/result-helper";

export const decrypt = async (
  encryptedJwe: string | undefined
): Promise<string> => {
  if (!encryptedJwe) {
    throw new CodedError(400, "Invalid JWE input: JWE must be defined");
  }

  if (typeof encryptedJwe !== "string") {
    throw new CodedError(400, "Invalid JWE input: JWE must be a string");
  }

  const jweComponents = encryptedJwe.split(".");

  if (jweComponents.length !== 5) {
    throw new CodedError(400, "Invalid JWE input: 5 component parts expected");
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
    throw new CodedError(
      400,
      `Error decrypting JWE ${error instanceof Error ? error.message : undefined}`
    );
  }
};

export const decryptPayloadUsingCek = async (
  contentEncryptionKeyData: Uint8Array,
  protectedHeader: string,
  iv: string,
  ciphertext: string,
  tag: string
): Promise<Uint8Array> => {
  const webcrypto = crypto.webcrypto;
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
