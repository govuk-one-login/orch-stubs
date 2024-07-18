import supertest from "supertest";
// we need this to accept self-signed-certificates in nodejs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_TLS_ACCEPT_UNTRUSTED_CERTIFICATES_THIS_IS_INSECURE = "1";

it("placeholder test", () => {
  expect(1).toBe(1);
});

describe("test GET and POST endpoints", () => {
  const api = supertest("http://127.0.0.1:3000/");

  it("returns a 200 for GET endpoint", async () => {
    const response = await api.get("/authorize");
    expect(response.statusCode).toBe(200);
  });

  it("returns a 200 for POST endpoint", async () => {
    const response = await api.post("/authorize");
    expect(response.statusCode).toBe(200);
  });
});
