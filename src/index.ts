import { EventEmitter } from "events";
import { Netmask } from "netmask";
import { getCIDRs } from "./address";
import { TConn, TConnOptions, connect } from "./connect";
import { TPortRanges, getPortRanges, isCountOver } from "./utils";
import PQueue from "p-queue";
import ms from "ms";
import { throttle } from "throttle-debounce";

export type TReport = {
  opened: number;
  closed: number;
  scaned: number;
  time: string;
};

export type TOptions = {
  maxScans?: number;
  concurrency?: number;
  port?: number | [number, number];
  timeout?: number;
  hosts?: string[];
  hostFilter?: (host: string) => boolean;
};

const defaultOptions: TOptions = {
  maxScans: Infinity,
  concurrency: 200,
  port: [1, 65535],
  timeout: 200,
  hosts: [],
  hostFilter: () => true
};

export declare interface Scan {
  on(event: string, listener: (...args: any[]) => void): this;
  on(
    event: "progress",
    listener: (scaned: number, total: number) => void
  ): this;
  on(event: "connect", listener: (host: string, port: number) => void): this;
  on(event: "refuse", listener: (host: string, port: number) => void): this;
  on(event: "complete", listener: (report: TReport) => void): this;
}

/**
 * IP Scaner
 *
 * @export
 * @class Scan
 * @extends {EventEmitter}
 */
export class Scan extends EventEmitter {
  private _opts: TOptions;
  private _queue: PQueue;
  private _isRunning: boolean;
  private _report: TReport;
  private _portRanges: TPortRanges;

  /**
   * Creates an instance of Scan.
   * @param {TOptions} [options={}]
   * @memberof Scan
   */
  constructor(options: TOptions = {}) {
    super();
    const opts = (this._opts = { ...defaultOptions, ...options });
    const { concurrency, port } = opts;
    this._portRanges = getPortRanges(port);
    this._isRunning = false;
    this._queue = new PQueue({ concurrency });
  }

  private _emit(event: string | symbol, ...args: any[]): boolean {
    if (!this._isRunning || this.listenerCount(event) == 0) return false;
    return this.emit(event, ...args);
  }

  private _emitProgress = throttle(100, (scaned: number, total: number) => {
    this._emit("progress", scaned, total);
  });

  private _addScanTask(conn: TConn, opts: TConnOptions) {
    this._queue.add(async () => {
      try {
        await connect(conn, opts);
        this._report.opened++;
        this._emit("connect", conn.host, conn.port);
      } catch (err) {
        this._report.closed++;
        this._emit("refuse", conn.host, conn.port);
      }
      this._report.scaned++;
    });
  }

  private async _scanOne(conn: TConn) {
    const { timeout } = this._opts;
    const connOptions: TConnOptions = { timeout };
    this._addScanTask(conn, connOptions);

    // if the queue is available, it will handle the task immediately
    // or it will block and wait for availble
    await this._queue.onEmpty();
  }

  private async _scanAll() {
    const { maxScans, hostFilter } = this._opts;
    const { minPort, maxPort, portsAmount } = this._portRanges;
    let { hosts } = this._opts;
    let count = 0;

    if (hosts.length == 0) {
      hosts = [];
      for (const cidr of getCIDRs()) {
        const block = new Netmask(cidr);
        block.forEach(host => hosts.push(host));
      }
    }

    hosts = hosts.filter(hostFilter);
    const allScans = hosts.length * portsAmount;
    const totalScans = maxScans <= 0 ? allScans : Math.min(maxScans, allScans);
    for (const host of hosts) {
      for (let port = minPort; port <= maxPort; port++) {
        if (isCountOver(++count, maxScans) || !this._isRunning) return;
        this._emitProgress(count, totalScans);
        await this._scanOne({ host, port });
        if (!this._isRunning) return;
      }
    }
  }

  private async _startBackground() {
    try {
      const t0 = Date.now();
      const report = (this._report = {
        opened: 0,
        closed: 0,
        scaned: 0,
        time: "0s"
      });
      await this._scanAll();
      await this._queue.onIdle();
      const deltaTime = Date.now() - t0;
      report.time = ms(deltaTime);
      this._emit("complete", report);
      this.close();
    } catch (err) {
      console.error("run background error:", err);
    }
  }

  /**
   * start to scan
   *
   * @returns {Promise<TReport>}
   * @memberof Scan
   */
  async start(): Promise<TReport> {
    if (this._isRunning) return;
    this._isRunning = true;
    this._startBackground();
    return new Promise(resolve =>
      this.once("close", () => resolve(this._report))
    );
  }

  /**
   * stop scanning
   *
   * @returns
   * @memberof Scan
   */
  close() {
    if (!this._isRunning) return;
    this._queue.clear();
    this._emit("close");
    this._isRunning = false;
    this.removeAllListeners();
  }
}
