export type TPortRanges = {
  minPort: number;
  maxPort: number;
  portsAmount: number;
};

export function getPortRanges(port?: number | [number, number]): TPortRanges {
  if (Array.isArray(port)) {
    const [a, b] = port;
    const minPort = Math.min(a, b);
    const maxPort = Math.max(a, b);
    const portsAmount = Math.floor(maxPort - minPort);
    return { minPort, maxPort, portsAmount };
  }
  return { minPort: port, maxPort: port, portsAmount: 1 };
}

export function isCountOver(curr: number, max: number): boolean {
  return max > 0 && max < curr;
}
