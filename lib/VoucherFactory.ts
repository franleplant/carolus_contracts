import ethers from "ethers";

// These constants must match the ones used in the smart contract.
const SIGNING_DOMAIN_NAME = "LazyNFT-Voucher";
const SIGNING_DOMAIN_VERSION = "1";

export interface NFTVoucher {
  /** the id of the un-minted NFT  */
  tokenId: ethers.BigNumberish;
  /** the minimum price (in wei) that the creator will accept to redeem this NFT */
  minPrice: ethers.BigNumberish;
  /** the metadata URI to associate with this NFT */
  uri: string;
  /** an EIP-712 signature of all fields in the NFTVoucher, apart from signature itself */
  signature: ethers.BytesLike;
}

/** the EIP-721 signing domain, tied to the chainId of the signer */
export interface SigningDomain {
  name: string;
  version: string;
  verifyingContract: string;
  chainId: unknown;
}

/**
 * Voucher is a helper class that creates NFTVoucher objects and signs them, to be redeemed later by the LazyNFT contract.
 */
export default class VoucherFactory {
  contract: ethers.Contract;
  signer: ethers.Signer;
  private domain: SigningDomain | undefined;

  /**
   * Create a new LazyMinter targeting a deployed instance of the LazyNFT contract.
   *
   * @param contract an ethers Contract that's wired up to the deployed contract
   * @param signer a Signer whose account is authorized to mint NFTs on the deployed contract
   */
  constructor({
    contract,
    signer,
  }: {
    contract: ethers.Contract;
    signer: ethers.Signer;
  }) {
    this.contract = contract;
    this.signer = signer;
  }

  /**
   * Creates a new NFTVoucher object and signs it using this LazyMinter's signing key.
   *
   * @param tokenId the id of the un-minted NFT
   * @param uri the metadata URI to associate with this NFT
   * @param minPrice the minimum price (in wei) that the creator will accept to redeem this NFT. defaults to zero
   *
   */
  public async create(
    tokenId: ethers.BigNumberish,
    uri: string,
    minPrice: ethers.BigNumberish = 0
  ): Promise<NFTVoucher> {
    const voucher = { tokenId, uri, minPrice };
    const domain = await this.signingDomain();
    const types = {
      NFTVoucher: [
        { name: "tokenId", type: "uint256" },
        { name: "minPrice", type: "uint256" },
        { name: "uri", type: "string" },
      ],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signature = await (this.signer as any)._signTypedData(
      domain,
      types,
      voucher
    );

    return {
      ...voucher,
      signature,
    };
  }

  private async signingDomain(): Promise<SigningDomain> {
    if (!this.domain) {
      const chainId = await this.signer.getChainId();

      this.domain = {
        name: SIGNING_DOMAIN_NAME,
        version: SIGNING_DOMAIN_VERSION,
        verifyingContract: this.contract.address,
        chainId,
      };
    }

    return this.domain;
  }
}
