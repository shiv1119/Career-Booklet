const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY;

export async function handelFollow(token: string | undefined, following_id: string): Promise<{ message: string }> {
  if (!token) {
    return { message: "User not authenticated" };
  }

  const url = new URL(`${API_GATEWAY_URL}`);
  url.searchParams.append("service", "profile_service");
  url.searchParams.append("path", "/api/follow/");
  url.searchParams.append("following_id", following_id);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      return { message: "Error Following" };
    }

    return await response.json();
  } catch {
    return { message: "Error following" };
  }
}

export const fetchFollowStatus = async (token: string | undefined, following_id: string) => {
    const url = new URL(`${API_GATEWAY_URL}`);
    url.searchParams.append("service", "profile_service");
    url.searchParams.append("path", "/api/check/follow/");
    url.searchParams.append("following_id", following_id);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${token}`,
      },
    });
  
    if (!res.ok) {
      console.log('Failed to fetch follow status');
    }
  
    const data = await res.json();
    return data;
  };

  export const fetchTotalFollowers = async (user_id: string) => {
    const url = new URL(`${API_GATEWAY_URL}`);
    url.searchParams.append("service", "profile_service");
    url.searchParams.append("path", "/api/get/user/follow/stats/");
    url.searchParams.append("user_id", user_id);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
  
    if (!res.ok) {
      console.log('Failed to fetch total followers');
    }

    const data = await res.json();
    return data;
  };
  