import { Versions } from "./constants";
import { AxiomV2QueryBuilderBaseConfig } from "./types";

export function handleProvider(config: AxiomV2QueryBuilderBaseConfig): AxiomV2QueryBuilderBaseConfig {
  if (config.providerUri === undefined || config.providerUri === "") {
    throw new Error("`provider` is required in AxiomV2QueryBuilderBaseConfig");
  }
  return config;
}

export function handleChainId(config: AxiomV2QueryBuilderBaseConfig): AxiomV2QueryBuilderBaseConfig {
  if (config.sourceChainId === undefined) {
    config.sourceChainId = 1;
  }
  if (config.targetChainId === undefined) {
    config.targetChainId = config.sourceChainId;
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

export function parseAddress(address?: string): string {
  if (!address) {
    return "";
  }
  if (!address.startsWith("0x")) {
    address = "0x" + address;
  }
  if (address.length !== 42) {
    throw new Error("Invalid address: must be 42 characters long");
  }
  address = address.toLowerCase();
  return address;
}
