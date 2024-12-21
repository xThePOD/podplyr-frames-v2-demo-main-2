"use client";

import { useState, useEffect } from "react";

interface FarcasterUser {
  fid: number;
  username: string;
  display_name?: string;
  pfp_url?: string;
  follower_count: number;
  following_count: number;
  profile?: {
    bio?: {
      text?: string;
    } | string;
  };
}

interface UserDetails {
  fid: number;
  username: string;
  display_name?: string;
  pfp_url?: string;
  follower_count: number;
  following_count: number;
  verified_addresses: string[];
}

interface SearchBarProps {
  onSearch: (username: string) => void;
  isSearching: boolean;
}

function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSearch(username.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-8">
      <div className="flex gap-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Farcaster username"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-black bg-white placeholder-gray-500"
          disabled={isSearching}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSearching || !username.trim()}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}

interface NFT {
  contract: string;
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  audio: string | null;
  audioMimeType?: string | null;
  isVideo: boolean;
  isAnimation: boolean;
  animationUrl?: string;
  metadata?: {
    name?: string;
    image?: string;
    image_url?: string;
    animation_url?: string;
    audio?: string;
    audio_url?: string;
    mimeType?: string;
    mime_type?: string;
    artwork?: {
      uri?: string;
    };
    properties?: {
      image?: string;
      audio?: string;
      audio_url?: string;
      audio_file?: string;
      animation_url?: string;
      category?: string;
      sound?: boolean;
      visual?: {
        url?: string;
      };
      soundContent?: {
        url?: string;
        mimeType?: string;
      };
      mimeType?: string;
      audio_mime_type?: string;
    };
  };
  collection?: {
    name: string;
    image?: string;
  };
  network: string;
}

interface NFTFile {
  type?: string;
  mimeType?: string;
  uri?: string;
  url?: string;
  name?: string;
}

interface AlchemyNFT {
  contract: {
    address: string;
    name?: string;
    openSea?: {
      imageUrl?: string;
    };
  };
  tokenId: string;
  title?: string;
  description?: string;
  metadata?: {
    name?: string;
    image?: string;
    image_url?: string;
    animation_url?: string;
    audio?: string;
    audio_url?: string;
    mimeType?: string;
    mime_type?: string;
    artwork?: {
      uri?: string;
    };
    properties?: {
      image?: string;
      audio?: string;
      audio_url?: string;
      audio_file?: string;
      animation_url?: string;
      category?: string;
      sound?: boolean;
      visual?: {
        url?: string;
      };
      soundContent?: {
        url?: string;
        mimeType?: string;
      };
      mimeType?: string;
      audio_mime_type?: string;
      files?: NFTFile[] | NFTFile;
    };
  };
  media?: Array<{
    gateway?: string;
  }>;
}

interface SearchResultProps {
  user: FarcasterUser;
  onSelect: (user: FarcasterUser) => void;
}

