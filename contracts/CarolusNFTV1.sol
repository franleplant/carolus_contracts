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

    // tokenid => author
    mapping(uint256 => address) public authorMap;

    // Price in wei
    uint256 private minPrice;

    string private baseURI;

    uint256 private pendingWithdrawals;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 newMinPrice,
        string memory newBaseURI
    ) ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        minPrice = newMinPrice;
        baseURI = newBaseURI;
    }

    //function pause() public onlyRole(PAUSER_ROLE) {
    //_pause();
    //}

    //function unpause() public onlyRole(PAUSER_ROLE) {
    //_unpause();
    //}

    function publishMint(
        string memory content //whenNotPaused
    ) public payable {
        // should have minPrice in value
        require(msg.value >= minPrice, "can't afford publishing");

        // account for the value
        pendingWithdrawals += msg.value;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);

        contentMap[tokenId] = content;
        authorMap[tokenId] = msg.sender;
    }

    // withdraw funds by moderator
    // TODO security analysis
    // IMPORTANT: casting msg.sender to a payable address is only safe if ALL members of the MODERATOR role are payable addresses.
    function withdraw()
        public
        //whenNotPaused
        onlyRole(MODERATOR_ROLE)
    {
        address payable receiver = payable(msg.sender);

        uint256 toWithdraw = pendingWithdrawals;
        // zero account before transfer to prevent re-entrancy attack
        pendingWithdrawals = 0;
        receiver.transfer(toWithdraw);
    }

    function setMinPrice(uint256 newMinPrice)
        public
        //whenNotPaused
        onlyRole(MODERATOR_ROLE)
    {
        minPrice = newMinPrice;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newBaseURI)
        public
        //whenNotPaused
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
