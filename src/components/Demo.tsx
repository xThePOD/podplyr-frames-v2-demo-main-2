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

function isNFTArtwork(artwork: string | NFTArtwork): artwork is NFTArtwork {
  return typeof artwork === 'object' && artwork !== null && ('uri' in artwork || 'url' in artwork);
}

interface NFTArtwork {
  uri?: string;
  url?: string;
  mimeType?: string;
}

type NFTArtworkType = string | NFTArtwork;

interface ArtworkObject {
  uri?: string;
  url?: string;
  mimeType?: string;
}

function isArtworkObject(artwork: unknown): artwork is ArtworkObject {
  if (typeof artwork !== 'object' || artwork === null) return false;
  const obj = artwork as { [key: string]: unknown };
  return (
    ('uri' in obj && (typeof obj['uri'] === 'string' || obj['uri'] === undefined)) ||
    ('url' in obj && (typeof obj['url'] === 'string' || obj['url'] === undefined))
  );
}

function getArtworkUrl(artwork: unknown): string | null {
  if (typeof artwork === 'string') {
    return artwork;
  }
  if (isArtworkObject(artwork)) {
    const obj = artwork as { [key: string]: string | undefined };
    const uri = 'uri' in obj ? obj['uri'] : undefined;
    const url = 'url' in obj ? obj['url'] : undefined;
    return uri || url || null;
  }
  return null;
}

interface NFTMetadata {
    name?: string;
    image?: string;
    image_url?: string;
    animation_url?: string;
    audio?: string;
    audio_url?: string;
    mimeType?: string;
    mime_type?: string;
    artwork?: unknown;
    content?: {
      mime?: string;
    };
    animation_details?: {
      format?: string;
      codecs?: string[];
      bytes?: number;
      duration?: number;
      width?: number;
      height?: number;
    };
    properties?: {
      image?: string;
      audio?: string;
      audio_url?: string;
      audio_file?: string;
      audio_mime_type?: string;
      animation_url?: string;
      video?: string;
      mimeType?: string;
      files?: NFTFile[] | NFTFile;
      category?: string;
      sound?: boolean;
      visual?: {
        url?: string;
      };
      soundContent?: {
        url?: string;
        mimeType?: string;
      };
    };
}

interface NFTFile {
  uri?: string;
  url?: string;
  type?: string;
  mimeType?: string;
  name?: string;
}

interface NFTMedia {
  gateway?: string;
  raw?: string;
  format?: string;
  bytes?: number;
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
  hasValidAudio: boolean;
  metadata?: NFTMetadata;
  collection?: {
    name: string;
    image?: string;
  };
  network: string;
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
  metadata?: NFTMetadata;
  media?: NFTMedia[];
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

  // Check if a URL points to a media file
  const isMediaUrl = (url: string): { isVideo: boolean; isAnimation: boolean } => {
    const videoExtensions = /\.(mp4|webm|mov|m4v)$/i;
    const animationExtensions = /\.(gif|webp|svg|html|glb|gltf)$/i;
    const videoMimeTypes = /(video|mp4|webm)/i;
    const animationMimeTypes = /(animation|gif|webp|svg|html|glb|gltf)/i;

    url = url.toLowerCase();

    // Check if the URL is a direct IPFS hash
    if (url.match(/^(Qm[1-9A-Za-z]{44}|bafy[A-Za-z0-9]{44})/)) {
      // For IPFS hashes without extensions, we'll try both video and animation
      return {
        isVideo: true,
        isAnimation: true
      };
    }

    // Extract IPFS hash if present
    let ipfsHash = '';
    if (url.startsWith('ipfs://')) {
      ipfsHash = url.replace('ipfs://', '');
    } else if (url.includes('/ipfs/')) {
      const parts = url.split('/ipfs/').filter(Boolean);
      ipfsHash = parts[parts.length - 1];
    }

    // If we have an IPFS hash, check for known video/animation hashes
    if (ipfsHash) {
      // Add specific checks for known NFTs
      if (ipfsHash.includes('bafybeicod3m7as3y7luyvfgc1ltnps235hhevt64xqmo3nyho') || // Brain Dead
          ipfsHash.includes('QmZ9VChCqz4syDHtmySPG6bJJpprqKjFSHAqhLyUcOKwY') ||    // Tomodachi Key
          ipfsHash.includes('QmSoY8ABbhRSp6B1xkbp17bpj7cqfadd9') ||               // Sunday Night
          ipfsHash.includes('QmWMegM1aWKgoLMGv4bGkzKopfr7vhrroz1oxbbk17bw') ||    // UP 5000 TO 50000
          ipfsHash.includes('bafybei') ||                                          // Common Base prefix
          ipfsHash.includes('qmq1dmd') ||                                         // AirOrb Level 1
          url.includes('ISLAND 221') ||                                            // ISLAND 221
          url.includes('Immutable Spirit') ||                                      // Immutable Spirit
          url.includes('AirOrb Level 1')) {                                        // AirOrb Level 1
        return {
          isVideo: true,
          isAnimation: false
        };
      }
    }

    // Check metadata for video indicators
    if (url.includes('animation_url') || 
        url.includes('mp4') || 
        url.includes('video') || 
        url.includes('animation') ||
        url.includes('png')) {  // Some NFTs use PNG format for animations
      return {
        isVideo: true,
        isAnimation: false
      };
    }

    return {
      isVideo: videoExtensions.test(url) || videoMimeTypes.test(url),
      isAnimation: animationExtensions.test(url) || animationMimeTypes.test(url)
    };
  };

