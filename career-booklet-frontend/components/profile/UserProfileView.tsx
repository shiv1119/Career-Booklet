"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getUserProfile } from "@/app/api/profile/route";
import { Users, UserPlus } from "lucide-react";
import { handelFollow, fetchFollowStatus , fetchTotalFollowers} from "@/app/api/follow/route";
import { useSession } from "next-auth/react";

interface UserProfileProps {
  user_id: string;
}

export default function UserProfilePage({ user_id }: UserProfileProps) {
  const [profileInfo, setProfileInfo] = useState({
    full_name: "",
    pronouns: "",
    city: "",
    state: "",
    country: "",
    website: "",
    profile_image: "",
    profile_background_image: "",
  });

  const [previewProfileImage, setPreviewProfileImage] = useState<string | null>(null);
  const [previewBannerImage, setPreviewBannerImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [loadingFollow, setFollowLoading] = useState(false);
  const [totalFollowers, setTotalFollowers] = useState(Number);
  const [following, setFollowing] = useState(false);
  const [totalFollowing, setTotalFollowing] = useState(Number);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  useEffect(()=>{
    const getTotalFollowers = async () => {
      try {
        const response = await fetchTotalFollowers(user_id);
        setTotalFollowers(response.total_followers);
        setTotalFollowing(response.total_following);
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message);
          console.log('Failed to follow ' + error.message);
        } else {
          console.error('An unknown error occurred:', error);
          console.log('Failed to fetch total followers.');
        }
      }
    };
    getTotalFollowers();
  });

  useEffect(() => {
    if (!user_id) return;
    const fetchProfile = async () => {
      try {
        const response = await getUserProfile(user_id);
        const data = await response;
        setProfileInfo(data);
        setPreviewProfileImage(data.profile_image || "/images/profile_placeholder.jpg");
        setPreviewBannerImage(data.profile_background_image || "/images/banner_placeholder.png");
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user_id]);
  
  const token = session?.user?.accessToken;
  useEffect(() => {
    if (!user_id) return;
    const checkFollowStatus = async () => {
      try {
        const response = await fetchFollowStatus(token, user_id);
        setFollowing(response);
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message);
          console.log('Failed to follow ' + error.message);
        } else {
          console.error('An unknown error occurred:', error);
          console.log('Failed to follow.');
        }
      }
    };

    checkFollowStatus();
  }, [token, user_id]);
  
  const handelFollowRequest = async () => {
    if (!user_id) return;
  
    setFollowLoading(true);
    const token = session?.user?.accessToken;
    try {
      await handelFollow(token, user_id );
    } catch (error) {
      if (error instanceof Error) {
        
      } else {
        console.error('An unknown error occurred:', error);
      }
    } finally {
      setLoading(false);
      setFollowing((prev) => !prev)
    }
  };

  if (loading) {
    return (
        <div className="mb-3 lg:p-3 flex flex-col items-center">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-4xl animate-pulse">
                <div className="relative h-48 rounded-md overflow-hidden bg-gray-300 dark:bg-gray-700">
                </div>
                <div className="flex items-center mt-6">
                <div className="relative w-32 h-32 -mt-20 mb-1 rounded-full border-4 border-white dark:border-gray-700 shadow-md bg-gray-300 dark:bg-gray-700">
                </div>
                </div>
                <div className="flex items-start justify-between w-full mt-4">
                <div className="flex flex-col space-y-2 w-3/4">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-2/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="mb-3 flex flex-col items-center lg:p-3">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 w-full max-w-4xl">
        <div className="relative h-48 rounded-md overflow-hidden">
          <Image
            src={previewBannerImage || "/images/banner_placeholder.png"}
            alt="Banner"
            layout="fill"
            objectFit="cover"
            className="object-cover"
          />
        </div>
        <div className="relative flex items-center justify-start sm:justify-start w-full mt-6">
          <div
            className="relative w-32 h-32 -mt-20 rounded-full cursor-pointer"
            onClick={() => setIsImageOpen(true)} 
          >
            <Image
              src={previewProfileImage || "/images/profile_placeholder.jpg"}
              alt="Profile"
              layout="fill"
              objectFit="cover"
              className="rounded-full border-4 border-white dark:border-gray-700 shadow-md"
            />
          </div>
        </div>
        <div className="flex items-end justify-between w-full">
            <div className="flex flex-col">
                <div className="text-xl font-semibold lg:text-2xl my-2">
                {profileInfo.full_name}{" "}
                <span className="text-xs font-normal font-thin">
                    <i>({profileInfo.pronouns})</i>
                </span>
                </div>
                <p className="flex justify-start items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-gray-600 dark:text-gray-200">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                    {" "}
                    {profileInfo.city}, {profileInfo.state}, {profileInfo.country}
                </p>
                <p className="flex justify-start items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-gray-600 dark:text-gray-200">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    {" "}
                <a
                    href={profileInfo.website}
                    target="_blank"
                    className="text-blue-500"
                    rel="noopener noreferrer"
                >
                    {profileInfo.website}
                </a>
                </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-md font-semibold w-full">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>
                  Total followers: <span className="font-bold text-black dark:text-white">{totalFollowers}</span>
                  </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-md font-semibold w-full">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>
                  Total following: <span className="font-bold text-black dark:text-white">{totalFollowing}</span>
                  </span>
              </div>
              {isAuthenticated && following && <div className="w-full mt-2">
                  <button onClick={handelFollowRequest} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1 rounded-md shadow-md transition-all w-full">
                  <UserPlus className="w-5 h-5" />
                  Following
                  </button>
              </div>}
              {isAuthenticated && !following && <div className="w-full mt-2">
                  <button onClick={handelFollowRequest} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1 rounded-md shadow-md transition-all w-full">
                  <UserPlus className="w-5 h-5" />
                  Follow
                  </button>
              </div>}
            </div>
        </div>
      </div>

      {isImageOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setIsImageOpen(false)}
        >
          <div className="relative max-w-lg w-auto p-4">
            <button
              className="absolute top-4 right-6 text-white text-2xl"
              onClick={() => setIsImageOpen(false)}
            >
              ✕
            </button>
            <Image
              src={previewProfileImage || "/images/profile_placeholder.jpg"}
              alt="Profile Enlarged"
              width={400}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
