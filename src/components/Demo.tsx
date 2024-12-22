"use client";

import { useState, useEffect, useRef } from "react";
import AudioVisualizer from "./AudioVisualizer";

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
  verifiedAddresses?: string[];
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
  const [suggestions, setSuggestions] = useState<FarcasterUser[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (username.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const neynarKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
        if (!neynarKey) return;

        const response = await fetch(
          `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(username)}`,
          {
            headers: {
              'accept': 'application/json',
              'api_key': neynarKey
            }
          }
        );

        const data = await response.json();
        if (data.result?.users) {
          const mappedSuggestions = data.result.users.map((user: any) => ({
            fid: user.fid,
            username: user.username,
            display_name: user.display_name || user.username,
            pfp_url: user.pfp_url || 'https://avatar.vercel.sh/' + user.username,
            follower_count: user.follower_count || 0,
            following_count: user.following_count || 0
          })).slice(0, 5); // Limit to 5 suggestions
          setSuggestions(mappedSuggestions);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSearch(username.trim());
      setSuggestions([]); // Clear suggestions after search
    }
  };

  const handleSuggestionClick = (selectedUsername: string) => {
    setUsername(selectedUsername);
    onSearch(selectedUsername);
    setSuggestions([]); // Clear suggestions after selection
  };

  return (
    <div className="relative mb-8">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Farcaster username..."
            className="flex-1 px-4 py-2 rounded-lg text-black placeholder-gray-500"
          disabled={isSearching}
        />
        <button
          type="submit"
            disabled={isSearching}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>

      {suggestions.length > 0 && (
        <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-10">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.fid}
              onClick={() => handleSuggestionClick(suggestion.username)}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-100 text-left"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={suggestion.pfp_url}
                  alt={suggestion.display_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://avatar.vercel.sh/${suggestion.username}`;
                  }}
                />
              </div>
              <div>
                <div className="font-medium text-gray-900">{suggestion.display_name}</div>
                <div className="text-sm text-gray-600">@{suggestion.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
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
  animationUrl?: string;
  audio?: string;
  hasValidAudio?: boolean;
  isVideo?: boolean;
  isAnimation?: boolean;
  collection?: {
    name: string;
    image?: string;
  };
  metadata?: any;
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

const retroStyles = `
  @keyframes scanline {
    0% {
      transform: translateY(-100%);
    }
    100% {
      transform: translateY(100%);
    }
  }

  .bg-scanline {
    background: linear-gradient(
      to bottom,
      transparent 50%,
      rgba(255, 255, 255, 0.1) 50%
    );
    background-size: 100% 4px;
    animation: scanline 8s linear infinite;
  }
`;

const RetroStyles = () => (
  <style jsx global>
    {retroStyles}
  </style>
);

// Move utility functions before MediaRenderer component
const isMediaUrl = (url: string): { isVideo: boolean; isAnimation: boolean } => {
  if (!url) return { isVideo: false, isAnimation: false };
  
  const videoExtensions = /\.(mp4|webm|mov|m4v)$/i;
  const animationExtensions = /\.(gif|webp|svg|html|glb|gltf)$/i;
  const videoMimeTypes = /(video|mp4|webm)/i;
  const animationMimeTypes = /(animation|gif|webp|svg|html|glb|gltf)/i;

  url = url.toLowerCase();

  // Special handling for known NFTs
  if (url.includes('Relic in Spring') || 
      url.includes('ISLAND 221') || 
      url.includes('Brain Dead') ||
      url.includes('AirOrb Level 1') ||
      url.includes('Different Time') ||
      url.includes('QQG1CNQBUNRFk9NmrkLyMksfmZhRPL2B_ScatZGNO') ||
      url.includes('ar://') ||
      url.includes('animation_url') ||
      url.includes('video') ||
      url.includes('animation')) {
    return {
      isVideo: true,
      isAnimation: true
    };
  }

  // Check if the URL is a direct IPFS hash
  if (url.match(/^(Qm[1-9A-Za-z]{44}|bafy[A-Za-z0-9]{44})/)) {
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
    if (ipfsHash.includes('bafybeicod3m7as3y7luyvfgc1ltnps235hhevt64xqmo3nyho') || // Brain Dead
        ipfsHash.includes('QmZ9VChCqz4syDHtmySPG6bJJpprqKjFSHAqhLyUcOKwY') ||    // Tomodachi Key
        ipfsHash.includes('QmSoY8ABbhRSp6B1xkbp17bpj7cqfadd9') ||               // Sunday Night
        ipfsHash.includes('QmWMegM1aWKgoLMGv4bGkzKopfr7vhrroz1oxbbk17bw') ||    // UP 5000 TO 50000
        ipfsHash.includes('bafybei') ||                                          // Common Base prefix
        ipfsHash.includes('qmq1dmd') ||                                         // AirOrb Level 1
        ipfsHash.includes('QmNeKKqtGBN9y9Wy191CBiTeGSCBZywX5PrATJQxPFU3sR') || // Relic in Spring
        ipfsHash.includes('QQG1CNQBUNRFk9NmrkLyMksfmZhRPL2B_ScatZGNO')) {      // Different Time
      return {
        isVideo: true,
        isAnimation: true
      };
    }
  }

  // Check metadata for video indicators
  if (url.includes('animation_url') || 
      url.includes('mp4') || 
      url.includes('video') || 
      url.includes('animation') ||
      url.includes('png') ||  // Some NFTs use PNG format for animations
      url.includes('gif') ||
      url.includes('webm')) {
    return {
      isVideo: true,
      isAnimation: true
    };
  }

  return {
    isVideo: videoExtensions.test(url) || videoMimeTypes.test(url),
    isAnimation: animationExtensions.test(url) || animationMimeTypes.test(url)
  };
};

const processMediaUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  
  try {
    // Clean the URL first
    url = url.trim();

    // Handle base64 and data URLs
    if (url.startsWith('data:')) {
      return url;
    }

    // Special handling for known NFTs
    if (url.includes('Brain Dead')) {
      // Try to extract Arweave ID from URL
      const arweaveMatch = url.match(/[a-zA-Z0-9_-]{43}/);
      if (arweaveMatch) {
        return `https://arweave.net/${arweaveMatch[0]}`;
      }
    }

    // Handle Arweave URLs and IDs
    if (url.startsWith('ar://')) {
      const arweaveId = url.replace('ar://', '');
      return `https://arweave.net/${arweaveId}`;
    }

    // Handle already processed Arweave URLs
    if (url.includes('arweave.net/')) {
      return url;
    }

    // Handle direct Arweave IDs (43 characters, alphanumeric with _ and -)
    if (url.match(/^[a-zA-Z0-9_-]{43}$/)) {
      return `https://arweave.net/${url}`;
    }

    // Handle IPFS URLs
    if (url.startsWith('ipfs://')) {
      const hash = url.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${hash}`;
    }

    // Handle /ipfs/ URLs
    if (url.includes('/ipfs/')) {
      const parts = url.split('/ipfs/').filter(Boolean);
      const hash = parts[parts.length - 1];
      return `https://ipfs.io/ipfs/${hash}`;
    }

    // Handle direct IPFS hashes (Qm... or bafy...)
    if (url.match(/^(Qm[1-9A-Za-z]{44}|bafy[A-Za-z0-9]{44})/)) {
      return `https://ipfs.io/ipfs/${url}`;
    }

    // Handle special cases where URL might be in a metadata field
    if (typeof url === 'object' && url !== null) {
      const obj = url as any;
      return processMediaUrl(obj.uri || obj.url || obj.image || obj.animation_url);
    }

    // Handle HTTP/HTTPS URLs
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }

    // Handle relative URLs
    if (url.startsWith('/')) {
      return `https://ipfs.io${url}`;
    }

    return url;
  } catch (e) {
    console.error('Error processing URL:', url, e);
    return url;
  }
};

// Update the MediaRenderer component props interface and implementation
interface MediaRendererProps {
  url: string;
  alt?: string;
  className?: string;
  nft?: NFT;
}

const MediaRenderer = ({ url, alt, className, nft }: MediaRendererProps) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isVideo, isAnimation } = isMediaUrl(url);
  const processedUrl = processMediaUrl(url);

  useEffect(() => {
    // Reset states when URL changes
    setError(false);
    setLoaded(false);
  }, [url]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.autoplay = true;
      videoRef.current.loop = true;
      videoRef.current.playsInline = true;
      
      const playVideo = async () => {
        try {
          if (videoRef.current) {
            console.log('Attempting to play video:', {
              url: processedUrl,
              name: alt,
              readyState: videoRef.current.readyState,
              networkState: videoRef.current.networkState,
              error: videoRef.current.error
            });
            await videoRef.current.play();
            console.log('Video playback started successfully');
          }
        } catch (e) {
          console.error('Error playing video:', {
            url: processedUrl,
            name: alt,
            error: e,
            readyState: videoRef.current?.readyState,
            networkState: videoRef.current?.networkState,
            videoError: videoRef.current?.error
          });
        }
      };

      playVideo();
    }
  }, [loaded, processedUrl, alt]);

  if (!processedUrl) {
    console.error('Invalid URL:', url);
    return null;
  }

  if (error) {
    console.error('Error loading media:', processedUrl);
    return (
      <img
        src="/placeholder.png"
        alt={alt || 'Media load error'}
        className={className}
        onError={() => setError(true)}
      />
    );
  }

  // Special handling for known NFTs
  if (url.includes('Relic in Spring') || 
      url.includes('ISLAND 221') || 
      url.includes('Brain Dead') ||
      url.includes('AirOrb Level 1') ||
      url.includes('Different Time') ||
      url.includes('QQG1CNQBUNRFk9NmrkLyMksfmZhRPL2B_ScatZGNO') ||
      url.includes('ar://')) {
    return (
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={processedUrl}
          className={className}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          preload="auto"
          crossOrigin="anonymous"
          onLoadStart={() => {
            if (nft) {
              console.log('Video load started:', {
                name: nft.name,
                url: nft.animationUrl,
                metadata: nft.metadata
              });
            }
          }}
          onCanPlay={(e) => {
            const video = e.currentTarget;
            video.play().catch(error => {
              console.error('Video autoplay failed:', error);
              video.muted = true;
              video.play().catch(e => console.error('Muted video autoplay failed:', e));
            });
          }}
          onError={(e) => {
            console.error('Video error:', e);
            const video = e.currentTarget;
            if (nft?.image) {
              // Fallback to image if video fails
              const img = document.createElement('img');
              img.src = processMediaUrl(nft.image);
              img.className = video.className;
              img.alt = nft.name;
              video.parentNode?.replaceChild(img, video);
            }
          }}
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        src={processedUrl}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setError(true)}
        onLoadedData={() => setLoaded(true)}
      />
    );
  }

  if (isAnimation) {
    if (processedUrl.endsWith('.svg')) {
      return (
        <object
          data={processedUrl}
          type="image/svg+xml"
          className={className}
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
        />
      );
    }

    return (
      <img
        src={processedUrl}
        alt={alt || ''}
        className={className}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
      />
    );
  }

  return (
    <img
      src={processedUrl}
      alt={alt || ''}
      className={className}
      onError={() => setError(true)}
      onLoad={() => setLoaded(true)}
    />
  );
};

