import { ScaffoldManager } from "./scaffoldManager"

export const scaffoldScript = (
  options: {
    path: string,
    packageMgr: string,
  },
  sm?: ScaffoldManager,
) => {
  let shouldPrint = false;
  if (sm === undefined) {
    shouldPrint = true;
    sm = new ScaffoldManager(options.path, options.packageMgr);
  }

  

  if (shouldPrint) {
    sm.report();
  }
}