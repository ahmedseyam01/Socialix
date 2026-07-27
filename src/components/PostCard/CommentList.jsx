import { useState, useRef, useContext, useEffect } from "react";
import { formatTimeAgo } from "../../utils/timeFormat";
import UserAvatar from "../UserAvatar/UserAvatar";
import { createReplyApi, getCommentRepliesApi, updateCommentApi, deleteCommentApi } from "../CreateComment/CreateCommentApi";
import { likeCommentApi } from "../CreateComment/LikeCommentApi";
import EmojiPicker from "emoji-picker-react";
import { AuthContext } from "../../Context/AuthContext";

export default function CommentList({ comments, postId, onCommentsRefresh, depth = 0 }) {
  const { userProfile } = useContext(AuthContext);
  const [likedStates, setLikedStates] = useState({});
  const [replyForms, setReplyForms] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [errorMessages, setErrorMessages] = useState({});
  const [repliesVisibility, setRepliesVisibility] = useState({});
  const [nestedRepliesData, setNestedRepliesData] = useState({});
  const [hasFetchedOnce, setHasFetchedOnce] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // which comment are we about to delete?

  // Edit state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [localComments, setLocalComments] = useState(null);

  const fileInputRef = useRef(null);

  const displayComments = localComments || comments;

  // --- Handlers ---

  const handleDeleteComment = async (commentId) => {
    // Show our custom confirm modal instead of window.confirm
    setConfirmDeleteId(commentId);
  };

  const confirmDelete = async () => {
    const commentId = confirmDeleteId;
    setConfirmDeleteId(null); // close modal first

    try {
      const response = await deleteCommentApi(postId, commentId);

      if (response && (response.message === "success" || response.success)) {
        // Remove from UI immediately
        setLocalComments(prev =>
          (prev || displayComments).filter(c => (c._id || c.id) !== commentId)
        );
        if (onCommentsRefresh) onCommentsRefresh();
      } else {
        alert(response?.message || "Could not delete comment.");
      }
    } catch (err) {
      console.error("Delete Comment Error:", err);
    }
  };

  const fetchReplies = async (commentId) => {
    if (commentId && postId) {
      setLoadingStates(prev => ({ ...prev, [commentId]: true }));
      try {
        const apiResponse = await getCommentRepliesApi(postId, commentId, 1, 10);
        if (apiResponse && !apiResponse.error) {
          const fetchedData = apiResponse.data?.replies || apiResponse.replies || apiResponse.data || [];
          if (Array.isArray(fetchedData)) {
            setNestedRepliesData(prev => ({ ...prev, [commentId]: fetchedData }));
            setHasFetchedOnce(prev => ({ ...prev, [commentId]: true }));
          }
        }
      } catch (error) {
        console.error("fetchReplies: Error", error);
      } finally {
        setLoadingStates(prev => ({ ...prev, [commentId]: false }));
      }
    }
  };

  const handleLikeAction = async (commentId) => {
    const isLiked = likedStates[commentId] || false;
    setLikedStates(prev => ({ ...prev, [commentId]: !isLiked }));
    try {
      await likeCommentApi(commentId);
    } catch (error) {
      setLikedStates(prev => ({ ...prev, [commentId]: isLiked }));
    }
  };

  const handleReplySubmit = async (event, commentId) => {
    event.preventDefault();
    const text = replyTexts[commentId] || "";
    if (text.trim()) {
      setLoadingStates(prev => ({ ...prev, [`submit-${commentId}`]: true }));
      setErrorMessages(prev => ({ ...prev, [commentId]: "" }));
      try {
        const apiResponse = await createReplyApi(postId, commentId, text);
        if (apiResponse && !apiResponse.error && (apiResponse.message === "success" || apiResponse.success)) {
          const newReply = apiResponse.reply || apiResponse.data?.reply;
          setReplyTexts(prev => ({ ...prev, [commentId]: "" }));
          setReplyForms(prev => ({ ...prev, [commentId]: false }));
          setRepliesVisibility(prev => ({ ...prev, [commentId]: true }));
          if (newReply) {
            setNestedRepliesData(prev => ({ ...prev, [commentId]: [...(prev[commentId] || []), newReply] }));
          } else {
            await fetchReplies(commentId);
          }
        } else {
          setErrorMessages(prev => ({ ...prev, [commentId]: apiResponse.message || "Failed to send." }));
        }
      } catch (error) {
        setErrorMessages(prev => ({ ...prev, [commentId]: "Error occurred." }));
      } finally {
        setLoadingStates(prev => ({ ...prev, [`submit-${commentId}`]: false }));
      }
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment._id || comment.id);
    setEditText(comment.content);
    setEditError("");
    // close reply form if open
    setReplyForms(prev => ({ ...prev, [comment._id || comment.id]: false }));
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText("");
    setEditError("");
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return;
    setEditLoading(true);
    setEditError("");
    try {
      const res = await updateCommentApi(postId, commentId, editText.trim());
      if (res && (res.message === "success" || res.success)) {
        // Update comment locally
        setLocalComments(
          (displayComments || []).map(c =>
            (c._id || c.id) === commentId ? { ...c, content: editText.trim() } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
      } else {
        setEditError(res?.message || "Failed to update comment.");
      }
    } catch {
      setEditError("An error occurred. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    const handleGlobalClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  return <>
    {displayComments && Array.isArray(displayComments) && displayComments.length > 0 && (
      <div className={`flex flex-col ${depth === 0 ? "gap-6 px-2 mb-4" : "gap-1"}`}>
        {displayComments.map((comment, index) => {
          const commentId = comment._id || comment.id;
          const isLiked = likedStates[commentId] || false;
          const isVisible = repliesVisibility[commentId] || false;
          const currentNestedReplies = nestedRepliesData[commentId] || comment.replies || [];
          const canShowButton = (comment.replies && (comment.replies.length > 0 || typeof comment.replies === 'number')) || (currentNestedReplies.length > 0) || (comment.repliesCount > 0);
          
          // ROBUST OWNER CHECK using userProfile from Context
          const isOwner = userProfile && (
            (comment.commentCreator?._id && comment.commentCreator?._id === userProfile.id) ||
            (comment.commentCreator?.id && comment.commentCreator?._id === userProfile.id) ||
            (comment.commentCreator === userProfile.id) ||
            (comment.user === userProfile.id) ||
            (comment.commentCreator?.username && comment.commentCreator?.username === userProfile.username)
          );
          const isEditing = editingCommentId === commentId;

          return (
            <div key={commentId || `comment-${index}`} className={`flex flex-col w-full ${depth > 0 ? "pl-10 mt-3" : ""}`}>
              <div className="flex gap-3 relative">
                {depth > 0 && <div className="absolute left-[-22px] top-[-12px] bottom-1/2 w-4 border-l-2 border-b-2 border-gray-100 rounded-bl-xl" />}
                <UserAvatar user={comment.commentCreator} size="sm" className="mt-1 flex-shrink-0 z-10" />
                <div className="flex flex-col gap-1 flex-1 min-w-0">

                  {/* Comment Bubble OR Edit Form */}
                  {isEditing ? (
                    /* â”€â”€ CLEAN BUBBLE EDIT MODE â”€â”€ */
                    <div className="flex flex-col gap-2 w-full animate-appearance-in">
                      <div className="bg-[#f0f2f5] px-4 py-3 rounded-[20px] w-full shadow-sm border border-[#016630]/20 relative">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-[14.5px] text-gray-900">{comment.commentCreator?.name}</span>
                          <span className="text-[11px] font-bold text-[#016630] uppercase opacity-70">Editing...</span>
                        </div>
                        <textarea
                          autoFocus
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveEdit(commentId);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          className="w-full bg-transparent border-none outline-none text-[14.5px] font-medium text-gray-800 resize-none min-h-[60px] pb-6"
                          placeholder="Edit your comment..."
                        />
                        
                        {/* Save button INSIDE bubble at bottom right */}
                        <button 
                          onClick={() => handleSaveEdit(commentId)} 
                          disabled={!editText.trim() || editLoading}
                          title="Save changes"
                          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-[#016630] text-white flex items-center justify-center shadow-md hover:bg-[#0d542b] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                          {editLoading ? (
                            <i className="fa-solid fa-spinner fa-spin text-[10px]" />
                          ) : (
                            <i className="fa-solid fa-paper-plane text-[11px]" />
                          )}
                        </button>
                      </div>
                      
                      {editError && <p className="text-red-500 text-[11px] font-bold pl-2">{editError}</p>}
                      
                      <div className="flex items-center gap-4 pl-2">
                        <button 
                          onClick={handleCancelEdit} 
                          className="text-[12.5px] font-extrabold text-gray-500 hover:text-red-500 transition-colors"
                        >
                          Cancel
                        </button>
                        <span className="hidden sm:inline text-[10px] text-gray-400 font-medium ml-auto pr-4">Ctrl+Enter to save</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 group/comment relative">
                        <div className="bg-[#f0f2f5] px-4 py-2.5 rounded-[20px] w-fit min-w-[150px] max-w-[95%] shadow-sm hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-[14.5px] text-gray-900 cursor-pointer hover:underline">{comment.commentCreator?.name}</span>
                            <span className="text-gray-400 text-[11px] font-medium">{formatTimeAgo(comment.createdAt)}</span>
                          </div>
                          {(() => {
                            const commentId = comment._id || comment.id;
                            let localImg = null;
                            if (commentId) {
                              try {
                                const savedMap = JSON.parse(localStorage.getItem("comment_attached_images") || "{}");
                                localImg = savedMap[commentId];
                              } catch (e) {}
                            }
                            const attachedImg = comment.image || comment.photo || localImg || (typeof comment.content === "string" && comment.content.match(/(data:image\/[a-zA-Z]+;base64,[^\s]+|https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp))/)?.[0]);
                            
                            const rawText = typeof comment.content === "string" 
                              ? comment.content.replace(/(data:image\/[a-zA-Z]+;base64,[^\s]+|https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp))/, "").trim() 
                              : comment.content;

                            const isPlaceholderText = (txt) => {
                              if (!txt) return true;
                              const clean = txt.replace(/[\s\u200B\uFEFF\u00A0\u180E]+/g, "").trim();
                              return clean === "" || clean === "📷Photo" || clean === "Photo" || clean.toLowerCase() === "photo";
                            };

                            const showText = rawText && !isPlaceholderText(rawText);

                            return (
                              <>
                                {showText && (
                                  <p className="text-[14.5px] text-gray-800 font-medium leading-[1.5] break-words">{rawText}</p>
                                )}
                                {attachedImg && (
                                  <div className="mt-2 rounded-2xl overflow-hidden max-w-[260px] border border-gray-100 shadow-sm bg-black/5">
                                    <img src={attachedImg} alt="Comment media" className="w-full h-auto max-h-52 object-cover hover:scale-105 transition-transform cursor-pointer" />
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* Three dots menu â€” Aligned Top â€” ONLY for owner */}
                        {isOwner && (
                          <div className="relative mt-1" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => setOpenMenuId(openMenuId === commentId ? null : commentId)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${openMenuId === commentId ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                              <i className="fa-solid fa-ellipsis text-sm" />
                            </button>

                            {openMenuId === commentId && (
                              <div className="absolute left-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-[100] animate-appearance-in">
                                {/* Edit Option */}
                                <button
                                  onClick={() => { handleStartEdit(comment); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-green-50 hover:text-[#016630] flex items-center gap-2 transition-colors"
                                >
                                  <i className="fa-regular fa-pen-to-square" /> Edit
                                </button>

                                {/* Delete Option */}
                                <button
                                  onClick={() => { handleDeleteComment(commentId); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-left text-[13px] font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-50"
                                >
                                  <i class="fa-regular fa-trash-can"></i> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action row â€” Premium & Clean */}
                    {!isEditing && (
                      <div className="flex items-center gap-6 pl-4 mt-1.5 pb-2">
                        <button 
                          onClick={() => handleLikeAction(commentId)} 
                          className={`flex items-center gap-1.5 text-[12.5px] font-bold tracking-tight transition-all duration-200 hover:scale-105 ${isLiked ? "text-blue-600" : "text-[#64748b] hover:text-blue-600"}`}
                        >
                          <i className={`${isLiked ? "fa-solid" : "fa-regular"} fa-thumbs-up text-[14px]`} /> 
                          <span>Like</span>
                        </button>
                        
                        <button 
                          onClick={() => setReplyForms(prev => ({ ...prev, [commentId]: !prev[commentId] }))} 
                          className="flex items-center gap-1.5 text-[12.5px] font-bold tracking-tight text-[#64748b] hover:text-[#016630] transition-all duration-200 hover:scale-105"
                        >
                          <i className="fa-solid fa-reply text-[14px] opacity-80" /> 
                          <span>Reply</span>
                        </button>
                      </div>
                    )}

                  {canShowButton && !isEditing && (
                    <div onClick={() => { setRepliesVisibility(prev => ({ ...prev, [commentId]: !isVisible })); if (!isVisible && !hasFetchedOnce[commentId]) fetchReplies(commentId); }} className="flex items-center gap-3 ml-2 mt-2 text-[#016630]/70 cursor-pointer font-extrabold uppercase text-[12px] hover:text-[#016630] group transition-colors">
                      <div className={`h-[1.5px] transition-all ${isVisible ? "w-7 bg-gray-200" : "w-7 bg-[#016630]/40 group-hover:w-10 group-hover:bg-[#016630]"}`} />
                      {isVisible ? "Hide replies" : `View replies (${currentNestedReplies.length || comment.repliesCount || 0})`}
                      {loadingStates[commentId] && <i className="fa-solid fa-spinner fa-spin text-[10px] ml-1" />}
                    </div>
                  )}

                  {replyForms[commentId] && !isEditing && (
                    <form onSubmit={(e) => handleReplySubmit(e, commentId)} className="mt-2.5 flex flex-col bg-white border border-[#016630]/20 rounded-[14px] p-3 shadow-sm animate-appearance-in">
                      {errorMessages[commentId] && <div className="mb-2 text-red-500 text-[11px] font-bold bg-red-50 px-2 py-1 rounded">{errorMessages[commentId]}</div>}
                      <textarea value={replyTexts[commentId] || ""} onChange={(e) => setReplyTexts(prev => ({ ...prev, [commentId]: e.target.value }))} placeholder="Write a reply..." className="w-full bg-transparent border-none outline-none text-[14.5px] font-medium text-gray-700 min-h-[22px] resize-none overflow-hidden mb-2.5" />
                      <div className="flex justify-between items-center">
                        <div className="flex gap-3.5 text-[#94a3b8]">
                          <i className="fa-regular fa-image text-[17px] cursor-pointer transition-all duration-200 hover:scale-110 hover:text-[#016630]" onClick={() => fileInputRef.current?.click()} />
                          <i className="fa-regular fa-face-smile text-[17px] cursor-pointer transition-all duration-200 hover:scale-110 hover:text-[#eab308]" onClick={() => setShowEmojiPicker(prev => ({ ...prev, [commentId]: !prev[commentId] }))} />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setReplyForms(prev => ({ ...prev, [commentId]: false }))} className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-[#94a3b8] shadow-sm border border-gray-50 hover:bg-red-50 hover:text-red-600 transition-all"><i className="fa-solid fa-xmark text-[13px]" /></button>
                          <button type="submit" disabled={!(replyTexts[commentId] || "").trim() || loadingStates[`submit-${commentId}`]} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border ${(replyTexts[commentId] || "").trim() && !loadingStates[`submit-${commentId}`] ? "bg-[#016630] text-white border-[#016630]" : "bg-white text-[#94a3b8] border-gray-50"}`}>{loadingStates[`submit-${commentId}`] ? <i className="fa-solid fa-spinner fa-spin text-[10px]" /> : <i className="fa-solid fa-paper-plane text-[12px]" />}</button>
                        </div>
                      </div>
                      {showEmojiPicker[commentId] && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm" onClick={() => setShowEmojiPicker(prev => ({ ...prev, [commentId]: false }))}>
                          <div className="bg-white p-2 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}><EmojiPicker width={350} height={400} onEmojiClick={(emojiData) => { setReplyTexts(prev => ({ ...prev, [commentId]: (prev[commentId] || "") + emojiData.emoji })); setShowEmojiPicker(prev => ({ ...prev, [commentId]: false })); }} /></div>
                        </div>
                      )}
                    </form>
                  )}

                  {isVisible && currentNestedReplies.length > 0 && (
                    <CommentList
                      comments={currentNestedReplies}
                      postId={postId}
                      onCommentsRefresh={onCommentsRefresh}
                      depth={depth + 1}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* Custom Delete Confirmation Modal */}
    {confirmDeleteId && (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center"
        onClick={() => setConfirmDeleteId(null)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-[420px] max-w-[90vw] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-[16px] font-bold text-gray-900">Confirm action</h3>
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="text-gray-400 hover:text-gray-700 transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>
          <div className="flex items-start gap-4 px-6 py-5">
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-triangle-exclamation text-red-500 text-[18px]" />
            </div>
            <div>
              <p className="font-bold text-[15px] text-gray-900 mb-1">Delete this comment?</p>
              <p className="text-[13.5px] text-gray-500">This comment will be permanently removed.</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="px-5 py-2.5 rounded-xl text-[13.5px] font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-5 py-2.5 rounded-xl text-[13.5px] font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all"
            >
              Delete comment
            </button>
          </div>
        </div>
      </div>
    )}
  </>;
}