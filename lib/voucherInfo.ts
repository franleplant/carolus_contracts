import { promises as fs } from "fs";
import { NFTVoucher } from "./VoucherFactory";

const PATH = "./voucher_info.json";

export interface IVoucherInfo {
  vouchers: Array<NFTVoucher>;
}

export async function write(info: IVoucherInfo): Promise<void> {
  await fs.writeFile(PATH, JSON.stringify(info));
  console.log(`wrote ${PATH}`);
}

export async function read(): Promise<IVoucherInfo> {
  const data = await fs.readFile(PATH, { encoding: "utf8" });
  return JSON.parse(data);
}

export default { write, read };
