import net from "net";

export type TConn = {
  host: string;
  port: number;
};

export type TConnOptions = {
  timeout: number;
};

export function connect(conn: TConn, opts: TConnOptions): Promise<TConn> {
  return new Promise((resolve, reject) => {
    const socket = net.connect(conn, function() {
      resolve(conn);
      this.destroy();
    });
    socket.on("error", function(err: Error) {
      this.destroy();
    });
    socket.on("close", function(err) {
      reject(err);
    });
    socket.setTimeout(opts.timeout, function() {
      this.destroy();
    });
  });
}
