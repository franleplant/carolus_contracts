import { ContractTransaction } from "@ethersproject/contracts";

export default async function isTxOk(
  txPromise: Promise<ContractTransaction> | ContractTransaction,
  msg = "Failed tx"
): Promise<void> {
  const tx = await txPromise;
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw new Error(msg);
  }
}
