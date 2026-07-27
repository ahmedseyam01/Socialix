import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter, Button, Divider } from "@heroui/react";
import { formatTimeAgo } from "../../utils/timeFormat";
import { AuthContext } from "../../Context/AuthContext";
import UserAvatar from "../UserAvatar/UserAvatar";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";

export default function PostCard({ post, isSingleView = false, onUpdate }) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(isSingleView);
  const [comments, setComments] = useState(post?.comments || []);
  
  const { userProfile } = useContext(AuthContext);
  const currentUser = userProfile || { name: "User", photo: "" };

  const handleCommentAdded = (newCommentsList) => {
    if (onUpdate) {
      onUpdate({
        comments: newCommentsList,
        commentsCount: newCommentsList.length
      });
    }
  };

  const likesCount = post?.likes?.length ?? post?.likesCount ?? 0;
  const sharesCount = post?.shares?.length ?? post?.sharesCount ?? 0;
  
  const calculateTotalComments = () => {
    if (!comments || comments.length === 0) {
      return post?.commentsCount || 0;
    }
    
    return comments.reduce((total, commentItem) => {
      let currentSum = 1;
      if (typeof commentItem.repliesCount === "number") {
        currentSum += commentItem.repliesCount;
      } else if (Array.isArray(commentItem.replies)) {
        currentSum += commentItem.replies.length;
      }
      return total + currentSum;
    }, 0);
  };

  const totalInteractionCount = calculateTotalComments();
  const postBody = post?.body || post?.content;

  const authorId = post?.user?._id || post?.user?.id;

  return (
    <>
      {post && (
        <Card className="w-full bg-white shadow-md border border-gray-100 rounded-[20px] overflow-hidden transition-all duration-300 hover:shadow-lg">
          {/* Card Header */}
          <CardHeader className="flex justify-between items-center p-5 pb-3">
            <Link to={authorId ? `/profile/${authorId}` : "/profile"} className="flex gap-3.5 items-center no-underline text-inherit group">
              <div className="relative group cursor-pointer">
                <UserAvatar user={post.user} size="xl" />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-[3px] border-white rounded-full"></span>
              </div>
              <div className="flex flex-col">
                <h4 className="text-[17px] font-extrabold leading-none text-gray-900 group-hover:text-[#016630] transition-colors cursor-pointer tracking-tight">
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

          {/* Card Body */}
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

            {/* Stats Row */}
            <div className="flex justify-between items-center px-1 text-gray-400 text-[14px] font-bold py-2.5">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="bg-blue-50 group-hover:bg-blue-100 p-2.5 rounded-full transition-all duration-300">
                    <i className="fa-solid fa-thumbs-up text-blue-500 text-[15px]" />
                  </div>
                  <span className="group-hover:text-blue-600 transition-colors font-bold text-gray-500 text-[15px]">{likesCount}</span>
                </div>
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

            {/* Action Buttons */}
            <div className="flex justify-between items-center py-1 gap-2">
              <Button variant="" radius="xl" className="flex-1 gap-2.5 font-bold text-gray-500 hover:text-blue-600 hover:scale-105 transition-all active:scale-95 text-[15px] py-6">
                <i className="fa-regular fa-thumbs-up text-xl" /> Like
              </Button>
              <Button
                variant="" radius="xl"
                className="flex-1 gap-2.5 font-bold text-gray-500 hover:text-[#016630] hover:scale-105 transition-all active:scale-95 text-[15px] py-6"
                onClick={() => setShowCommentInput(!showCommentInput)}
              >
                <i className="fa-regular fa-comment text-xl" /> Comment
              </Button>
              <Button variant="" radius="xl" className="flex-1 gap-2.5 font-bold text-gray-500 hover:text-purple-500 hover:scale-105 transition-all active:scale-95 text-[15px] py-6">
                <i className="fa-regular fa-share-from-square text-xl"></i> Share
              </Button>
            </div>

            {showCommentInput && <CommentInput currentUser={currentUser} setComments={setComments} postId={post._id} onCommentAdded={handleCommentAdded} />}
            
            {showCommentInput && (
              <CommentList
                comments={comments}
                postId={post._id}
                onCommentsRefresh={setComments}
              />
            )}
          </CardBody>

          {/* Top Comment Preview */}
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
                      className="font-bold text-[15px] text-gray-900 cursor-pointer hover:underline tracking-tight no-underline"
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

      {/* Image Modal */}
      {isImageModalOpen && post?.image && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            className="absolute top-6 right-6 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50 shadow-lg backdrop-blur-md"
            onClick={(event) => { event.stopPropagation(); setIsImageModalOpen(false); }}
          >
            <i className="fa-solid fa-xmark text-xl" />
          </button>
          <img
            src={post.image}
            alt="Fullscreen media"
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-[20px] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
