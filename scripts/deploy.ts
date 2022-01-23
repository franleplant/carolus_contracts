// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import Env from "../lib/Env";
import DeployInfo from "../lib/deployInfo";

import {BigNumberish} from "@ethersproject/bignumber"


const TOKEN_NAME = Env.get("TOKEN_NAME");
const TOKEN_SYMBOL = Env.get("TOKEN_SYMBOL");
// TODO
const MINT_PRICE_RAW = Env.get("TOKEN_MINT_PRICE", "number")
let TOKEN_MINT_PRICE: BigNumberish;
if (MINT_PRICE_RAW < 1) {
  TOKEN_MINT_PRICE = ethers.constants.WeiPerEther.div(1 / MINT_PRICE_RAW);
} else {
  TOKEN_MINT_PRICE = ethers.constants.WeiPerEther.mul(MINT_PRICE_RAW);
}
console.log(
  "USING MINT PRICE",
  TOKEN_MINT_PRICE,
  ethers.utils.formatEther(TOKEN_MINT_PRICE)
);
const TOKEN_BASE_URI = Env.get("TOKEN_URI");
console.log("USIGN TOKEN URI", TOKEN_BASE_URI);


async function main() {
  const ContractFactory = await ethers.getContractFactory("CarolusNFTV1");
  const deployTransaction = ContractFactory.getDeployTransaction(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_MINT_PRICE,
    TOKEN_BASE_URI
  );

  const estimated = await ethers.provider.estimateGas(deployTransaction);
  console.log("Estimating gas:", ethers.utils.formatEther(estimated));

  //throw new Error("this is only a test");

  const contract = await ContractFactory.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_MINT_PRICE,
    TOKEN_BASE_URI
  );
  await contract.deployed();

  await DeployInfo.write({ address: contract.address });
  console.log("Contract deployed to:", contract.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
