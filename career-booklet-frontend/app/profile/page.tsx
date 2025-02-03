"use client";
import React, { useEffect, useState } from "react";
import { RiPencilFill } from "react-icons/ri";
import {FaPencilAlt} from 'react-icons/fa';
import Image from "next/image";
import { useSession } from "next-auth/react";
import { updateProfileImage, updateBackgroundImage , getProfile , updateProfile } from "@/app/api/profile/route";
import { Country, State, City } from "country-state-city";
import { RxCross1 } from "react-icons/rx";
import Loader from "../../components/utils/loader"

interface ProfilePageProps {
    full_name: string;
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

  // Profile Information State
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

  // State for Image Upload
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [previewProfileImage, setPreviewProfileImage] = useState<string | null>(null);
  const [previewBannerImage, setPreviewBannerImage] = useState<string | null>(null);

  // Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);  
  

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

  const handleModal = () => {
    setIsEditProfileOpen(true);
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
      <div className="min-h-screen flex flex-col gap-2 justify-center items-center font-medium">
      <Loader/>
      Loading User Profile
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col items-center p-3">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 w-full max-w-4xl">
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
          <button className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-200" onClick={() => openModal("banner")}>
            <RiPencilFill className="text-blue-500 dark:text-blue-300" />
          </button>
        </div>

        {/* Profile Image */}
        <div className="relative flex items-center justify-start sm:justify-start w-full mt-6">
          <div className="relative w-32 h-32 -mt-10  rounded-full dark:border-gray-700 shadow-md">
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
          <div className="absolute max-h-8 sm:relative sm:ml-6  top-2 right-2 sm:bottom-0 sm:right-0 text-black dark:text-white rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-800" onClick={handleModal}>
            <FaPencilAlt/>
          </div>
        </div>

        {/* Profile Details */}
        <div className="mt-6 space-y-2">
          <span className="flex items-center gap-2">
          <div className="text-2xl font-medium :text-lg">{profileInfo.full_name}</div>
          <div className="mt-1">({profileInfo.pronouns})</div>
          </span>
          <div className="dark:text-gray-300 text-gray-600">{profileInfo.city}, {profileInfo.state}, {profileInfo.country}</div>
          <p><a href={profileInfo.website} target="_blank" className="text-blue-500">{profileInfo.website}</a></p>
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
