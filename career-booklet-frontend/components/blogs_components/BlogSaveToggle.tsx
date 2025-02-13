"use client";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchSaveStatus, handelSave } from "@/app/api/blogs_services/route";

interface BlogSaveToggleProps {
  token?: string;
  blog_id: string;
}

export default function BlogSaveToggle({ token, blog_id }: BlogSaveToggleProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [totalSaves, setTotalSaves] = useState(0);

  useEffect(() => {
    if (!blog_id) return;

    const checkSaveStatus = async () => {
      try {
        const response = await fetchSaveStatus(token, blog_id);
        setIsSaved(response.is_saved);
        setTotalSaves(response.total_saves);
      } catch (error) {
        console.error("Error fetching save status:", error);
      }
    };

    checkSaveStatus();
  }, [token, blog_id]);

  const toggleSave = async () => {
    if (!blog_id) return;
    try {
      const response = await handelSave(token, blog_id);
      setIsSaved(response.is_saved);
      setTotalSaves(response.total_saves);
    } catch (error) {
      console.error("Error saving/un-saving blog:", error);
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={toggleSave}
        className="flex items-center gap-1 hover:scale-105 transition-transform"
      >
        {isSaved ? (
          <BookmarkCheck
            className="w-7 h-7 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 hover:border hover:border-gray-300 p-1 rounded-full focus:ring focus:ring-gray-300 focus:outline-none"
            color="blue"
            fill="blue"
          />
        ) : (
          <Bookmark className="w-7 h-7 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 hover:border hover:border-gray-300 p-1 rounded-full focus:ring focus:ring-gray-300 focus:outline-none" />
        )}
      </button>
      <span className="text-xs text-gray-700 dark:text-gray-300">{totalSaves} Saves</span>
    </div>
  );
}
