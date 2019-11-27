# Scan IP

Scan IP over LAN

## Installation

```bash
$ yarn add @cap32/scan-ip
```

## Usages

```js
import { Scan } from "@cap32/scan-ip";

(async () => {
  const scan = new Scan({ port: 80 });
  scan.on("connect", (host, port) => {
    console.log(`${host}:${port}`);
  });
  const report = await scan.start();
  console.log(report);
})();
```

## API References

https://cap32.github.io/scan-ip/

## License

MIT
