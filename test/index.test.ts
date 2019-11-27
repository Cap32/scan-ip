import { Scan, TReport } from "../src/index";

describe("scan", () => {
  let scan: Scan;

  beforeEach(() => {
    scan = new Scan();
  });

  afterEach(() => {
    scan.close();
  });

  test("max scans", async () => {
    scan = new Scan({ maxScans: 1 });
    const report = await scan.start();
    expect(report.scaned).toBe(1);
  });

  test("events", async () => {
    const scan = new Scan({ port: 80 });
    scan.on("connect", (host: string, port: string) => {
      // console.log("connect", `${host}:${port}`);
    });
    scan.on("refuse", (host: string, port: string) => {
      // console.log("refuse", `${host}:${port}`);
    });
    scan.on("complete", (report: TReport) => {
      // console.log(report);
    });
    await scan.start();
  });

  test("progress event", async () => {
    const scan = new Scan({ maxScans: 1000 });
    scan.on("progress", (scans: number, total: number) => {
      // console.log("progress", `${((scans / total) * 100).toFixed(2)}%`);
    });
    await scan.start();
  });
});
