import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter, Button, Divider } from "@heroui/react";
import { formatTimeAgo } from "../../utils/timeFormat";
import { AuthContext } from "../../Context/AuthContext";
import UserAvatar from "../UserAvatar/UserAvatar";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";
import { togglePostLike, getPostLikes } from "../AllPosts/AllPosts";

export default function PostCard({ post, isSingleView = false, onUpdate }) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(isSingleView);
  const [comments, setComments] = useState(post?.comments || []);

  // ── Like State ──
  const { userProfile } = useContext(AuthContext);
  const currentUser = userProfile || { name: "User", photo: "" };
  const currentUserId = currentUser?._id || currentUser?.id;

  // Derive initial liked state from post.likes array
  const isInitiallyLiked = Array.isArray(post?.likes)
    ? post.likes.some((l) => (l._id || l.id || l) === currentUserId)
    : false;

  const [liked, setLiked] = useState(isInitiallyLiked);
  const [likesCount, setLikesCount] = useState(
    post?.likes?.length ?? post?.likesCount ?? 0
  );
  const [likeLoading, setLikeLoading] = useState(false);

  // ── Likes Modal State ──
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likersList, setLikersList] = useState([]);
  const [likersLoading, setLikersLoading] = useState(false);

  const sharesCount = post?.shares?.length ?? post?.sharesCount ?? 0;

  const calculateTotalComments = () => {
    if (!comments || comments.length === 0) return post?.commentsCount || 0;
    return comments.reduce((total, commentItem) => {
      let sum = 1;
      if (typeof commentItem.repliesCount === "number") sum += commentItem.repliesCount;
      else if (Array.isArray(commentItem.replies)) sum += commentItem.replies.length;
      return total + sum;
    }, 0);
  };

  const totalInteractionCount = calculateTotalComments();
  const postBody = post?.body || post?.content;
  const authorId = post?.user?._id || post?.user?.id;

  // ── Handlers ──
  const handleCommentAdded = (newCommentsList) => {
    if (onUpdate) onUpdate({ comments: newCommentsList, commentsCount: newCommentsList.length });
  };

  const handleLikeToggle = async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));

    const res = await togglePostLike(post._id);
    if (res?.success) {
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
      if (onUpdate) onUpdate({ likesCount: res.data.likesCount });
    } else {
      // Rollback on error
      setLiked(!newLiked);
      setLikesCount((prev) => (!newLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
    setLikeLoading(false);
  };

  const handleOpenLikesModal = async () => {
    if (likesCount === 0) return;
    setShowLikesModal(true);
    setLikersLoading(true);
    const res = await getPostLikes(post._id, 1, 20);
    if (res?.success && Array.isArray(res?.data?.likes)) {
      setLikersList(res.data.likes);
    }
    setLikersLoading(false);
  };

  return (
    <>
      {post && (
        <Card className="w-full bg-white shadow-md border border-gray-100 rounded-[20px] overflow-hidden transition-all duration-300 hover:shadow-lg">
          {/* ── Card Header ── */}
          <CardHeader className="flex justify-between items-center p-5 pb-3">
            <Link to={authorId ? `/profile/${authorId}` : "/profile"} className="flex gap-3.5 items-center no-underline text-inherit group">
              <div className="relative cursor-pointer">
                <UserAvatar user={post.user} size="xl" />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-[3px] border-white rounded-full" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-[17px] font-extrabold leading-none text-gray-900 group-hover:text-[#016630] transition-colors tracking-tight">
                  {post.user?.name || "Anonymous"}
                </h4>
                <div className="flex items-center gap-1.5 mt-1.5 text-gray-400 text-[13px] font-semibold">
                  <span className="font-bold text-gray-500">
                    @{post.user?.name ? post.user.name.split(" ")[0].toLowerCase() : "user"}
                  </span>
                  <span className="opacity-30">•</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
            </Link>
            <Button isIconOnly variant="light" radius="full" size="md" className="text-gray-300 hover:text-gray-600 hover:bg-gray-50">
              <i className="fa-solid fa-ellipsis text-xl" />
            </Button>
          </CardHeader>

          {/* ── Card Body ── */}
          <CardBody className="px-5 py-2 overflow-visible">
            {postBody && (
              <p className="text-gray-800 text-[16px] mt-2 ml-3 mb-5 font-medium leading-[1.6] whitespace-pre-wrap tracking-wide">
                {postBody}
              </p>
            )}

            {post.image && (
              <div
                className="w-full rounded-[20px] overflow-hidden mb-5 border border-gray-50 shadow-sm flex bg-gray-100 cursor-pointer"
                onClick={() => setIsImageModalOpen(true)}
              >
                <img
                  src={post.image}
                  alt="Post media"
                  className="w-full h-auto max-h-[600px] object-cover hover:scale-[1.01] transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}

            {!isSingleView && (
              <div className="flex justify-end mb-2">
                <Link
                  to={`/post/${post._id}`}
                  className="text-[#016630] text-[14px] font-extrabold hover:underline flex items-center gap-1.5 no-underline opacity-80 hover:opacity-100"
                >
                  View details <i className="fa-solid fa-arrow-right-long text-[12px]" />
                </Link>
              </div>
            )}

            <Divider className="my-2 bg-gray-50" />

            {/* ── Stats Row ── */}
            <div className="flex justify-between items-center px-1 text-gray-400 text-[14px] font-bold py-2.5">
              <div className="flex items-center gap-5">
                {/* Likes count — clickable to open who liked modal */}
                <button
                  onClick={handleOpenLikesModal}
                  className={`flex items-center gap-2.5 cursor-pointer group transition-all ${likesCount === 0 ? "pointer-events-none" : ""}`}
                >
                  <div className={`p-2.5 rounded-full transition-all duration-300 ${liked ? "bg-blue-100" : "bg-blue-50 group-hover:bg-blue-100"}`}>
                    <i className={`fa-solid fa-thumbs-up text-[15px] ${liked ? "text-blue-600" : "text-blue-500"}`} />
                  </div>
                  <span className={`font-bold text-[15px] transition-colors ${liked ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"}`}>
                    {likesCount}
                  </span>
                </button>

                <div className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="bg-purple-50 group-hover:bg-purple-100 p-2.5 rounded-full transition-all duration-300">
                    <i className="fa-solid fa-share-nodes text-purple-500 text-[15px]" />
                  </div>
                  <span className="group-hover:text-purple-600 transition-colors font-bold text-gray-500 text-[15px]">{sharesCount}</span>
                </div>
              </div>

              {!isSingleView ? (
                <Link to={`/post/${post._id}`} className="cursor-pointer hover:text-gray-700 transition-colors font-extrabold text-[13px] uppercase tracking-wider text-gray-500 no-underline">
                  {totalInteractionCount} comments
                </Link>
              ) : (
                <div className="font-extrabold text-[13px] uppercase tracking-wider text-gray-500">
                  {totalInteractionCount} comments
                </div>
              )}
            </div>

            <Divider className="my-2 bg-gray-50" />

            {/* ── Action Buttons ── */}
            <div className="flex justify-between items-center py-1 gap-2">
              {/* Like Button */}
              <button
                onClick={handleLikeToggle}
                disabled={likeLoading}
                className={`flex flex-1 items-center justify-center gap-2.5 font-bold text-[15px] py-3.5 rounded-xl cursor-pointer transition-all active:scale-95 select-none
                  ${liked
                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  } ${likeLoading ? "opacity-60 pointer-events-none" : ""}`}
              >
                {likeLoading ? (
                  <i className="fa-solid fa-spinner fa-spin text-xl" />
                ) : (
                  <i className={`text-xl ${liked ? "fa-solid fa-thumbs-up" : "fa-regular fa-thumbs-up"}`} />
                )}
                {liked ? "Liked" : "Like"}
              </button>

              {/* Comment Button */}
              <button
                onClick={() => setShowCommentInput(!showCommentInput)}
                className={`flex flex-1 items-center justify-center gap-2.5 font-bold text-[15px] py-3.5 rounded-xl cursor-pointer transition-all active:scale-95 select-none
                  ${showCommentInput
                    ? "text-[#016630] bg-green-50 hover:bg-green-100"
                    : "text-gray-500 hover:text-[#016630] hover:bg-green-50"
                  }`}
              >
                <i className={`text-xl ${showCommentInput ? "fa-solid fa-comment" : "fa-regular fa-comment"}`} />
                Comment
              </button>

              {/* Share Button */}
              <button className="flex flex-1 items-center justify-center gap-2.5 font-bold text-gray-500 hover:text-purple-500 hover:bg-purple-50 text-[15px] py-3.5 rounded-xl cursor-pointer transition-all active:scale-95 select-none">
                <i className="fa-regular fa-share-from-square text-xl" />
                Share
              </button>
            </div>

            {showCommentInput && (
              <CommentInput
                currentUser={currentUser}
                setComments={setComments}
                postId={post._id}
                onCommentAdded={handleCommentAdded}
              />
            )}
            {showCommentInput && (
              <CommentList
                comments={comments}
                postId={post._id}
                onCommentsRefresh={setComments}
              />
            )}
          </CardBody>

          {/* ── Top Comment Preview ── */}
          {!isSingleView && post.topComment && (
            <CardFooter className="flex flex-col p-5 pt-0 bg-transparent">
              <Divider className="w-full mt-2 mb-5 bg-gray-50" />
              <div className="flex gap-3.5 mb-4 w-full">
                <Link to={post.topComment.commentCreator?._id ? `/profile/${post.topComment.commentCreator._id}` : "/profile"}>
                  <UserAvatar user={post.topComment.commentCreator} size="sm" className="mt-0.5" />
                </Link>
                <div className="bg-[#f0f2f5] px-4.5 py-3 rounded-[18px] w-fit max-w-[88%] shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={post.topComment.commentCreator?._id ? `/profile/${post.topComment.commentCreator._id}` : "/profile"}
                      className="font-bold text-[15px] text-gray-900 hover:underline tracking-tight no-underline"
                    >
                      {post.topComment.commentCreator?.name || "Anonymous"}
                    </Link>
                    <span className="text-gray-400 text-[12px] font-normal ml-1">
                      {formatTimeAgo(post.topComment.createdAt)}
                    </span>
                  </div>
                  <p className="text-[14.5px] text-gray-800 font-medium leading-[1.5] whitespace-pre-wrap">
                    {post.topComment.content}
                  </p>
                </div>
              </div>
              <Link
                to={`/post/${post._id}`}
                className="text-[#016630] text-[14px] font-extrabold hover:underline self-start ml-[54px] no-underline tracking-wide opacity-80"
              >
                View all comments →
              </Link>
            </CardFooter>
          )}
        </Card>
      )}

      {/* ── Image Full-Screen Modal ── */}
      {isImageModalOpen && post?.image && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            className="absolute top-6 right-6 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50 shadow-lg backdrop-blur-md"
            onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(false); }}
          >
            <i className="fa-solid fa-xmark text-xl" />
          </button>
          <img
            src={post.image}
            alt="Fullscreen media"
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-[20px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Who Liked Modal ── */}
      {showLikesModal && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowLikesModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-50 p-2 rounded-full">
                  <i className="fa-solid fa-thumbs-up text-blue-500 text-sm" />
                </div>
                <span className="font-extrabold text-gray-800 text-[17px]">
                  {likesCount} {likesCount === 1 ? "Like" : "Likes"}
                </span>
              </div>
              <button
                onClick={() => setShowLikesModal(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-72 overflow-y-auto py-3 px-4">
              {likersLoading ? (
                <div className="flex items-center justify-center py-10">
                  <i className="fa-solid fa-spinner fa-spin text-[#016630] text-2xl" />
                </div>
              ) : likersList.length === 0 ? (
                <p className="text-center text-gray-400 font-medium py-8">No likes yet</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {likersList.map((liker) => {
                    const likerId = liker._id || liker.id;
                    return (
                      <li key={likerId}>
                        <Link
                          to={likerId ? `/profile/${likerId}` : "/profile"}
                          onClick={() => setShowLikesModal(false)}
                          className="flex items-center gap-3.5 hover:bg-gray-50 px-3 py-2.5 rounded-2xl transition-colors no-underline group"
                        >
                          <UserAvatar user={liker} size="md" />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-[15px] group-hover:text-[#016630] transition-colors">
                              {liker.name || "Unknown"}
                            </span>
                            {liker.username && (
                              <span className="text-gray-400 text-[12px] font-medium">
                                @{liker.username}
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
