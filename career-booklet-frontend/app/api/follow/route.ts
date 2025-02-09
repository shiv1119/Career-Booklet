const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY;
e
xport async function createBlog(token: string, blogData: BlogCreateData): Promise<{ message: string }> {
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