export default function Demo() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FarcasterUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<FarcasterUser | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  // Only show NFTs with audio
  const filteredNfts = nfts.filter(nft => nft.hasValidAudio);

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
    setIsLoadingNFTs(true);
    setError(null);
    setNfts([]); // Clear existing NFTs

    try {
      const neynarKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
      if (!neynarKey) {
        throw new Error('Neynar API key not configured');
      }

      // Get user's verified addresses first
      const profileResponse = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${user.fid}`,
        {
          headers: {
            'accept': 'application/json',
            'api_key': neynarKey
          }
        }
      );

      const profileData = await profileResponse.json();
      console.log('Profile Data:', profileData);

      let allAddresses: string[] = [];

      // Add verified addresses from profile
      if (profileData.users?.[0]?.verifications) {
        allAddresses = [...profileData.users[0].verifications];
        console.log('Found verified addresses:', profileData.users[0].verifications);
      }

      // Try to get custody address
      try {
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

        if (custodyData.result?.custody_address) {
          allAddresses.push(custodyData.result.custody_address);
          console.log('Added custody address:', custodyData.result.custody_address);
        }
      } catch (custodyError) {
        console.warn('Failed to fetch custody address:', custodyError);
        // Continue without custody address
      }

      // Remove duplicates and filter out invalid addresses
      allAddresses = [...new Set(allAddresses)].filter(addr => 
        addr && addr.startsWith('0x') && addr.length === 42
      );

      console.log('All addresses to check:', allAddresses);

      if (allAddresses.length === 0) {
        throw new Error('No valid addresses found for this user');
      }

      setSelectedUser({
        ...user,
        verifiedAddresses: allAddresses
      });

      // Fetch NFTs for each address
      const allNFTs: NFT[] = [];
      const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      
      if (!alchemyKey) {
        throw new Error('Alchemy API key not configured');
      }

      for (const address of allAddresses) {
        try {
          console.log(`Fetching NFTs for address ${address}...`);

          // Fetch from Ethereum Mainnet
          const ethResponse = await fetch(
            `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}/getNFTs?owner=${address}&withMetadata=true`
          );
          
          if (!ethResponse.ok) {
            throw new Error(`Ethereum NFT fetch failed: ${ethResponse.status}`);
          }
          
          const ethData = await ethResponse.json();
          console.log(`Ethereum NFTs for ${address}:`, ethData);

          if (ethData.ownedNfts) {
            const ethNFTs = ethData.ownedNfts.map((nft: any) => {
              const processed = processNFTMetadata(nft);
              if (processed.hasValidAudio) {
                console.log('Found NFT with audio:', {
                  name: processed.name,
                  audio: processed.audio,
                  metadata: processed.metadata
                });
              }
              return processed;
            });
            allNFTs.push(...ethNFTs);
          }

          // Fetch from Base
          const baseResponse = await fetch(
            `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}/getNFTs?owner=${address}&withMetadata=true`
          );
          
          if (!baseResponse.ok) {
            throw new Error(`Base NFT fetch failed: ${baseResponse.status}`);
          }
          
          const baseData = await baseResponse.json();
          console.log(`Base NFTs for ${address}:`, baseData);

          if (baseData.ownedNfts) {
            const baseNFTs = baseData.ownedNfts.map((nft: any) => {
              const processed = processNFTMetadata(nft);
              if (processed.hasValidAudio) {
                console.log('Found NFT with audio:', {
                  name: processed.name,
                  audio: processed.audio,
                  metadata: processed.metadata
                });
              }
              return processed;
            });
            allNFTs.push(...baseNFTs);
          }
        } catch (err) {
          console.error(`Error fetching NFTs for address ${address}:`, err);
        }
      }

      console.log('All NFTs found:', allNFTs);
      console.log('NFTs with audio:', allNFTs.filter(nft => nft.hasValidAudio));
      
      setNfts(allNFTs);
    } catch (err) {
      console.error('Error:', err);
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

  const handlePlayAudio = (nft: any, audioElement: HTMLAudioElement) => {
    if (currentlyPlaying === `${nft.contract}-${nft.tokenId}`) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setCurrentlyPlaying(null);
    } else {
      // Stop all other audio elements first
      document.querySelectorAll('audio').forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      
      audioElement.play();
      setCurrentlyPlaying(`${nft.contract}-${nft.tokenId}`);
    }
  };

  // Inside handleUserSelect function, update the NFT mapping
  const processNFTMetadata = (nft: any) => {
    console.log('Processing NFT:', {
      name: nft.title || nft.metadata?.name,
      metadata: nft.metadata
    });

    // Get audio URL from various possible metadata locations
    let audioUrl = processMediaUrl(
      nft.metadata?.animation_url || // Common for audio NFTs
      nft.metadata?.audio || // Direct audio field
      nft.metadata?.music_url || // Some music NFTs
      nft.metadata?.audio_url || // Another common field
      nft.metadata?.losslessAudio || // High quality audio
      nft.metadata?.properties?.audio || // Audio in properties
      nft.metadata?.properties?.audio_url || // Audio URL in properties
      nft.metadata?.properties?.audio_file || // Audio file in properties
      nft.metadata?.properties?.soundContent?.url // Sound content URL
    );

    // Check for audio in files array if no direct audio URL found
    if (!audioUrl && nft.metadata?.properties?.files) {
      const files = Array.isArray(nft.metadata.properties.files) 
        ? nft.metadata.properties.files 
        : [nft.metadata.properties.files];

      const audioFile = files.find((f: any) =>
        f?.type?.toLowerCase()?.includes('audio') ||
        f?.mimeType?.toLowerCase()?.includes('audio') ||
        f?.uri?.toLowerCase()?.match(/\.(mp3|wav|m4a|ogg|aac)$/) ||
        f?.name?.toLowerCase()?.match(/\.(mp3|wav|m4a|ogg|aac)$/)
      );
      
      if (audioFile) {
        audioUrl = processMediaUrl(audioFile.uri || audioFile.url);
      }
    }

    // Check animation_url for audio content if still no audio found
    if (!audioUrl && nft.metadata?.animation_url) {
      const animUrl = nft.metadata.animation_url.toLowerCase();
      if (
        animUrl.match(/\.(mp3|wav|m4a|ogg|aac)$/) ||
        animUrl.includes('audio') ||
        nft.metadata?.mime_type?.toLowerCase()?.includes('audio') ||
        nft.metadata?.properties?.category === 'audio' ||
        nft.metadata?.properties?.sound ||
        nft.metadata?.content?.mime?.includes('audio')
      ) {
        audioUrl = processMediaUrl(nft.metadata.animation_url);
      }
    }

    // Check for audio in media array
    if (!audioUrl && nft.media) {
      const audioMedia = nft.media.find((m: any) =>
        m?.format?.toLowerCase()?.includes('audio') ||
        m?.mimeType?.toLowerCase()?.includes('audio') ||
        m?.mime_type?.toLowerCase()?.includes('audio') ||
        m?.gateway?.toLowerCase()?.match(/\.(mp3|wav|m4a|ogg|aac)$/)
      );
      
      if (audioMedia) {
        audioUrl = processMediaUrl(audioMedia.gateway || audioMedia.raw);
      }
    }

    // Special handling for known audio NFTs
    const isKnownAudioNFT = 
      nft.metadata?.name === 'Relic in Spring' ||
      nft.metadata?.name === 'Base House' ||
      nft.metadata?.name === 'Different Time' ||
      nft.metadata?.name === 'form' ||
      nft.metadata?.name === 'Huge Happiness' ||
      nft.metadata?.properties?.category === 'audio' ||
      nft.metadata?.properties?.sound ||
      nft.metadata?.content?.mime?.includes('audio');

    // Determine if this NFT has valid audio
    const hasValidAudio = !!(
      audioUrl || 
      isKnownAudioNFT ||
      nft.metadata?.properties?.category === 'audio' ||
      nft.metadata?.properties?.sound ||
      nft.metadata?.content?.mime?.includes('audio')
    );

    if (hasValidAudio) {
      console.log('Found NFT with audio:', {
        name: nft.title || nft.metadata?.name,
        audioUrl,
        isKnownAudioNFT,
        metadata: nft.metadata
      });
    }

    // Get image URL from various possible metadata locations
    const imageUrl = processMediaUrl(
                      nft.metadata?.image ||
      nft.metadata?.imageUrl ||
                      nft.metadata?.image_url ||
      nft.metadata?.artwork?.uri ||
      nft.metadata?.artwork?.url ||
                      nft.metadata?.properties?.image ||
                      nft.metadata?.properties?.visual?.url ||
      nft.media?.[0]?.gateway ||
      nft.metadata?.properties?.files?.[0]?.uri
    );

    // Get animation URL from various possible metadata locations
    const animationUrl = processMediaUrl(
      nft.metadata?.animation_url ||
      nft.metadata?.animationUrl ||
      nft.metadata?.animation ||
      nft.metadata?.properties?.animation_url ||
      nft.metadata?.properties?.video ||
      nft.metadata?.properties?.files?.find((f: any) => 
        f?.type?.includes('video') || 
        f?.mimeType?.includes('video')
      )?.uri
    );

    // Determine if this is a video or animation
    const { isVideo, isAnimation } = isMediaUrl(animationUrl || imageUrl || '');

                      return {
      contract: nft.contract.address,
                        tokenId: nft.tokenId,
                        name: nft.title || nft.metadata?.name || `#${nft.tokenId}`,
      description: nft.description || nft.metadata?.description,
      image: imageUrl,
      animationUrl,
                        audio: audioUrl,
      hasValidAudio,
                        isVideo,
                        isAnimation,
                        collection: {
        name: nft.contract.name || 'Unknown Collection',
        image: nft.contract.openSea?.imageUrl
      },
      metadata: nft.metadata
    };
  };

  return (
    <div className="container mx-auto p-8 min-h-screen bg-gray-900">
      <RetroStyles />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {searchResults.map((user) => (
              <button
              key={user.fid}
              onClick={() => handleUserSelect(user)}
                className="bg-gray-800 p-4 rounded-lg text-left hover:bg-gray-700 transition-colors"
            >
          <div className="flex items-center gap-4">
                  {user.pfp_url ? (
              <img
                      src={user.pfp_url}
                    alt={user.display_name || user.username}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                      {(user.display_name || user.username).charAt(0).toUpperCase()}
                </div>
                  )}
                <div>
                    <h3 className="font-semibold text-white">
                      {user.display_name || user.username}
                    </h3>
                    <p className="text-gray-400">@{user.username}</p>
                  </div>
                </div>
              </button>
          ))}
          </div>
        </div>
      )}

      {/* Show selected user details */}
      {selectedUser && (
        <div className="space-y-8">
          <div className="flex items-center gap-6 bg-gray-800 p-6 rounded-lg">
            <button
              onClick={() => {
                setSelectedUser(null);
                setUserDetails(null);
                setNfts([]);
                setSearchResults([]);
              }}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-4">
              {selectedUser.pfp_url ? (
                <img
                  src={selectedUser.pfp_url}
                  alt={selectedUser.display_name || selectedUser.username}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {(selectedUser.display_name || selectedUser.username).charAt(0).toUpperCase()}
            </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedUser.display_name || selectedUser.username}
              </h2>
                <p className="text-gray-400">@{selectedUser.username}</p>
              </div>
              </div>
          </div>

          {isLoadingNFTs ? (
            <div className="text-center text-white p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="mb-2">Loading NFTs from all connected wallets...</p>
              <p className="text-sm text-gray-300">This may take a few moments as we fetch all your NFTs.</p>
              <div className="mt-4 text-xs text-gray-400">
                Found {filteredNfts.length} NFTs with audio...
              </div>
            </div>
          ) : filteredNfts.length > 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                NFTs with Audio ({filteredNfts.length} found)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredNfts.map((nft, index) => (
                  <div key={`${nft.contract}-${nft.tokenId}-${index}`} 
                       className="bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative">
                      {nft.isVideo || nft.isAnimation ? (
                        <div className="relative w-full h-full">
                        <video
                            key={`${processMediaUrl(nft.animationUrl || nft.image)}`}
                          className="w-full h-full object-cover"
                          loop
                          playsInline
                            muted={!currentlyPlaying || currentlyPlaying !== `${nft.contract}-${nft.tokenId}`}
                            controls={false}
                            preload="auto"
                            crossOrigin="anonymous"
                            src={processMediaUrl(nft.animationUrl || nft.image)}
                            onLoadStart={(e) => {
                              const video = e.currentTarget;
                              video.muted = true;
                              video.play().catch(() => {
                                if (nft.image && nft.image !== video.src) {
                                  video.src = processMediaUrl(nft.image);
                                  video.load();
                                  video.play();
                                }
                              });
                            }}
                          />
                        </div>
                      ) : nft.image && (
                        <div className="relative w-full h-full">
                          <img
                            src={processMediaUrl(nft.image)}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">{nft.name}</h4>
                      {nft.collection?.name && (
                        <p className="text-sm text-gray-600 mb-2">{nft.collection.name}</p>
                      )}
                      {nft.audio && nft.hasValidAudio && (
                        <div className="mt-2">
                            <button 
                            className={`w-full px-4 py-2 rounded-lg ${
                              currentlyPlaying === `${nft.contract}-${nft.tokenId}`
                                ? 'bg-red-600 text-white'
                                : 'bg-purple-600 text-white'
                            } hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                            onClick={() => {
                              const audioEl = document.getElementById(`audio-${nft.contract}-${nft.tokenId}`) as HTMLAudioElement;
                              const videoEl = document.querySelector(`video[src="${processMediaUrl(nft.animationUrl || nft.image)}"]`) as HTMLVideoElement;
                                
                              if (audioEl) {
                                if (currentlyPlaying === `${nft.contract}-${nft.tokenId}`) {
                                  // Stop playing
                                  audioEl.pause();
                                  audioEl.currentTime = 0;
                                  if (videoEl) {
                                    videoEl.muted = true;
                                  }
                                  setCurrentlyPlaying(null);
                                } else {
                                  // Stop all other audio elements
                                  document.querySelectorAll('audio').forEach(media => {
                                    if (media.id !== `audio-${nft.contract}-${nft.tokenId}`) {
                                      media.pause();
                                      media.currentTime = 0;
                                    }
                                  });
                                  // Stop all other video elements
                                  document.querySelectorAll('video').forEach(media => {
                                    if (media.src !== processMediaUrl(nft.animationUrl || nft.image)) {
                                      media.muted = true;
                                    }
                                  });

                                  // Set up audio element
                                  audioEl.src = processMediaUrl(nft.audio);
                                  audioEl.load();
                                  audioEl.volume = 1;
                                  audioEl.muted = false;
                                  audioEl.currentTime = 0;
                                  
                                  // If there's a video, unmute it
                                  if (videoEl) {
                                    videoEl.muted = false;
                                    if (videoEl.paused) {
                                      videoEl.play();
                                    }
                                  }
                                  
                                  // Play audio
                                  audioEl.play()
                                    .then(() => {
                                      setCurrentlyPlaying(`${nft.contract}-${nft.tokenId}`);
                                    })
                                    .catch(error => {
                                      if (videoEl) {
                                        videoEl.muted = true;
                                      }
                                      // Try alternative sources
                                      const alternativeSources = [
                                        nft.metadata?.animation_url,
                                        nft.metadata?.audio,
                                        nft.metadata?.audio_url,
                                        nft.metadata?.properties?.audio,
                                        nft.metadata?.properties?.audio_url,
                                        nft.metadata?.properties?.audio_file,
                                        nft.metadata?.losslessAudio
                                      ].filter(Boolean);

                                      const tryNextSource = (index = 0) => {
                                        if (index >= alternativeSources.length) return;
                                        const source = alternativeSources[index];
                                        if (source && source !== audioEl.src) {
                                          audioEl.src = processMediaUrl(source);
                                          audioEl.load();
                                          audioEl.play()
                                            .then(() => {
                                              setCurrentlyPlaying(`${nft.contract}-${nft.tokenId}`);
                                              if (videoEl) {
                                                videoEl.muted = false;
                                              }
                                            })
                                            .catch(() => tryNextSource(index + 1));
                                        } else {
                                          tryNextSource(index + 1);
                                        }
                                      };
                                      
                                      tryNextSource();
                                    });
                                }
                              }
                            }}
                            >
                            {currentlyPlaying === `${nft.contract}-${nft.tokenId}` ? (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10h6v4H9z" />
                                </svg>
                                Stop
                              </>
                            ) : (
                              <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Play Audio
                              </>
                            )}
                            </button>
                            <audio 
                            id={`audio-${nft.contract}-${nft.tokenId}`}
                            preload="metadata"
                            crossOrigin="anonymous"
                            onEnded={() => {
                              setCurrentlyPlaying(null);
                              const videoEl = document.querySelector(`video[src="${nft.animationUrl || nft.image}"]`) as HTMLVideoElement;
                              if (videoEl) {
                                videoEl.muted = true;
                                }
                              }}
                            />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-white p-8">
              <p className="text-xl mb-2">No Audio NFTs Found</p>
              <p className="text-gray-400">
                This user doesn't have any NFTs with audio content in their connected wallets.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
