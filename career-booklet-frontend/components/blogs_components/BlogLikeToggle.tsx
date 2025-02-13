"use client";
import { ThumbsUp } from "lucide-react";
import { useState, useEffect } from "react";
import { handelBlogLike, fetchLikeStatus } from "@/app/api/blogs_services/route";

interface BlogLikeToggleProps {
  token?: string;
  blog_id: string;
}

export default function BlogLikeToggle({ token, blog_id }: BlogLikeToggleProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);

  useEffect(() => {
    if (!blog_id) return;

    const checkLikeStatus = async () => {
      try {
        const response = await fetchLikeStatus(token, blog_id);
        setIsLiked(response.is_liked);
        setTotalLikes(response.total_likes);
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    };

    checkLikeStatus();
  }, [token, blog_id]);

  const toggleLike = async () => {
    if (!blog_id) return;
    try {
      const response = await handelBlogLike(token, blog_id);
      setIsLiked(response.is_liked);
      setTotalLikes(response.total_likes);
    } catch (error) {
      console.error("Error liking/unliking blog:", error);
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={toggleLike}
        className="flex items-center hover:scale-105 transition-transform"
      >
        <ThumbsUp
          className="w-7 h-7 text-gray-700 hover:text-gray-800 dark:text-gray-200 dark:hover:text-gray-100 hover:border hover:border-gray-300 p-1 rounded-full focus:ring focus:ring-gray-300 focus:outline-none"
          fill={isLiked ? "blue" : "none"}
        />
      </button>
      <span className="text-xs text-gray-700 dark:text-gray-300">{totalLikes} Likes</span>
    </div>
  );
}
