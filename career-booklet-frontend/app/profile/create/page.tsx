'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProfile } from "@/app/api/profile/route";
import { useSession } from "next-auth/react";
import { Country, State, City } from "country-state-city";

const CreateProfilePage = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    additional_name: "",
    pronouns: "",
    date_of_birth: "",
    gender: "",
    country: "",
    state: "",
    city: "",
    full_address:"",
    website: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (formData.country) {
      const selectedCountry = Country.getAllCountries().find(
        (country) => country.name === formData.country
      );
      setStates(selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : []);
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.state) {
      const selectedState = states.find((state) => state.name === formData.state);
      setCities(selectedState ? City.getCitiesOfState(selectedState.countryCode, selectedState.isoCode) : []);
    }
  }, [formData.state, states]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value; // The input will return a YYYY-MM-DD format
    setFormData({
      ...formData,
      date_of_birth: dateValue,
    });
  };

  const handleSubmit = async (formData: any) => {
    try {
      setError(null);
      const payload = {
        full_name: formData.full_name || "",
        additional_name: formData.additional_name || "",
        pronouns: formData.pronouns || "",
        date_of_birth: formData.date_of_birth || "",
        gender: formData.gender || "",
        country: formData.country || "",
        city: formData.city || "",
        state: formData.state || "",
        full_address: formData.full_address || "",
        website: formData.website || "",
      };
  
      console.log("Payload being sent:", payload);
  
      const response = await createProfile(payload, session?.user?.accessToken);
  
      if (response.ok) {
        router.push("/profile/update-images");
      } else {
        setError(response.detail || "An error occurred while creating the profile.");
      }
    } catch (error) {
      setError("An error occurred while submitting the form. Please try again.");
      console.error(error);
    }
  };



  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 w-full max-w-4xl">
        {error && (
          <div className="text-red-600 text-sm mb-4">
            <strong>Warning:</strong> {error}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(formData);
          }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
            Create Your Profile
          </h2>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
              <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Enter your Full Name"
              required
            />
          </div>

          {/* Additional Name */}
          <div>
            <label htmlFor="additional_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Name
            </label>
            <input
              type="text"
              id="additional_name"
              name="additional_name"
              value={formData.additional_name}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Enter your Additional Name"
            />
          </div>

          {/* Pronouns */}
          <div>
            <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pronouns
            </label>
            <select
              id="pronouns"
              name="pronouns"
              value={formData.pronouns}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="" disabled>Select Pronouns</option>
              <option value="He/Him">He/Him</option>
              <option value="She/Her">She/Her</option>
              <option value="They/Them">They/Them</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date of Birth
            </label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleDateChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Country
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="" disabled>Select Country</option>
              {Country.getAllCountries().map((country) => (
                <option key={country.isoCode} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              State
            </label>
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="" disabled>Select State</option>
              {states.map((state) => (
                <option key={state.isoCode} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              City
            </label>
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="" disabled>Select City</option>
              {cities.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="full_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
               Full Address
            </label>
            <input
              type="text"
              id="full_address"
              name="full_address"
              value={formData.full_address}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Enter your Full Address"
            />
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
               Website
               <span className="text-red-600">*</span>
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Enter you Website Link"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProfilePage;
