"use client";

import { useState, useEffect } from "react";

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: string;
  followerCount: number;
  followingCount: number;
  bio?: string;
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
            displayName: user.display_name || user.username,
            pfp: user.pfp_url || 'https://avatar.vercel.sh/' + user.username,
            followerCount: user.follower_count || 0,
            followingCount: user.following_count || 0
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
                  src={suggestion.pfp}
                  alt={suggestion.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://avatar.vercel.sh/${suggestion.username}`;
                  }}
                />
              </div>
              <div>
                <div className="font-medium text-gray-900">{suggestion.displayName}</div>
                <div className="text-sm text-gray-600">@{suggestion.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Demo() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<FarcasterUser | null>(null);

  const handleSearch = async (username: string) => {
    setIsSearching(true);
    setError(null);
    setUser(null);

    try {
      const neynarKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
      if (!neynarKey) {
        throw new Error('Neynar API key not configured');
      }

      // Use the search endpoint
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
      console.log('API Response:', data);

      if (!data.result?.users?.length) {
        throw new Error('User not found');
      }

      // Find exact username match
      const exactMatch = data.result.users.find(
        (u: any) => u.username.toLowerCase() === username.toLowerCase()
      );

      if (!exactMatch) {
        throw new Error('User not found');
      }

      setUser({
        fid: exactMatch.fid,
        username: exactMatch.username,
        displayName: exactMatch.display_name || exactMatch.username,
        pfp: exactMatch.pfp_url || 'https://avatar.vercel.sh/' + exactMatch.username,
        followerCount: exactMatch.follower_count || 0,
        followingCount: exactMatch.following_count || 0,
        bio: typeof exactMatch.profile?.bio === 'string' ? exactMatch.profile.bio : exactMatch.profile?.bio?.text || ''
      });
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search for user');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto p-8 min-h-screen bg-gray-900">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">
        Farcaster User Search
      </h1>

      <SearchBar onSearch={handleSearch} isSearching={isSearching} />

      {error && (
        <div className="text-red-500 text-center mb-8 bg-white/10 p-4 rounded-lg">
          {error}
        </div>
      )}

      {isSearching && (
        <div className="text-center mb-8 text-white">
          Searching...
        </div>
      )}

      {user && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-purple-500 overflow-hidden">
              <img
                src={user.pfp}
                alt={user.displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://avatar.vercel.sh/${user.username}`;
                }}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user.displayName}
              </h2>
              <p className="text-gray-600">@{user.username}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span className="font-medium">{user.followerCount.toLocaleString()} followers</span>
                <span className="font-medium">{user.followingCount.toLocaleString()} following</span>
              </div>
              {user.bio && (
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
