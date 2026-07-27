import React, { useState, useEffect, useContext, useRef } from "react";
import { Card, Divider, Button } from "@heroui/react";
import EmojiPicker from "emoji-picker-react";

// ── Internal Components ──
import PostCard from "../PostCard/PostCard";
import Loading from "../Loading/Loading";
import UserAvatar from "../UserAvatar/UserAvatar";

// ── Context & Utils ──
import { AuthContext } from "../../Context/AuthContext";
import { getPosts, createPostApi } from "../AllPosts/AllPosts";

// ── Persistence Layer (survives refreshes) ──
const getSavedData = (key, defaultValue) => {
  const serializedData = sessionStorage.getItem(key);
  return serializedData ? JSON.parse(serializedData) : defaultValue;
};

const setSavedData = (key, value) => sessionStorage.setItem(key, JSON.stringify(value));

// Global variables for quick access during component lifecycle
let cachedPosts = getSavedData("cachedPosts", []);
let cachedPage = getSavedData("cachedPage", 1);
let cachedHasMore = getSavedData("cachedHasMore", true);
let scrollPosition = getSavedData("scrollPosition", 0);

// Helper to reset everything (used by Navbar)
export const clearHomeCache = () => {
  sessionStorage.removeItem("cachedPosts");
  sessionStorage.removeItem("cachedPage");
  sessionStorage.removeItem("cachedHasMore");
  sessionStorage.removeItem("scrollPosition");
  cachedPosts = [];
  cachedPage = 1;
  cachedHasMore = true;
  scrollPosition = 0;
};

