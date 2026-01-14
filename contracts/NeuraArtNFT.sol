// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NeuraArtNFT
 * @dev NFT contract for NeuraArt marketplace on Neura Protocol
 */
contract NeuraArtNFT is ERC721, ERC721URIStorage, ERC721Enumerable, ERC2981, Ownable {
    uint256 private _nextTokenId;
    uint256 public mintingFee = 0; // Free minting by default
    
    // Mapping from token ID to creator
    mapping(uint256 => address) public creators;
    
    event NFTMinted(address indexed creator, uint256 indexed tokenId, string tokenURI);
    event MintingFeeUpdated(uint256 newFee);
    
    constructor() ERC721("NeuraArt", "NART") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new NFT
     * @param to Address to mint the NFT to
     * @param uri Token URI for metadata
     * @param royaltyPercentage Royalty percentage in basis points (e.g., 250 = 2.5%)
     */
    function mintNFT(
        address to,
        string memory uri,
        uint96 royaltyPercentage
    ) public payable returns (uint256) {
        require(msg.value >= mintingFee, "Insufficient minting fee");
        require(royaltyPercentage <= 1000, "Royalty too high"); // Max 10%
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Set royalty info - creator receives royalties
        _setTokenRoyalty(tokenId, msg.sender, royaltyPercentage);
        
        // Track creator
        creators[tokenId] = msg.sender;
        
        emit NFTMinted(msg.sender, tokenId, uri);
        
        return tokenId;
    }
    
    /**
     * @dev Update minting fee (only owner)
     */
    function setMintingFee(uint256 newFee) external onlyOwner {
        mintingFee = newFee;
        emit MintingFeeUpdated(newFee);
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Get creator of a token
     */
    function getCreator(uint256 tokenId) external view returns (address) {
        return creators[tokenId];
    }
    
    // Required overrides
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
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
        override(ERC721, ERC721URIStorage, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
