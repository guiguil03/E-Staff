import { ArgumentsHost, BadRequestException, Logger } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";

function makeHost(request: Record<string, unknown>) {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

describe("AllExceptionsFilter", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("préserve le statut et le corps d'une HttpException connue, sans logguer (4xx)", () => {
    const filter = new AllExceptionsFilter();
    const { host, response } = makeHost({ method: "POST", originalUrl: "/auth/login", ip: "1.2.3.4" });

    filter.catch(new BadRequestException("Matricule invalide."), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Matricule invalide." })
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("renvoie un message générique en 500 et loggue pour une exception inconnue", () => {
    const filter = new AllExceptionsFilter();
    const { host, response } = makeHost({ method: "GET", originalUrl: "/rh/stats", ip: "5.6.7.8" });

    filter.catch(new Error("boom"), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: "Erreur interne du serveur.",
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("GET /rh/stats — 500 (ip=5.6.7.8)"),
      expect.any(String)
    );
  });
});
