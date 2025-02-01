export const createProfile = async (formData: any, token: any) => {
    try {
      const response = await fetch(`http://127.0.0.1:9002?service=profile_service&path=/api/profile/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });
      return response;
  
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

export const getProfile = async (token: any) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APIGATEWAY_SERVICES}?service=profile_service&path=/api/profile/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        return response;
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
    return response;


  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

export const updateProfileImage = async (profileImage: any, token: any) => {
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
    return response;

  } catch(error){
    console.error('Error Updating Profile Pic.',error);
    throw error;
  }
};

export const updateBackgroundImage = async (backgroundImage: any, token: any) => {
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
    return response;

  } catch(error){
    console.error('Error Updating Profile Pic.',error);
    throw error;
  }
};

export const getAbout = async (token: any) => {
  try{
    const response = await fetch(`http://127.0.0.1:9002?service=profile_service&path=/api/profile/about/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response;

  }catch(error){
    console.error('Error Getting About.',error);
    throw error;
  }
};

export const createAbout = async (token: any, formData: any) => {
  try{
    const response = await fetch(`http://127.0.0.1:9002?services=profile_services&path=/api/profile/about/`,{
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return response;

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
    return response;
  } catch(error) {
    console.error('Error Updating About.', error);
    throw error;
  }
}