  // Transform URLs helper function
  const processMediaUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    
    try {
      // Clean the URL first
      url = url.trim();

      // Handle base64 and data URLs
      if (url.startsWith('data:')) {
        return url;
      }

      // Handle Arweave URLs
      if (url.startsWith('ar://')) {
        return url.replace('ar://', 'https://arweave.net/');
      }
      if (url.includes('arweave.net/')) {
        return url;
      }

      // Extract IPFS hash from various URL formats
      let ipfsHash = '';

      // Handle IPFS URLs
      if (url.startsWith('ipfs://')) {
        ipfsHash = url.replace('ipfs://', '');
      } else if (url.includes('/ipfs/')) {
        const parts = url.split('/ipfs/').filter(Boolean);
        ipfsHash = parts[parts.length - 1];
      } else if (url.match(/^Qm[1-9A-Za-z]{44}/)) {
        ipfsHash = url;
      } else if (url.match(/^bafy[A-Za-z0-9]{44}/)) {
        ipfsHash = url;
      }

      if (ipfsHash) {
        // Clean up the hash
        ipfsHash = ipfsHash.split('?')[0].split('#')[0].replace(/\/$/, '');
        
        // Use a reliable gateway for known NFTs
        if (url.includes('ISLAND 221') || url.includes('Immutable Spirit') || url.includes('AirOrb Level 1')) {
          return `https://ipfs.io/ipfs/${ipfsHash}`;
        }
        
        // Use a smaller set of reliable gateways
        const gateways = [
          'https://ipfs.io/ipfs/',
          'https://cloudflare-ipfs.com/ipfs/',
          'https://nftstorage.link/ipfs/'
        ];

        // Try to prefetch from the first gateway
        const prefetchGateway = async () => {
          try {
            const url = `${gateways[0]}${ipfsHash}`;
            const response = await fetch(url, { 
              method: 'HEAD',
              cache: 'force-cache',
              signal: AbortSignal.timeout(2000) // 2 second timeout
            });
            if (response.ok) {
              return url;
            }
          } catch (e) {
            // Silently fail and let it use the default gateway
          }
        };

        // Start prefetch in background
        prefetchGateway().catch(() => {});
        
        // Return the first gateway immediately
        return `${gateways[0]}${ipfsHash}`;
      }

      // If it's a relative URL without protocol, assume https
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }

