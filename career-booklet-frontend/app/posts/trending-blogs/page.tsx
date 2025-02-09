"use client";
import { useEffect, useState, useCallback } from "react";
import { getTrendingBlogs, fetchCategories, fetchTags } from "@/app/api/blogs_services/route";
import { BlogResponse, Category, Subcategory, Tag } from "@/types";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MdTrendingUp } from "react-icons/md";

const TrendingBlogs = () => {
  const { data: session, status } = useSession();
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ value: number; label: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [author, setAuthor] = useState<string>("");
  const [days, setDays] = useState<number>(7);
  const [search, setSearch] = useState<string>("");
  const [tagSearch, setTagSearch] = useState<string>("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryData = await fetchCategories();
        console.log("Categories loaded:", categoryData);
        setCategories(categoryData);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    const loadTags = async () => {
      try {
        const tagData = await fetchTags();
        console.log("Tags loaded:", tagData);
        setTags(tagData);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };

    loadCategories();
    loadTags();
  }, []);

  const getSubcategories = (): Subcategory[] => {
    const category = categories.find((cat) => cat.id === selectedCategory);
    return category ? category.subcategories : [];
  };

  const isAuthenticated = status === "authenticated";

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        category_id: selectedCategory || undefined,
        subcategory_id: selectedSubcategory || undefined,
        author: author || undefined,
        tag_ids: selectedTags.length > 0 ? selectedTags.map((tag) => tag.value) : undefined,
        search: search || undefined, 
      };

      console.log("Filters applied:", filters);

      const data = await getTrendingBlogs(days, 10, 0, filters);
      setBlogs(data);
    } catch (err) {
      console.error("Error fetching trending blogs:", err);
      setError("Failed to fetch trending blogs.");
    } finally {
      setLoading(false);
    }
  }, [days, selectedCategory, selectedSubcategory, author, selectedTags, search]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()) && !selectedTags.some(t => t.value === tag.id)
  );

  const handleTagSelect = (tag: Tag) => {
    const tagOption = { value: tag.id, label: tag.name };
    setSelectedTags(prev => [...prev, tagOption]);
    setTagSearch('');
  };

  const removeTag = (tagValue: number) => {
    setSelectedTags(prev => prev.filter(tag => tag.value !== tagValue));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchBlogs();
    }
  };
  
  const handleSearchClick = () => {
    fetchBlogs();
  };

  const handleTagSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSearch(e.target.value);
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setAuthor("");
    setSearch("");
    setTagSearch("");
    setSelectedTags([]);
    setDays(7);
  };

  return (
    <div className="min-h-screen mx-auto dark:bg-gray-800">
      <h1 className=" display flex justify-center items-center gap-2 text-lg font-bold mb-8 text-center px-5 py-4  shadow-lg rounded-md dark:bg-gray-900 dark:shadow-gray-700">
        <span>Trending Blogs</span>
        <span><MdTrendingUp className="w-6 h-6" /></span>
      </h1>
      <div className="flex justify-center mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-wrap gap-4 justify-center">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trending in Last (Days)</label>
            <input
              type="number"
              min="1"
              placeholder="Enter days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(Number(e.target.value))}
              className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subcategory</label>
            <select
              value={selectedSubcategory || ""}
              onChange={(e) => setSelectedSubcategory(Number(e.target.value))}
              className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
            >
              <option value="">Select Subcategory</option>
              {getSubcategories().map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Author</label>
            <input
              type="text"
              placeholder="Enter author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
            />
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search blogs..."
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyPress}
              className="text-sm p-1 pl-2 pr-8 bg-gray-200 dark:bg-gray-700 dark:text-white rounded w-full"
            />
            <button 
              onClick={handleSearchClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              🔍
            </button>
          </div>

          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
            <input
              type="text"
              placeholder="Apply Tags"
              value={tagSearch}
              onChange={handleTagSearchChange} 
              className="text-sm ml-2 p-1 rounded w-full bg-gray-200 dark:bg-gray-700 dark:text-white"
            />
            {tagSearch && filteredTags.length > 0 && (
              <ul className="text-sm mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
                {filteredTags.map(tag => (
                  <li
                    key={tag.id}
                    className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 p-1"
                    onClick={() => handleTagSelect(tag)}
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={resetFilters}
            className="text-sm px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
          >
            Reset Filters
          </button>
        </div>
      </div>
      
        {selectedTags.length > 0 && (
          <div className="flex justify-center items-center mb-6">
              <div className="flex flex-wrap flex justify-center items-center gap-2"><span> Selected tags:</span> 
                {selectedTags.map((tag) => (
                  <span
                    key={tag.value}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-2 py-1 rounded flex items-center"
                  > 
                    #{tag.label}
                    <button
                      type="button"
                      onClick={() => removeTag(tag.value)}
                      className="ml-2 text-red-500"
                    >
                      X
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}


      {loading ? (
        <div className="w-full space-y-6">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-lg px-5 py-3 border border-gray-200 dark:border-gray-700 w-full animate-pulse"
            >
              <div className="bg-gradient-to-r text-gray-800 dark:text-white rounded-t-lg py-2 mb-3">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded-full w-1/6"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {error && <p className="text-center text-red-500">{error}</p>}
          {blogs.length === 0 && !loading && <p className="text-center text-gray-500">No blogs found</p>}
          
          <div className="w-full">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-lg hover:shadow-xl transition-shadow px-5 py-4 border border-gray-200 dark:border-gray-700 mb-6 w-full"
              >
                <div className="bg-gradient-to-r text-gray-800 dark:text-white rounded-t-lg py-1 mb-1">
                  <h2 className="text-md lg:text-lg font-semibold">
                    <Link href={`/posts/getBlogsById/${blog.id}`} className="hover:text-indigo-800 transition">
                      {blog.title}
                    </Link>
                  </h2>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" /> {blog.total_views}
                  </span>
                  <span className="font-medium">By: {session?.user?.name|| blog.author}</span>
                  <span className="bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-white px-2 py-1 rounded-full text-xs font-semibold">
                  <Link href="/posts/postByCategories">{blog.category}</Link>
                  </span>
                </div>
                <div 
                  className="text-sm lg:text-md text-gray-700 dark:text-gray-300 text-justify line-clamp-3 whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: blog.content.split(" ").slice(0, 50).join(" ") + "...",
                  }}
                />
                <div className="mt-1 flex justify-between items-center">
                  <Link
                    href={`/posts/getBlogsById/${blog.id}`}
                    className="text-indigo-700 hover:text-indigo-900 font-medium text-sm"
                  >
                    Read more →
                  </Link>
                  {isAuthenticated && Number(session.user.id) === Number(blog.author) && (
                    <Link
                      href={`/posts/view-analytics/${blog.id}`}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-white text-xs"
                    >
                      View Analytics
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TrendingBlogs;
