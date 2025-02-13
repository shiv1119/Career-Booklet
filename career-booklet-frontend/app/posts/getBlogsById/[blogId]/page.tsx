'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";  // Import useParams from next/navigation
import { getBlogById } from "@/app/api/blogs_services/route";  
import { BlogResponse } from "@/types";
import BlogSaveToggle from "@/components/blogs_components/BlogSaveToggle";
import { Eye } from "lucide-react";  
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import BlogShare from "@/components/blogs_components/BlogShare";
import BlogLikeToggle from "@/components/blogs_components/BlogLikeToggle";

const BlogDetails = () => {
  const {data: session, status} = useSession()
  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blogUrl, setBlogUrl] = useState("");
  const isAuthenticated = status === 'authenticated';
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
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBlogUrl(window.location.href);
    }
  }, []);

  const blog_id = typeof blogId === "string" ? blogId : "";

  if (loading) return (
      <div className="min-h-screen py-1 px-1 bg-white dark:bg-gray-800 max-w-3xl animate-pulse">
        <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md mx-auto mb-4"></div>

        <div className="flex flex-col text-sm text-gray-600 dark:text-gray-400 mb-4 gap-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          {isAuthenticated && Number(session.user.id) === Number(blog?.author) && (
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        )}
        </div>
        <div className="space-y-4">
          <div className="h-40 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-80 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-40 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-60 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-40 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
      <div className="mt-4 h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
    </div>
  );
  if (error) return <p className="min-h-screen">{error}</p>;
  if (!blog) return <p className="min-h-screen">Blog not found</p>;

  return (
    <div className="min-h-screen py-1 px-1 bg-white dark:bg-gray-800 max-w-3xl">
      <h1 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">
        {blog.title}
      </h1>
      <div className="flex justify-between">
        <div className="flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1" /> {blog.total_views}
          </div>
          <div>Category: {blog.category}</div>
          <div>Subcategory: {blog.subcategory}</div>
          {isAuthenticated && Number(session.user.id) === Number(blog.author) && (
            <div><Link className="text-indigo-600" href={`/posts/view-analytics/${blog.id}`}>View analytics</Link></div>
          )}
        </div>
        <div className="flex flex-col">
          {isAuthenticated && (
            <div><BlogSaveToggle token={session?.user.accessToken} blog_id={blog_id} /></div>
          )}
          {isAuthenticated && (
            <div><BlogLikeToggle token={session?.user.accessToken} blog_id={blog_id} /></div>
          )}
          <div><BlogShare blogTitle={blog.title} blogUrl={blogUrl} /></div>
        </div>
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
      <div className="mt-4"> 
        <div >
          <Link className="flex gap-2 items-center text-blue-600" href={Number(session?.user.id) === Number(blog.author) ? "/profile/" : `/profile/profileById/${blog.author}`}>
          <div className="relative w-14 h-14">
            <Image 
              src={blog.author_profile_image || "/default-avatar.png"} 
              alt="Author profile image" 
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>{blog.author_name}</div>
            </Link>
          </div>
        </div>
    </div>
  );
};

export default BlogDetails;
