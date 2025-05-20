import path from "node:path";

export function normalizePath(p: string): string {
  return path.posix.normalize(p).replace(/\\/g, "/");
}

export function createURL(input: string, base?: string): URL | null {
  if (compareNodeVersions(process.version, "v22.1") >= 0)
    return URL.parse(input, base);

  return new URL(input, base);
}

export function compareNodeVersions(v1: string, v2: string): number {
  const parseVersion = (vStr: string) => {
    const normalized = vStr.startsWith("v") ? vStr.substring(1) : vStr;
    const parts = normalized.split(".").map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  };

  const ver1 = parseVersion(v1);
  const ver2 = parseVersion(v2);

  if (ver1.major !== ver2.major) {
    return ver1.major > ver2.major ? 1 : -1;
  }
  if (ver1.minor !== ver2.minor) {
    return ver1.minor > ver2.minor ? 1 : -1;
  }
  if (ver1.patch !== ver2.patch) {
    return ver1.patch > ver2.patch ? 1 : -1;
  }
  return 0;
}
