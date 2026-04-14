import fs from "node:fs";
import path from "path";

const logFilePath = path.join(__dirname, "logs.txt");

export class File {
  static log(...logs: any[]) {
    const _log = `[${new Date().toLocaleString()}]: ${logs.join(" ")}\n`;
    fs.appendFile(logFilePath, _log, (err) => {
      if (err) {
        console.error("Error while logging to file:", err);
      }
    });
  }
}
