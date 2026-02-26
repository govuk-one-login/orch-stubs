import { Optional } from "./Optional";

describe("Optional tests", () => {
  it("Optional with value is present and not empty", () => {
    const opt = Optional.of("Hello");

    expect(opt.isPresent()).toBe(true);
    expect(opt.isEmpty()).toBe(false);
  });

  it("Optional with null value is empty and not present", () => {
    const opt = Optional.of(null);

    expect(opt.isPresent()).toBe(false);
    expect(opt.isEmpty()).toBe(true);
  });

  it("Optional with undefined value is empty and not present", () => {
    const opt = Optional.of(undefined);

    expect(opt.isPresent()).toBe(false);
    expect(opt.isEmpty()).toBe(true);
  });

  it("accessing present optional should return value and not throw", () => {
    const opt = Optional.of("Hello");

    expect(() =>
      opt.orElseThrow(() => {
        throw new Error("Gah no value");
      })
    ).not.toThrow();

    expect(() => opt.getValue()).not.toThrow();
    expect(opt.getValue()).toStrictEqual("Hello");
  });

  it("accessing empty optional should throw", () => {
    const opt = Optional.of(null);

    expect(() =>
      opt.orElseThrow(() => {
        throw new Error("Gah no value");
      })
    ).toThrow();

    expect(() => opt.getValue()).toThrow();
  });
});
