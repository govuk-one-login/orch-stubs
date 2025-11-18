import { logger } from "../../../main/logger.ts";
import { getEnv } from "./env-helper.ts";
import {
  DecryptCommandInput,
  DecryptCommandOutput,
  EncryptionAlgorithmSpec,
  KMS,
} from "@aws-sdk/client-kms";
import { base64DecodeToUint8Array } from "./encoding.ts";
import { getAwsRegion, getKmsKeyId } from "./config.ts";

export const getContentEncryptionKey = async (
  encryptedKey: string
): Promise<Uint8Array> => {
  const localEncryptionKey = getEnv("DUMMY_ENCRYPTION_PUBLIC_KEY", false);
  if (localEncryptionKey) {
    logger.info(
      "Found DUMMY_ENCRYPTION_PUBLIC_KEY env variable. Using value as encryption key source"
    );
    const localEncryptionKeyArray: Uint8Array = JSON.parse(localEncryptionKey);
    return Promise.resolve(localEncryptionKeyArray);
  } else {
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

    const decryptResponse: DecryptCommandOutput =
      await kmsClient.decrypt(inputs);
    return decryptResponse.Plaintext!;
  }
};

export const getAuthPublicKey = (): string => {
  return getEnv("AUTH_AUTHORIZE_PUBLIC_ENCRYPTION_KEY");
};
