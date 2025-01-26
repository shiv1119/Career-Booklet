export const createProfile = async (formData: any, token: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:9002?service=profile_service&path=/api/profile/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });
  
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Failed to create profile');
      }
  
      return result;
  
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

export const getProfile = async (token: string) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APIGATEWAY_SERVICES}?service=profile_service&path=/api/profile/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.detail || 'Failed to retrieve profile');
            }
            return result;
            } catch (error) {
                console.error('Error getting profile:', error);
                throw error;
    }
};


export const updateProfile = async (formData: any, token: string) => {
  try {
    const response = await fetch(`http://127.0.0.1:9002?service=profile_service&path=/api/profile/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || 'Failed to update profile');
    }
    return result;

  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

export const updateProfileImage = async (profileImage: any, token: string) => {
  const formData = new FormData();
  formData.append("profile_image",profileImage);
  try{
    const response = await fetch(`http://127.0.0.1:9002?service=profile_service&path=/api/update-profile-image/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    const result = await response.json();
    if(!response.ok){
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update profile image");
    }
    return result;
  } catch(error){
    console.error('Error Updating Profile Pic.',error);
    throw error;
  }
};

export const updateBackgroundImage = async (backgroundImage: any, token: string) => {
  const formData = new FormData();
  formData.append("profile_background_image",backgroundImage);
  try{
    const response = await fetch(`http://127.0.0.1:9002?service=profile_service&path=/api/update-background-image/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    const result = await response.json();
    if(!response.ok){
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update profile image");
    }
    return result;
  } catch(error){
    console.error('Error Updating Profile Pic.',error);
    throw error;
  }
};

export const getAbout = async (token: string) => {
  try{
    const response = await fetch(`http://127.0.0.1:9002?service=profile_service&path=/api/profile/about/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if(!response.ok){
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get about");
    }
    return result;
  }catch(error){
    console.error('Error Getting About.',error);
    throw error;
  }
};

export const createAbout = async (token: string, formData: any) => {
  try{
    const response = await fetch(`http://127.0.0.1:9002?services=profile_services&path=/api/profile/about/`,{
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    const result = await response.json();
    if(!response.ok){
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create about");
  }
  return result;
  }catch(error){
    console.error('Error Creating About.',error);
    throw error;
  }
}

export const updateAbout = async (token: string, formData: any) => {
  try{
    const response = await fetch(`http://127.0.0.1:9002?services=profile_service&path=/api/profile/about/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    const result = await response.json();
    if(!response.ok){
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update about");
    }
    return result;
  } catch(error) {
    console.error('Error Updating About.', error);
    throw error;
  }
}