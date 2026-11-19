import { describe, expect, it } from "vitest";
import { addCycles, isValidIsoDate, rollForward } from "@/lib/dates";

describe("isValidIsoDate", () => {
  it("accepts real dates, rejects impossible ones", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2026-02-31")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("26-1-1")).toBe(false);
  });
});

describe("month-end anchoring", () => {
  it("a bill due on the 31st returns to the 31st after short months", () => {
    expect(addCycles("2026-01-31", "monthly", 1)).toBe("2026-02-28");
    expect(addCycles("2026-01-31", "monthly", 2)).toBe("2026-03-31");
    expect(addCycles("2026-01-31", "monthly", 3)).toBe("2026-04-30");
  });
  it("uses the stored anchor day when the stored date has already drifted", () => {
    expect(addCycles("2026-02-28", "monthly", 1, 31)).toBe("2026-03-31");
  });
  it("handles Feb 29 yearly bills", () => {
    expect(addCycles("2028-02-29", "yearly", 1)).toBe("2029-02-28");
    expect(addCycles("2028-02-29", "yearly", 4)).toBe("2032-02-29");
  });
  it("rolls across year boundaries", () => {
    expect(addCycles("2026-11-15", "quarterly", 1)).toBe("2027-02-15");
  });
});

describe("rollForward", () => {
  it("returns the date unchanged when not overdue", () => {
    expect(rollForward("2026-12-01", "monthly", "2026-11-19")).toBe("2026-12-01");
  });
  it("skips all missed weekly cycles in one step", () => {
    // 10 weeks overdue -> lands within the next 7 days, not 7 days later than the old date
    const next = rollForward("2026-09-10", "weekly", "2026-11-19");
    expect(next >= "2026-11-19").toBe(true);
    expect(next <= "2026-11-26").toBe(true);
  });
  it("skips missed monthly cycles", () => {
    expect(rollForward("2026-06-31".replace("31", "30"), "monthly", "2026-11-19", 31)).toBe("2026-11-30");
  });
});
