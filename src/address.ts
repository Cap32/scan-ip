import os from "os";

export function getCIDRs(): string[] {
  const cidrs: string[] = [];
  for (const netInfoList of Object.values(os.networkInterfaces())) {
    for (const netInfo of netInfoList) {
      if (!netInfo.internal && netInfo.family != "IPv6") {
        const { cidr } = netInfo;
        if (cidr) cidrs.push(cidr);
      }
    }
  }
  return cidrs;
}
