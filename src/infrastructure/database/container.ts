import "reflect-metadata";
import { container } from "tsyringe";
import { glob } from "glob";
import path from "path";
import { SocketService } from "../socket/socket.service";
const getInterfaceToken = (className: string) => {
  return "I" + className.replace("Repo", "") + "Repo";
};

export async function registerDependencies() {
  const repoFiles = await glob(
    path.join(__dirname, "repos/*.@(ts|js)").replace(/\\/g, "/")
  );
  for (const filePath of repoFiles) {
    const module = await import(filePath);
    for (const exportedName in module) {
      const RepoClass = module[exportedName];
      if (typeof RepoClass === "function") {
        const token = getInterfaceToken(exportedName);
        container.register(token, { useClass: RepoClass });
        console.success(`Registered ${token}`);
      }
    }
  }
  const servicePath = path
    .resolve(__dirname, "../../app/services")
    .replace(/\\/g, "/");
  const appFiles = await glob(
    path.join(servicePath, "*.{ts,js}").replace(/\\/g, "/")
  );

  for (const filePath of appFiles) {
    const module = await import(filePath);
    for (const exportedName in module) {
      const ServiceClass = module[exportedName];
      if (typeof ServiceClass === "function") {
        container.register(ServiceClass, { useClass: ServiceClass });
        console.success(`Registered service: ${exportedName}`);
      }
    }
  }

  container.registerSingleton("SocketService", SocketService);
  console.success(`Registered service: SocketService`);
}
