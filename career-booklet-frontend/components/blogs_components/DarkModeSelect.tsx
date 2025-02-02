import { useEffect, useState } from "react";
import Select from "react-select";

const DarkModeSelect = ({ tags, selectedTags, setSelectedTags }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Read dark mode status from localStorage
    const darkModeStatus = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeStatus);

    // Listen for changes to dark mode in localStorage
    const handleStorageChange = () => {
      setIsDarkMode(localStorage.getItem("darkMode") === "true");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Select
      isMulti
      options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
      value={selectedTags}
      onChange={(selectedOptions) => setSelectedTags(selectedOptions as { value: number; label: string }[])}
      placeholder="Select Tags"
      className={`text-sm ml-2 p-1 rounded w-full ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'}`} // Tailwind classes for basic styling
      styles={{
        control: (base, state) => ({
          ...base,
          backgroundColor: isDarkMode ? "rgb(55 65 81)" : "rgb(229 231 235)",
          color: isDarkMode ? "white" : "black",
          borderColor: state.isFocused
            ? isDarkMode
              ? "rgb(99 102 241)"
              : "rgb(107 114 128)"
            : isDarkMode
            ? "rgb(75 85 99)"
            : "rgb(209 213 219)",
          borderRadius: "0.375rem", // Tailwind rounded
          padding: "0.25rem 0.5rem", // Tailwind p-1
          "&:hover": {
            borderColor: isDarkMode ? "rgb(156 163 175)" : "rgb(156 163 175)",
          },
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: isDarkMode ? "rgb(31 41 55)" : "white",
          color: isDarkMode ? "white" : "black",
        }),
        multiValue: (base) => ({
          ...base,
          backgroundColor: isDarkMode ? "rgb(75 85 99)" : "rgb(209 213 219)",
          color: isDarkMode ? "white" : "black",
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: isDarkMode ? "white" : "black",
        }),
        multiValueRemove: (base) => ({
          ...base,
          color: isDarkMode ? "white" : "black",
          "&:hover": { backgroundColor: "rgb(75 85 99)", color: "white" },
        }),
        placeholder: (base) => ({
          ...base,
          color: isDarkMode ? "rgb(156 163 175)" : "rgb(107 114 128)",
        }),
        input: (base) => ({
          ...base,
          color: isDarkMode ? "white" : "black",
        }),
      }}
    />
  );
};

export default DarkModeSelect;
