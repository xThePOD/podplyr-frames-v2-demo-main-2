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

export interface NFT {
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
  const [currentPlayingNFT, setCurrentPlayingNFT] = useState<NFT | null>(null);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Only show NFTs with audio
  const filteredNfts = nfts.filter(nft => nft.hasValidAudio);

  const handleStopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentPlayingNFT(null);
    setCurrentlyPlaying(null);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioProgress(time);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setAudioProgress(audio.currentTime);
    };

    const updateDuration = () => {
      setAudioDuration(audio.duration);
    };

    const handleEnded = () => {
      // Mute the video if it exists
      if (currentPlayingNFT) {
        const videoEl = document.querySelector(`video[src="${processMediaUrl(currentPlayingNFT.animationUrl || currentPlayingNFT.image)}"]`) as HTMLVideoElement;
        if (videoEl) {
          videoEl.muted = true;
        }
      }
      setCurrentlyPlaying(null);
      setCurrentPlayingNFT(null);
      setAudioProgress(0);
      setAudioDuration(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef.current, currentPlayingNFT]);

  // Update the handlePlayAudio function
  const handlePlayAudio = async (nft: NFT) => {
    try {
      const nftId = `${nft.contract}-${nft.tokenId}`;
      console.log('Attempting to play audio for NFT:', {
        name: nft.name,
        audioUrl: nft.audio,
        processedUrl: processMediaUrl(nft.audio || ''),
        metadata: nft.metadata
      });
      
      if (currentlyPlaying === nftId) {
        // Stop playing
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        // Mute the video if it exists
        const videoEl = document.querySelector(`video[src="${processMediaUrl(nft.animationUrl || nft.image)}"]`) as HTMLVideoElement;
        if (videoEl) {
          videoEl.muted = true;
        }
        setCurrentlyPlaying(null);
        setCurrentPlayingNFT(null);
        setAudioProgress(0);
        setAudioDuration(0);
      } else {
        // Stop all other audio elements
        document.querySelectorAll('audio').forEach(media => {
          media.pause();
          media.currentTime = 0;
        });
        // Mute all videos
        document.querySelectorAll('video').forEach(video => {
          video.muted = true;
        });

        const audioElement = document.querySelector(`audio[data-nft="${nftId}"]`) as HTMLAudioElement;
        console.log('Found audio element:', audioElement);
        
        if (audioElement) {
          // Try alternative audio sources if the main one fails
          const tryAudioSource = async (source: string) => {
            try {
              console.log('Trying audio source:', source);
              audioElement.src = processMediaUrl(source);
              audioRef.current = audioElement;
              audioElement.volume = 1;
              audioElement.currentTime = 0;
              await audioElement.play();
              console.log('Audio playback started successfully');
              return true;
            } catch (error) {
              console.error('Failed to play audio source:', source, error);
              return false;
            }
          };

          // Get all possible audio sources from the NFT metadata
          const audioSources = [
            nft.audio,
            nft.metadata?.animation_url,
            nft.metadata?.audio,
            nft.metadata?.audio_url,
            nft.metadata?.properties?.audio,
            nft.metadata?.properties?.audio_url,
            nft.metadata?.properties?.audio_file,
            nft.metadata?.losslessAudio
          ].filter(Boolean);

          console.log('Available audio sources:', audioSources);

          // Try each audio source until one works
          let playbackSuccess = false;
          for (const source of audioSources) {
            playbackSuccess = await tryAudioSource(source);
            if (playbackSuccess) break;
          }

          if (playbackSuccess) {
            // Unmute the corresponding video if it exists
            const videoEl = document.querySelector(`video[src="${processMediaUrl(nft.animationUrl || nft.image)}"]`) as HTMLVideoElement;
            if (videoEl) {
              videoEl.muted = false;
              if (videoEl.paused) {
                videoEl.play();
              }
            }
            
            setCurrentlyPlaying(nftId);
            setCurrentPlayingNFT(nft);
          } else {
            throw new Error('No supported audio source found');
          }
        } else {
          throw new Error('Audio element not found');
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      // Mute the video if it exists
      const videoEl = document.querySelector(`video[src="${processMediaUrl(nft.animationUrl || nft.image)}"]`) as HTMLVideoElement;
      if (videoEl) {
        videoEl.muted = true;
      }
      setCurrentlyPlaying(null);
      setCurrentPlayingNFT(null);
      setAudioProgress(0);
      setAudioDuration(0);
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
      <div className="pb-24">
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
            </div>
          </div>
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
                  {filteredNfts.map((nft) => (
                    <div key={`${nft.contract}-${nft.tokenId}`} className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="aspect-square relative">
                        {nft.isVideo || nft.isAnimation ? (
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
                        ) : (
                          <img
                            src={processMediaUrl(nft.image || '')}
                            alt={nft.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white truncate">{nft.name}</h3>
                        <button 
                          onClick={() => handlePlayAudio(nft)}
                          className={`ml-2 p-2 rounded-full ${
                            currentlyPlaying === `${nft.contract}-${nft.tokenId}`
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white transition-colors`}
                        >
                          {currentlyPlaying === `${nft.contract}-${nft.tokenId}` ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10h6v4H9z" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <audio 
                        data-nft={`${nft.contract}-${nft.tokenId}`}
                        src={processMediaUrl(nft.audio || '')}
                        preload="metadata"
                        crossOrigin="anonymous"
                      />
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

      {/* Fixed Media Player - Always visible */}
      <div className={`fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 transition-all duration-300 ${isPlayerMinimized ? 'h-16' : 'h-32'}`}>
        <div className="container mx-auto px-4 h-full">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between flex-1">
              {/* NFT Info */}
              <div className="flex items-center gap-4">
                {currentPlayingNFT ? (
                  <>
                    <div className="w-12 h-12 rounded overflow-hidden">
                      <img 
                        src={processMediaUrl(currentPlayingNFT.image || '')} 
                        alt={currentPlayingNFT.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{currentPlayingNFT.name}</h4>
                      {currentPlayingNFT.collection?.name && (
                        <p className="text-sm text-gray-400">{currentPlayingNFT.collection.name}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">No track selected</div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {currentPlayingNFT && (
                  <button
                    onClick={() => handlePlayAudio(currentPlayingNFT)}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10h6v4H9z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setIsPlayerMinimized(!isPlayerMinimized)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isPlayerMinimized ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Progress Bar - Only show when not minimized and a track is playing */}
            {!isPlayerMinimized && currentPlayingNFT && (
              <div className="flex items-center gap-4 py-4">
                <span className="text-sm text-gray-400">
                  {Math.floor(audioProgress / 60)}:{String(Math.floor(audioProgress % 60)).padStart(2, '0')}
                </span>
                <input
                  type="range"
                  min={0}
                  max={audioDuration || 100}
                  value={audioProgress}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-gray-400">
                  {Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
