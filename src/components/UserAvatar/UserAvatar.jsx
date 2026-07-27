import { Avatar, Skeleton } from "@heroui/react";
import { useContext, useState, useEffect } from "react";
import { AuthContext, DEFAULT_API_AVATAR } from "../../Context/AuthContext";

/**
 * UserAvatar - Reusable avatar component with automatic image error fallback
 * 
 * @param {object} user  - user object { name, photo }
 * @param {string} size  - "sm" | "md" | "lg" | "xl" (default: "md")
 * @param {string} className - extra classes
 * @param {boolean} showSkeleton - whether to show skeleton while loading (default: false)
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

  const isPhotoRemoved = typeof window !== "undefined" && localStorage.getItem("user_profile_photo_removed") === "true";

  // Check if the user object represents the current logged-in user
  const isCurrentLoggedInUser =
    userProfile &&
    (!user ||
      user._id === userProfile.id ||
      user._id === userProfile._id ||
      user.id === userProfile.id ||
      user.id === userProfile._id ||
      user.name === userProfile.name ||
      user.email === userProfile.email);

  let userName = (isCurrentLoggedInUser ? userProfile?.name : user?.name) || "User";
  let userPhoto = isCurrentLoggedInUser
    ? (isPhotoRemoved ? DEFAULT_API_AVATAR : (userProfile?.photo || user?.photo || DEFAULT_API_AVATAR))
    : (user?.photo || DEFAULT_API_AVATAR);

  useEffect(() => {
    setImgError(false);
  }, [userPhoto]);

  const finalPhoto = imgError ? DEFAULT_API_AVATAR : (userPhoto || DEFAULT_API_AVATAR);

  return (
    <>
      {showSkeleton && isProfileLoading ? (
        <Skeleton className={`rounded-full ${currentSizeClass} shrink-0`} />
      ) : (
        <div className={`${currentSizeClass} shrink-0`}>
          <Avatar
            src={finalPhoto}
            name={userName.charAt(0).toUpperCase()}
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
