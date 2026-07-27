import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSinglePost, getPostComments } from "../AllPosts/AllPosts";
import Loading from "../Loading/Loading";
import { Button } from "@heroui/react";
import PostCard from "../PostCard/PostCard";

export default function SinglePosts() {
  const { id: postIdFromUrl } = useParams();
  const navigate = useNavigate();
  const [postData, setPostData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  async function fetchPostDetails() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [postResponse, commentsResponse] = await Promise.all([
        getSinglePost(postIdFromUrl),
        getPostComments(postIdFromUrl)
      ]);

      if (postResponse && (postResponse.message === "success" || postResponse.message === "Success")) {
        const extractedPost = postResponse.post || postResponse.data?.post || postResponse.data || null;
        let extractedComments = [];

        if (commentsResponse && (commentsResponse.message === "success" || commentsResponse.message === "Success")) {
          extractedComments = commentsResponse.comments || commentsResponse.data?.comments || commentsResponse.data || [];
        }

        if (extractedPost) {
          setPostData({ ...extractedPost, comments: extractedComments });
        } else {
          setPostData(null);
        }
      } else {
        setErrorMessage(postResponse?.error || postResponse?.message || "Failed to load post.");
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred while fetching the post.");
      console.error("SinglePost Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPostDetails();
  }, [postIdFromUrl]);

  const handlePostUpdateAction = (updatedFields) => {
    setPostData((previousPostState) => (previousPostState ? { ...previousPostState, ...updatedFields } : previousPostState));
  };

  return (
    <>
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-[800px] mx-auto">
          {isLoading ? (
            <div className="flex flex-col gap-8">
              <Loading />
            </div>
          ) : errorMessage || !postData ? (
            <div className="min-h-[50vh] flex justify-center items-center">
              <div className="text-center bg-white p-10 rounded-[20px] shadow-sm border border-gray-100">
                <i className="fa-solid fa-circle-exclamation text-4xl text-red-400 mb-4 block" />
                <p className="text-red-500 font-bold mb-2">Oops! Something went wrong</p>
                <p className="text-gray-400 text-sm mb-6">{errorMessage || "Post not found"}</p>
                <Button color="success" variant="flat" onClick={() => navigate(-1)}>
                  Go Back
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Breadcrumbs Navigation */}
              <div className="flex items-center gap-2 mb-6 text-gray-500 font-semibold text-[15px]">
                <button onClick={() => navigate(-1)} className="hover:text-gray-800 transition-colors flex items-center gap-1.5">
                  <i className="fa-solid fa-chevron-left text-[13px]" /> Back
                </button>          
                <span className="text-gray-300">/</span>
                <span className="text-[#016630] flex items-center gap-2">
                  <i className="fa-regular fa-file-lines" /> Post Details
                </span>
              </div>

              {/* Main Post Content */}
              <PostCard 
                key={`post-${postData._id}-${postData.comments?.length}`}
                post={postData} 
                isSingleView={true} 
                onUpdate={handlePostUpdateAction}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
