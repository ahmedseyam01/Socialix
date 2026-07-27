import React, { useState, useEffect } from "react";
import { Avatar, Button, Skeleton } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { fetchSuggestedUsersApi, followSuggestedUserApi } from "./RightSidebarApi";

// ── Constants & Configuration ──
const TRENDING_TOPICS_LIST = [
  { tag: "#ReactJS", postsCount: "1.2K posts" },
  { tag: "#WebDev", postsCount: "987 posts" },
  { tag: "#JavaScript", postsCount: "3.4K posts" },
  { tag: "#OpenSource", postsCount: "567 posts" },
];

const SUGGESTIONS_LIMIT = 3;

// ── Internal UI Components ──

/**
 * SuggestedUserItem - Renders an individual user suggestion row
 */
function SuggestedUserItem({ user, isFollowLoading, onFollowAction }) {
  return (
    <>
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <Avatar src={user.photo} name={user.name?.charAt(0)} className="w-12 h-12 border-2 border-white shadow-sm" />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="font-bold text-[14px] text-gray-900 truncate leading-snug group-hover:text-[#016630] transition-colors pr-2">
              {user.name}
            </p>
            <p className="text-gray-400 text-[11px] font-medium truncate">
              @{user.username || "user"}
            </p>
            {user.followersCount !== undefined && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[#016630] text-[10px] font-bold px-1.5 py-0.5 bg-green-50 rounded-md shrink-0">
                  {user.followersCount} followers
                </span>
              </div>
            )}
          </div>
        </div>
        <Button
          size="sm"
          isLoading={isFollowLoading}
          onClick={() => onFollowAction(user._id)}
          className="shrink-0 text-[13px] font-bold rounded-[12px] h-9 px-4 transition-all duration-200 active:scale-95 shadow-sm bg-[#016630] text-white hover:bg-[#014d24]"
        >
          Follow
        </Button>
      </div>
    </>
  );
}

/**
 * TrendingTopicItem - Renders a single trending topic row
 */
function TrendingTopicItem({ topic, rank }) {
  return (
    <>
      <div className="flex items-center justify-between cursor-pointer group rounded-[12px] hover:bg-gray-50 p-2 -m-2 transition-all">
        <div className="min-w-0">
          <p className="font-bold text-[14px] text-gray-800 group-hover:text-[#016630] transition-colors truncate">
            {topic.tag}
          </p>
          <p className="text-gray-400 text-[12px] font-medium">{topic.postsCount}</p>
        </div>
        <div className="bg-gray-50 group-hover:bg-green-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
          <span className="text-gray-400 group-hover:text-[#016630] text-[11px] font-bold">#{rank}</span>
        </div>
      </div>
    </>
  );
}

/**
 * SectionHeader - Reusable header for sidebar cards
 */
function SectionHeader({ title, count, icon }) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-gray-900 text-[18px] tracking-tight">{title}</h3>
          {count !== undefined && count > 0 && (
            <span className="bg-green-100 text-[#016630] text-[12px] font-bold px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        {icon}
      </div>
    </>
  );
}

// ── Main RightSidebar Component ──

export default function RightSidebar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedUsersList, setSuggestedUsersList] = useState([]);
  const [followingStatesMap, setFollowingStatesMap] = useState({});
  const [isListLoading, setIsListLoading] = useState(true);

  const fetchSuggestedUsersDataAction = async () => {
    setIsListLoading(true);
    const apiResponse = await fetchSuggestedUsersApi(SUGGESTIONS_LIMIT);
    
    if (apiResponse && apiResponse.success) {
      const fetchedSuggestions = apiResponse.data?.suggestions || [];
      setSuggestedUsersList(fetchedSuggestions.slice(0, SUGGESTIONS_LIMIT));
    } else {
      setSuggestedUsersList([]);
    }
    
    setIsListLoading(false);
  };

  useEffect(() => {
    fetchSuggestedUsersDataAction();
  }, []);

  const handleFollowUserAction = async (userId) => {
    if (followingStatesMap[userId]?.loading) return;

    setFollowingStatesMap((previousStates) => ({
      ...previousStates,
      [userId]: { loading: true }
    }));

    const apiResponse = await followSuggestedUserApi(userId);

    if (apiResponse && apiResponse.message === "success") {
      setSuggestedUsersList((previousList) => previousList.filter((userItem) => userItem._id !== userId));
      fetchSuggestedUsersDataAction();
    }

    setFollowingStatesMap((previousStates) => ({
      ...previousStates,
      [userId]: { loading: false }
    }));
  };

  const filteredUsersList = suggestedUsersList.filter((userItem) => {
    const searchString = searchQuery.toLowerCase();
    return (
      userItem.name?.toLowerCase().includes(searchString) ||
      userItem.username?.toLowerCase().includes(searchString)
    );
  });

  return (
    <>
      <aside className="w-full flex flex-col gap-6">
        {/* Suggested Friends Card */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
          <SectionHeader 
            title="Suggested Friends" 
            count={!isListLoading ? suggestedUsersList.length : 0} 
          />

          {/* Search Box */}
          <div className="relative mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-[14px] pl-10 pr-4 py-3 text-[14px] text-gray-700 font-medium placeholder-gray-400 outline-none focus:bg-white focus:border-[#016630]/20 focus:ring-4 focus:ring-[#016630]/5 transition-all outline-none"
            />
          </div>

          {/* User Suggestions List */}
          <div className="flex flex-col gap-5">
            {isListLoading && suggestedUsersList.length === 0 ? (
              [1, 2, 3].map((skeletonIndex) => (
                <div key={skeletonIndex} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="w-24 h-3 rounded-lg" />
                      <Skeleton className="w-16 h-2 rounded-lg" />
                    </div>
                  </div>
                  <Skeleton className="w-16 h-8 rounded-xl" />
                </div>
              ))
            ) : filteredUsersList.length > 0 ? (
              filteredUsersList.map((userItem) => (
                <SuggestedUserItem 
                  key={userItem._id}
                  user={userItem}
                  isFollowLoading={followingStatesMap[userItem._id]?.loading}
                  onFollowAction={handleFollowUserAction}
                />
              ))
            ) : (
              <div className="text-center py-6">
                <i className="fa-solid fa-user-plus text-gray-100 text-4xl mb-2" />
                <p className="text-gray-400 text-sm font-medium">No suggestions at the moment.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate("/suggestions")}
            className="w-full text-center text-[#016630] font-bold text-[14px] mt-6 pt-4 border-t border-gray-50 hover:text-[#014d24] hover:underline transition-all"
          >
            View all suggestions
          </button>
        </div>

        {/* Trending Topics Card */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
          <SectionHeader 
            title="Trending Now" 
            icon={<i className="fa-solid fa-arrow-trend-up text-[#016630] text-lg" />} 
          />
          <div className="flex flex-col gap-4">
            {TRENDING_TOPICS_LIST.map((topicItem, index) => (
              <TrendingTopicItem 
                key={topicItem.tag} 
                topic={topicItem} 
                rank={index + 1} 
              />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
