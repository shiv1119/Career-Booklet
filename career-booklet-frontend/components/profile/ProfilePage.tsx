"use client";
import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { updateProfileImage, updateBackgroundImage , getProfile } from "@/app/api/profile/route";

const ProfilePage = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [profileInfo, setProfileInfo] = useState({
    full_name: "",
    pronouns: "",
    city: "",
    state: "",
    country: "",
    website: "",
    profile_image:"",
    profile_background_image:"",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [previewProfileImage, setPreviewProfileImage] = useState<string | null>(null);
  const [previewBannerImage, setPreviewBannerImage] = useState<string | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    const token = session?.user?.accessToken;
    const fetchProfile = async () => {
      try{
        setLoading(true);
        const response = await getProfile(token);
        const data = await response;
        console.log(data);
        setProfileInfo(data);
        setPreviewBannerImage(data.profile_background_image);
        setPreviewProfileImage(data.profile_image);
      } catch (error) {
        console.error("Error fetching profile data:",error);
      } finally {
        setLoading(false);
      }
    };
    if(token){
      fetchProfile();
    }
  }, [session]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "profile") {
          setPreviewProfileImage(reader.result as string);
          setProfileImage(file);
        } else if (type === "banner") {
          setPreviewBannerImage(reader.result as string);
          setBannerImage(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSave = async (type: string) => {
    try {
      const formData = new FormData();
      if (type === "profile" && profileImage) {
        formData.append("profile_image", profileImage);
        const response = await updateProfileImage(formData, session?.user?.accessToken);
        if (response.ok) closeModal("profile");
      } else if (type === "banner" && bannerImage) {
        formData.append("banner_image", bannerImage);
        const response = await updateBackgroundImage(formData, session?.user?.accessToken);
        if (response.ok) closeModal("banner");
      }
    } catch (error) {
      console.error("Error updating image", error);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileInfo({ ...profileInfo, [e.target.name]: e.target.value });
  };

  const openModal = (type: string) => {
    if (type === "profile") setIsProfileModalOpen(true);
    else if (type === "banner") setIsBannerModalOpen(true);
    else if (type === "editProfile") setIsEditProfileOpen(true);
  };

  const closeModal = (type: string) => {
    if (type === "profile") setIsProfileModalOpen(false);
    else if (type === "banner") setIsBannerModalOpen(false);
    else if (type === "editProfile") setIsEditProfileOpen(false);
  };

  return (
    <>
    {loading ? (
        <div className="min-h-screen">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-4xl animate-pulse">
                <div className="relative h-48 rounded-md overflow-hidden bg-gray-300 dark:bg-gray-700">
                <div className="absolute top-4 right-4 p-2 bg-gray-400 dark:bg-gray-600 rounded-full w-10 h-10"></div>
                </div>
                <div className="flex items-center mt-6">
                <div className="relative w-32 h-32 -mt-20 mb-1 rounded-full border-4 border-white dark:border-gray-700 shadow-md bg-gray-300 dark:bg-gray-700">
                    <div className="absolute bottom-0 right-0 p-2 bg-gray-400 dark:bg-gray-600 rounded-full w-10 h-10"></div>
                </div>
                </div>
                <div className="flex items-start justify-between w-full mt-4">
                <div className="flex flex-col space-y-2 w-3/4">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
                <div className="w-10 h-10 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                </div>
            </div>
            </div>

    ):(
      <div className="min-h-screen flex flex-col items-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-4xl">
        <div className="relative h-48 rounded-md overflow-hidden">
          <Image
            src={previewBannerImage || "/images/banner_placeholder.png"}
            alt="Banner"
            layout="fill"
            objectFit="cover"
            className="object-cover"
          />
          <button className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md" onClick={() => openModal("banner")}>
            <FaEdit className="text-blue-500 dark:text-blue-300" />
          </button>
        </div>
        <div className="flex items-center mt-6">
          <div className="relative w-32 h-32 -mt-20 mb-1">
            <Image
              src={previewProfileImage || "/images/profile_placeholder.jpg"}
              alt="Profile"
              layout="fill"
              objectFit="cover"
              className="rounded-full border-4 border-white dark:border-gray-700 shadow-md"
            />
            <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md" onClick={() => openModal("profile")}>
              <FaEdit className="text-blue-500 dark:text-blue-300" />
            </button>
          </div>
        </div>
        <div className="flex items-start justify-between w-full">
            <div className="flex flex-col">
                <div className="text-xl font-semibold lg:text-2xl">
                {profileInfo.full_name}{" "}
                <span className="text-xs font-normal font-thin">
                    <i>({profileInfo.pronouns})</i>
                </span>
                </div>
                <p>
                <strong>City:</strong> {profileInfo.city}, {profileInfo.state}
                </p>
                <p>
                <strong>Country:</strong> {profileInfo.country}
                </p>
                <p>
                <strong>Website:</strong>{" "}
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
            <button
                className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 hover:border hover:border-gray-300 px-2 py-2 rounded-full focus:ring focus:ring-gray-300 focus:outline-none"
                title="Edit profile"
                onClick={() => openModal("editProfile")}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>

            </button>
            </div>
        </div>
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Change Profile Image
              </h3>
              <button
                onClick={() => closeModal("profile")}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="flex items-center justify-center mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "profile")}
                className="hidden"
                id="profileImage"
              />
              <label
                htmlFor="profileImage"
                className="flex items-center justify-center cursor-pointer bg-gray-300 dark:bg-gray-700 px-4 py-2 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Change Image
              </label>
            </div>
            {previewProfileImage && (
              <div className="mb-4">
                <Image
                  src={previewProfileImage}
                  alt="Preview"
                  className="w-full h-auto rounded-full"
                />
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => handleImageSave("profile")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {isBannerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Upload Banner Image
              </h3>
              <button
                onClick={() => closeModal("banner")}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="flex items-center justify-center mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "banner")}
                className="hidden"
                id="bannerImage"
              />
              <label
                htmlFor="bannerImage"
                className="flex items-center justify-center cursor-pointer bg-gray-300 dark:bg-gray-700 px-4 py-2 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Change Image
              </label>
            </div>
            {previewBannerImage && (
              <div className="mb-4">
                <Image
                  src={previewBannerImage}
                  alt="Preview"
                  className="w-full h-auto" 
                />
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => handleImageSave("banner")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
            {["full_name", "pronouns", "city", "state", "country", "website"].map((field) => (
              <input
                key={field}
                type="text"
                name={field}
                value={(profileInfo as any)[field]}
                onChange={handleProfileChange}
                placeholder={field.replace("_", " ")}
                className="w-full mb-2 px-3 py-2 border rounded-lg"
              />
            ))}
            <div className="flex justify-end">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg" onClick={() => closeModal("editProfile")}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    )}
    </>
  );
};

export default ProfilePage;
