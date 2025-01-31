'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";  // Import useParams from next/navigation
import { getBlogById } from "@/app/api/blogs_services/route";  
import { BlogResponse } from "@/types";
import { Eye } from "lucide-react";  

const BlogDetails = () => {
  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { blogId } = useParams(); 
  useEffect(() => {
    if (!blogId) return;

    const fetchBlog = async () => {
      try {
        setLoading(true);
        const data = await getBlogById(Number(blogId)); 
        setBlog(data);
      } catch (err) {
        setError("Failed to fetch the blog: " + err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [blogId]); 

  if (loading) return <p className="flex justify-center items-center">Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!blog) return <p>Blog not found</p>;

  return (
    <div className="min-h-screen py-1 px-1 bg-white dark:bg-gray-800 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white text-center">
        {blog.title}
      </h1>

      <div className="flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
        <div className="flex items-center">
          <Eye className="w-4 h-4 mr-1" /> {blog.total_views}
        </div>
        <div>Category: {blog.category}</div>
        <div>Subcategory: {blog.subcategory}</div>
      </div>

      <div 
        className="text-gray-700 dark:text-gray-300 mt-2 text-justify whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      <div className="mt-4">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          Tags:{" "}
          {blog.tags.map((tag, index) => (
            <span key={index} className="text-indigo-700 hover:text-indigo-800 cursor-pointer">
              #{tag}{" "}
            </span>
          ))}
        </span>
      </div>
      <div className="mt-4">By: {blog.author}</div>
    </div>
  );
};

export default BlogDetails;
