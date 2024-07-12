const supertest = require("supertest");
// we need this to accept self-signed-certificates in nodejs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_TLS_ACCEPT_UNTRUSTED_CERTIFICATES_THIS_IS_INSECURE = "1";

describe("test GET and POST endpoints", () => {
  const api = supertest("http://127.0.0.1:3000/");

  it("returns a 200 for GET endpoint", (done) => {
    api.get("/authorize").timeout(10000).expect(200, done);
  });

  it("returns a 200 for POST endpoint", (done) => {
    api.post("/authorize").timeout(10000).expect(200, done);
  });
});
