'use client';
import { useEffect, useState, useCallback } from "react";
import { getLatestBlogs, fetchCategories, fetchTags } from "@/app/api/blogs_services/route";
import { BlogResponse, Category, Subcategory, Tag } from "@/types";
import { Eye, Filter, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import Select from "react-select"; // Import react-select

const LatestBlogs = () => {
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]); // Stores available tags
  const [selectedTags, setSelectedTags] = useState<{ value: number; label: string }[]>([]); // For multi-select

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [author, setAuthor] = useState<string>("");
  const [minViews, setMinViews] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filtersVisible, setFiltersVisible] = useState<boolean>(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryData = await fetchCategories();
        setCategories(categoryData);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    const loadTags = async () => {
      try {
        const tagData = await fetchTags();
        setTags(tagData);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };

    loadCategories();
    loadTags();
  }, []);

  const getSubcategories = (): Subcategory[] => {
    const category = categories.find(cat => cat.id === selectedCategory);
    return category ? category.subcategories : [];
  };

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        category_id: selectedCategory || undefined,
        subcategory_id: selectedSubcategory || undefined,
        author: author || undefined,
        tag_ids: selectedTags.length > 0 ? selectedTags.map(tag => tag.value) : undefined, // Extract tag IDs
        min_views: minViews || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const data = await getLatestBlogs(1, 10, filters);
      setBlogs(data);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Failed to fetch blogs: " + err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSubcategory, author, selectedTags, minViews, startDate, endDate]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return (
    <div className="min-h-screen mx-auto dark:bg-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white text-center">
        Latest Blogs
      </h1>

      <div className="flex justify-center mb-1">
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="flex items-center justify-between w-full bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-300"
        >
          <div className="flex items-center justify-center">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </div>
          <div className="flex items-center justify-center">
            {filtersVisible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>
      </div>

      {filtersVisible && (
        <div className="bg-white dark:bg-gray-800 rounded-lg mb-6 flex flex-wrap gap-1 justify-center px-2">
        <div className="w-full">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
            Category
          </label>
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(Number(e.target.value))}
            className="block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 
            text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="w-full">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
            Subcategory
          </label>
          <select
            value={selectedSubcategory || ""}
            onChange={(e) => setSelectedSubcategory(Number(e.target.value))}
            className="block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 
            text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
          >
            <option value="">Select Subcategory</option>
            {getSubcategories().map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
            Author
          </label>
          <input
            type="text"
            placeholder="Enter author name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 
            text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
          />
        </div>
        <div className="w-full">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
            Tags
          </label>
          <Select
            isMulti
            options={tags.map(tag => ({ value: tag.id, label: tag.name }))}
            value={selectedTags}
            onChange={(selectedOptions) => setSelectedTags(selectedOptions as { value: number; label: string }[])}
            className="w-full dark:text-gray-200 dark:bg-gray-800"
            placeholder="Select Tags"
          />
        </div>
        <div className="w-full">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
            Minimum Views
          </label>
          <input
            type="number"
            placeholder="Enter minimum views"
            value={minViews || ""}
            onChange={(e) => setMinViews(Number(e.target.value))}
            className="block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 
            text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
          />
        </div>
        <div className="w-full">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 
            text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            placeholder="Start Date"
          />
        </div>
        <div className="w-full">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 
            text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            placeholder="End Date"
          />
        </div>
        <div className="w-full flex justify-center">
          <button
            onClick={fetchBlogs}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      )}
      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {blogs.length === 0 && !loading && (
        <p className="text-center text-gray-500">No blogs found</p>
      )}

      <div>
        {blogs.map((blog) => (
          <div key={blog.id} className="bg-white dark:bg-gray-800 mt-8">
            <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-700">
              <Link href={`/posts/getBlogsById/${blog.id}`} className="hover:text-indigo-800">
                {blog.title}
              </Link>
            </h2>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" /> {blog.total_views}
              </span>
              <span>By: {blog.author}</span>
              <span>{blog.category}</span>
            </div>
            <div 
              className="text-gray-700 dark:text-gray-300 mt-2 line-clamp-3 text-justify whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: blog.content.split(" ").slice(0, 200).join(" ") + "..."
              }}
            />
            <Link
              href={`/posts/getBlogsById/${blog.id}`}
              className="text-indigo-700 hover:text-indigo-800 block text-sm font-semibold mt-2"
            >
              Read more
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatestBlogs;