export default function Home() {
  // ── Feed States ──
  const [posts, setPosts] = useState(cachedPosts);
  const [page, setPage] = useState(cachedPage);
  const [hasMore, setHasMore] = useState(cachedHasMore);
  const [loading, setLoading] = useState(posts.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // ── Create Post States ──
  const [postText, setPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // { file, previewUrl }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState(null); // { type: "success"|"error", text }

  const { userProfile } = useContext(AuthContext);
  const currentUser = userProfile || { name: "User", photo: "" };
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // ── 3-Refresh Protection Logic ──
  useEffect(() => {
    const performanceEntries = performance.getEntriesByType("navigation");
    const isPageReload = performanceEntries.length > 0 && performanceEntries[0].type === "reload";

    if (isPageReload) {
      const refreshCount = getSavedData("rf_count", 0) + 1;
      if (refreshCount >= 3) {
        clearHomeCache();
        setSavedData("rf_count", 0);
        window.location.href = "/";
      } else {
        setSavedData("rf_count", refreshCount);
      }
    } else {
      setSavedData("rf_count", 0);
    }
  }, []);

  // ── Data Fetching ──
  async function fetchPosts(pageNum = 1) {
    if (pageNum === 1 && posts.length === 0) setLoading(true);
    else if (pageNum > 1) setLoadingMore(true);

    setErrorMessage(null);
    try {
      let apiResponse = await getPosts(10, pageNum);
      if (apiResponse && (apiResponse.message === "success" || apiResponse.message === "Success")) {
        let postsArray = apiResponse.posts || apiResponse.data || [];
        if (apiResponse.data && Array.isArray(apiResponse.data.posts)) {
          postsArray = apiResponse.data.posts;
        } else if (apiResponse.posts && Array.isArray(apiResponse.posts.data)) {
          postsArray = apiResponse.posts.data;
        }

        const hasMorePosts = postsArray.length >= 10;
        setHasMore(hasMorePosts);
        cachedHasMore = hasMorePosts;
        setSavedData("cachedHasMore", hasMorePosts);

        if (pageNum === 1) {
          setPosts(postsArray);
          cachedPosts = postsArray;
          setSavedData("cachedPosts", postsArray);
        } else {
          setPosts((previousPosts) => {
            const updatedPostsList = [...previousPosts, ...postsArray];
            cachedPosts = updatedPostsList;
            setSavedData("cachedPosts", updatedPostsList);
            return updatedPostsList;
          });
        }
        setPage(pageNum);
        cachedPage = pageNum;
        setSavedData("cachedPage", pageNum);
      } else if (pageNum === 1 && posts.length === 0) {
        setErrorMessage(apiResponse?.message || "Error fetching posts");
      }
    } catch (error) {
      if (pageNum === 1 && posts.length === 0) {
        setErrorMessage("Connection error");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // ── Initial Load & Scroll Restoration ──
  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts(1);
    } else {
      setTimeout(() => window.scrollTo(0, scrollPosition), 150);
    }

    const handleScrollEvent = () => {
      if (window.scrollY > 0) {
        scrollPosition = window.scrollY;
        setSavedData("scrollPosition", scrollPosition);
      }
    };
    window.addEventListener("scroll", handleScrollEvent);
    return () => window.removeEventListener("scroll", handleScrollEvent);
  }, []);

  // ── Feed Handlers ──
  const handlePostUpdate = (postId, updatedData) => {
    setPosts((previousPosts) => {
      const updatedPostsList = previousPosts.map((postItem) =>
        postItem._id === postId ? { ...postItem, ...updatedData } : postItem
      );
      cachedPosts = updatedPostsList;
      setSavedData("cachedPosts", updatedPostsList);
      return updatedPostsList;
    });
  };

  const handleViewMore = () => fetchPosts(page + 1);

  // ── Create Post Handlers ──
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.src = evt.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let w = img.width, h = img.height;
        if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        setSelectedImage({ file, previewUrl: canvas.toDataURL("image/jpeg", 0.85) });
      };
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = postText.slice(0, start) + emoji + postText.slice(end);
      setPostText(newText);
      // Put cursor after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 10);
    } else {
      setPostText((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleSubmitPost = async () => {
    const trimmedText = postText.trim();
    if (!trimmedText && !selectedImage) return;
    if (posting) return;

    setPosting(true);
    setPostMsg(null);

    try {
      const res = await createPostApi(trimmedText, selectedImage?.file || null);
      const success = res?.success === true || res?.message?.toLowerCase()?.includes("created");

      if (success) {
        const newPost = res?.data?.post || res?.post;
        // Prepend new post to feed (optimistic update)
        if (newPost) {
          setPosts((prev) => {
            const updated = [{ ...newPost, user: currentUser }, ...prev];
            cachedPosts = updated;
            setSavedData("cachedPosts", updated);
            return updated;
          });
        } else {
          // Fallback: refetch first page
          clearHomeCache();
          await fetchPosts(1);
        }
        setPostText("");
        setSelectedImage(null);
        setPostMsg({ type: "success", text: "Post published successfully! 🎉" });
        setTimeout(() => setPostMsg(null), 3000);
      } else {
        setPostMsg({ type: "error", text: res?.message || "Failed to publish post." });
      }
    } catch (err) {
      setPostMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setPosting(false);
    }
  };

  const canPost = (postText.trim().length > 0 || selectedImage !== null) && !posting;

  return <>
    <div className="max-w-[800px] mx-auto flex flex-col gap-8">

      {/* ── Toast notification ── */}
      {postMsg && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold transition-all ${
          postMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <i className={`fa-solid ${postMsg.type === "success" ? "fa-circle-check text-emerald-500" : "fa-circle-exclamation text-red-500"} text-lg`} />
          {postMsg.text}
          <button onClick={() => setPostMsg(null)} className="ml-3 opacity-50 hover:opacity-100 cursor-pointer">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* ── Create Post Card ── */}
      <Card className="p-5 bg-white shadow-sm border border-gray-100 rounded-[20px]">
        {/* Avatar + Textarea row */}
        <div className="flex gap-4 items-start mb-4">
          <UserAvatar user={currentUser} size="lg" showSkeleton />
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's on your mind?"
              rows={postText.length > 80 || postText.includes("\n") ? 4 : 2}
              className="w-full bg-gray-50/80 rounded-[16px] px-5 py-3.5 text-gray-700 font-medium text-[16px] placeholder:text-gray-400 focus:outline-none focus:bg-gray-100/60 transition-colors resize-none min-h-[54px] leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmitPost();
                }
              }}
            />
          </div>
        </div>

        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-4 ml-[64px] relative w-fit">
            <div className="relative group rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm">
              <img
                src={selectedImage.previewUrl}
                alt="Selected"
                className="max-h-72 max-w-full object-contain rounded-2xl"
              />
              {/* Remove image overlay */}
              <button
                onClick={removeSelectedImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer"
                title="Remove image"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 font-bold mt-1.5 flex items-center gap-1">
              <i className="fa-regular fa-image text-[#016630]" />
              Image attached
            </p>
          </div>
        )}

        <Divider className="mb-4 bg-gray-100/50" />

        {/* Bottom Row: Actions + Post Button */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 relative">
            {/* Hidden file input */}
            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
            />

            {/* Photo Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl transition-all text-sm font-bold ${
                selectedImage
                  ? "bg-emerald-50 text-[#016630]"
                  : "hover:bg-gray-50 text-gray-500"
              }`}
            >
              <i className={`fa-regular fa-image text-xl ${selectedImage ? "text-[#016630]" : "text-green-500"}`} />
              <span className="text-[15px]">Photo</span>
            </button>

            {/* Emoji Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl transition-all font-bold ${
                showEmojiPicker ? "bg-yellow-50 text-yellow-600" : "hover:bg-gray-50 text-gray-500"
              }`}
            >
              <i className="fa-regular fa-face-smile text-yellow-500 text-xl" />
              <span className="text-[15px]">Emoji</span>
            </button>

            {/* Emoji Picker Modal */}
            {showEmojiPicker && (
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                onClick={() => setShowEmojiPicker(false)}
              >
                <div
                  className="shadow-xl rounded-2xl overflow-hidden border-[3px] border-[#016630]/20 animate-appearance-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EmojiPicker
                    theme="light"
                    width={360}
                    height={420}
                    onEmojiClick={handleEmojiClick}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Post Button */}
          <Button
            onClick={handleSubmitPost}
            isDisabled={!canPost}
            isLoading={posting}
            className={`font-extrabold px-10 py-2.5 h-auto text-[15px] transition-all active:scale-95 shadow-sm rounded-xl ${
              canPost
                ? "bg-[#016630] hover:bg-[#014d24] text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            radius="lg"
          >
            {posting ? "Publishing..." : "Post"}
          </Button>
        </div>

        {/* Keyboard shortcut hint */}
        {postText.trim().length > 0 && (
          <p className="text-[11px] text-gray-400 mt-2 text-right font-medium">
            Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl+Enter</kbd> to publish
          </p>
        )}
      </Card>

      {/* ── Post Feed Section ── */}
      {loading ? (
        <Loading />
      ) : errorMessage ? (
        <div className="text-center py-20 bg-white rounded-[20px] border border-red-100 shadow-sm">
          <p className="text-red-500 font-bold">{errorMessage}</p>
          <Button variant="flat" color="success" className="mt-6" onClick={() => fetchPosts(1)}>Try Again</Button>
        </div>
      ) : posts.length > 0 ? (
        posts.map((postItem) => (
          <PostCard
            key={postItem._id}
            post={postItem}
            onUpdate={(updatedData) => handlePostUpdate(postItem._id, updatedData)}
          />
        ))
      ) : (
        <div className="text-center py-20 bg-white rounded-[20px] border border-dashed border-gray-200 text-gray-400 font-medium">No posts available.</div>
      )}

      {/* ── Pagination ── */}
      {!loading && posts.length > 0 && hasMore && (
        <div className="flex justify-center mt-4 mb-8">
          <Button
            className="bg-white border-2 border-[#016630] text-[#016630] font-extrabold px-12 py-6 text-[16px] hover:bg-[#016630] hover:text-white transition-all duration-300 shadow-sm rounded-[14px] active:scale-95"
            onClick={handleViewMore}
            isLoading={loadingMore}
          >
            {loadingMore ? "Loading..." : "View More"}
          </Button>
        </div>
      )}
    </div>
  </>;
}
