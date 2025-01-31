'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BlogCreateData, Category, Subcategory } from '@/types';
import { createBlog, fetchCategories } from '@/app/api/blogs_services/route';
import TextEditor from '@/components/blogs_components/TextEditor';

const CreatePostForm = () => {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'others'>();
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | 'others'>();
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchCategories();
      setCategories(data);
    };

    loadCategories();
  }, []);
  const getSubcategories = (): Subcategory[] => {
    const category = categories.find(cat => cat.id === selectedCategory);
    return category ? category.subcategories : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage("User not authenticated");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const blogData: BlogCreateData = {
      title,
      content,
      status,
      category_id: selectedCategory !== 'others' ? selectedCategory : undefined,
      subcategory_id: selectedSubcategory !== 'others' ? selectedSubcategory : undefined,
      new_category: selectedCategory === 'others' ? newCategory : undefined,
      new_subcategory: selectedSubcategory === 'others' ? newSubcategory : undefined,
      tags,
    };

    try {
      await createBlog(token, blogData);
      setSuccessMessage("Blog created successfully!");
      router.push('/posts/latest-blogs');
    } catch (error) {
      setErrorMessage("Failed to create blog: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900">
      <h2 className="text-2xl font-semibold mb-4 text-center text-gray-900 dark:text-white">
        Create a New Blog
      </h2>

      {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
      {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-300">Content</label>
          <TextEditor value={content} onChange={setContent} />
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-300">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              const value = e.target.value === "others" ? "others" : Number(e.target.value);
              setSelectedCategory(value);
              setSelectedSubcategory(undefined);
            }}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
            <option value="others">Others</option>
          </select>

          {selectedCategory === 'others' && (
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter new category"
              className="mt-2 block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-300">Subcategory</label>
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value === "others" ? "others" : Number(e.target.value))}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
          >
            <option value="">Select Subcategory</option>
            {getSubcategories().map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
            <option value="others">Others</option>
          </select>

          {selectedSubcategory === 'others' && (
            <input
              type="text"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              placeholder="Enter new subcategory"
              className="mt-2 block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
            />
          )}
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-800 dark:text-gray-300">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
          >
            <option value="">Select Status</option>
            <option value="draft">Draft</option>
            <option value="published">Publish</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white font-semibold rounded-md shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          {isLoading ? 'Creating...' : 'Create Blog'}
        </button>
      </form>
    </div>
  );
};

export default CreatePostForm;
