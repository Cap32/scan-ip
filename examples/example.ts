import { Scan, TReport } from "../src/index";

(async () => {
  const scan = new Scan({
    port: 80
    // hosts: ["127.0.0.1"]
    // hostFilter: host => host == "192.168.195.215"
    // maxScans: 100
  });
  scan.on("connect", (host: string, port: string) => {
    console.log("* * *", `${host}:${port}`, "* * *");
  });
  // scan.on("progress", (scaned: number, total: number) => {
  //   console.log("progress", `${scaned}/${total}`);
  // });
  // scan.on("refuse", (host: string, port: string) => {
  //   console.log("refuse", `${host}:${port}`);
  // });
  scan.on("complete", (report: TReport) => {
    console.log(report);
  });
  await scan.start();
})();
