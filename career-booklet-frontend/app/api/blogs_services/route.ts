import { BlogResponse, BlogCreateData, Category, Tag, FetchOptions } from "@/types";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY;

export async function getLatestBlogs(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    category_id?: number;
    subcategory_id?: number;
    author?: string;
    tag_ids?: number[];
    min_views?: number;
    start_date?: string;
    end_date?: string;
  }
): Promise<BlogResponse[]> {
  const queryParams = new URLSearchParams({
    service: "blogs_services",
    path: "/api/blogs/latest-blogs/",
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((val) => queryParams.append(key, val.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }

  const url = `${API_GATEWAY_URL}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch {
    return [];
  }
}

export async function createBlog(token: string, blogData: BlogCreateData): Promise<{ message: string }> {
  if (!token) {
    return { message: "User not authenticated" };
  }

  const url = new URL(`${API_GATEWAY_URL}`);
  url.searchParams.append("service", "blogs_services");
  url.searchParams.append("path", "/api/blogs/");

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(blogData),
    });

    if (!response.ok) {
      return { message: "Error creating blog" };
    }

    return await response.json();
  } catch {
    return { message: "Error creating blog" };
  }
}

export const fetchCategories = async (): Promise<Category[]> => {
  const url = new URL(`${API_GATEWAY_URL}`);
  url.searchParams.append("service", "blogs_services");
  url.searchParams.append("path", "/api/blogs/categories/");

  try {
    const response = await fetch(`${url}`);
    if (!response.ok) {
      return [];
    }
    return response.json();
  } catch {
    return [];
  }
};

export async function getBlogById(blogId: number): Promise<BlogResponse> {
  const queryParams = new URLSearchParams({
    service: "blogs_services",
    path: `/api/blogs/by_id/`,
    blog_id: blogId.toString(),
  });

  const url = `${API_GATEWAY_URL}?${queryParams.toString()}`;

  try {
    await incrementView(blogId);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {} as BlogResponse;
    }
    const data: BlogResponse = await response.json();
    return data;
  } catch {
    return {} as BlogResponse;
  }
}

async function incrementView(blogId: number) {
  const queryParams = new URLSearchParams({
    service: "blogs_services",
    path: "/api/blogs/by_id/increment-view/",
    blog_id: blogId.toString(),
  });

  const url = `${API_GATEWAY_URL}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
    }
  } catch {
  }
}

export async function fetchTags(): Promise<Tag[]> {
  const queryParams = new URLSearchParams({
    service: "blogs_services",
    path: "/api/tags/",
  });

  const url = `${API_GATEWAY_URL}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`Warning: Failed to fetch tags. Status: ${response.status} - ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn("Warning: Invalid response format for tags");
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}


export async function getTrendingBlogs(
  days: number = 7,
  limit: number = 10,
  skip: number = 0,
  filters?: {
    category_id?: number;
    subcategory_id?: number;
    author?: string;
    tag_ids?: number[];
    search?: string;
  }
): Promise<BlogResponse[]> {
  const queryParams = new URLSearchParams({
    service: "blogs_services",
    path: "/api/blogs/trending/",
    days: days.toString(),
    limit: limit.toString(),
    skip: skip.toString(),
  });

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((val) => queryParams.append(key, val.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }

  const url = `${API_GATEWAY_URL}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch {
    return [];
  }
}

export async function fetchUserViews({ token, queryParams }: FetchOptions) {
  const queryString = new URLSearchParams({
    service: "blogs_services",
    path: "/api/blogs/user/views/",
    ...(queryParams || {}),
  }).toString();

  const url = `${API_GATEWAY_URL}?${queryString}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching user views:", error);
    throw error;
  }
}
