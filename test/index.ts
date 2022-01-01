import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractTransaction } from "@ethersproject/contracts";
import range from "../lib/range";

const TOKEN_NAME = "";
const TOKEN_SYMBOL = "";
const TOKEN_MIN_PRICE = ethers.constants.WeiPerEther.div(2);
const TOKEN_BASE_URI = "https://www.fake.com/";

const CONTENT_1 = "This is a fake content piece";

async function isTxOk(
  txPromise: Promise<ContractTransaction> | ContractTransaction
): Promise<void> {
  const tx = await txPromise;
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw new Error("Failed tx");
  }
}

describe("CarolusNFTV1", function () {
  it("should deploy", async function () {
    const ContractFactory = await ethers.getContractFactory("CarolusNFTV1");
    let contract = await ContractFactory.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      TOKEN_MIN_PRICE,
      TOKEN_BASE_URI
    );
    await contract.deployed();

    const contentCreator = (await ethers.getSigners())[1];
    contract = contract.connect(contentCreator);

    await Promise.all(
      range(10).map((index) => {
        const tx = contract.publishMint(
          `${index.toString().padStart(3, "0")} ${CONTENT_1}`,
          {
            value: TOKEN_MIN_PRICE,
          }
        );

        isTxOk(tx);
      })
    );

    const news = await Promise.all(
      range(10).map(async (index) => {
        const tokenId = await contract.tokenByIndex(index);

        const [content, author, tokenURI] = await Promise.all([
          contract.contentMap(tokenId),
          contract.authorMap(tokenId),
          contract.tokenURI(tokenId),
        ]);

        return { tokenId, content, author, tokenURI };
      })
    );

    console.table(news);
  });
});
