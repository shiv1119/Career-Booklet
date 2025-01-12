"use client";
import React, { useState } from "react";

interface ProfileData {
  full_name: string;
  additional_name?: string;
  pronouns?: string;
  date_of_birth?: string;
  gender?: string;
  country?: string;
  city?: string;
  full_address?: string;
  website?: string;
  profile_image?: string; // Base64 string
  profile_background_image?: string; // Base64 string
}

interface CreateProfileProps {
  onSubmitSuccess?: () => void;
}

const CreateProfile: React.FC<CreateProfileProps> = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    additional_name: "",
    pronouns: "",
    date_of_birth: "",
    gender: "",
    country: "",
    city: "",
    full_address: "",
    website: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileBackgroundImage, setProfileBackgroundImage] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: ProfileData = {
      ...formData,
    };

    // Add images as Base64 strings if available
    if (profileImage) {
      data.profile_image = profileImage;
    }
    if (profileBackgroundImage) {
      data.profile_background_image = profileBackgroundImage;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:9002?service=profile_service&path=/api/profile/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJzaGl2bmFuZGFudmVybWE2M0BnbWFpbC5jb20iLCJwaG9uZV9udW1iZXIiOiI5MTg4ODEwODc2MTQiLCJyb2xlcyI6InVzZXIiLCJleHAiOjE3MzYxNzg5MTV9.hsG8bRlRD7tVEqzhZFmSDcRmSnlLLwWPkkvpVZuJUPI",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create profile");
      }

      alert("Profile created successfully!");
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Error creating profile. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Create Profile</h2>
      <form onSubmit={handleSubmit}>
        {/* Other Fields */}
        {[
          "full_name",
          "additional_name",
          "pronouns",
          "date_of_birth",
          "gender",
          "country",
          "city",
          "full_address",
          "website",
        ].map((field) => (
          <div key={field} className="mb-4">
            <label
              htmlFor={field}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {field.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </label>
            <input
              type={field === "date_of_birth" ? "date" : "text"}
              id={field}
              name={field}
              value={formData[field as keyof typeof formData]}
              onChange={handleInputChange}
              required={field === "full_name"}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
        ))}

        {/* Profile Image */}
        <div className="mb-4">
          <label
            htmlFor="profile_image"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Profile Image
          </label>
          <input
            type="file"
            id="profile_image"
            name="profile_image"
            onChange={(e) => handleFileChange(e, setProfileImage)}
            accept="image/*"
            className="mt-1"
          />
        </div>

        {/* Background Image */}
        <div className="mb-4">
          <label
            htmlFor="profile_background_image"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Profile Background Image
          </label>
          <input
            type="file"
            id="profile_background_image"
            name="profile_background_image"
            onChange={(e) => handleFileChange(e, setProfileBackgroundImage)}
            accept="image/*"
            className="mt-1"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
          >
            Create Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProfile;
