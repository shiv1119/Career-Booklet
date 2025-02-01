"use client";
import React, { useState } from "react";
import { FaCamera } from "react-icons/fa";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, getSession } from "next-auth/react";
import { updateProfileImage, updateBackgroundImage } from "@/app/api/profile/route";

const UpdateImagesPage = () => {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [previewProfileImage, setPreviewProfileImage] = useState<string | null>(null);
  const [previewBannerImage, setPreviewBannerImage] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const router = useRouter();
  const { data: session } = useSession();

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
      if (type === "profile" && profileImage) {
        const response = await updateProfileImage(profileImage, session?.user?.accessToken);
        if (response.ok) {
          console.log(response.json());
          setProfileImage(profileImage);
          closeModal("profile");
        } else {
          console.error('Failed to update profile image');
        }
      } else if (type === "banner" && bannerImage) {
        console.log("Attempting Banner Change!");
        const response = await updateBackgroundImage(bannerImage, session?.user?.accessToken);

        if (response.ok) {
          setBannerImage(bannerImage);
          closeModal("banner");
        } else {
          console.error('Failed to update banner image');
        }
      }
    } catch (error) {
      console.error('Error updating image', error);
    }
  };

  const openModal = (type: string) => {
    if (type === "profile") {
      setIsProfileModalOpen(true);
    } else if (type === "banner") {
      setIsBannerModalOpen(true);
    }
  };

  const closeModal = (type: string) => {
    if (type === "profile") {
      setIsProfileModalOpen(false);
    } else if (type === "banner") {
      setIsBannerModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-3">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white text-center">
            Update Your Profile Images
          </h2>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="dark:bg-gray-700 px-4 py-1 rounded-full border-2 hover:bg-blue-600 hover:text-white"
          >
            Skip
          </button>
        </div>

        <div className="relative h-48 rounded-md overflow-hidden">
          {bannerImage ? (
            <Image
              src={URL.createObjectURL(bannerImage)}
              alt="Banner"
              layout="fill"
              objectFit="cover"
              className="object-cover"
            />
          ) : (
            <Image
              src="/images/banner_placeholder.png"
              alt="Banner Placeholder"
              layout="fill"
              objectFit="cover"
              className="object-cover"
            />
          )}
          <button
            className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:shadow-lg z-20"
            onClick={() => openModal("banner")}
          >
            <FaCamera className="text-blue-500 dark:text-blue-300" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="relative w-32 h-32 -mt-20 mb-4">
            {profileImage ? (
              <Image
                src={URL.createObjectURL(profileImage)}
                alt="Profile"
                layout="fill"
                objectFit="cover"
                className="rounded-full border-4 border-white dark:border-gray-700 shadow-md"
              />
            ) : (
              <Image
                src="/images/profile_placeholder.jpg"
                alt="Profile Placeholder"
                layout="fill"
                objectFit="cover"
                className="rounded-full border-4 border-white dark:border-gray-700 shadow-md"
              />
            )}
            <button
              className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:shadow-lg z-10"
              onClick={() => openModal("profile")}
            >
              <FaCamera className="text-blue-500 dark:text-blue-300" />
            </button>
          </div>
        <button
            type="button"
            onClick={() => router.push("/")}
            className="dark:bg-gray-700 px-4 py-1 rounded-md border-2 hover:bg-green-600 hover:text-white"
          >
            Update
          </button>
        </div>
      </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Upload Profile Image
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
                Choose Image
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

      {/* Banner Image Modal */}
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
                Choose Image
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
    </div>
  );
};

export default UpdateImagesPage;
