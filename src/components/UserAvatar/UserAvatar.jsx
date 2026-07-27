import { Avatar, Skeleton } from "@heroui/react";
import { useContext, useState, useEffect } from "react";
import { AuthContext, DEFAULT_API_AVATAR } from "../../Context/AuthContext";

/**
 * UserAvatar - Reusable avatar component with automatic image error fallback.
 *
 * @param {object}  user         - user object { _id, id, name, photo }
 * @param {string}  size         - "sm" | "md" | "lg" | "xl" (default: "md")
 * @param {string}  className    - extra classes
 * @param {boolean} showSkeleton - show skeleton while profile is loading
 */
export default function UserAvatar({ user, size = "md", className = "", showSkeleton = false }) {
  const { userProfile, isProfileLoading } = useContext(AuthContext);
  const [imgError, setImgError] = useState(false);

  const sizeMapping = {
    sm: "w-10 h-10",
    md: "w-11 h-11",
    lg: "w-12 h-12",
    xl: "w-[52px] h-[52px]",
  };
  const currentSizeClass = sizeMapping[size] || sizeMapping.md;

  // Determine if the passed user represents the logged-in user
  const userId = user?._id || user?.id || null;
  const myId   = userProfile?._id || userProfile?.id || null;

  const isMe = !user ||
    (!!userId && !!myId && userId === myId) ||
    (!!userProfile && !!user?.name && user.name === userProfile.name);

  // Derive name and photo
  const displayName  = isMe ? (userProfile?.name  || user?.name  || "User") : (user?.name  || "User");
  const displayPhoto = isMe
    ? (userProfile?.photo || user?.photo || DEFAULT_API_AVATAR)
    : (user?.photo || DEFAULT_API_AVATAR);

  // Reset error state whenever resolved photo URL changes
  useEffect(() => {
    setImgError(false);
  }, [displayPhoto]);

  const finalPhoto = imgError ? null : (displayPhoto || null);

  return (
    <>
      {showSkeleton && isProfileLoading ? (
        <Skeleton className={`rounded-full ${currentSizeClass} shrink-0`} />
      ) : (
        <div className={`${currentSizeClass} shrink-0`}>
          <Avatar
            src={finalPhoto}
            name={displayName.charAt(0).toUpperCase()}
            className={`${showSkeleton ? "w-full h-full" : currentSizeClass} ${className}`}
            isBordered
            color="success"
            imgProps={{
              onError: () => setImgError(true),
            }}
          />
        </div>
      )}
    </>
  );
}
