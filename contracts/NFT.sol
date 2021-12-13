// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CucoNFT is
    ERC721,
    ERC721Enumerable,
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
    mapping(uint256 => string) public _contentMap;

    // tokenid => author
    mapping(uint256 => address) public _authorMap;

    // TODO minPrice in way???
    uint256 private _minPrice;

    string private _theBaseURI;

    uint256 private _funds;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 minPrice
    ) ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _minPrice = minPrice;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function publishMint(string memory content) public whenNotPaused {
        // should have minPrice in value
        require(msg.value >= _minPrice, "can't afford publishing");

        // account for the value
        _funds += msg.value;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);

        _contentMap[tokenId] = content;
        _authorMap[tokenId] = msg.sender;
    }

    // withdraw funds by moderator
    function withdraw() public whenNotPaused onlyRole(MODERATOR_ROLE) {
        _funds = 0;
        msg.sender.transfer(_funds);
    }

    function setMinPrice(uint256 minPrice)
        public
        whenNotPaused
        onlyRole(MODERATOR_ROLE)
    {
        _minPrice = minPrice;
    }

    function _baseURI() internal view override returns (string memory) {
        return _theBaseURI;
    }

    function setBaseURI(string memory baseURI)
        public
        whenNotPaused
        onlyRole(MODERATOR_ROLE)
    {
        _theBaseURI = baseURI;
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
