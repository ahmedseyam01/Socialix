import { createContext, useState, useEffect } from "react";
import { getDecodedTokenProfile, fetchUserProfileAPI } from "../utils/authHelpers";

export const DEFAULT_API_AVATAR = "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";

export const AuthContext = createContext();

export default function AuthContextProvider({ children }) {
  const [isLoggedIn, setisLoggedIn] = useState(localStorage.getItem("token") != null);

  const [userProfile, setUserProfile] = useState(() => {
    const decoded = getDecodedTokenProfile();
    const isPhotoRemoved = localStorage.getItem("user_profile_photo_removed") === "true";
    if (decoded) {
      return {
        ...decoded,
        photo: isPhotoRemoved ? DEFAULT_API_AVATAR : (decoded.photo || DEFAULT_API_AVATAR),
      };
    }
    return null;
  });

  const [isProfileLoading, setIsProfileLoading] = useState(isLoggedIn);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserProfileAPI()
        .then((fetchedUser) => {
          if (fetchedUser) {
            const isPhotoRemoved = localStorage.getItem("user_profile_photo_removed") === "true";
            const apiPhoto = isPhotoRemoved
              ? DEFAULT_API_AVATAR
              : (fetchedUser.photo || fetchedUser.profilePic || fetchedUser.image || DEFAULT_API_AVATAR);

            setUserProfile((prev) => ({
              ...prev,
              _id:      fetchedUser._id  || fetchedUser.id  || prev?._id,
              id:       fetchedUser.id   || fetchedUser._id || prev?.id,
              name:     fetchedUser.name || fetchedUser.username || prev?.name,
              username: fetchedUser.username || prev?.username,
              email:    fetchedUser.email    || prev?.email,
              photo:    apiPhoto,
            }));
          }
        })
        .catch((err) => {
          console.error("Auth validation failed:", err);
          localStorage.removeItem("token");
          setisLoggedIn(false);
          setUserProfile(null);
        })
        .finally(() => {
          setIsProfileLoading(false);
        });
    } else {
      localStorage.removeItem("token");
      setUserProfile(null);
      setIsProfileLoading(false);
    }
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setisLoggedIn, userProfile, setUserProfile, isProfileLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
