export const getInstallCmd = (manager: string): string => {
  switch (manager) {
    case "npm":
    case "pnpm":
      return "install";
    case "yarn":
      return "add";
    default:
      throw new Error(`Unsupported package manager ${manager}`);
  }
}