      return url;
    } catch (e) {
      console.error('Error processing URL:', url, e);
      return '';
    }
  };

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
                let hasValidAudio = false;

                // Check if the URL points to an audio file
                const isAudioUrl = (url: string): boolean => {
                  const audioExtensions = /\.(mp3|wav|ogg|m4a|aac)$/i;
                  const audioMimeTypes = /(audio|sound)/i;
                  return audioExtensions.test(url) || audioMimeTypes.test(url);
                };

                const potentialAudioUrl = 
                  nft.metadata?.animation_url ||
                  nft.metadata?.audio ||
                  nft.metadata?.audio_url ||
                  nft.metadata?.properties?.audio ||
                  nft.metadata?.properties?.audio_url ||
                  nft.metadata?.properties?.audio_file ||
                  nft.metadata?.properties?.soundContent?.url ||
                  nft.metadata?.properties?.animation_url ||
                  (isArtworkObject(nft.metadata?.artwork) && nft.metadata.artwork.uri?.includes('audio') ? nft.metadata.artwork.uri : null);

                if (potentialAudioUrl && isAudioUrl(potentialAudioUrl)) {
                  audioUrl = potentialAudioUrl;
                  hasValidAudio = true;
                }

                // Check for audio in files array if present
                if (!hasValidAudio && nft.metadata?.properties?.files) {
                  const files = Array.isArray(nft.metadata.properties.files) 
                    ? nft.metadata.properties.files 
                    : [nft.metadata.properties.files];
                  
                  const audioFile = files.find((f: NFTFile) => 
                    (f.type?.toLowerCase()?.includes('audio') ||
                    f.mimeType?.toLowerCase()?.includes('audio') ||
                    (f.uri && isAudioUrl(f.uri)) ||
                    (f.name && isAudioUrl(f.name)))
                  );
                  
                  if (audioFile && audioFile.uri && isAudioUrl(audioFile.uri)) {
                    audioUrl = audioFile.uri || audioFile.url || null;
                    hasValidAudio = true;
                  }
                }

                // Additional checks for audio content
                if (!hasValidAudio && (
                  nft.metadata?.properties?.category?.toLowerCase()?.includes('audio') ||
                  nft.metadata?.properties?.sound ||
                  nft.metadata?.mime_type?.toLowerCase()?.includes('audio')
                )) {
                  hasValidAudio = true;
                }

                // Get the visual representation
                let imageUrl = null;
                let animationUrl = null;
                let isVideo = false;
                let isAnimation = false;

                // Check for animation content first
                if (nft.metadata?.animation_url) {
                  const url = nft.metadata.animation_url.toLowerCase();
                  const mimeType = (nft.metadata?.properties?.mimeType || nft.metadata?.content?.mime || '').toLowerCase();
                  
                  console.log('NFT Animation Check:', {
                    name: nft.title || nft.metadata?.name,
                    animation_url: url,
                    mimeType: mimeType,
                    metadata: nft.metadata,
                    media: nft.media
                  });

                  // Process the URL first
                  const processedUrl = processMediaUrl(nft.metadata.animation_url);
                  const mediaType = isMediaUrl(processedUrl);

                  if (mediaType.isVideo || 
                      mimeType.includes('video') ||
                      nft.metadata?.properties?.category?.toLowerCase()?.includes('video') ||
                      nft.metadata?.animation_details?.format?.toLowerCase() === 'mp4' ||
                      nft.metadata?.animation_details?.codecs?.includes('H.264')) {
                    console.log('Detected as Video:', nft.title || nft.metadata?.name);
                    isVideo = true;
                    animationUrl = processedUrl;
                  } 
                  else if (mediaType.isAnimation || 
                          mimeType.includes('animation') ||
                          nft.metadata?.properties?.category?.toLowerCase()?.includes('animation')) {
                    console.log('Detected as Animation:', nft.title || nft.metadata?.name);
                    isAnimation = true;
                    animationUrl = processedUrl;
                  }
                }

                // Also check media array for animations
                if (!isVideo && !isAnimation && nft.media) {
                  console.log('Checking media array:', {
                    name: nft.title || nft.metadata?.name,
                    media: nft.media
                  });

                  const mediaItem = nft.media.find(m => {
                    const format = (m.format || '').toLowerCase();
                    const gateway = (m.gateway || '').toLowerCase();
                    const raw = (m.raw || '').toLowerCase();
                    
                    // Process URLs
                    const gatewayUrl = processMediaUrl(gateway);
                    const rawUrl = processMediaUrl(raw);
                    
                    // Check both URLs
                    const gatewayType = isMediaUrl(gatewayUrl);
                    const rawType = isMediaUrl(rawUrl);
                    
                    const isAnimated = gatewayType.isVideo || gatewayType.isAnimation || 
                                     rawType.isVideo || rawType.isAnimation ||
                                     format.includes('video') ||
                                     format.includes('animation');

                    if (isAnimated) {
                      console.log('Found animated media:', {
                        name: nft.title || nft.metadata?.name,
                        format,
                        gateway: gatewayUrl,
                        raw: rawUrl
                      });
                    }
                    
                    return isAnimated;
                  });
                  
                  if (mediaItem) {
                    const format = mediaItem.format?.toLowerCase() || '';
                    const url = processMediaUrl(mediaItem.gateway || mediaItem.raw || '');
                    const mediaType = isMediaUrl(url);
                    
                    if (mediaType.isVideo || format.includes('video')) {
                      console.log('Media item detected as Video:', nft.title || nft.metadata?.name);
                      isVideo = true;
                      animationUrl = url;
                    } else {
                      console.log('Media item detected as Animation:', nft.title || nft.metadata?.name);
                      isAnimation = true;
                      animationUrl = url;
                    }
                  }
                }

                // Get image URL with enhanced artwork detection
                const artwork = nft.metadata?.artwork as { uri?: string; url?: string } | undefined;
                imageUrl = 
                  artwork?.uri ||
                  artwork?.url ||
                  nft.metadata?.image ||
                  nft.metadata?.image_url ||
                  nft.metadata?.properties?.image ||
                  nft.metadata?.properties?.visual?.url ||
                  nft.media?.[0]?.gateway ||
                  nft.media?.[0]?.raw;

                // Transform URLs
                if (imageUrl) {
                  imageUrl = processMediaUrl(imageUrl);
                }

                if (animationUrl) {
                  animationUrl = processMediaUrl(animationUrl);
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
                  isVideo,
                  isAnimation,
                  animationUrl,
                  hasValidAudio,
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
                let hasValidAudio = false;

                // Check if the URL points to an audio file
                const isAudioUrl = (url: string): boolean => {
                  const audioExtensions = /\.(mp3|wav|ogg|m4a|aac)$/i;
                  const audioMimeTypes = /(audio|sound)/i;
                  return audioExtensions.test(url) || audioMimeTypes.test(url);
                };

                const potentialAudioUrl = 
                  nft.metadata?.animation_url ||
                  nft.metadata?.audio ||
                  nft.metadata?.audio_url ||
                  nft.metadata?.properties?.audio ||
                  nft.metadata?.properties?.audio_url ||
                  nft.metadata?.properties?.audio_file ||
                  nft.metadata?.properties?.soundContent?.url ||
                  nft.metadata?.properties?.animation_url ||
                  (isArtworkObject(nft.metadata?.artwork) && nft.metadata.artwork.uri?.includes('audio') ? nft.metadata.artwork.uri : null);

                if (potentialAudioUrl && isAudioUrl(potentialAudioUrl)) {
                  audioUrl = potentialAudioUrl;
                  hasValidAudio = true;
                }

                // Check for audio in files array if present
                if (!hasValidAudio && nft.metadata?.properties?.files) {
                  const files = Array.isArray(nft.metadata.properties.files) 
                    ? nft.metadata.properties.files 
                    : [nft.metadata.properties.files];
                  
                  const audioFile = files.find((f: NFTFile) => 
                    (f.type?.toLowerCase()?.includes('audio') ||
                    f.mimeType?.toLowerCase()?.includes('audio') ||
                    (f.uri && isAudioUrl(f.uri)) ||
                    (f.name && isAudioUrl(f.name)))
                  );
                  
                  if (audioFile && audioFile.uri && isAudioUrl(audioFile.uri)) {
                    audioUrl = audioFile.uri || audioFile.url || null;
                    hasValidAudio = true;
                  }
                }

                // Additional checks for audio content
                if (!hasValidAudio && (
                  nft.metadata?.properties?.category?.toLowerCase()?.includes('audio') ||
                  nft.metadata?.properties?.sound ||
                  nft.metadata?.mime_type?.toLowerCase()?.includes('audio')
                )) {
                  hasValidAudio = true;
                }

                // Get the visual representation
                let imageUrl = null;
                let animationUrl = null;
                let isVideo = false;
                let isAnimation = false;

                // Check for animation content first
                if (nft.metadata?.animation_url) {
                  const url = nft.metadata.animation_url.toLowerCase();
                  const mimeType = (nft.metadata?.properties?.mimeType || nft.metadata?.content?.mime || '').toLowerCase();
                  
                  console.log('NFT Animation Check:', {
                    name: nft.title || nft.metadata?.name,
                    animation_url: url,
                    mimeType: mimeType,
                    metadata: nft.metadata,
                    media: nft.media
                  });

                  // Process the URL first
                  const processedUrl = processMediaUrl(nft.metadata.animation_url);
                  const mediaType = isMediaUrl(processedUrl);

                  if (mediaType.isVideo || 
                      mimeType.includes('video') ||
                      nft.metadata?.properties?.category?.toLowerCase()?.includes('video') ||
                      nft.metadata?.animation_details?.format?.toLowerCase() === 'mp4' ||
                      nft.metadata?.animation_details?.codecs?.includes('H.264')) {
                    console.log('Detected as Video:', nft.title || nft.metadata?.name);
                    isVideo = true;
                    animationUrl = processedUrl;
                  } 
                  else if (mediaType.isAnimation || 
                          mimeType.includes('animation') ||
                          nft.metadata?.properties?.category?.toLowerCase()?.includes('animation')) {
                    console.log('Detected as Animation:', nft.title || nft.metadata?.name);
                    isAnimation = true;
                    animationUrl = processedUrl;
                  }
                }

                // Also check media array for animations
                if (!isVideo && !isAnimation && nft.media) {
                  console.log('Checking media array:', {
                    name: nft.title || nft.metadata?.name,
                    media: nft.media
                  });

                  const mediaItem = nft.media.find(m => {
                    const format = (m.format || '').toLowerCase();
                    const gateway = (m.gateway || '').toLowerCase();
                    const raw = (m.raw || '').toLowerCase();
                    
                    // Process URLs
                    const gatewayUrl = processMediaUrl(gateway);
                    const rawUrl = processMediaUrl(raw);
                    
                    // Check both URLs
                    const gatewayType = isMediaUrl(gatewayUrl);
                    const rawType = isMediaUrl(rawUrl);
                    
                    const isAnimated = gatewayType.isVideo || gatewayType.isAnimation || 
                                     rawType.isVideo || rawType.isAnimation ||
                                     format.includes('video') ||
                                     format.includes('animation');

                    if (isAnimated) {
                      console.log('Found animated media:', {
                        name: nft.title || nft.metadata?.name,
                        format,
                        gateway: gatewayUrl,
                        raw: rawUrl
                      });
                    }
                    
                    return isAnimated;
                  });
                  
                  if (mediaItem) {
                    const format = mediaItem.format?.toLowerCase() || '';
                    const url = processMediaUrl(mediaItem.gateway || mediaItem.raw || '');
                    const mediaType = isMediaUrl(url);
                    
                    if (mediaType.isVideo || format.includes('video')) {
                      console.log('Media item detected as Video:', nft.title || nft.metadata?.name);
                      isVideo = true;
                      animationUrl = url;
                    } else {
                      console.log('Media item detected as Animation:', nft.title || nft.metadata?.name);
                      isAnimation = true;
                      animationUrl = url;
                    }
                  }
                }

                // Get image URL with enhanced artwork detection
                const artwork = nft.metadata?.artwork as { uri?: string; url?: string } | undefined;
                imageUrl = 
                  artwork?.uri ||
                  artwork?.url ||
                  nft.metadata?.image ||
                  nft.metadata?.image_url ||
                  nft.metadata?.properties?.image ||
                  nft.metadata?.properties?.visual?.url ||
                  nft.media?.[0]?.gateway ||
                  nft.media?.[0]?.raw;

                // Transform URLs
                if (imageUrl) {
                  imageUrl = processMediaUrl(imageUrl);
                }

                if (animationUrl) {
                  animationUrl = processMediaUrl(animationUrl);
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
                  isVideo,
                  isAnimation,
                  animationUrl,
                  hasValidAudio,
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

  // Enhanced error handling for media elements
  const handleMediaError = (e: any, type: string, fallbackUrl?: string) => {
    console.error(`${type} loading error:`, e, {
      element: e.target,
      src: e.target.src,
      error: e.error
    });

    const target = e.target;
    const currentSrc = target.src;

    // Try different IPFS gateways in sequence
    if (currentSrc.includes('cloudflare-ipfs.com')) {
      target.src = currentSrc.replace('cloudflare-ipfs.com', 'nftstorage.link');
    } else if (currentSrc.includes('nftstorage.link')) {
      target.src = currentSrc.replace('nftstorage.link', 'dweb.link');
    } else if (currentSrc.includes('dweb.link')) {
      target.src = currentSrc.replace('dweb.link', 'ipfs.io');
    } else if (currentSrc.includes('ipfs.io')) {
      if (fallbackUrl) {
        target.src = fallbackUrl;
      } else {
        target.src = `https://avatar.vercel.sh/${Math.random().toString(36).substring(7)}`;
      }
    } else if (fallbackUrl) {
      target.src = fallbackUrl;
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">NFTs ({nfts.length} found)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {nfts.map((nft, index) => (
                  <div key={`${nft.contract}-${nft.tokenId}-${index}`} 
                       className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {(() => {
                        console.log('Rendering NFT:', {
                          name: nft.name,
                          isVideo: nft.isVideo,
                          isAnimation: nft.isAnimation,
                          animationUrl: nft.animationUrl,
                          image: nft.image
                        });
                        return null;
                      })()}
                      {nft.isVideo && nft.animationUrl ? (
                        <div className="relative w-full h-full">
                          <video
                            key={nft.animationUrl}
                            src={nft.animationUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                            controls={false}
                            style={{ opacity: 0 }}
                            preload="auto"
                            crossOrigin="anonymous"
                            onCanPlay={(e) => {
                              const video = e.currentTarget;
                              video.style.opacity = '1';
                              // Force play with multiple attempts
                              const attemptPlay = async () => {
                                try {
                                  await video.play();
                                } catch (error) {
                                  console.error('Video autoplay failed:', error);
                                  // Try again with muted
                                  video.muted = true;
                                  try {
                                    await video.play();
                                  } catch (e) {
                                    console.error('Muted video autoplay failed:', e);
                                    // One final attempt with inline playback
                                    video.setAttribute('playsinline', '');
                                    video.setAttribute('webkit-playsinline', '');
                                    try {
                                      await video.play();
                                    } catch (finalError) {
                                      console.error('Final video autoplay attempt failed:', finalError);
                                      // Try one last time with a timeout
                                      setTimeout(async () => {
                                        try {
                                          await video.play();
                                        } catch (lastError) {
                                          console.error('Last attempt failed:', lastError);
                                        }
                                      }, 1000);
                                    }
                                  }
                                }
                              };
                              attemptPlay();
                            }}
                            onLoadStart={() => {
                              console.log('Video load started:', {
                                name: nft.name,
                                url: nft.animationUrl,
                                metadata: nft.metadata
                              });
                            }}
                            onError={(e) => {
                              console.error('Video loading error:', {
                                nft: nft.name,
                                url: nft.animationUrl,
                                error: e,
                                metadata: nft.metadata,
                                currentSrc: e.currentTarget.src
                              });
                              const target = e.currentTarget;
                              const currentSrc = target.src;

                              // Special handling for known NFTs
                              if (nft.name.includes('ISLAND 221') || nft.name.includes('Immutable Spirit')) {
                                // Try direct gateway access
                                const ipfsHash = currentSrc.split('/ipfs/').pop()?.split('?')[0];
                                if (ipfsHash) {
                                  const gateways = [
                                    'https://ipfs.io/ipfs/',
                                    'https://cloudflare-ipfs.com/ipfs/',
                                    'https://nftstorage.link/ipfs/',
                                    'https://dweb.link/ipfs/',
                                    'https://gateway.pinata.cloud/ipfs/'
                                  ];
                                  
                                  // Try each gateway in sequence
                                  const tryNextGateway = async (index = 0) => {
                                    if (index < gateways.length) {
                                      const newUrl = `${gateways[index]}${ipfsHash}`;
                                      console.log(`Trying gateway ${index + 1}/${gateways.length}:`, newUrl);
                                      target.src = newUrl;
                                      
                                      // Set up listener for next error
                                      target.onerror = () => {
                                        console.log(`Gateway ${index + 1} failed, trying next...`);
                                        tryNextGateway(index + 1);
                                      };
                                    } else if (nft.image) {
                                      console.log('All gateways failed, falling back to static image');
                                      target.style.display = 'none';
                                      const img = target.parentElement?.querySelector('img');
                                      if (img) {
                                        img.style.display = 'block';
                                        img.src = nft.image;
                                      }
                                    }
                                  };
                                  
                                  tryNextGateway();
                                  return;
                                }
                              }

                              // Standard gateway fallback for other NFTs
                              let newSrc = currentSrc;
                              if (currentSrc.includes('cloudflare-ipfs.com')) {
                                newSrc = currentSrc.replace('cloudflare-ipfs.com', 'ipfs.io');
                              } else if (currentSrc.includes('ipfs.io')) {
                                newSrc = currentSrc.replace('ipfs.io', 'nftstorage.link');
                              } else if (currentSrc.includes('nftstorage.link')) {
                                newSrc = currentSrc.replace('nftstorage.link', 'dweb.link');
                              } else if (currentSrc.includes('dweb.link')) {
                                newSrc = currentSrc.replace('dweb.link', 'gateway.pinata.cloud');
                              } else if (nft.image) {
                                console.log('Falling back to static image');
                                target.style.display = 'none';
                                const img = target.parentElement?.querySelector('img');
                                if (img) {
                                  img.style.display = 'block';
                                  img.src = nft.image;
                                }
                                return;
                              }

                              if (newSrc !== currentSrc) {
                                console.log('Trying new gateway:', newSrc);
                                target.src = newSrc;
                              }
                            }}
                          />
                          {/* Preload image for faster fallback */}
                          <link rel="preload" as="image" href={nft.image} />
                          {/* Fallback image that's hidden by default */}
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover absolute inset-0"
                            style={{ display: 'none' }}
                            loading="eager"
                            crossOrigin="anonymous"
                          />
                        </div>
                      ) : nft.isAnimation && nft.animationUrl ? (
                        <div className="relative w-full h-full">
                          {(() => {
                            console.log('Rendering animation:', {
                              name: nft.name,
                              url: nft.animationUrl,
                              type: nft.animationUrl.split('.').pop()?.toLowerCase(),
                              metadata: nft.metadata
                            });
                            return null;
                          })()}
                          {nft.animationUrl.toLowerCase().endsWith('.svg') ? (
                            <object
                              key={nft.animationUrl}
                              data={nft.animationUrl}
                              type="image/svg+xml"
                              className="w-full h-full object-cover"
                            >
                              <img
                                src={nft.image}
                                alt={nft.name}
                                className="w-full h-full object-cover"
                                loading="eager"
                              />
                            </object>
                          ) : nft.animationUrl.toLowerCase().endsWith('.html') ? (
                            <iframe
                              key={nft.animationUrl}
                              src={nft.animationUrl}
                              className="w-full h-full border-0"
                              sandbox="allow-scripts allow-same-origin"
                              loading="eager"
                            />
                          ) : nft.animationUrl.toLowerCase().match(/\.(gif|webp)$/) ? (
                            <div className="relative w-full h-full">
                              <img
                                key={nft.animationUrl}
                                src={nft.animationUrl}
                                alt={nft.name}
                                className="w-full h-full object-cover"
                                style={{ opacity: 0 }}
                                loading="eager"
                                onLoad={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                                onError={(e) => {
                                  console.error('Animation loading error:', {
                                    nft: nft.name,
                                    url: nft.animationUrl,
                                    error: e,
                                    metadata: nft.metadata,
                                    currentSrc: e.currentTarget.src
                                  });
                                  const target = e.currentTarget;
                                  const currentSrc = target.src;

                                  // Try different IPFS gateways in sequence
                                  if (currentSrc.includes('cloudflare-ipfs.com')) {
                                    target.src = currentSrc.replace('cloudflare-ipfs.com', 'nftstorage.link');
                                  } else if (currentSrc.includes('nftstorage.link')) {
                                    target.src = currentSrc.replace('nftstorage.link', 'dweb.link');
                                  } else if (currentSrc.includes('dweb.link')) {
                                    target.src = currentSrc.replace('dweb.link', 'ipfs.io');
                                  } else if (currentSrc.includes('ipfs.io')) {
                                    target.src = currentSrc.replace('ipfs.io', 'gateway.pinata.cloud');
                                  } else if (nft.image) {
                                    console.log('Falling back to static image');
                                    // If all IPFS gateways fail, fallback to image
                                    target.style.display = 'none';
                                    const img = target.parentElement?.querySelector('img');
                                    if (img) {
                                      img.style.display = 'block';
                                      img.src = nft.image;
                                    } else {
                                      // Create and append fallback image if it doesn't exist
                                      const fallbackImg = document.createElement('img');
                                      fallbackImg.src = nft.image;
                                      fallbackImg.alt = nft.name;
                                      fallbackImg.className = 'w-full h-full object-cover';
                                      target.parentElement?.appendChild(fallbackImg);
                                    }
                                  }
                                }}
                              />
                              {/* Preload image for faster fallback */}
                              <link rel="preload" as="image" href={nft.image} />
                              {/* Fallback image that's hidden by default */}
                              <img
                                src={nft.image}
                                alt={nft.name}
                                className="w-full h-full object-cover absolute inset-0"
                                style={{ display: 'none' }}
                                loading="eager"
                              />
                            </div>
                          ) : (
                            // For other animation types, try video first
                            <div className="relative w-full h-full">
                              <video
                                key={nft.animationUrl}
                                src={nft.animationUrl}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                                controls={false}
                                style={{ opacity: 0 }}
                                preload="auto"
                                onCanPlay={(e) => {
                                  const video = e.currentTarget;
                                  video.style.opacity = '1';
                                  const playPromise = video.play();
                                  if (playPromise !== undefined) {
                                    playPromise.catch((error: Error) => {
                                      console.error('Animation video autoplay failed:', error);
                                      video.muted = true;
                                      video.play().catch(e => console.error('Muted animation video autoplay failed:', e));
                                    });
                                  }
                                }}
                                onLoadStart={() => {
                                  console.log('Animation video load started:', {
                                    name: nft.name,
                                    url: nft.animationUrl,
                                    metadata: nft.metadata
                                  });
                                }}
                                onError={(e) => {
                                  console.error('Animation video loading error:', {
                                    nft: nft.name,
                                    url: nft.animationUrl,
                                    error: e,
                                    metadata: nft.metadata,
                                    currentSrc: e.currentTarget.src
                                  });
                                  const target = e.currentTarget;
                                  const currentSrc = target.src;

                                  // Try different IPFS gateways in sequence
                                  if (currentSrc.includes('cloudflare-ipfs.com')) {
                                    target.src = currentSrc.replace('cloudflare-ipfs.com', 'nftstorage.link');
                                  } else if (currentSrc.includes('nftstorage.link')) {
                                    target.src = currentSrc.replace('nftstorage.link', 'dweb.link');
                                  } else if (currentSrc.includes('dweb.link')) {
                                    target.src = currentSrc.replace('dweb.link', 'ipfs.io');
                                  } else if (currentSrc.includes('ipfs.io')) {
                                    target.src = currentSrc.replace('ipfs.io', 'gateway.pinata.cloud');
                                  } else if (currentSrc.includes('gateway.pinata.cloud')) {
                                    target.src = currentSrc.replace('gateway.pinata.cloud', 'ipfs.eth.aragon.network');
                                  } else if (currentSrc.includes('ipfs.eth.aragon.network')) {
                                    target.src = currentSrc.replace('ipfs.eth.aragon.network', 'gateway.ipfs.io');
                                  } else if (currentSrc.includes('gateway.ipfs.io')) {
                                    target.src = currentSrc.replace('gateway.ipfs.io', 'hardbin.com');
                                  } else if (currentSrc.includes('hardbin.com')) {
                                    target.src = currentSrc.replace('hardbin.com', 'ipfs.fleek.co');
                                  } else if (currentSrc.includes('ipfs.fleek.co')) {
                                    target.src = currentSrc.replace('ipfs.fleek.co', 'ipfs.best-practice.se');
                                  } else if (nft.image) {
                                    console.log('Falling back to static image');
                                    // If all IPFS gateways fail, fallback to image
                                    target.style.display = 'none';
                                    const img = target.parentElement?.querySelector('img');
                                    if (img) {
                                      img.style.display = 'block';
                                      img.src = nft.image;
                                    } else {
                                      // Create and append fallback image if it doesn't exist
                                      const fallbackImg = document.createElement('img');
                                      fallbackImg.src = nft.image;
                                      fallbackImg.alt = nft.name;
                                      fallbackImg.className = 'w-full h-full object-cover';
                                      target.parentElement?.appendChild(fallbackImg);
                                    }
                                  }
                                }}
                              />
                              {/* Preload image for faster fallback */}
                              <link rel="preload" as="image" href={nft.image} />
                              {/* Fallback image that's hidden by default */}
                              <img
                                src={nft.image}
                                alt={nft.name}
                                className="w-full h-full object-cover absolute inset-0"
                                style={{ display: 'none' }}
                                loading="eager"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <img
                          key={nft.image}
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image loading error:', {
                              nft: nft.name,
                              url: nft.image,
                              error: e,
                              metadata: nft.metadata,
                              currentSrc: e.currentTarget.src
                            });
                            const target = e.currentTarget;
                            const currentSrc = target.src;

                            // Try different IPFS gateways in sequence
                            if (currentSrc.includes('cloudflare-ipfs.com')) {
                              console.log('Trying nftstorage.link gateway');
                              target.src = currentSrc.replace('cloudflare-ipfs.com', 'nftstorage.link');
                            } else if (currentSrc.includes('nftstorage.link')) {
                              console.log('Trying dweb.link gateway');
                              target.src = currentSrc.replace('nftstorage.link', 'dweb.link');
                            } else if (currentSrc.includes('dweb.link')) {
                              console.log('Trying ipfs.io gateway');
                              target.src = currentSrc.replace('dweb.link', 'ipfs.io');
                            } else {
                              console.log('Using fallback avatar');
                              target.src = `https://avatar.vercel.sh/${nft.name}`;
                            }
                          }}
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">{nft.name}</h4>
                      {nft.collection?.name && (
                        <p className="text-sm text-gray-600 mb-2">{nft.collection.name}</p>
                      )}
                      {nft.audio && nft.hasValidAudio && (
                        <div className="mt-2 mb-3">
                          <div className="flex items-center gap-2">
                            <button 
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 w-full justify-center"
                              onClick={(e) => {
                                const audioEl = e.currentTarget.parentElement?.querySelector('audio');
                                if (audioEl) {
                                  if (audioEl.paused) {
                                    // Stop all other audio elements first
                                    document.querySelectorAll('audio').forEach(audio => {
                                      if (audio !== audioEl) {
                                        audio.pause();
                                        audio.currentTime = 0;
                                      }
                                    });
                                    audioEl.play().catch(error => {
                                      console.error('Audio playback error:', error);
                                      // Try alternative IPFS gateway
                                      if (audioEl.src.includes('nftstorage.link')) {
                                        audioEl.src = audioEl.src.replace('nftstorage.link', 'cloudflare-ipfs.com');
                                      } else if (audioEl.src.includes('cloudflare-ipfs.com')) {
                                        audioEl.src = audioEl.src.replace('cloudflare-ipfs.com', 'dweb.link');
                                      } else if (audioEl.src.includes('dweb.link')) {
                                        audioEl.src = audioEl.src.replace('dweb.link', 'ipfs.io');
                                      }
                                      audioEl.play().catch(e => console.error('Final audio playback attempt failed:', e));
                                    });
                                  } else {
                                    audioEl.pause();
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
                              key={nft.audio}
                              className="hidden"
                              preload="metadata"
                              src={nft.audio}
                              onError={(e) => {
                                console.error('Audio loading error:', e);
                                const target = e.currentTarget;
                                const currentSrc = target.src;

                                // Try different IPFS gateways in sequence
                                if (currentSrc.includes('nftstorage.link')) {
                                  target.src = currentSrc.replace('nftstorage.link', 'cloudflare-ipfs.com');
                                } else if (currentSrc.includes('cloudflare-ipfs.com')) {
                                  target.src = currentSrc.replace('cloudflare-ipfs.com', 'dweb.link');
                                } else if (currentSrc.includes('dweb.link')) {
                                  target.src = currentSrc.replace('dweb.link', 'ipfs.io');
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">Token ID: #{nft.tokenId}</span>
                        {nft.network && (
                          <span className={`text-xs px-2 py-1 rounded ${nft.network === 'ethereum' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {nft.network === 'ethereum' ? 'Ethereum' : 'Base'}
                          </span>
                        )}
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
