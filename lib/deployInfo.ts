import { promises as fs } from "fs";

const PATH = "./deploy_info.json";

export interface IDeployInfo {
  address: string;
}

export async function write(info: IDeployInfo): Promise<void> {
  await fs.writeFile(PATH, JSON.stringify(info));
  console.log(`wrote ${PATH}`);
}

export async function read(): Promise<IDeployInfo> {
  const data = await fs.readFile(PATH, { encoding: "utf8" });
  return JSON.parse(data);
}

export default { write, read };
