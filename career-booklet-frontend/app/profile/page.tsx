"use client";
import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { updateProfileImage, updateBackgroundImage , getProfile } from "@/app/api/profile/route";

const ProfilePage = () => {
  const { data: session } = useSession();

  // Profile Information State
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

  // State for Image Upload
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [previewProfileImage, setPreviewProfileImage] = useState<string | null>(null);
  const [previewBannerImage, setPreviewBannerImage] = useState<string | null>(null);

  // Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Fetch Profile Data
  useEffect(() => {
    const token = session?.user?.accessToken;
    const fetchProfile = async () => {
      try{
        const response = await getProfile(token);
        const data = await response.json();
        console.log(data);
        setProfileInfo(data);
        setPreviewBannerImage(data.profile_background_image);
        setPreviewProfileImage(data.profile_image);
      } catch (error) {
        console.error("Error fetching profile data:",error);
      }
    };
    if(token){
      fetchProfile();
    }
  }, [session]);

  // Handle Image Change
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

  // Handle Image Save
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

  // Handle Profile Info Change
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileInfo({ ...profileInfo, [e.target.name]: e.target.value });
  };

  // Open and Close Modals
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
    <div className="min-h-screen flex flex-col items-center p-3">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white text-center mb-4">
          Profile Page
        </h2>

        {/* Banner Image */}
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

        {/* Profile Image */}
        <div className="flex items-center mt-6">
          <div className="relative w-32 h-32 -mt-20 mb-4">
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

        {/* Profile Details */}
        <div className="mt-6 space-y-2">
          <div className="text-2xl font-medium :text-lg">{profileInfo.full_name}</div>
          <p><strong>Pronouns:</strong> {profileInfo.pronouns}</p>
          <p><strong>City:</strong> {profileInfo.city}, {profileInfo.state}</p>
          <p><strong>Country:</strong> {profileInfo.country}</p>
          <p><strong>Website:</strong> <a href={profileInfo.website} target="_blank" className="text-blue-500">{profileInfo.website}</a></p>
        </div>

        {/* Edit Profile Button */}
        <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg" onClick={() => openModal("editProfile")}>
          Edit Profile
        </button>
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
                <img
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
                <img
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
      {/* Edit Profile Modal */}
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
  );
};

export default ProfilePage;
