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
import isTxOk from "../lib/isTxOk";

const TOKEN_MINT_PRICE = Env.get("TOKEN_MINT_PRICE_2", "number");

async function main() {
  const deployInfo = await DeployInfo.read();

  const ContractFactory = await ethers.getContractFactory("CarolusNFTV1");
  const contract = ContractFactory.attach(deployInfo.address);

  const price = ethers.constants.WeiPerEther.mul(TOKEN_MINT_PRICE);
  await contract.setMinPrice(price);

  console.log("Done");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
