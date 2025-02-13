'use client';
import { useEffect, useState, useCallback } from "react";
import { getLatestBlogs, fetchCategories, fetchTags } from "@/app/api/blogs_services/route";
import { BlogResponse, Category, Subcategory, Tag } from "@/types";
import { Eye, ThumbsUp, Bookmark} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MdOutlineTimer } from "react-icons/md"; 
import BlogShare from "@/components/blogs_components/BlogShare";
import BlogSaveToggle from "@/components/blogs_components/BlogSaveToggle";
import BlogLikeToggle from "@/components/blogs_components/BlogLikeToggle";
import { useRouter } from "next/navigation"

const LatestBlogs = () => {
  const {data: session, status} = useSession();
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ value: number; label: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [author, setAuthor] = useState<string>("");
  const [minViews, setMinViews] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [tagSearch, setTagSearch] = useState<string>("");
  const router = useRouter();
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
  const isAuthenticated = status === 'authenticated';
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

  const handleTagSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSearch(e.target.value);
  };
  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setAuthor("");
    setSelectedTags([]);
    setMinViews(null);
    setStartDate("");
    setEndDate("");
    fetchBlogs();
  };

  const checkLoginStatus = () => {
    if(!isAuthenticated){
      router.push("/auth")
    }
  }

  return (
    <div className="min-h-screen mx-auto dark:bg-gray-800">
      <h1 className="flex justify-center items-center gap-2 text-lg font-bold mb-8 text-center px-5 py-4  shadow-lg rounded-md dark:bg-gray-900 dark:shadow-gray-700">
        <span>Latest Blogs</span>
        <span><MdOutlineTimer className="w-6 h-6" /></span>
      </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg mb-8 flex flex-wrap gap-4 justify-center px-2">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(Number(e.target.value))}
            className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Subcategory
          </label>
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Author
          </label>
          <input
            type="text"
            placeholder="Enter author name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Minimum Views
          </label>
          <select
            value={minViews || ""}
            onChange={(e) => setMinViews(Number(e.target.value))}
            className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
          >
            <option value="">Select Minimum Views</option>
            <option value="100">50</option>
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="1000">1k</option>
            <option value="5000">5k</option>
            <option value="10000">10k</option>
            <option value="20000">20k</option>
            <option value="50000">50k</option>
            <option value="100000">100k</option>
            <option value="250000">250k</option>
            <option value="500000">500k</option>
            <option value="1000000">1M</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
            placeholder="Start Date"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
            placeholder="End Date"
          />
        </div>
        <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
            <input
              type="text"
              placeholder="Apply tags"
              value={tagSearch}
              onChange={handleTagSearchChange} 
              className="text-sm ml-2 p-1 rounded bg-gray-200 dark:bg-gray-700 dark:text-white"
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
      {selectedTags.length > 0 && (
          <div className="flex justify-center items-center mb-8">
              <div className="flex flex-wrap flex justify-center items-center gap-2"><span> Selected tags:</span> 
                {selectedTags.map((tag) => (
                  <span
                    key={tag.value}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white p-2 rounded flex items-center"
                  > 
                    {tag.label}
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
              <div className="bg-gradient-to-r text-gray-800 dark:text-white rounded-t-lg py-2 mb-2">
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
                <div className="bg-gradient-to-r text-gray-800 dark:text-white rounded-t-lg mb-1">
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
                  <span className="font-medium text-indigo-700">
                  <Link 
                    className="text-indigo-700" 
                    href={Number(session?.user.id) === Number(blog.author) ? "/profile/" : `/profile/profileById/${blog.author}`}
                  >
                    By: {blog.author_name}
                  </Link>
                  </span>
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
                <div className="mt-2 flex justify-between items-center">
                  {!isAuthenticated && (<div className="flex items-center">        
                    <ThumbsUp
                        onClick={checkLoginStatus}
                        className="w-7 h-7 cursor-pointer text-gray-700 hover:text-gray-800 dark:text-gray-200 dark:hover:text-gray-100 hover:border hover:border-gray-300 p-1 rounded-full focus:ring focus:ring-gray-300 focus:outline-none"
                      />
                      {blog.total_likes}
                    </div>
                  )}
                  {isAuthenticated && (
                    <div><BlogLikeToggle token={session?.user.accessToken} blog_id={String(blog.id)} /></div>
                  )}
                  {!isAuthenticated && (<div className="flex items-center">
                    <Bookmark onClick={checkLoginStatus} className="w-7 h-7 cursor-pointer text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 hover:border hover:border-gray-300 p-1 rounded-full focus:ring focus:ring-gray-300 focus:outline-none" />{blog.total_saves}
                  </div>
                  )}
                  {isAuthenticated && (
                    <div><BlogSaveToggle token={session?.user.accessToken} blog_id={String(blog.id)} /></div>
                  )}
                  <div className="flex"><BlogShare blogTitle={blog.title} blogUrl={`${process.env.NEXT_PUBLIC_HOST_URL}/posts/getBlogsById/${blog.id}`} /></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LatestBlogs;
