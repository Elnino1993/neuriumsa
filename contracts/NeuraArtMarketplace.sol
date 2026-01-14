// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NeuraArtMarketplace
 * @dev Marketplace contract for NeuraArt NFTs with listings and auctions
 */
contract NeuraArtMarketplace is ReentrancyGuard, Ownable {
    
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }
    
    struct Auction {
        address seller;
        address highestBidder;
        uint256 highestBid;
        uint256 startingPrice;
        uint256 endTime;
        bool isActive;
    }
    
    struct ListingInfo {
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
    }
    
    struct AuctionInfo {
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 highestBid;
        uint256 endTime;
    }
    
    // Platform fee (2.5% = 250 basis points)
    uint256 public platformFeePercent = 250;
    
    // Mappings
    mapping(address => mapping(uint256 => Listing)) public listings;
    mapping(address => mapping(uint256 => Auction)) public auctions;
    
    // Track active listings and auctions for enumeration
    ListingInfo[] private activeListings;
    AuctionInfo[] private activeAuctions;
    
    // Events
    event ItemListed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ItemBought(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ItemCanceled(address indexed seller, address indexed nftContract, uint256 indexed tokenId);
    event AuctionCreated(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 startingPrice, uint256 endTime);
    event BidPlaced(address indexed bidder, address indexed nftContract, uint256 indexed tokenId, uint256 amount);
    event AuctionEnded(address indexed winner, address indexed nftContract, uint256 indexed tokenId, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev List an NFT for sale
     */
    function listItem(address nftContract, uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be greater than 0");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Not approved");
        require(!listings[nftContract][tokenId].isActive, "Already listed");
        require(!auctions[nftContract][tokenId].isActive, "In auction");
        
        listings[nftContract][tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });
        
        activeListings.push(ListingInfo({
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price
        }));
        
        emit ItemListed(msg.sender, nftContract, tokenId, price);
    }
    
    /**
     * @dev Buy a listed NFT
     */
    function buyItem(address nftContract, uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.isActive, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        
        listing.isActive = false;
        
        // Calculate fees
        uint256 platformFee = (listing.price * platformFeePercent) / 10000;
        uint256 sellerAmount = listing.price - platformFee;
        
        // Check for royalties (ERC2981)
        try ERC2981(nftContract).royaltyInfo(tokenId, listing.price) returns (address receiver, uint256 royaltyAmount) {
            if (royaltyAmount > 0 && receiver != address(0) && receiver != listing.seller) {
                sellerAmount -= royaltyAmount;
                payable(receiver).transfer(royaltyAmount);
            }
        } catch {}
        
        // Transfer NFT
        IERC721(nftContract).safeTransferFrom(listing.seller, msg.sender, tokenId);
        
        // Transfer payment
        payable(listing.seller).transfer(sellerAmount);
        
        // Refund excess
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        // Remove from active listings
        _removeFromActiveListings(nftContract, tokenId);
        
        emit ItemBought(msg.sender, nftContract, tokenId, listing.price);
    }
    
    /**
     * @dev Cancel a listing
     */
    function cancelListing(address nftContract, uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.isActive, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");
        
        listing.isActive = false;
        _removeFromActiveListings(nftContract, tokenId);
        
        emit ItemCanceled(msg.sender, nftContract, tokenId);
    }
    
    /**
     * @dev Update listing price
     */
    function updateListing(address nftContract, uint256 tokenId, uint256 newPrice) external nonReentrant {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.isActive, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");
        require(newPrice > 0, "Price must be greater than 0");
        
        listing.price = newPrice;
        
        emit ItemListed(msg.sender, nftContract, tokenId, newPrice);
    }
    
    /**
     * @dev Create an auction
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration
    ) external nonReentrant {
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(duration >= 1 hours && duration <= 7 days, "Invalid duration");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Not approved");
        require(!listings[nftContract][tokenId].isActive, "Already listed");
        require(!auctions[nftContract][tokenId].isActive, "Already in auction");
        
        uint256 endTime = block.timestamp + duration;
        
        auctions[nftContract][tokenId] = Auction({
            seller: msg.sender,
            highestBidder: address(0),
            highestBid: 0,
            startingPrice: startingPrice,
            endTime: endTime,
            isActive: true
        });
        
        activeAuctions.push(AuctionInfo({
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            highestBid: 0,
            endTime: endTime
        }));
        
        emit AuctionCreated(msg.sender, nftContract, tokenId, startingPrice, endTime);
    }
    
    /**
     * @dev Place a bid on an auction
     */
    function placeBid(address nftContract, uint256 tokenId) external payable nonReentrant {
        Auction storage auction = auctions[nftContract][tokenId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");
        
        uint256 minBid = auction.highestBid > 0 ? auction.highestBid : auction.startingPrice;
        require(msg.value > minBid, "Bid too low");
        
        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        
        emit BidPlaced(msg.sender, nftContract, tokenId, msg.value);
    }
    
    /**
     * @dev End an auction
     */
    function endAuction(address nftContract, uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[nftContract][tokenId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        
        auction.isActive = false;
        
        if (auction.highestBidder != address(0)) {
            // Calculate fees
            uint256 platformFee = (auction.highestBid * platformFeePercent) / 10000;
            uint256 sellerAmount = auction.highestBid - platformFee;
            
            // Check for royalties
            try ERC2981(nftContract).royaltyInfo(tokenId, auction.highestBid) returns (address receiver, uint256 royaltyAmount) {
                if (royaltyAmount > 0 && receiver != address(0) && receiver != auction.seller) {
                    sellerAmount -= royaltyAmount;
                    payable(receiver).transfer(royaltyAmount);
                }
            } catch {}
            
            // Transfer NFT to winner
            IERC721(nftContract).safeTransferFrom(auction.seller, auction.highestBidder, tokenId);
            
            // Transfer payment to seller
            payable(auction.seller).transfer(sellerAmount);
            
            emit AuctionEnded(auction.highestBidder, nftContract, tokenId, auction.highestBid);
        }
        
        _removeFromActiveAuctions(nftContract, tokenId);
    }
    
    /**
     * @dev Get listing info
     */
    function getListing(address nftContract, uint256 tokenId) external view returns (Listing memory) {
        return listings[nftContract][tokenId];
    }
    
    /**
     * @dev Get auction info
     */
    function getAuction(address nftContract, uint256 tokenId) external view returns (Auction memory) {
        return auctions[nftContract][tokenId];
    }
    
    /**
     * @dev Get all active listings
     */
    function getActiveListings() external view returns (ListingInfo[] memory) {
        return activeListings;
    }
    
    /**
     * @dev Get all active auctions
     */
    function getActiveAuctions() external view returns (AuctionInfo[] memory) {
        return activeAuctions;
    }
    
    /**
     * @dev Set platform fee (only owner)
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = newFee;
    }
    
    /**
     * @dev Withdraw platform fees (only owner)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Internal functions
    
    function _removeFromActiveListings(address nftContract, uint256 tokenId) internal {
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (activeListings[i].nftContract == nftContract && activeListings[i].tokenId == tokenId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }
    }
    
    function _removeFromActiveAuctions(address nftContract, uint256 tokenId) internal {
        for (uint256 i = 0; i < activeAuctions.length; i++) {
            if (activeAuctions[i].nftContract == nftContract && activeAuctions[i].tokenId == tokenId) {
                activeAuctions[i] = activeAuctions[activeAuctions.length - 1];
                activeAuctions.pop();
                break;
            }
        }
    }
}
