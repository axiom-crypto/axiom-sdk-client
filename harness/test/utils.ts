import fs from 'fs';
import path from 'path';

export function listDir(dir: string): string[] {
  const files: string[] = [];
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      const dirFiles = listDir(fullPath);
      files.push(...dirFiles);
    } else {
      files.push(fullPath);
    }
  });
  return files;
}

export function makeFileMap(files: string[]): object {
  const fileMap: {[key: string]: string[]} = {};
  for (let file of files) {
    const [folder, fileName] = file.split("/").slice(-2);
    if (fileMap[folder] == undefined) {
      fileMap[folder] = [] as string[];
    }
    fileMap[folder].push(fileName);
  }
  return fileMap;
}