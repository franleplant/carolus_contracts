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

const ADMIN = Env.get("ADMIN_ADDRESS");

async function main() {
  const deployInfo = await DeployInfo.read();

  const ContractFactory = await ethers.getContractFactory("CarolusNFTV1");
  const contract = ContractFactory.attach(deployInfo.address);

  const adminRole = await contract.DEFAULT_ADMIN_ROLE();
  const moderatorRole = await contract.MODERATOR_ROLE();
  const pauserRole = await contract.PAUSER_ROLE();

  console.log(`Making ${ADMIN} admin`);

  Promise.all(
    [adminRole, moderatorRole, pauserRole].map((role) =>
      isTxOk(contract.grantRole(role, ADMIN))
    )
  );

  console.log("Done");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
