// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CarolusNFTV1 is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Pausable,
    AccessControl,
    ERC721Burnable
{
    using Counters for Counters.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    Counters.Counter private _tokenIdCounter;

    // TODO eventually this should be a compress string
    // using some sort of compression algorithm like the ones proposed in
    // https://stackoverflow.com/questions/53926612/is-there-a-way-to-compress-a-string-into-a-smaller-string-with-reversibility
    mapping(uint256 => string) public contentMap;
    mapping(uint256 => address) public tokenToAuthorMap;
    mapping(uint256 => uint256) public tokenToTimestampMap;

    mapping(uint256 => uint256) public tokenToUpvotesMap;
    mapping(uint256 => uint256) public tokenToDownvotesMap;
    mapping(uint256 => mapping(address => bool))
        public tokenToUpvoterAddressMap;
    mapping(uint256 => mapping(address => bool))
        public tokenToDownvoterAddressMap;

    // Price in wei
    uint256 private minPrice;

    string private baseURI;

    uint256 public pendingWithdrawals;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 newMinPrice,
        string memory newBaseURI
    ) ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        minPrice = newMinPrice;
        baseURI = newBaseURI;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // TODO author and date map
    function publishMint(string memory content) public payable whenNotPaused {
        // should have minPrice in value
        require(msg.value >= minPrice, "can't afford publishing");

        // account for the value
        pendingWithdrawals += msg.value;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);

        contentMap[tokenId] = content;
        tokenToAuthorMap[tokenId] = msg.sender;
        tokenToTimestampMap[tokenId] = block.timestamp;
    }

    // withdraw funds by moderator
    // TODO security analysis
    // IMPORTANT: casting msg.sender to a payable address is only safe if ALL members of the MODERATOR role are payable addresses.
    function withdraw() public whenNotPaused onlyRole(MODERATOR_ROLE) {
        address payable receiver = payable(msg.sender);

        uint256 toWithdraw = pendingWithdrawals;
        // zero account before transfer to prevent re-entrancy attack
        pendingWithdrawals = 0;
        receiver.transfer(toWithdraw);
    }

    function setMinPrice(uint256 newMinPrice)
        public
        whenNotPaused
        onlyRole(MODERATOR_ROLE)
    {
        minPrice = newMinPrice;
    }

    /// Give a possitive vote a given news by tokenId,
    /// if you already voted the vote will be removed
    ///
    function upvoteToken(uint256 tokenId) public whenNotPaused {
        // this will through if token does not exist
        ownerOf(tokenId);
        address voter = msg.sender;
        bool hasAlreadyVoted = tokenToUpvoterAddressMap[tokenId][voter];

        tokenToUpvoterAddressMap[tokenId][voter] = !hasAlreadyVoted;
        if (hasAlreadyVoted) {
            tokenToUpvotesMap[tokenId] -= 1;
        } else {
            tokenToUpvotesMap[tokenId] += 1;
        }
    }

    /// Give a negative vote a given news by tokenId
    /// if you already voted the vote will be removed
    ///
    function downvoteToken(uint256 tokenId) public whenNotPaused {
        // this will through if token does not exist
        ownerOf(tokenId);
        address voter = msg.sender;
        bool hasAlreadyVoted = tokenToDownvoterAddressMap[tokenId][voter];

        tokenToDownvoterAddressMap[tokenId][voter] = !hasAlreadyVoted;
        if (hasAlreadyVoted) {
            tokenToDownvotesMap[tokenId] -= 1;
        } else {
            tokenToDownvotesMap[tokenId] += 1;
        }
    }

    /// Censure the content of a given token but only when it has enough downvotes
    /// There should a minimum amount of votes, up or down, to properly asses the news.
    ///
    function censure(uint256 tokenId)
        public
        whenNotPaused
        onlyRole(MODERATOR_ROLE)
    {
        // this will through if token does not exist
        ownerOf(tokenId);
        uint256 upvotes = tokenToUpvotesMap[tokenId];
        require(upvotes >= 10, "not enough upvotes");
        uint256 downvotes = tokenToDownvotesMap[tokenId];
        require(downvotes >= 10, "not enough downvotes");

        // twice dowvotes than upvotes to be able to cesnure.
        // 10 upvotes 20 downvotes rounded down
        uint256 downvoteRate = downvotes / upvotes;
        require(downvoteRate >= 2, "not enough downvote rate");

        // remove content
        contentMap[tokenId] = "";
    }

    /// Emergency use only.
    ///
    function emergencyCensure(uint256 tokenId)
        public
        whenNotPaused
        onlyRole(MODERATOR_ROLE)
    {
        // this will through if token does not exist
        ownerOf(tokenId);

        // remove content
        contentMap[tokenId] = "";
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newBaseURI)
        public
        whenNotPaused
        onlyRole(MODERATOR_ROLE)
    {
        baseURI = newBaseURI;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
