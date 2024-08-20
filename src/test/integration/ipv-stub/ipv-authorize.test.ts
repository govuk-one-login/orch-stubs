import supertest from "supertest";

// we need this to accept self-signed-certificates in nodejs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_TLS_ACCEPT_UNTRUSTED_CERTIFICATES_THIS_IS_INSECURE = "1";

const ENCRYPTED_JWT =
  "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.Jwb-nOD7ib4JL2pDDVpwauJE9nGlGHzQ2ww5OfShClR1jJJitvDlCM8jVCYkGNjksCBERx_2cZkG0TsHhZQCtTkGHZrYUusO_8s0NHeOSkAjABL5VRMO_BIIT088USaifaYbPO2581b2AacHhXtfbJnF_l4xLv2tLIrHDbSTpRyYZXmRxQtl1Z-cDyIWs_OdpFQPOeK_gAuW_96YCvRf2MiIdmN275ZE5ip05cJwCijUkbnqYCB5Z5OgZJgoaKEvNhp5FJIZYNOx-IRG8IN9E-wxYHj7OQU-QKTCOukRNoopiKlpzq1EYnLtRNt7B3Mjpb7FZ4SKhMfO8wqD2LM6FA.3Y-UjrNal7bMaF_y.J_XDE3hnHfhrgrfsZG6oA_Mhw50Orc0YApIEA_BFTEmVm2B_nqk_ARlNu8Q7tUlXV1q51gaxCXThIWiLFwp6Q7Rp2O7p1nzRZwVbsDzRZtRosjuOwqUO47PXOQYSe-dSEmlIVrzaaupnzeYnxlgV_o7s1GpieiEKyxsy5Z1mslcJDCmATMb6Z0k7oPBaVisunJswRdm71YzSQELEytFNlZFGhpn7j-31JYsJHNfBSl-zdNrnVf7eVOmOh1daMGaGLydAzq5t81iHgbzqJQtkUOqDVf3PQhf4_M0OWN29fm2TdMrmpXeJExfOsyt5tPY53_0s_9anFPYAi7jbCM7c1FEWDiObtFNpp3GkjpFftCF8TncdW7pDUrwOW4YsNXKd_nEyy4BnaziOYMMrE1MMCRaG3jhy9-7ZdBFFWE0BxZFtgnB_aA1tLaUZXK9wnLCvCWRk4WJQQkk6iIY1osDr8BpAofA2rerL39E5_EmhLIWTVc9WzXwHKUZIdT1qFobv45YcGxQewfSeKjgrou8vIeOBQRDu9YIJapYy1_JX4I2W4Bvay2luMuVDoFpNgVjJhlnWC2cVWUOOnVk_ZPgGg5NhvlGUFJLGwPpGCGRNlgxJnQXq5fV3dduCTHKd7LUajU-RpyFSwatdALOvzXY4tcPKIkfJOO-HdM7AwbF89nP3UpIrnkYbIeTbiRKeFyOEIjy0GE50lFxirzZ8BhLnsOulURzvuhMlYkBtI8hEIozdQWoUQoyi6KTfrfmu-PEqcGW4KUihcPpi41dD4T6Oy7q51bPUcWUvzLvHntVEoNkCgCSw1XCvtqhyUgGzTe5UkYOF5rbsrL3xfhrZo6egTVjb13fsaEG-fX9cbeAqZyIV0b_4bMSbYyHAJhjp1V4Vx9PtmGDXArpiNGnro09iFIpU89fO-xR4pYtHUhIx5191vg0CdV0S-UgLGUF8J18jFVY_08D6bGSgAulxrPNuVYxytcx_u5mOl_TaiSEavN8v6vGX_J1qst_nGXxGgu5U3sTfmS66fOffaDWZ99gY5_wvHcR8REP7O9KaBrMdur5Pfl0F7Gjt1po4UXtF8wtxk2omUFbN1zodome6LE9aVtIT3aYUjN0KL9eOV_RTuoFGGNb-1eGI1ruqakvXKs1bQ70brCNXEmZPa2C1trAaepxPHET19mXfiKsv3P6kS8I-hYDD84F8FdUYAZxBK6PPhcPnoTSONqxcl49HKy329OC0o40s4s0McbgBsXPbiInLBqZSPeMzGbvJB_mpB6DAgS5q3stz5hIJTrX5eAT9zcrZqMengRqcUl5I1eXYsnrYIQ4f7cWVQo8t07j5eKe8vt-WtK3RoeI6O2uv-IWVuH_boPI5wBohiMaOmeZfum0IWGSbGbIc4HMB0TukCNBWBh0ZsRYnQ9FSs6tfxOnKLLbcK033riXlDYshirF4lGJcR84B7Cn5tk6jm6VUxJZL1i867Qxl0PkUgM3KiBM1uLaiBcMUjz4WDjMTPhsHWFokRT1paPmLFSh4jEQLIQY1T_U0nbFBvIvx7gODsKHiANXHxK_xznb-6031OSGFJLmuD3fnGV4Wo3tp35FihnaTLEmiPaVILVGw5SuwUMxIY9qfpHvxOfr58tbjQU3ADeq31vlQBmthVcPWOigNzN-zftoPuMEJOangTHajGAKvu1mdmyZjhEXS05mCYTOOCn9GGjt9JF4Dfl-x5wkM55BBmpMi9mVNyzVs_nGvlurAmTR63SAzcRYk6nMZ-66Em0UQL-DuiET3Kjy1_Lz62IpdYC2igjw6OGUcCstXPGxHUcfsdL0SklNja5VYHzdj3Eq1AU1L7PmW9eurntxal1l7LmriBIWp3mhjrGMTQSWyWP5FjayGdGGJTtbBXT2UUTBZc2Tkcm0.f522CY4YAIpAs7AKqQOMDg";
describe("IPV Authorize", () => {
  const api = supertest("http://127.0.0.1:3000/");

  it("should return 200 for valid GET request", async () => {
    const response = await api
      .get("/authorize")
      .set("Authorization", "Bearer " + ENCRYPTED_JWT);
    expect(response.statusCode).toBe(200);
  });

  it("should return 302 for valid POST request", async () => {
    const response = await api
      .post("/authorize")
      .set("Authorization", "Bearer " + ENCRYPTED_JWT);
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      "https://oidc.sandpit.account.gov.uk/ipv-callback?code=12345"
    );
  });

  it("should return 400 if token is not present in authorize request", async () => {
    const response = await api.get("/authorize");
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Bearer token not found");
  });

  it("should return 500 if decryption fails", async () => {
    const invalidJwt = "invalid.jwt.token";
    const response = await api
      .get("/authorize")
      .set("Authorization", "Bearer " + invalidJwt);
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe(
      "Encountered an unhandled exception: Invalid Compact JWE"
    );
  });
});