function SearchResults({ user, onSelect }: SearchResultProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-50" onClick={() => onSelect(user)}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden">
          <img
            src={user.pfp_url || `https://avatar.vercel.sh/${user.username}`}
            alt={user.display_name || user.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
              target.src = `https://avatar.vercel.sh/${user.username}`;
                  }}
                />
              </div>
              <div>
          <h3 className="font-bold text-gray-900">{user.display_name || user.username}</h3>
          <p className="text-gray-600">@{user.username}</p>
          <div className="flex gap-4 mt-1 text-sm text-gray-500">
            <span>{user.follower_count.toLocaleString()} followers</span>
            <span>{user.following_count.toLocaleString()} following</span>
              </div>
        </div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FarcasterUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<FarcasterUser | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);

  const handleSearch = async (username: string) => {
    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedUser(null);
    setUserDetails(null);
    setNfts([]);

    try {
      const neynarKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
      if (!neynarKey) {
        throw new Error('Neynar API key not configured');
      }

      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(username)}`,
        {
          headers: {
            'accept': 'application/json',
            'api_key': neynarKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Search Response:', data);

      if (!data.result?.users?.length) {
        throw new Error('No users found');
      }

      setSearchResults(data.result.users);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search for users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = async (user: FarcasterUser) => {
    setSelectedUser(user);
    setError(null);
    setNfts([]);
    setIsLoadingNFTs(true);

    try {
      const neynarKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
      if (!neynarKey) {
        throw new Error('Neynar API key not configured');
      }

      // First, get the user's verified addresses
      const verifiedResponse = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${user.fid}`,
        {
          headers: {
            'accept': 'application/json',
            'api_key': neynarKey
          }
        }
      );

      if (!verifiedResponse.ok) {
        throw new Error(`Failed to fetch user details: ${verifiedResponse.status}`);
      }

      const verifiedData = await verifiedResponse.json();
      console.log('Verified Data:', verifiedData);

      const verifiedAddresses = verifiedData.users?.[0]?.verifications || [];
      
      if (!verifiedAddresses.length) {
        setError('No verified addresses found for this user. The user needs to verify their Ethereum addresses on Farcaster to use this feature.');
        setIsLoadingNFTs(false);
        return;
      }

      // Get custody address
      const custodyResponse = await fetch(
        `https://api.neynar.com/v2/farcaster/custody/address?fid=${user.fid}`,
        {
          headers: {
            'accept': 'application/json',
            'api_key': neynarKey
          }
        }
      );

      const custodyData = await custodyResponse.json();
      console.log('Custody Data:', custodyData);

      const custodyAddress = custodyData.result?.custody_address;
      const allAddresses = [...new Set([
        ...(custodyAddress ? [custodyAddress] : []),
        ...verifiedAddresses
      ])];

      if (!allAddresses.length) {
        setError('No addresses found for this user.');
        setIsLoadingNFTs(false);
        return;
      }

      // Now fetch NFTs for all addresses
      const allNFTs: NFT[] = [];
      
      for (const address of allAddresses) {
        try {
          // Fetch from Ethereum Mainnet
          const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
          if (!alchemyKey) {
            throw new Error('Alchemy API key not configured');
          }

          const url = new URL(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}/getNFTs`);
          url.searchParams.append('owner', address);
          url.searchParams.append('withMetadata', 'true');
          url.searchParams.append('pageSize', '100');

          const nftResponse = await fetch(url.toString());
          const nftData = await nftResponse.json();
          console.log(`NFTs for address ${address}:`, nftData);

          if (nftData.ownedNfts) {
            const mappedNFTs = nftData.ownedNfts
              .map((nft: AlchemyNFT) => {
                // Enhanced audio content detection
                let audioUrl: string | null = null;
                const potentialAudioUrl = 
                  nft.metadata?.animation_url ||
                  nft.metadata?.audio ||
                  nft.metadata?.audio_url ||
                  nft.metadata?.properties?.audio ||
                  nft.metadata?.properties?.audio_url ||
                  nft.metadata?.properties?.audio_file ||
                  nft.metadata?.properties?.soundContent?.url ||
                  nft.metadata?.properties?.animation_url ||
                  (nft.metadata?.artwork?.uri?.includes('audio') ? nft.metadata.artwork.uri : null);

                if (potentialAudioUrl) {
                  audioUrl = potentialAudioUrl;
                }

                // Check if animation_url is an audio file
                if (!audioUrl && nft.metadata?.animation_url) {
                  const url = nft.metadata.animation_url.toLowerCase();
                  if (url.match(/\.(mp3|wav|ogg|m4a|aac)$/) || 
                      url.includes('audio') ||
                      nft.metadata?.properties?.mimeType?.includes('audio') ||
                      nft.metadata?.properties?.category === 'audio' ||
                      nft.metadata?.properties?.sound === true) {
                    audioUrl = nft.metadata.animation_url;
                  }
                }

                // Check for audio in files array if present
                if (!audioUrl && nft.metadata?.properties?.files) {
                  const files = Array.isArray(nft.metadata.properties.files) 
                    ? nft.metadata.properties.files 
                    : [nft.metadata.properties.files];
                  
                  const audioFile = files.find((f: NFTFile) => 
                    f.type?.toLowerCase()?.includes('audio') ||
                    f.mimeType?.toLowerCase()?.includes('audio') ||
                    f.uri?.toLowerCase()?.match(/\.(mp3|wav|m4a|ogg|aac)$/) ||
                    f.name?.toLowerCase()?.match(/\.(mp3|wav|m4a|ogg|aac)$/)
                  );
                  
                  if (audioFile) {
                    audioUrl = audioFile.uri || audioFile.url || null;
                  }
                }

                // Only include NFTs with audio content
                if (!audioUrl && 
                    !nft.metadata?.properties?.category?.toLowerCase()?.includes('audio') &&
                    !nft.metadata?.properties?.sound &&
                    !nft.metadata?.properties?.soundContent) {
                  return null;
                }

                // Transform URLs
                if (audioUrl) {
                  if (audioUrl.startsWith('ipfs://')) {
                    audioUrl = audioUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  } else if (audioUrl.startsWith('ar://')) {
                    audioUrl = audioUrl.replace('ar://', 'https://arweave.net/');
                  }
                }

                // Get image URL with enhanced artwork detection
                let imageUrl = 
                  nft.metadata?.artwork?.uri ||
                  nft.metadata?.image ||
                  nft.metadata?.image_url ||
                  nft.metadata?.properties?.image ||
                  nft.metadata?.properties?.visual?.url ||
                  nft.media?.[0]?.gateway;

                // Check for artwork in files array
                if (!imageUrl && nft.metadata?.properties?.files) {
                  const files = Array.isArray(nft.metadata.properties.files) 
                    ? nft.metadata.properties.files 
                    : [nft.metadata.properties.files];
                  
                  const imageFile = files.find((f: any) => 
                    f.type?.toLowerCase()?.includes('image') ||
                    f.mimeType?.toLowerCase()?.includes('image') ||
                    f.uri?.toLowerCase()?.match(/\.(jpg|jpeg|png|gif|webp)$/) ||
                    f.name?.toLowerCase()?.match(/\.(jpg|jpeg|png|gif|webp)$/)
                  );
                  
                  if (imageFile) {
                    imageUrl = imageFile.uri || imageFile.url;
                  }
                }

                // Transform image URLs
                if (imageUrl) {
                  if (imageUrl.startsWith('ipfs://')) {
                    imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  } else if (imageUrl.startsWith('ar://')) {
                    imageUrl = imageUrl.replace('ar://', 'https://arweave.net/');
                  }
                }

                // Fallback image if none found
                if (!imageUrl) {
                  imageUrl = `https://avatar.vercel.sh/${nft.title || nft.tokenId}`;
                }

                // Get audio mime type
                const audioMimeType = 
                  nft.metadata?.properties?.soundContent?.mimeType ||
                  nft.metadata?.properties?.mimeType ||
                  nft.metadata?.properties?.audio_mime_type ||
                  'audio/mpeg'; // fallback mime type

                return {
                  contract: nft.contract.address,
                  tokenId: nft.tokenId,
                  name: nft.title || nft.metadata?.name || `#${nft.tokenId}`,
                  description: nft.description,
                  image: imageUrl,
                  audio: audioUrl || null,
                  audioMimeType,
                  isVideo: false,
                  isAnimation: false,
                  metadata: nft.metadata,
                  collection: {
                    name: nft.contract.name || 'Unknown Collection',
                    image: nft.contract.openSea?.imageUrl
                  },
                  network: 'ethereum'
                };
              })
              .filter(Boolean);

            allNFTs.push(...mappedNFTs);
          }

          // Also check Base network
          const baseUrl = new URL(`https://base-mainnet.g.alchemy.com/v2/${alchemyKey}/getNFTs`);
          baseUrl.searchParams.append('owner', address);
          baseUrl.searchParams.append('withMetadata', 'true');
          baseUrl.searchParams.append('pageSize', '100');

          const baseNftResponse = await fetch(baseUrl.toString());
          const baseNftData = await baseNftResponse.json();
          console.log(`Base NFTs for address ${address}:`, baseNftData);

          if (baseNftData.ownedNfts) {
            const mappedBaseNFTs = baseNftData.ownedNfts
              .map((nft: AlchemyNFT) => {
                // Enhanced audio content detection
                let audioUrl: string | null = null;
                const potentialAudioUrl = 
                  nft.metadata?.animation_url ||
                  nft.metadata?.audio ||
                  nft.metadata?.audio_url ||
                  nft.metadata?.properties?.audio ||
                  nft.metadata?.properties?.audio_url ||
                  nft.metadata?.properties?.audio_file ||
                  nft.metadata?.properties?.soundContent?.url ||
                  nft.metadata?.properties?.animation_url ||
                  (nft.metadata?.artwork?.uri?.includes('audio') ? nft.metadata.artwork.uri : null);

                if (potentialAudioUrl) {
                  audioUrl = potentialAudioUrl;
                }

                // Check if animation_url is an audio file
                if (!audioUrl && nft.metadata?.animation_url) {
                  const url = nft.metadata.animation_url.toLowerCase();
                  if (url.match(/\.(mp3|wav|ogg|m4a|aac)$/) || 
                      url.includes('audio') ||
                      nft.metadata?.properties?.mimeType?.includes('audio') ||
                      nft.metadata?.properties?.category === 'audio' ||
                      nft.metadata?.properties?.sound === true) {
                    audioUrl = nft.metadata.animation_url;
                  }
                }

                // Check for audio in files array if present
                if (!audioUrl && nft.metadata?.properties?.files) {
                  const files = Array.isArray(nft.metadata.properties.files) 
                    ? nft.metadata.properties.files 
                    : [nft.metadata.properties.files];
                  
                  const audioFile = files.find((f: NFTFile) => 
                    f.type?.toLowerCase()?.includes('audio') ||
                    f.mimeType?.toLowerCase()?.includes('audio') ||
                    f.uri?.toLowerCase()?.match(/\.(mp3|wav|m4a|ogg|aac)$/) ||
                    f.name?.toLowerCase()?.match(/\.(mp3|wav|m4a|ogg|aac)$/)
                  );
                  
                  if (audioFile) {
                    audioUrl = audioFile.uri || audioFile.url || null;
                  }
                }

                // Only include NFTs with audio content
                if (!audioUrl && 
                    !nft.metadata?.properties?.category?.toLowerCase()?.includes('audio') &&
                    !nft.metadata?.properties?.sound &&
                    !nft.metadata?.properties?.soundContent) {
                  return null;
                }

                // Transform URLs
                if (audioUrl) {
                  if (audioUrl.startsWith('ipfs://')) {
                    audioUrl = audioUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  } else if (audioUrl.startsWith('ar://')) {
                    audioUrl = audioUrl.replace('ar://', 'https://arweave.net/');
                  }
                }

                // Get image URL with enhanced artwork detection
                let imageUrl = 
                  nft.metadata?.artwork?.uri ||
                  nft.metadata?.image ||
                  nft.metadata?.image_url ||
                  nft.metadata?.properties?.image ||
                  nft.metadata?.properties?.visual?.url ||
                  nft.media?.[0]?.gateway;

                // Check for artwork in files array
                if (!imageUrl && nft.metadata?.properties?.files) {
                  const files = Array.isArray(nft.metadata.properties.files) 
                    ? nft.metadata.properties.files 
                    : [nft.metadata.properties.files];
                  
                  const imageFile = files.find((f: any) => 
                    f.type?.toLowerCase()?.includes('image') ||
                    f.mimeType?.toLowerCase()?.includes('image') ||
                    f.uri?.toLowerCase()?.match(/\.(jpg|jpeg|png|gif|webp)$/) ||
                    f.name?.toLowerCase()?.match(/\.(jpg|jpeg|png|gif|webp)$/)
                  );
                  
                  if (imageFile) {
                    imageUrl = imageFile.uri || imageFile.url;
                  }
                }

                // Transform image URLs
                if (imageUrl) {
                  if (imageUrl.startsWith('ipfs://')) {
                    imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  } else if (imageUrl.startsWith('ar://')) {
                    imageUrl = imageUrl.replace('ar://', 'https://arweave.net/');
                  }
                }

                // Fallback image if none found
                if (!imageUrl) {
                  imageUrl = `https://avatar.vercel.sh/${nft.title || nft.tokenId}`;
                }

                // Get audio mime type
                const audioMimeType = 
                  nft.metadata?.properties?.soundContent?.mimeType ||
                  nft.metadata?.properties?.mimeType ||
                  nft.metadata?.properties?.audio_mime_type ||
                  'audio/mpeg'; // fallback mime type

                return {
                  contract: nft.contract.address,
                  tokenId: nft.tokenId,
                  name: nft.title || nft.metadata?.name || `#${nft.tokenId}`,
                  description: nft.description,
                  image: imageUrl,
                  audio: audioUrl || null,
                  audioMimeType,
                  isVideo: false,
                  isAnimation: false,
                  metadata: nft.metadata,
                  collection: {
                    name: nft.contract.name || 'Unknown Collection',
                    image: nft.contract.openSea?.imageUrl
                  },
                  network: 'base'
                };
              })
              .filter(Boolean);

            allNFTs.push(...mappedBaseNFTs);
          }
        } catch (err) {
          console.error(`Error fetching NFTs for address ${address}:`, err);
        }
      }

      setNfts(allNFTs);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  return (
    <div className="container mx-auto p-8 min-h-screen bg-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">
        Farcaster User Search
      </h1>

      <SearchBar onSearch={handleSearch} isSearching={isSearching} />

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold">Error</h3>
              <p className="text-sm">{error}</p>
              {error.includes('API access denied') && (
                <p className="text-sm mt-2">
                  Make sure you have set up your Neynar API key correctly in the environment variables.
                </p>
              )}
              {error.includes('No verified addresses') && (
                <p className="text-sm mt-2">
                  The user needs to verify their Ethereum addresses on Farcaster before their NFTs can be displayed.
                  This can be done through the Warpcast app or website.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isSearching && (
        <div className="text-center mb-8 text-white">
          Searching...
        </div>
      )}

      {/* Show search results if available */}
      {searchResults.length > 0 && !selectedUser && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Search Results</h2>
          {searchResults.map((user: FarcasterUser) => (
            <div 
              key={user.fid}
              className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-50"
              onClick={() => handleUserSelect(user)}
            >
          <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden">
              <img
                    src={user.pfp_url || `https://avatar.vercel.sh/${user.username}`}
                    alt={user.display_name || user.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://avatar.vercel.sh/${user.username}`;
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{user.display_name || user.username}</h3>
                  <p className="text-gray-600">@{user.username}</p>
                  <div className="flex gap-4 mt-1 text-sm text-gray-500">
                    <span>{user.follower_count.toLocaleString()} followers</span>
                    <span>{user.following_count.toLocaleString()} following</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show selected user profile and NFTs */}
      {selectedUser && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full border-2 border-purple-500 overflow-hidden">
                <img
                  src={selectedUser.pfp_url || `https://avatar.vercel.sh/${selectedUser.username}`}
                  alt={selectedUser.display_name || selectedUser.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://avatar.vercel.sh/${selectedUser.username}`;
                }}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                  {selectedUser.display_name || selectedUser.username}
              </h2>
                <p className="text-gray-600">@{selectedUser.username}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span className="font-medium">{selectedUser.follower_count.toLocaleString()} followers</span>
                  <span className="font-medium">{selectedUser.following_count.toLocaleString()} following</span>
              </div>
                {selectedUser.profile?.bio && (
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">
                    {typeof selectedUser.profile.bio === 'string' 
                      ? selectedUser.profile.bio 
                      : selectedUser.profile.bio.text}
                </p>
              )}
              </div>
            </div>

            {userDetails?.verified_addresses && userDetails.verified_addresses.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Connected Wallets</h3>
                <div className="space-y-3">
                  {userDetails.verified_addresses.map((address) => (
                    <div key={address} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-mono text-sm text-gray-600">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </span>
                          <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        </div>
                      </div>
                      <a
                        href={`https://etherscan.io/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                      >
                        View on Etherscan
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isLoadingNFTs ? (
            <div className="text-center text-white p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="mb-2">Loading NFTs from all connected wallets...</p>
              <p className="text-sm text-gray-300">This may take a few moments as we fetch all your NFTs.</p>
              <div className="mt-4 text-xs text-gray-400">
                Found {nfts.length} NFTs so far...
              </div>
            </div>
          ) : nfts.length > 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Audio NFTs ({nfts.length} found)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {nfts.map((nft, index) => (
                  <div key={`${nft.contract}-${nft.tokenId}-${index}`} 
                       className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative">
                      {nft.isVideo ? (
                        <video
                          className="w-full h-full object-cover"
                          loop
                          autoPlay
                          playsInline
                          muted
                          src={nft.animationUrl || nft.image}
                          onError={(e) => {
                            console.error('Video error:', e);
                            const target = e.target as HTMLVideoElement;
                            target.src = `https://avatar.vercel.sh/${nft.name}`;
                          }}
                        />
                      ) : nft.isAnimation ? (
                        <img
                          src={nft.animationUrl || nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://avatar.vercel.sh/${nft.name}`;
                          }}
                        />
                      ) : (
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://avatar.vercel.sh/${nft.name}`;
                          }}
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">{nft.name}</h4>
                      {nft.collection?.name && (
                        <p className="text-sm text-gray-600 mb-2">{nft.collection.name}</p>
                      )}
                      {nft.audio && (
                        <div className="mt-2 mb-3">
                          <div className="flex items-center gap-2">
                            <button 
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 w-full justify-center"
                              onClick={async (e) => {
                                const audioEl = e.currentTarget.parentElement?.querySelector('audio');
                                const button = e.currentTarget;
                                
                                if (audioEl) {
                                  try {
                                    // Stop all other playing audio elements first
                                    document.querySelectorAll('audio').forEach(audio => {
                                      if (audio !== audioEl) {
                                        audio.pause();
                                        const otherButton = audio.parentElement?.querySelector('button');
                                        if (otherButton) {
                                          otherButton.innerHTML = `
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Play Audio
                                          `;
                                        }
                                      }
                                    });

                                    if (audioEl.paused) {
                                      // Load the audio if not loaded
                                      if (audioEl.readyState === 0) {
                                        console.log('Loading audio:', nft.audio);
                                        let audioUrl = nft.audio;
                                        if (audioUrl?.startsWith('ar://')) {
                                          audioUrl = `https://arweave.net/${audioUrl.replace('ar://', '')}`;
                                        } else if (audioUrl?.startsWith('ipfs://')) {
                                          audioUrl = audioUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                                        }
                                        audioEl.src = audioUrl || '';
                                        await audioEl.load();
                                      }
                                      
                                      // Try to play
                                      console.log('Playing audio:', audioEl.src);
                                      const playPromise = audioEl.play();
                                      if (playPromise !== undefined) {
                                        await playPromise;
                                        button.innerHTML = `
                                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          Pause Audio
                                        `;
                                      }
                                    } else {
                                      audioEl.pause();
                                      button.innerHTML = `
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Play Audio
                                      `;
                                    }
                                  } catch (error) {
                                    console.error('Audio playback error:', error);
                                    // Try alternative URL format
                                    if (audioEl.src.includes('arweave.net')) {
                                      const newUrl = audioEl.src.replace('https://arweave.net/', 'https://ar.io/');
                                      console.log('Trying alternative URL:', newUrl);
                                      audioEl.src = newUrl;
                                      try {
                                        await audioEl.load();
                                        await audioEl.play();
                                        button.innerHTML = `
                                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          Pause Audio
                                        `;
                                      } catch (retryError) {
                                        console.error('Retry failed:', retryError);
                                        alert('Failed to play audio. Please try again.');
                                      }
                                    } else {
                                      alert('Failed to play audio. Please try again.');
                                    }
                                  }
                                }
                              }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Play Audio
                            </button>
                            <audio 
                              className="hidden"
                              preload="none"
                              onLoadStart={(e) => {
                                const audio = e.target as HTMLAudioElement;
                                console.log('Audio loading started:', {
                                  src: audio.src,
                                  nftName: nft.name,
                                  mimeType: nft.audioMimeType
                                });
                              }}
                              onError={(e) => {
                                const audio = e.target as HTMLAudioElement;
                                console.error('Audio error:', {
                                  src: audio.src,
                                  error: audio.error,
                                  nftName: nft.name,
                                  mimeType: nft.audioMimeType
                                });
                                // Try alternative URL format
                                if (audio.src.includes('arweave.net')) {
                                  const newUrl = audio.src.replace('https://arweave.net/', 'https://ar.io/');
                                  console.log('Trying alternative URL:', newUrl);
                                  audio.src = newUrl;
                                  audio.load();
                                }
                              }}
                              onEnded={(e) => {
                                const button = e.currentTarget.parentElement?.querySelector('button');
                                if (button) {
                                  button.innerHTML = `
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Play Audio
                                  `;
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">Token ID: #{nft.tokenId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : userDetails?.verified_addresses?.length ? (
            <div className="text-center text-white p-8">
              <p className="mb-2">No audio NFTs found in the connected wallets.</p>
              <p className="text-sm text-gray-300">Try searching for another user.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
