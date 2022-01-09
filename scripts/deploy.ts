// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import Env from "../lib/Env";
import DeployInfo from "../lib/deployInfo";
import { range } from "lodash";
import { ContractTransaction } from "@ethersproject/contracts";

const TOKEN_NAME = Env.get("TOKEN_NAME");
const TOKEN_SYMBOL = Env.get("TOKEN_SYMBOL");
// TODO
const TOKEN_MIN_PRICE = ethers.constants.WeiPerEther.div(2);
// TODO
const TOKEN_BASE_URI = "https://www.fake.com/";
const CONTENT_1 = "This is a fake content piece";

// TODO abstract
async function isTxOk(
  txPromise: Promise<ContractTransaction> | ContractTransaction
): Promise<void> {
  const tx = await txPromise;
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw new Error("Failed tx");
  }
}

async function main() {
  const ContractFactory = await ethers.getContractFactory("CarolusNFTV1");
  const contract = await ContractFactory.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_MIN_PRICE,
    TOKEN_BASE_URI
  );
  await contract.deployed();

  await DeployInfo.write({ address: contract.address });
  console.log("Contract deployed to:", contract.address);

  await Promise.all(
    range(10).map((index) => {
      const tx = contract.publishMint(
        `${index.toString().padStart(3, "0")} ${CONTENT_1}`,
        {
          value: TOKEN_MIN_PRICE,
          gasLimit: 300000,
        }
      );

      return isTxOk(tx);
    })
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
