"use client";
import React, { useEffect, useState } from "react";
import { RiPencilFill } from "react-icons/ri";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { updateProfileImage, updateBackgroundImage , getProfile , updateProfile } from "@/app/api/profile/route";
import {fetchTotalFollowers} from "@/app/api/follow/route";
import { Users } from "lucide-react";
import { Country, State, City } from "country-state-city";
import { RxCross1 } from "react-icons/rx";

interface ProfilePageProps {
    full_name?: string;
    additional_name?: string;
    pronouns?: string;
    date_of_birth?: string;
    gender?: string;
    country?: string;
    state?: string;
    city?: string;
    full_address?: string;
    website?: string;
}

const ProfilePage: React.FC<ProfilePageProps> = () => {
  const { data: session } = useSession();

  const [profileInfo, setProfileInfo] = useState({
    full_name: "",
    additional_name: "",
    pronouns: "",
    city: "",
    state: "",
    country: "",
    website: "",
    profile_image:"",
    profile_background_image:"",
  });

  const [states, setStates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [previewProfileImage, setPreviewProfileImage] = useState<string | null>(null);
  const [previewBannerImage, setPreviewBannerImage] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [totalFollowers, setTotalFollowers] = useState(Number);
  const [totalFollowing, setTotalFollowing] = useState(Number);
  const [loading, setLoading] = useState(true);  
  const user_id = session?.user.id;
  useEffect(()=>{
    const getTotalFollowers = async () => {
      try {
        const response = await fetchTotalFollowers(String(user_id));
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
    const token = session?.user?.accessToken;
    const fetchProfile = async () => {
      try{
        const response = await getProfile(token);
        const data = await response;
        console.log(data);
        setProfileInfo(data);
        setPreviewBannerImage(data.profile_background_image);
        setPreviewProfileImage(data.profile_image);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile data:",error);
      }
    };
    if(token){
      fetchProfile();
    }
  }, [session]);

  useEffect(() => {
    if(profileInfo.country) {
      const selectedCountry = Country.getAllCountries().find(
        (country) => country.name === profileInfo.country
      );
      setStates(selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : []);
    }
  }, [profileInfo.country]);

  useEffect(() => {
    if (profileInfo.state) {
      const selectedState = states.find((state) => state.name === profileInfo.state);
      setCities(selectedState ? City.getCitiesOfState(selectedState.countryCode, selectedState.isoCode) : []);
    }
  }, [profileInfo.state, states]);

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

  
  //Handle Profile Save
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = session?.user?.accessToken; 
      if (!token) {
        console.error("User is not authenticated");
        return;
      }
  
      const response = await updateProfile(profileInfo, token);
      
      if (response.ok) {
        console.log("Profile updated successfully!");
        closeModal("editProfile");
      } else {
        console.error("Failed to update profile:", await response.json());
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
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


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
<div className="min-h-screen lg:p-3 flex flex-col items-center">
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
    );
  }
  return (
    <div className="min-h-screen flex flex-col items-center lg:p-3">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 w-full max-w-4xl">
        <div className="relative h-48 rounded-md overflow-hidden">
          <Image
            src={previewBannerImage || "/images/banner_placeholder.png"}
            alt="Banner"
            layout="fill"
            objectFit="cover"
            className="object-cover"
          />
          <button className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-200" onClick={() => openModal("banner")}>
            <RiPencilFill className="text-blue-500 dark:text-blue-300" />
          </button>
        </div>
        <div className="relative flex items-center justify-start sm:justify-start w-full mt-6">
          <div className="relative w-32 h-32 -mt-20  rounded-full dark:border-gray-700 shadow-md">
            <Image
              src={previewProfileImage || "/images/profile_placeholder.jpg"}
              alt="Profile"
              layout="fill"
              objectFit="cover"
              className="rounded-full border-4 border-white dark:border-gray-700 shadow-md"
            />
            <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => openModal("profile")}>
              <RiPencilFill className="text-black dark:text-white" />
            </button>
          </div>
        </div>
        <div className="flex items-start justify-between w-full">
            <div className="flex flex-col">
                <div className="text-xl font-semibold lg:text-2xl my-3">
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
            <div className="flex flex-col items-end">
              <button
                  className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 hover:border hover:border-gray-300 px-2 py-2 my-3 rounded-full focus:ring focus:ring-gray-300 focus:outline-none"
                  title="Edit profile"
                  onClick={() => openModal("editProfile")}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
              </button>
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
              </div>
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
                className="text-gray-500 text-xl hover:text-gray-700 hover:bg-gray-200 rounded-full p-2"
              >
                <RxCross1 />
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
                className="text-gray-500 text-xl hover:text-gray-700 hover:bg-gray-200 rounded-full p-2"
              >
                <RxCross1 />
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

      {isEditProfileOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
          
          {/* Close Button */}
          <div className="flex justify-between text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
            Edit your profile
          <button
                onClick={() => closeModal("editProfile")}
                className="text-gray-500 text-xl hover:text-gray-700 hover:bg-gray-200 rounded-full p-2"
              >
                <RxCross1 />
              </button>
          
          </div>

          <form className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={profileInfo.full_name}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-2 border rounded-md dark:bg-gray-700"
                placeholder="Enter Full Name"
              />
            </div>

            {/* Additional Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Additional Name</label>
              <input
                type="text"
                name="additional_name"
                value={profileInfo.additional_name}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md dark:bg-gray-700"
                placeholder="Enter Additional Name"
              />
            </div>

            {/* Pronouns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pronouns</label>
              <select
                name="pronouns"
                value={profileInfo.pronouns}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md dark:bg-gray-700"
              >
                <option value="">Select Pronouns</option>
                <option value="He/Him">He/Him</option>
                <option value="She/Her">She/Her</option>
                <option value="They/Them">They/Them</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
              <select
                name="country"
                value={profileInfo.country}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md dark:bg-gray-700"
              >
                <option value="">Select Country</option>
                {Country.getAllCountries().map((country) => (
                  <option key={country.isoCode} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
              <select
                name="state"
                value={profileInfo.state}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md dark:bg-gray-700"
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.isoCode} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
              <select
                name="city"
                value={profileInfo.city}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md dark:bg-gray-700"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website *</label>
              <input
                type="url"
                name="website"
                value={profileInfo.website}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-2 border rounded-md dark:bg-gray-700"
                placeholder="Enter Website URL"
              />
            </div>

            {/* Submit Button */}
            <button onClick={handleProfileSave} className="ml-100 w-32 bg-blue-600 text-white py-2 rounded-3xl">
              Update Profile
            </button>
          </form>
        </div>
      </div>
    )}
    </div>
  );
};

export default ProfilePage;