import React, { useState, useRef } from "react";
import { Divider } from "@heroui/react";
import EmojiPicker from "emoji-picker-react";
import UserAvatar from "../UserAvatar/UserAvatar";
import { createCommentApi } from "../CreateComment/CreateCommentApi";
import { getPostComments } from "../AllPosts/AllPosts";

export default function CommentInput({ currentUser, setComments, postId, onCommentAdded }) {
  const [commentText, setCommentText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.src = evt.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);

        setSelectedImage({
          file,
          previewUrl: compressedDataUrl,
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function createComment(event) {
    event.preventDefault();
    if ((!commentText.trim() && !selectedImage) || loading) {
      return;
    }

    setLoading(true);
    try {
      // Send zero-width spaces if no text is typed to satisfy RouteMisr API minimum 2 char length requirement
      const textToSubmit = commentText.trim() || "\u200B\u200B";
      const apiResponse = await createCommentApi(postId, textToSubmit);

      const isSuccess =
        apiResponse?.success === true ||
        apiResponse?.message === "comment created successfully" ||
        apiResponse?.data?.comment ||
        apiResponse?.comment;

      if (isSuccess) {
        const createdComment = apiResponse?.data?.comment || apiResponse?.comment;
        const commentId = createdComment?._id || createdComment?.id;

        // Persist comment image locally if attached
        if (selectedImage?.previewUrl && commentId) {
          try {
            const savedMap = JSON.parse(localStorage.getItem("comment_attached_images") || "{}");
            savedMap[commentId] = selectedImage.previewUrl;
            localStorage.setItem("comment_attached_images", JSON.stringify(savedMap));
          } catch (e) {
            console.error("Error saving comment image locally:", e);
          }
        }

        setCommentText("");
        setSelectedImage(null);
        setShowEmojiPicker(false);
        if (fileInputRef.current) fileInputRef.current.value = "";

        const refreshedComments = await getPostComments(postId);
        let updatedCommentsList = [];
        if (refreshedComments) {
          updatedCommentsList =
            refreshedComments.comments ||
            refreshedComments.data?.comments ||
            refreshedComments.data ||
            [];
        }
        setComments(updatedCommentsList);
        if (onCommentAdded) onCommentAdded(updatedCommentsList);
      } else {
        alert(apiResponse?.message || "Failed to create comment");
      }
    } catch (error) {
      console.error("Unexpected error during comment creation:", error);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = (commentText.trim().length > 0 || selectedImage !== null) && !loading;

  return (
    <>
      <Divider className="mt-2 mb-6 bg-gray-50" />
      <div className="flex gap-4 items-start mb-8 px-2">
        <UserAvatar user={currentUser} size="md" showSkeleton />

        <form
          className="flex-1 bg-gray-50/80 border border-gray-100 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all rounded-[16px] p-3 pl-4 flex flex-col gap-3"
          onSubmit={createComment}
        >
          <input
            type="text"
            value={commentText}
            maxLength={300}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Write a comment..."
            disabled={loading}
            className="bg-transparent border-none outline-none text-[15px] font-medium text-gray-700 placeholder:text-gray-400 w-full disabled:opacity-50"
          />

          {/* Attached Image Preview */}
          {selectedImage && (
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-[#016630]/30 shadow-md group my-1">
              <img
                src={selectedImage.previewUrl}
                alt="Comment attachment"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-sm cursor-pointer"
                title="Remove image"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-1 relative">
            <div className="flex gap-4 text-[#94a3b8] relative items-center">
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
              />
              <i
                className={`fa-regular fa-image cursor-pointer text-[19px] transition-all duration-200 hover:scale-110 ${
                  selectedImage ? "text-[#016630] font-bold" : "hover:text-[#016630]"
                }`}
                onClick={() => fileInputRef.current?.click()}
                title="Attach an image"
              />
              <i
                className="fa-regular fa-face-smile cursor-pointer text-[19px] transition-all duration-200 hover:scale-110 hover:text-[#eab308]"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Add emoji"
              />
              {showEmojiPicker && (
                <div
                  className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                  onClick={() => setShowEmojiPicker(false)}
                >
                  <div
                    className="[--epr-highlight-color:#016630] [--epr-hover-bg-color:#f0fdf4] [--epr-focus-bg-color:#dcfce7] [--epr-search-border-color:#016630] [--epr-bg-color:#ffffff] [--epr-category-label-bg-color:#ffffff] shadow-[0_20px_50px_rgba(1,102,48,0.15)] rounded-2xl overflow-hidden border-[3px] border-[#016630]/20 animate-appearance-in"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <EmojiPicker
                      theme="light"
                      width={360}
                      height={420}
                      onEmojiClick={(emojiData) => {
                        setCommentText((previousText) => previousText + emojiData.emoji);
                        setShowEmojiPicker(false);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {commentText.length > 0 && (
                <span className="text-[11px] font-bold text-gray-400">
                  {300 - commentText.length}
                </span>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border ${
                  canSubmit
                    ? "bg-[#016630] text-white border-[#016630] scale-105 hover:scale-110 hover:bg-[#014d24] active:scale-95 shadow-green-200/50 hover:shadow-green-300/60 cursor-pointer"
                    : "bg-white text-[#94a3b8] border-gray-50 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <i className="fa-solid fa-spinner fa-spin text-[14px]" />
                ) : (
                  <i
                    className={`fa-solid fa-paper-plane text-[14px] transition-transform ${
                      canSubmit ? "-ml-0.5" : ""
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
