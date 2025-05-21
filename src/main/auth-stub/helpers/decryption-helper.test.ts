import { decrypt } from "./decryption-helper";
import * as keyHelper from "./key-helpers";

const jwe =
  "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.ZjhoKAi_KnCTbSTKjX8WIwdEXo_XuNbDRzJRtmt3mLS6FCXaaUTyyOXi4qQyZNjA2Fxn6D4UB121kmF58mcyDrhHtSN-ebT3wnsJ_VOd5Mv0IVRNRAQnAW15dWgJy_uLHva6IKgL6GNrH9DYrPhEG1f9e6b8qMZiag3OAmtX6bZAtHFikw3i9Dvhdx_HMKCO1nX5z5qatF8K6XxAjq1-W0TT5OllJQC8aiE2Xtznu23Uft2jnrdqidvaG0JBdaMjIvcy-cvVaogW4WyUyXGLvna4hC7fmU2TZYqtk63bhv4XYrCfEwNe5qLDXW8-G6EyJO6C3OTMh8otvm1_EDS3LQ.78xU5KBJixV96DRA.YqpzvqoyiDCjUJj2qIhg1k3SuxFdK4l2ou4uja1g-aQjcJZ15C-9szBXCBtYNqqGuoymgi_mcJNyf0DaCkAcsUFyQhe2fQv9YkkkhwcJSe47DDnLNiJyL7hA8cJpDJkzrxoRzVdimbaCEUs_pkYPMi3ojEivE2Fpz7rg5yCLf_VjR5SLlohWSG7qJ1ypkpon4JJjYGKVTzu98XLJuSVqdJq_81pwSn-OMm5V90qmNozzeA.2dFUI2yJLGxgo6yEDfqtjw";

describe("KMS decryption service", () => {
  it("should return a jwt", async () => {
    jest
      .spyOn(keyHelper, "getContentEncryptionKey")
      .mockReturnValueOnce(
        Promise.resolve(
          new Uint8Array([
            142, 95, 23, 226, 246, 50, 142, 180, 28, 234, 156, 229, 103, 214,
            179, 219, 246, 139, 213, 206, 155, 126, 217, 196, 129, 23, 198, 54,
            32, 219, 115, 38,
          ])
        )
      );
    const result = await decrypt(jwe);

    expect(result).toBe(
      "eyJhbGciOiJFUzI1NiJ9.eyJjbGllbnQtbmFtZSI6ImRpLWF1dGgtc3R1Yi1yZWx5aW5nLXBhcnR5LXNhbmRwaXQifQ.FFNDcj3znW5JPillhEIgCvWFCinlX0PMdvfVxgDArYueiVH6VDvlhaZyS70ocm9eOXBlB8pe449vpJrcKllBBg"
    );
  });

  it("should throw a CodedError with error detail when an invalid JWE is input (undefined)", async () => {
    const action = async () => await decrypt(undefined);

    await expect(action()).rejects.toThrow(
      "Invalid JWE input: JWE must be defined"
    );
  });

  it("should throw a CodedError with error detail when an invalid JWE is input (number)", async () => {
    const action = async () => await decrypt(5 as unknown as string);

    await expect(action()).rejects.toThrow(
      "Invalid JWE input: JWE must be a string"
    );
  });

  it("should throw a CodedError with error detail when an invalid JWE is input (too short)", async () => {
    const action = async () => await decrypt("a.b.c");

    await expect(action()).rejects.toThrow(
      "Invalid JWE input: 5 component parts expected"
    );
  });

  it("should throw a CodedError with error details when an invalid encryption key is used", async () => {
    jest
      .spyOn(keyHelper, "getContentEncryptionKey")
      .mockReturnValueOnce(
        Promise.resolve(
          new Uint8Array([
            142, 95, 23, 226, 246, 50, 142, 180, 28, 234, 156, 229, 103, 214,
            179, 219, 246, 139, 213, 206, 155, 126, 217, 196, 129, 23, 198, 54,
            32, 219, 115, 39,
          ])
        )
      );
    const action = async () => await decrypt(jwe);

    await expect(action()).rejects.toThrow("Error decrypting JWE undefined");
  });
});
