import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Elysia Server Endpoints", () => {
  it("GET / returns API metadata", async () => {
    const response = await app.handle(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      name: string;
      version: string;
      framework: string;
      runtime: string;
    };
    expect(data.name).toBe("vibecode-api");
    expect(data.framework).toBe("ElysiaJS");
    expect(data.runtime).toBe("Bun");
  });

  it("GET /ping returns pong", async () => {
    const response = await app.handle(new Request("http://localhost/ping"));
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      message: string;
      timestamp: string;
    };
    expect(data.message).toBe("pong");
    expect(data.timestamp).toBeDefined();
  });

  it("GET /health returns health status", async () => {
    const response = await app.handle(new Request("http://localhost/health"));
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      status: string;
      uptime: number;
      timestamp: string;
    };
    expect(data.status).toBe("ok");
    expect(data.uptime).toBeNumber();
  });
});
