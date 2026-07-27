import React, { useState, useEffect } from "react";
import { Avatar, Button, Skeleton } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { fetchAllSuggestionsApi, followUserApi } from "./SuggestionsApi";

export default function Suggestions() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [allSuggestionsList, setAllSuggestionsList] = useState([]);
  const [followingStatesMap, setFollowingStatesMap] = useState({});
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchAllSuggestionsDataAction = async () => {
    setIsDataLoading(true);
    const apiResponse = await fetchAllSuggestionsApi(50);
    
    if (apiResponse && apiResponse.success) {
      const fetchedSuggestions = apiResponse.data?.suggestions || [];
      setAllSuggestionsList(fetchedSuggestions);
    } else {
      setAllSuggestionsList([]);
    }
    
    setIsDataLoading(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAllSuggestionsDataAction();
  }, []);

  const handleFollowUserAction = async (userId) => {
    if (followingStatesMap[userId]?.loading) return;

    setFollowingStatesMap((previousStates) => ({
      ...previousStates,
      [userId]: { loading: true }
    }));

    const apiResponse = await followUserApi(userId);
    
    if (apiResponse && apiResponse.message === "success") {
      setAllSuggestionsList((previousList) => previousList.filter((userItem) => userItem._id !== userId));
    }

    setFollowingStatesMap((previousStates) => ({
      ...previousStates,
      [userId]: { loading: false }
    }));
  };

  const filteredSuggestionsList = allSuggestionsList.filter((userItem) => {
    const searchString = searchQuery.toLowerCase();
    const userName = userItem.name?.toLowerCase() || "";
    const userHandle = userItem.username?.toLowerCase() || "";
    return userName.includes(searchString) || userHandle.includes(searchString);
  });

  return (
    <>
      <div className="min-h-screen pt-1 pb-10 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          
          {/* Breadcrumbs Navigation */}
          <div className="flex items-center gap-2 mb-4 text-gray-400 font-extrabold text-[12px] tracking-tight">
            <button onClick={() => navigate(-1)} className="hover:text-gray-900 transition-colors flex items-center gap-1.5 group">
              <i className="fa-solid fa-arrow-left text-[10px] group-hover:-translate-x-0.5 transition-transform" /> Back
            </button>          
            <span className="text-gray-200 font-normal">/</span>
            <span className="text-[#016630] flex items-center gap-2 uppercase tracking-wide font-black">
               <i className="fa-solid fa-compass text-[11px]" /> Discover Friends
            </span>
          </div>

          {/* Balanced Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#014d24] rounded-[15px] flex items-center justify-center text-white text-xl shadow-lg shadow-green-900/10">
                <i className="fa-solid fa-user-plus" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-0">
                  <h1 className="text-[28px] font-black text-[#111827] tracking-tighter leading-tight">Suggested Friends</h1>
                  {!isDataLoading && (
                    <span className="bg-[#f0fdf4] text-[#016630] text-[11px] font-black px-2 py-0.5 rounded-md border border-green-100/50 shadow-sm">
                      {allSuggestionsList.length}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 font-bold text-[14px] tracking-tight">Find people you might know from your community</p>
              </div>
            </div>

            {/* Sleek Search Box */}
            <div className="w-full md:w-[280px] relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]" />
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-[14px] font-bold text-gray-700 placeholder:text-gray-300 focus:border-[#016630]/20 focus:ring-4 focus:ring-[#016630]/5 transition-all outline-none shadow-sm"
              />
            </div>
          </div>

          {/* User Suggestions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {isDataLoading ? (
              [...Array(9)].map((_, index) => (
                <div key={index} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-5 w-3/4 mx-auto rounded-lg" />
                    <Skeleton className="h-3.5 w-1/2 mx-auto rounded-lg" />
                  </div>
                  <Skeleton className="w-full h-10 rounded-xl" />
                </div>
              ))
            ) : filteredSuggestionsList.length > 0 ? (
              filteredSuggestionsList.map((userItem) => (
                <div 
                  key={userItem._id} 
                  className="bg-white p-6 rounded-[26px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-green-900/5 hover:border-[#016630]/20 transition-all duration-500 group flex flex-col items-center text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                    <i className="fa-solid fa-user-plus text-5xl rotate-12" />
                  </div>

                  <div className="relative mb-5">
                    <div className="absolute inset-0 bg-[#016630]/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                    <Avatar 
                      src={userItem.photo} 
                      name={userItem.name?.charAt(0)} 
                      className="w-18 h-18 border-[3.5px] border-white shadow-lg relative z-10" 
                    />
                    <div className="absolute bottom-0.5 right-0.5 w-4.5 h-4.5 bg-green-500 border-2 border-white rounded-full z-20 shadow-sm" />
                  </div>
                  
                  <div className="mb-5 min-w-0 w-full px-1">
                    <h3 className="font-black text-gray-900 text-[19px] truncate mb-0.5 group-hover:text-[#016630] transition-colors tracking-tight">
                      {userItem.name}
                    </h3>
                    <p className="text-gray-400 font-bold text-[12px] truncate mb-4 lowercase opacity-75 tracking-wider">@{userItem.username || "user"}</p>
                    
                    <div className="flex items-center justify-center gap-6 py-2.5 bg-gray-50/60 rounded-[18px] border border-gray-100/50">
                      <div className="flex flex-col items-center">
                        <span className="text-gray-900 font-black text-[16px] leading-tight">{userItem.followersCount || 0}</span>
                        <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Followers</span>
                      </div>
                      <div className="w-[1px] h-6 bg-gray-200" />
                      <div className="flex flex-col items-center">
                        <span className="text-gray-900 font-black text-[16px] leading-tight">{userItem.mutualFollowersCount || 0}</span>
                        <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Mutual</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="md"
                    isLoading={followingStatesMap[userItem._id]?.loading}
                    onClick={() => handleFollowUserAction(userItem._id)}
                    className="w-full rounded-[16px] font-black text-[14px] bg-[#016630] text-white hover:bg-[#014d24] active:scale-95 shadow-lg shadow-green-100/50 transition-all py-6"
                  >
                    Follow User
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-[28px] border border-dashed border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <i className="fa-solid fa-user-astronaut text-gray-200 text-2xl" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1 tracking-tight">No Discoveries Available</h3>
                <p className="text-gray-400 font-bold text-sm">Try broadening your search or check back later</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
