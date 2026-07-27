import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext, DEFAULT_API_AVATAR } from "../../Context/AuthContext";
import {
  getMyProfileApi,
  getUserProfileApi,
  getUserPostsApi,
  uploadProfilePhotoApi,
  uploadCoverPhotoApi,
  removeProfilePhotoApi,
  removeCoverPhotoApi,
  followUserApi,
} from "./ProfileApi.jsx";
import PostCard from "../PostCard/PostCard.jsx";
import Loading from "../Loading/Loading.jsx";
import { motion, AnimatePresence } from "framer-motion";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userProfile, setUserProfile } = useContext(AuthContext);

  const isOwnProfile = !userId || userId === userProfile?.id || userId === userProfile?._id;

  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setPostsLoading(true);
    setImgError(false);

    if (userId && !isOwnProfile) {
      getUserProfileApi(userId).then((res) => {
        const user = res?.user || res?.data?.user || res?.data || res;
        const isFol = res?.data?.isFollowing ?? res?.isFollowing ?? false;
        setIsFollowing(isFol);
        setProfile({
          ...user,
          photo: user?.photo || DEFAULT_API_AVATAR,
          coverPhoto: user?.coverPhoto || "",
        });
        setLoading(false);
      });

      getUserPostsApi(userId).then((res) => {
        const postsList = res?.posts || res?.data?.posts || res?.data || [];
        setUserPosts(Array.isArray(postsList) ? postsList : []);
        setPostsLoading(false);
      });
    } else {
      getMyProfileApi().then((res) => {
        const user = res?.data?.user || res?.user || res;
        const savedCover = localStorage.getItem("user_cover_banner");
        const myId = user?._id || user?.id || userProfile?.id || userProfile?._id;

        // Always trust the photo from the API — it is the source of truth
        const apiPhoto = user?.photo || DEFAULT_API_AVATAR;

        setProfile({
          ...user,
          photo: apiPhoto,
          coverPhoto: savedCover || user?.coverPhoto || "",
        });

        // Keep AuthContext in sync with the live API photo
        if (setUserProfile) {
          setUserProfile((prev) => ({ ...prev, photo: apiPhoto }));
        }

        setLoading(false);

        if (myId) {
          getUserPostsApi(myId).then((postsRes) => {
            const postsList = postsRes?.posts || postsRes?.data?.posts || postsRes?.data || [];
            setUserPosts(Array.isArray(postsList) ? postsList : []);
            setPostsLoading(false);
          });
        } else {
          setPostsLoading(false);
        }
      });
    }
  }, [userId, isOwnProfile]);

  const fDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  const formatBirthOrMemberDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const formatGender = (gender) => {
    if (!gender) return "—";
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const handleFollowToggle = async () => {
    if (!profile || !profile._id || followLoading) return;
    setFollowLoading(true);
    const res = await followUserApi(profile._id);
    if (res?.success || res?.message?.toLowerCase()?.includes("success")) {
      const currentlyFollowing = res?.data?.following ?? !isFollowing;
      setIsFollowing(currentlyFollowing);
      
      // Dynamically update followers count
      setProfile((prev) => {
        if (!prev) return prev;
        const newCount = res?.data?.followersCount ?? (currentlyFollowing ? (prev.followersCount || 0) + 1 : Math.max(0, (prev.followersCount || 0) - 1));
        return {
          ...prev,
          followersCount: newCount
        };
      });
    }
    setFollowLoading(false);
  };

  const handlePostUpdate = (postId, updatedData) => {
    setUserPosts((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, ...updatedData } : p))
    );
  };

  const handleFileChange = async (e) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg(null);
    setImgError(false);

    // Clear stale flags
    localStorage.removeItem("user_profile_photo_removed");

    const res = await uploadProfilePhotoApi(file);

    const isSuccess =
      res?.message?.toLowerCase()?.includes("success") ||
      res?.status === "success" ||
      res?.user ||
      res?.data?.user;

    if (isSuccess) {
      const updatedProfileRes = await getMyProfileApi();
      const updatedUser = updatedProfileRes?.data?.user || updatedProfileRes?.user || updatedProfileRes;

      const newPhoto =
        res?.user?.photo ||
        res?.user?.profilePhoto ||
        res?.data?.user?.photo ||
        res?.photo ||
        updatedUser?.photo ||
        DEFAULT_API_AVATAR;

      if (updatedUser) {
        setProfile({ ...updatedUser, photo: newPhoto });
      } else {
        setProfile((prev) => ({ ...prev, photo: newPhoto }));
      }

      if (setUserProfile) {
        setUserProfile((prev) => ({ ...prev, photo: newPhoto }));
      }

      setUploadMsg({ type: "success", text: res?.message || "Profile photo updated successfully!" });
    } else {
      setUploadMsg({ type: "error", text: res?.message || res?.error || "Failed to upload photo" });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCoverChange = async (e) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    setUploadMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const coverDataUrl = evt.target.result;
      localStorage.setItem("user_cover_banner", coverDataUrl);
      setProfile((prev) => ({ ...prev, coverPhoto: coverDataUrl }));
      setUploadMsg({ type: "success", text: "Cover banner updated successfully!" });
      setCoverUploading(false);
    };

    reader.onerror = () => {
      setCoverUploading(false);
      setUploadMsg({ type: "error", text: "Failed to read image file" });
    };

    reader.readAsDataURL(file);

    uploadCoverPhotoApi(file).catch((err) => console.log("Cover API error:", err));

    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleRemoveProfilePhoto = async () => {
    if (!isOwnProfile) return;
    setUploading(true);
    setUploadMsg(null);
    setImgError(false);

    // Clear any stale localStorage flag
    localStorage.removeItem("user_profile_photo_removed");

    try {
      await removeProfilePhotoApi();
    } catch (e) {
      console.log("Remove photo API error:", e);
    }

    // Refetch from API so we get the real default avatar URL the server set
    const refreshed = await getMyProfileApi();
    const refreshedUser = refreshed?.data?.user || refreshed?.user || null;
    const resetPhoto = refreshedUser?.photo || DEFAULT_API_AVATAR;

    setImgError(false);
    setProfile((prev) => ({ ...prev, photo: resetPhoto }));
    if (setUserProfile) {
      setUserProfile((prev) => ({ ...prev, photo: resetPhoto }));
    }

    setUploading(false);
    setUploadMsg({ type: "success", text: "Profile photo reset to default avatar!" });
  };

  const handleRemoveCoverPhoto = async () => {
    if (!isOwnProfile) return;
    setCoverUploading(true);
    setUploadMsg(null);

    localStorage.removeItem("user_cover_banner");
    try {
      await removeCoverPhotoApi();
    } catch (e) {
      console.log("Remove cover API error:", e);
    }

    setProfile((prev) => ({ ...prev, coverPhoto: "" }));
    setCoverUploading(false);
    setUploadMsg({ type: "success", text: "Cover banner removed successfully!" });
  };

  return (
    <>
      {isOwnProfile && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverChange}
            accept="image/*"
            className="hidden"
          />
        </>
      )}

      {loading ? (
        <div className="w-full min-h-screen bg-[#f1f5f9] animate-pulse max-w-5xl mx-auto pt-6 px-4">
          <div className="bg-white h-[280px] w-full rounded-3xl mb-6" />
          <div className="bg-white h-[350px] w-full rounded-3xl" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#f1f5f9] w-full overflow-x-hidden font-sans py-4">
          {/* ── ALERTS / TOAST ── */}
          {uploadMsg && (
            <div className="fixed top-5 right-5 z-50">
              <div
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border text-sm font-bold ${
                  uploadMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                <i className={`fa-solid ${uploadMsg.type === "success" ? "fa-circle-check text-emerald-600" : "fa-circle-exclamation text-red-600"} text-lg`} />
                <span>{uploadMsg.text}</span>
                <button onClick={() => setUploadMsg(null)} className="ml-4 opacity-50 hover:opacity-100">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>
          )}

          <div className="max-w-5xl mx-auto px-4">
            {/* ── BREADCRUMB & TABS HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <button
                  onClick={() => navigate(-1)}
                  className="hover:text-[#016630] flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none p-0 text-slate-500"
                >
                  <i className="fa-solid fa-chevron-left text-xs" /> Back
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-[#016630] font-extrabold flex items-center gap-1.5">
                  <i className="fa-regular fa-user" /> {profile?.name}
                </span>
              </div>

              {/* TABS (Only for Own Profile) */}
              {isOwnProfile && (
                <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex gap-1 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                      activeTab === "profile"
                        ? "bg-[#016630] text-white shadow-md shadow-[#016630]/20"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <i className="fa-regular fa-user text-xs" />
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                      activeTab === "settings"
                        ? "bg-[#016630] text-white shadow-md shadow-[#016630]/20"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <i className="fa-solid fa-sliders text-xs" />
                    Settings
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "profile" ? (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {/* ── HEADER CARD ── */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 relative overflow-hidden">
                    {/* Cover Banner Top Area */}
                    <div className="h-44 md:h-52 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#016630] to-slate-900 relative overflow-hidden flex items-center justify-end p-6 mb-6 shadow-inner">
                      {profile?.coverPhoto ? (
                        <img src={profile.coverPhoto} alt="Cover Banner" className="w-full h-full object-cover absolute inset-0" />
                      ) : (
                        <i className="fa-regular fa-comment-dots text-white/10 text-[180px] absolute -right-6 top-1/2 -translate-y-1/2 select-none" />
                      )}

                      {/* Cover Controls (Only for own profile) */}
                      {isOwnProfile && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                          <button
                            onClick={() => coverInputRef.current?.click()}
                            disabled={coverUploading}
                            className="bg-black/50 hover:bg-black/75 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/20 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                          >
                            <i className={`fa-solid ${coverUploading ? "fa-spinner fa-spin" : "fa-camera"}`} />
                            {profile?.coverPhoto ? "Edit Cover" : "Add Cover"}
                          </button>

                          {profile?.coverPhoto && (
                            <button
                              onClick={handleRemoveCoverPhoto}
                              disabled={coverUploading}
                              className="bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
                              title="Remove Cover"
                            >
                              <i className="fa-solid fa-trash-can" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* User Profile Info & Follow Row */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-20 px-2 md:px-4 relative z-10">
                      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                        {/* Circle Avatar */}
                        <div
                          className={`w-36 h-36 md:w-40 md:h-40 rounded-full ring-8 ring-white shadow-xl overflow-hidden bg-slate-100 shrink-0 relative group ${
                            isOwnProfile ? "cursor-pointer" : ""
                          }`}
                          onClick={() => isOwnProfile && !uploading && fileInputRef.current?.click()}
                          title={isOwnProfile ? "Click to update profile photo" : profile?.name}
                        >
                          {uploading ? (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                              <i className="fa-solid fa-spinner fa-spin text-3xl text-[#016630]" />
                            </div>
                          ) : (
                            <img
                              src={(isOwnProfile ? (userProfile?.photo || profile?.photo) : profile?.photo) || DEFAULT_API_AVATAR}
                              alt={profile?.name || "User"}
                              onError={(e) => {
                                if (e.target.src !== DEFAULT_API_AVATAR) {
                                  e.target.src = DEFAULT_API_AVATAR;
                                }
                              }}
                              className="w-full h-full object-cover"
                            />
                          )}

                          {isOwnProfile && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                              <i className="fa-solid fa-camera text-xl" />
                              <span className="text-xs font-bold">Change</span>
                            </div>
                          )}
                        </div>

                        <div className="pb-2">
                          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            {profile?.name}
                          </h1>
                          <div className="w-14 h-1 bg-[#016630] rounded-full my-2 mx-auto md:mx-0" />
                          <p className="text-slate-400 font-bold text-base">
                            @{profile?.username || profile?.name?.toLowerCase()?.replace(/\s+/g, "")}
                          </p>
                        </div>
                      </div>

                      {/* Follow Button (Shown for other users) */}
                      {!isOwnProfile && (
                        <button
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`font-extrabold px-7 py-2.5 rounded-full shadow-md flex items-center justify-center gap-2 text-sm transition-all active:scale-95 cursor-pointer self-center md:self-end disabled:opacity-50 ${
                            isFollowing
                              ? "bg-emerald-50 text-[#016630] border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              : "bg-[#016630] hover:bg-[#014d24] text-white"
                          }`}
                        >
                          {followLoading ? (
                            <i className="fa-solid fa-spinner fa-spin text-xs" />
                          ) : (
                            <i className={`fa-solid ${isFollowing ? "fa-user-check" : "fa-user-plus"} text-xs`} />
                          )}
                          <span>
                            {followLoading ? "Processing..." : isFollowing ? "Following" : "Follow"}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Stat Cards Grid */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4 mt-8 px-2 md:px-4">
                      {[
                        { label: "POSTS", value: userPosts.length, icon: "fa-regular fa-file-lines" },
                        { label: "FOLLOWERS", value: profile?.followersCount ?? profile?.followers?.length ?? 0, icon: "fa-solid fa-users" },
                        { label: "FOLLOWING", value: profile?.followingCount ?? profile?.following?.length ?? 0, icon: "fa-regular fa-user" },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-slate-50/80 border border-slate-100 p-4 md:p-5 rounded-2xl flex flex-col justify-between hover:bg-slate-100/60 transition-colors">
                          <span className="text-3xl md:text-4xl font-black text-[#016630] tracking-tight leading-none mb-3">{stat.value}</span>
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                            <i className={`${stat.icon} text-xs text-slate-400`} />
                            <span>{stat.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── PROFILE INFORMATION SECTION ── */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mb-6">
                      Profile Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Box 1: Username */}
                      <div className="bg-[#f4f7fa] p-5 rounded-2xl flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Username
                        </span>
                        <span className="text-[#016630] font-extrabold text-base">
                          @{profile?.username || profile?.name?.toLowerCase()?.replace(/\s+/g, "")}
                        </span>
                      </div>

                      {/* Box 2: Full Name */}
                      <div className="bg-[#f4f7fa] p-5 rounded-2xl flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Full Name
                        </span>
                        <span className="text-[#016630] font-extrabold text-base">
                          {profile?.name || "—"}
                        </span>
                      </div>

                      {/* Box 3: Email Address */}
                      <div className="bg-[#f4f7fa] p-5 rounded-2xl flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Email Address
                        </span>
                        <span className="text-[#016630] font-extrabold text-base break-all">
                          {profile?.email || "—"}
                        </span>
                      </div>

                      {/* Box 4: Date of Birth */}
                      <div className="bg-[#f4f7fa] p-5 rounded-2xl flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Date of Birth
                        </span>
                        <span className="text-[#016630] font-extrabold text-base">
                          {formatBirthOrMemberDate(profile?.dateOfBirth)}
                        </span>
                      </div>

                      {/* Box 5: Gender */}
                      <div className="bg-[#f4f7fa] p-5 rounded-2xl flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Gender
                        </span>
                        <span className="text-[#016630] font-extrabold text-base">
                          {formatGender(profile?.gender)}
                        </span>
                      </div>

                      {/* Box 6: Member Since */}
                      <div className="bg-[#f4f7fa] p-5 rounded-2xl flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Member Since
                        </span>
                        <span className="text-[#016630] font-extrabold text-base">
                          {formatBirthOrMemberDate(profile?.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── USER POSTS SECTION BELOW ── */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm mb-12">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#016630] flex items-center justify-center text-lg shadow-sm">
                        <i className="fa-regular fa-file-lines" />
                      </div>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {profile?.name?.split(" ")[0]} <span className="text-[#016630]">Posts</span>
                      </h2>
                    </div>

                    {postsLoading ? (
                      <Loading />
                    ) : userPosts.length > 0 ? (
                      <div className="space-y-6">
                        {userPosts.map((postItem) => (
                          <PostCard
                            key={postItem._id}
                            post={postItem}
                            onUpdate={(updatedData) => handlePostUpdate(postItem._id, updatedData)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-medium">
                        <i className="fa-regular fa-folder-open text-4xl mb-3 text-slate-300 block" />
                        No posts published by {profile?.name?.split(" ")[0]} yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* ── CONFIGURATION / SETTINGS TAB (ONLY OWN PROFILE) ── */
                isOwnProfile && (
                  <motion.div key="config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Profile Photo Management */}
                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-28 h-28 mb-6 bg-slate-50 relative rounded-full overflow-hidden shadow-inner ring-4 ring-slate-100 flex items-center justify-center">
                          {uploading ? (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                              <i className="fa-solid fa-spinner fa-spin text-2xl text-[#016630]" />
                            </div>
                          ) : (
                            <img
                              src={userProfile?.photo || profile?.photo || DEFAULT_API_AVATAR}
                              alt="Profile Avatar"
                              onError={(e) => {
                                if (e.target.src !== DEFAULT_API_AVATAR) {
                                  e.target.src = DEFAULT_API_AVATAR;
                                }
                              }}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 mb-1 leading-none">Profile Photo</h4>
                        <p className="text-[11px] text-slate-400 mb-6 uppercase font-bold tracking-widest">Asset Management</p>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="text-[#016630] bg-[#016630]/5 hover:bg-[#016630]/10 px-4 py-2 rounded-xl font-bold text-[13px] transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            <i className={`fa-solid ${uploading ? "fa-spinner fa-spin" : "fa-cloud-arrow-up"} text-xs`} />
                            {uploading ? "Uploading..." : "Edit Photo"}
                          </button>

                          <button
                            onClick={handleRemoveProfilePhoto}
                            disabled={uploading}
                            className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl font-bold text-[13px] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <i className="fa-solid fa-trash-can text-xs" />
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Cover Banner Management */}
                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <div className="w-28 h-28 mb-6 bg-slate-50 relative rounded-2xl overflow-hidden shadow-inner ring-4 ring-slate-100">
                          {coverUploading ? (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                              <i className="fa-solid fa-spinner fa-spin text-2xl text-[#016630]" />
                            </div>
                          ) : profile?.coverPhoto ? (
                            <img src={profile.coverPhoto} className="w-full h-full object-cover" alt="Cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl text-slate-200">
                              <i className="fa-regular fa-image" />
                            </div>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 mb-1 leading-none">Cover Banner</h4>
                        <p className="text-[11px] text-slate-400 mb-6 uppercase font-bold tracking-widest">Asset Management</p>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => coverInputRef.current?.click()}
                            disabled={coverUploading}
                            className="text-[#016630] bg-[#016630]/5 hover:bg-[#016630]/10 px-4 py-2 rounded-xl font-bold text-[13px] transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            <i className={`fa-solid ${coverUploading ? "fa-spinner fa-spin" : "fa-cloud-arrow-up"} text-xs`} />
                            {coverUploading ? "Uploading..." : "Edit Banner"}
                          </button>

                          {profile?.coverPhoto && (
                            <button
                              onClick={handleRemoveCoverPhoto}
                              disabled={coverUploading}
                              className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl font-bold text-[13px] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                              <i className="fa-solid fa-trash-can text-xs" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Security Protocols / Password Settings */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-slate-50 text-[#016630] rounded-2xl flex items-center justify-center text-lg">
                          <i className="fa-solid fa-shield-halved" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Security Protocols</h3>
                      </div>

                      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { label: "Current Master Key", placeholder: "••••••••", type: "password" },
                            { label: "Target New Key", placeholder: "••••••••", type: "password" },
                            { label: "Confirm Alignment", placeholder: "••••••••", type: "password" },
                          ].map((input, idx) => (
                            <div key={input.label} className={`space-y-1.5 ${idx === 0 ? "md:col-span-1" : ""}`}>
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{input.label}</label>
                              <input
                                type={input.type}
                                placeholder={input.placeholder}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5 text-[15px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#016630]/10 focus:border-[#016630]/20 transition-all"
                              />
                            </div>
                          ))}
                        </div>
                        <button className="bg-[#016630] text-white font-bold px-8 py-3 rounded-2xl shadow-sm hover:opacity-90 transition-colors active:scale-95 text-sm mt-2 cursor-pointer">
                          Rewrite Key
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </>
  );
}
