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

const TOKEN_NAME = Env.get("TOKEN_NAME");
const TOKEN_SYMBOL = Env.get("TOKEN_SYMBOL");
const TOKEN_MINT_PRICE = ethers.constants.WeiPerEther.div(
  1 / Env.get("TOKEN_MINT_PRICE", "number")
);
console.log(
  "USING MINT PRICE",
  TOKEN_MINT_PRICE,
  ethers.utils.formatEther(TOKEN_MINT_PRICE)
);
const TOKEN_BASE_URI = Env.get("TOKEN_URI");
console.log("USIGN TOKEN URI", TOKEN_BASE_URI);

//const CONTENT_1 = "This is a fake content piece";

async function main() {
  const ContractFactory = await ethers.getContractFactory("CarolusNFTV1");
  const contract = await ContractFactory.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_MINT_PRICE,
    TOKEN_BASE_URI
  );
  await contract.deployed();

  await DeployInfo.write({ address: contract.address });
  console.log("Contract deployed to:", contract.address);

  //await Promise.all(
  //range(10).map((index) => {
  //const tx = contract.publishMint(
  //`${index.toString().padStart(3, "0")} ${CONTENT_1}`,
  //{
  //value: TOKEN_MINT_PRICE,
  //gasLimit: 300000,
  //}
  //);

  //return isTxOk(tx);
  //})
  //);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
