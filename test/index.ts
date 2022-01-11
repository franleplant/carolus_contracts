import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { range } from "lodash";
import isTxOk from "../lib/isTxOk";
import { CarolusNFTV1 } from "../typechain";

const TOKEN_NAME = "";
const TOKEN_SYMBOL = "";
const TOKEN_MIN_PRICE = ethers.constants.WeiPerEther.div(2);
const TOKEN_BASE_URI = "https://www.fake.com/";

const CONTENT_1 = "This is a fake content piece";

export async function shouldThrow(
  fn: () => Promise<any>,
  msg = "Error"
): Promise<void> {
  try {
    await fn();
    throw new Error(msg);
  } catch (err) {
    // all good
  }
}

async function deploy(): Promise<CarolusNFTV1> {
  const ContractFactory = await ethers.getContractFactory("CarolusNFTV1");
  const contract = await ContractFactory.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_MIN_PRICE,
    TOKEN_BASE_URI
  );
  await contract.deployed();

  return contract;
}

async function mintNews(contract: CarolusNFTV1): Promise<void> {
  await Promise.all(
    range(10).map((index) => {
      const tx = contract.publishMint(
        `${index.toString().padStart(3, "0")} ${CONTENT_1}`,
        {
          value: TOKEN_MIN_PRICE,
        }
      );

      return isTxOk(tx);
    })
  );
}

describe("CarolusNFTV1", function () {
  it("should deploy", async function () {
    await deploy();
  });

  it("should allow publishMinting", async function () {
    let contract = await deploy();

    const contentCreator = (await ethers.getSigners())[1];
    contract = contract.connect(contentCreator);

    await mintNews(contract);

    const news = await Promise.all(
      range(10).map(async (index) => {
        const tokenId = await contract.tokenByIndex(index);

        const [content, tokenURI] = await Promise.all([
          contract.contentMap(tokenId),
          contract.tokenURI(tokenId),
        ]);

        return { tokenId, content, tokenURI };
      })
    );

    expect(news.length).to.equal(10);
  });

  it("should allow upvoting", async () => {
    let contract = await deploy();

    const contentCreator = (await ethers.getSigners())[1];
    contract = contract.connect(contentCreator);

    await mintNews(contract);

    const tokenId = 0;

    // should increase vote count
    await isTxOk(contract.upvoteToken(tokenId));
    assert.equal((await contract.tokenToUpvotesMap(tokenId)).toNumber(), 1);
    assert.equal(
      await contract.tokenToUpvoterAddressMap(tokenId, contentCreator.address),
      true
    );

    // should decrease vote count when voting again
    await isTxOk(contract.upvoteToken(tokenId));
    assert.equal((await contract.tokenToUpvotesMap(tokenId)).toNumber(), 0);
    assert.equal(
      await contract.tokenToUpvoterAddressMap(tokenId, contentCreator.address),
      false
    );

    // should allow other addresses to upvote
    const contentCreator2 = (await ethers.getSigners())[2];
    contract = contract.connect(contentCreator2);

    await isTxOk(contract.upvoteToken(tokenId));
    assert.equal((await contract.tokenToUpvotesMap(tokenId)).toNumber(), 1);
    assert.equal(
      await contract.tokenToUpvoterAddressMap(tokenId, contentCreator2.address),
      true
    );
  });

  it("should allow downvoting", async () => {
    let contract = await deploy();

    const contentCreator = (await ethers.getSigners())[1];
    contract = contract.connect(contentCreator);

    await mintNews(contract);

    const tokenId = 0;

    // should increase vote count
    await isTxOk(contract.downvoteToken(tokenId));
    assert.equal((await contract.tokenToDownvotesMap(tokenId)).toNumber(), 1);
    assert.equal(
      await contract.tokenToDownvoterAddressMap(
        tokenId,
        contentCreator.address
      ),
      true
    );

    // should decrease vote count when voting again
    await isTxOk(contract.downvoteToken(tokenId));
    assert.equal((await contract.tokenToDownvotesMap(tokenId)).toNumber(), 0);
    assert.equal(
      await contract.tokenToDownvoterAddressMap(
        tokenId,
        contentCreator.address
      ),
      false
    );

    // should allow other addresses to upvote
    const contentCreator2 = (await ethers.getSigners())[2];
    contract = contract.connect(contentCreator2);

    await isTxOk(contract.downvoteToken(tokenId));
    assert.equal((await contract.tokenToDownvotesMap(tokenId)).toNumber(), 1);
    assert.equal(
      await contract.tokenToDownvoterAddressMap(
        tokenId,
        contentCreator2.address
      ),
      true
    );
  });

  it("should allow censuring", async () => {
    const tokenId = 0;
    const contract = await deploy();

    const minter = (await ethers.getSigners())[1];
    const minterContract = contract.connect(minter);

    await shouldThrow(
      () => isTxOk(contract.censure(tokenId)),
      "should not allow an unexisting token to be censured"
    );

    await mintNews(minterContract);

    await shouldThrow(
      () => isTxOk(contract.censure(tokenId)),
      "should not allow a token to be censured when it doens't have enough votes"
    );

    const voters = await ethers.getSigners();

    // at least 10 votes
    await Promise.all(
      voters.slice(0, 10).map(async (voter) => {
        const voterContract = contract.connect(voter);
        await isTxOk(voterContract.upvoteToken(tokenId));
      })
    );

    // many downvotes
    await Promise.all(
      voters.map(async (voter) => {
        const voterContract = contract.connect(voter);
        await isTxOk(voterContract.downvoteToken(tokenId));
      })
    );

    assert.equal(
      (await contract.tokenToDownvotesMap(tokenId)).toNumber(),
      voters.length
    );

    await isTxOk(contract.censure(tokenId), "should allow to censure a token");
  });

  it("should allow withrawing", async () => {
    const [admin, minter] = await ethers.getSigners();
    const contract = await deploy();

    const originalBalance = Number(
      ethers.utils.formatEther(await admin.getBalance())
    );

    const minterContract = contract.connect(minter);

    await mintNews(minterContract);

    const toWithdraw = Number(
      ethers.utils.formatEther(await contract.pendingWithdrawals())
    );
    assert.equal(toWithdraw, 5);

    await isTxOk(contract.withdraw());

    const toWithdraw2 = await contract.pendingWithdrawals();
    assert.equal(toWithdraw2.toNumber(), 0);

    const balance = Number(ethers.utils.formatEther(await admin.getBalance()));
    assert.ok(Number(balance) > originalBalance);
    assert.ok(Number(balance) > originalBalance + 5 - 0.1);
  });
});
