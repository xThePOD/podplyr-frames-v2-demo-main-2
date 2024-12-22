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

  // Check if a URL points to a media file
  const isMediaUrl = (url: string): { isVideo: boolean; isAnimation: boolean } => {
    const videoExtensions = /\.(mp4|webm|mov|m4v)$/i;
    const animationExtensions = /\.(gif|webp|svg|html|glb|gltf)$/i;
    const videoMimeTypes = /(video|mp4|webm)/i;
    const animationMimeTypes = /(animation|gif|webp|svg|html|glb|gltf)/i;

    url = url.toLowerCase();

    // Special handling for Relic in Spring
    if (url.includes('QmNeKKqtGBN9y9Wy191CBiTeGSCBZywX5PrATJQxPFU3sR') || 
        url.includes('Relic in Spring')) {
      return {
        isVideo: true,
        isAnimation: true
      };
    }

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
          ipfsHash.includes('QmNeKKqtGBN9y9Wy191CBiTeGSCBZywX5PrATJQxPFU3sR') || // Relic in Spring
          url.includes('ISLAND 221') ||                                            // ISLAND 221
          url.includes('Immutable Spirit') ||                                      // Immutable Spirit
          url.includes('AirOrb Level 1') ||                                        // AirOrb Level 1
          url.includes('Relic in Spring') ||                                       // Relic in Spring
          url.includes('Different Time') ||  // Add Different Time
          url.includes('QQG1CNQBUNRFk9NmrkLyMksfmZhRPL2B_ScatZGNO') || // Add Different Time's IPFS hash
          url.includes('ar://')) {  // Add Arweave URL handling
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
        url.includes('png')) {  // Some NFTs use PNG format for animations
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

  // Update the processMediaUrl function
  const processMediaUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    
    try {
      // Clean the URL first
      url = url.trim();

      // Handle base64 and data URLs
      if (url.startsWith('data:')) {
        return url;
      }

      // Handle Arweave URLs and IDs
      if (url.startsWith('ar://')) {
        return `https://arweave.net/${url.replace('ar://', '')}`;
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
        return `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
      }

      // Handle /ipfs/ URLs
      if (url.includes('/ipfs/')) {
        const parts = url.split('/ipfs/').filter(Boolean);
        return `https://ipfs.io/ipfs/${parts[parts.length - 1]}`;
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

      return url;
    } catch (e) {
      console.error('Error processing URL:', url, e);
      return url;
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
    setIsLoadingNFTs(true);
    setError(null);
    try {
      const neynarKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
      if (!neynarKey) {
        throw new Error('Neynar API key not configured');
      }

      // Get user's full profile which includes verifications
      const profileResponse = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${user.fid}`,
        {
          headers: {
            'accept': 'application/json',
            'api_key': neynarKey
          }
        }
      );

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch user profile: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();
      console.log('Profile Data:', profileData);

      const userProfile = profileData.users?.[0];
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get user's custody address
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

      // Combine all addresses
      const custodyAddress = custodyData.result?.custody_address;
      const verifiedAddresses = userProfile.verifications || [];
      const allAddresses = [...new Set([
        ...(custodyAddress ? [custodyAddress] : []),
        ...verifiedAddresses
      ])];

      setSelectedUser({
        ...user,
        verifiedAddresses: allAddresses
      });

      if (allAddresses.length === 0) {
        throw new Error('No verified addresses found');
      }

      // Fetch NFTs for each address
      const allNFTs: NFT[] = [];

      for (const address of allAddresses) {
        try {
          // Fetch from Ethereum Mainnet
          const ethUrl = new URL(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTs`);
          ethUrl.searchParams.append('owner', address);
          ethUrl.searchParams.append('withMetadata', 'true');

          const ethResponse = await fetch(ethUrl.toString());
          const ethData = await ethResponse.json();
          console.log('Ethereum NFTs:', ethData);

          if (ethData.ownedNfts) {
            const ethNFTs = ethData.ownedNfts.map(processNFTMetadata);
            allNFTs.push(...ethNFTs);
          }

          // Fetch from Base
          const baseUrl = new URL(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTs`);
          baseUrl.searchParams.append('owner', address);
          baseUrl.searchParams.append('withMetadata', 'true');

          const baseResponse = await fetch(baseUrl.toString());
          const baseData = await baseResponse.json();
          console.log('Base NFTs:', baseData);

          if (baseData.ownedNfts) {
            const baseNFTs = baseData.ownedNfts.map(processNFTMetadata);
            allNFTs.push(...baseNFTs);
          }
        } catch (err) {
          console.error(`Error fetching NFTs for address ${address}:`, err);
        }
      }

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

  const MediaRenderer = ({ url, alt, className }: { url: string; alt?: string; className?: string }) => {
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
        url.includes('Different Time') ||  // Add Different Time
        url.includes('QQG1CNQBUNRFk9NmrkLyMksfmZhRPL2B_ScatZGNO') || // Add Different Time's IPFS hash
        url.includes('ar://')) {  // Add Arweave URL handling
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
            onError={(e) => {
              console.error('Video loading error:', {
                url: processedUrl,
                error: e,
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
              } else {
                setError(true);
              }
            }}
            onLoadedData={() => setLoaded(true)}
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
    // Get audio URL from various possible metadata locations
    const audioUrl = processMediaUrl(
      nft.metadata?.audio ||
      nft.metadata?.audioUrl ||
      nft.metadata?.audio_url ||
      nft.metadata?.losslessAudio ||
      nft.metadata?.properties?.audio ||
      nft.metadata?.properties?.audio_url ||
      nft.metadata?.properties?.audio_file ||
      nft.metadata?.properties?.soundContent?.url ||
      (nft.metadata?.properties?.category === 'audio' && nft.metadata?.animation_url) ||
      (nft.metadata?.properties?.sound && nft.metadata?.animation_url) ||
      (nft.metadata?.mimeType?.includes('audio') && nft.metadata?.animation_url) ||
      (nft.metadata?.properties?.mimeType?.includes('audio') && nft.metadata?.animation_url) ||
      (nft.metadata?.mime_type?.includes('audio') && nft.metadata?.animation_url)
    );

    // Check for audio in animation_url if it has an audio-related mime type
    const hasAudioInAnimation = nft.metadata?.animation_url && (
      nft.metadata?.properties?.category === 'audio' ||
      nft.metadata?.properties?.sound ||
      nft.metadata?.mimeType?.includes('audio') ||
      nft.metadata?.properties?.mimeType?.includes('audio') ||
      nft.metadata?.mime_type?.includes('audio')
    );

    // Special handling for known audio NFTs
    const isKnownAudioNFT = 
      nft.metadata?.name === 'Relic in Spring' ||
      nft.metadata?.name === 'Base House' ||
      nft.metadata?.name === 'Different Time' ||
      nft.metadata?.name === 'form' ||
      nft.metadata?.name === 'Huge Happiness' ||
      nft.metadata?.properties?.category === 'audio' ||
      nft.metadata?.properties?.sound;

    // Determine if this NFT has valid audio
    const hasValidAudio = !!(
      audioUrl || 
      hasAudioInAnimation || 
      isKnownAudioNFT ||
      nft.metadata?.properties?.category === 'audio' ||
      nft.metadata?.properties?.sound
    );

    // Get image URL from various possible metadata locations
    const imageUrl = processMediaUrl(
      nft.metadata?.image ||
      nft.metadata?.imageUrl ||
      nft.metadata?.image_url ||
      nft.metadata?.artwork?.uri ||
      nft.metadata?.artwork?.url ||
      nft.metadata?.properties?.image ||
      nft.metadata?.properties?.visual?.url ||
      nft.media?.[0]?.gateway
    );

    // Get animation URL from various possible metadata locations
    const animationUrl = processMediaUrl(
      nft.metadata?.animation_url ||
      nft.metadata?.animationUrl ||
      nft.metadata?.animation ||
      nft.metadata?.properties?.animation_url ||
      nft.metadata?.properties?.video
    );

    // Special handling for Different Time NFT
    if (nft.metadata?.name === 'Different Time') {
      console.log('Processing Different Time NFT:', {
        name: nft.metadata?.name,
        image: nft.metadata?.image,
        losslessAudio: nft.metadata?.losslessAudio,
        metadata: nft.metadata
      });

      return {
        contract: nft.contract.address,
        tokenId: nft.tokenId,
        name: nft.metadata?.name || `#${nft.tokenId}`,
        description: nft.metadata?.description,
        image: nft.metadata?.image?.startsWith('ar://')
          ? `https://arweave.net/${nft.metadata.image.replace('ar://', '')}`
          : nft.metadata?.image,
        audio: nft.metadata?.losslessAudio?.startsWith('ar://')
          ? `https://arweave.net/${nft.metadata.losslessAudio.replace('ar://', '')}`
          : nft.metadata?.losslessAudio,
        hasValidAudio: true,
        isVideo: false,
        isAnimation: false,
        collection: {
          name: nft.contract.name || 'Unknown Collection',
          image: nft.contract.openSea?.imageUrl
        },
        metadata: nft.metadata
      };
    }

    // Determine if this is a video or animation
    const { isVideo, isAnimation } = isMediaUrl(animationUrl || imageUrl || '');

    return {
      contract: nft.contract.address,
      tokenId: nft.tokenId,
      name: nft.title || nft.metadata?.name || `#${nft.tokenId}`,
      description: nft.description || nft.metadata?.description,
      image: imageUrl,
      animationUrl,
      audio: audioUrl || (hasAudioInAnimation ? animationUrl : undefined),
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
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {nft.animationUrl ? (
                        <div className="relative w-full h-full">
                          <video
                            key={processMediaUrl(nft.animationUrl)}
                            src={processMediaUrl(nft.animationUrl)}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                            controls={false}
                            preload="auto"
                            crossOrigin="anonymous"
                            onLoadStart={() => {
                              console.log('Video load started:', {
                                name: nft.name,
                                url: nft.animationUrl,
                                metadata: nft.metadata
                              });
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
                              if (nft.image) {
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
                      ) : nft.image ? (
                        <div className="relative w-full h-full">
                          <img
                            key={nft.image}
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image error:', {
                                name: nft.name,
                                url: nft.image,
                                error: e,
                                metadata: nft.metadata
                              });
                              const img = e.currentTarget as HTMLImageElement;
                              
                              // Try direct image from metadata
                              if (nft.metadata?.image?.startsWith('ar://')) {
                                img.src = `https://arweave.net/${nft.metadata.image.replace('ar://', '')}`;
                                return;
                              }
                              
                              // Try direct Arweave URL if available
                              if (nft.metadata?.imageUrl) {
                                img.src = nft.metadata.imageUrl;
                                return;
                              }
                              
                              // Fallback to placeholder
                              img.src = `https://avatar.vercel.sh/${nft.name}`;
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-400">No media available</span>
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
                          <div className="flex flex-col gap-2">
                            <button 
                              className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                                currentlyPlaying === `${nft.contract}-${nft.tokenId}`
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                              onClick={() => {
                                const audioEl = document.getElementById(`audio-${nft.contract}-${nft.tokenId}`) as HTMLAudioElement;
                                if (audioEl) {
                                  handlePlayAudio(nft, audioEl);
                                }
                              }}
                            >
                              {currentlyPlaying === `${nft.contract}-${nft.tokenId}` ? (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10v4h6v-4H9z" />
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
                              src={processMediaUrl(nft.audio)}
                              onPlay={() => setCurrentlyPlaying(`${nft.contract}-${nft.tokenId}`)}
                              onEnded={() => setCurrentlyPlaying(null)}
                              onError={(e) => {
                                console.error('Audio error:', e);
                                const audio = e.currentTarget;
                                if (nft.animationUrl && nft.animationUrl !== nft.audio) {
                                  audio.src = processMediaUrl(nft.animationUrl);
                                }
                              }}
                            />
                            {currentlyPlaying === `${nft.contract}-${nft.tokenId}` && (
                              <AudioVisualizer
                                audioElement={document.getElementById(`audio-${nft.contract}-${nft.tokenId}`) as HTMLAudioElement}
                              />
                            )}
                          </div>
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
