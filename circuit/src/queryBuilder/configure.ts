import { Versions } from "./constants";
import { AxiomV2QueryBuilderConfig } from "./types";

export function handleProvider(config: AxiomV2QueryBuilderConfig): AxiomV2QueryBuilderConfig {
  if (config.provider === undefined || config.provider === "") {
    throw new Error("`provider` is required in AxiomV2QueryBuilderConfig");
  }
  return config;
}

export function handleChainId(config: AxiomV2QueryBuilderConfig): AxiomV2QueryBuilderConfig {
  if (config.chainId === undefined) {
    config.chainId = 1;
  }
  if (config.targetChainId === undefined) {
    config.targetChainId = config.chainId;
  }
  return config;
}

export function parseProvider(provider: string): string {
  if (!provider) {
    throw new Error("Invalid provider: value is undefined or empty string");
  }
  if (
    provider.startsWith("http://") ||
    provider.startsWith("https://")
  ) {
    return provider;
  } else if (provider.startsWith("wss://")) {
    throw new Error("Websockets is not yet supported");
  } else {
    throw new Error(
      "Invalid provider: must start with http://, https://, or wss://"
    );
  }
}

export function parseChainId(chainId?: number | string | BigInt): BigInt {
  if (chainId === undefined) {
    return BigInt(1);
  }
  return BigInt(chainId.valueOf());
}

export function parseVersion(version?: string): string {
  if (version === undefined) {
    return Versions[Versions.length - 1];
  }

  let parsedVersion = version.toLowerCase();
  if (!parsedVersion.startsWith("v")) {
    parsedVersion = `v${parsedVersion}`;
  }
  parsedVersion = parsedVersion.replace(/\./g, "_") as string;

  if (Versions.includes(parsedVersion)) {
    return parsedVersion;
  }
  throw new Error(
    "Invalid version number. Valid versions are: " + Versions.join(", ")
  );
}

export function parseMock(mock: boolean | undefined, chainId: BigInt): boolean {
  if (mock === undefined) {
    return false;
  }
  if (chainId === 1n) {
    return false;
  }
  return mock;
}