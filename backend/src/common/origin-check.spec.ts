import type { NextFunction, Request, Response } from "express";
import { originCheck } from "./origin-check";

function run(method: string, origin?: string) {
  const req = { method, headers: origin ? { origin } : {} } as unknown as Request;
  const json = jest.fn();
  const res = { status: jest.fn().mockReturnValue({ json }) } as unknown as Response;
  const next = jest.fn() as NextFunction;
  originCheck(["https://e-staf.com"])(req, res, next);
  return { next, res };
}

describe("originCheck (protection CSRF)", () => {
  it("laisse passer les lectures, même depuis un site tiers", () => {
    expect(run("GET", "https://pirate.example").next).toHaveBeenCalled();
  });

  it("laisse passer une écriture depuis le front autorisé", () => {
    expect(run("POST", "https://e-staf.com").next).toHaveBeenCalled();
  });

  it("refuse une écriture lancée depuis un site tiers", () => {
    const { next, res } = run("POST", "https://pirate.example");
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("laisse passer les appels serveur à serveur sans Origin (webhooks)", () => {
    expect(run("POST").next).toHaveBeenCalled();
  });
});
