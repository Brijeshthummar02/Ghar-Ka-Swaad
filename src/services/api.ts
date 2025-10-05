import { Cook, Meal, Order, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Auth API
export const authApi = {
  register: async (userData: { name: string; email: string; password: string; phone: string }): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    return response.json();
  },
  
  registerCook: async (userData: { 
    name: string; 
    email: string; 
    password: string; 
    phone: string;
    // location removed — optional/handled server-side
    [key: string]: any;
  }): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/register-cook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Cook registration failed');
    }
    
    return response.json();
  },
  
  login: async (credentials: { email: string; password: string }): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid credentials');
    }
    
    return response.json();
  },
};

// Cooks API
export const cooksApi = {
  register: async (formData: FormData): Promise<{ user: User; cook: Cook }> => {
    const response = await fetch(`${API_URL}/cooks/register`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Cook registration failed');
    }
    
    return response.json();
  },
  
  update: async (cookId: string, cookData: Partial<Cook>): Promise<Cook> => {
    const response = await fetch(`${API_URL}/cooks/${cookId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cookData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update cook profile');
    }
    
    return response.json();
  },

  getAll: async (): Promise<Cook[]> => {
    try {
      const response = await fetch(`${API_URL}/cooks`);
      
      if (!response.ok) {
        console.error('Server error fetching cooks:', await response.text());
        throw new Error(`Failed to fetch all cooks: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Network or parsing error:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },
  
  getNearby: async (lat: number, lng: number, maxDistance: number = 5): Promise<Cook[]> => {
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      maxDistance: maxDistance.toString()
    });
    
    const response = await fetch(`${API_URL}/cooks/nearby?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch nearby cooks');
    }
    
    return response.json();
  },
  
  getByPincode: async (pincode: string): Promise<Cook[]> => {
    const response = await fetch(`${API_URL}/cooks/pincode/${pincode}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch cooks by pincode');
    }
    
    return response.json();
  },
  
  getByLocation: async (params: { lat?: number; lon?: number; pincode?: string }): Promise<Cook[]> => {
    const queryParams = new URLSearchParams();
    if (params.lat && params.lon) {
      queryParams.append('lat', params.lat.toString());
      queryParams.append('lon', params.lon.toString());
    } else if (params.pincode) {
      queryParams.append('pincode', params.pincode);
    }
    
    const response = await fetch(`${API_URL}/cooks?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch cooks');
    }
    
    return response.json();
  },
  
  getById: async (cookId: string): Promise<Cook> => {
    const response = await fetch(`${API_URL}/cooks/${cookId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch cook details');
    }
    
    return response.json();
  },
};

// Meals API
export const mealsApi = {
  create: async (formData: FormData): Promise<Meal> => {
    const response = await fetch(`${API_URL}/meals`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to create meal');
    }
    
    return response.json();
  },
  
  getByCookId: async (cookId: string): Promise<Meal[]> => {
    const response = await fetch(`${API_URL}/meals/${cookId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch meals');
    }
    
    return response.json();
  },

  getAll: async (): Promise<Meal[]> => {
    try {
      const response = await fetch(`${API_URL}/meals`);
      
      if (!response.ok) {
        console.error('Server error fetching meals:', await response.text());
        throw new Error(`Failed to fetch all meals: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Network or parsing error:', error);
      return [];
    }
  },
};

// Orders API
export const ordersApi = {
  create: async (orderData: { userId: string; cookId: string; mealId: string }): Promise<Order> => {
    try {
      // Validate the data before sending
      if (!orderData.userId || !orderData.cookId || !orderData.mealId) {
        console.error('Invalid order data:', orderData);
        throw new Error('Missing required fields in order data');
      }
      
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error (${response.status}):`, errorText);
        throw new Error(`Failed to create order: ${response.status} ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  },
  
  rateOrder: async (orderId: string, ratingData: { rating: number; reviewText?: string }): Promise<Order> => {
    const response = await fetch(`${API_URL}/orders/${orderId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ratingData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to rate order');
    }
    
    return response.json();
  },
  
  getByUserId: async (userId: string): Promise<Order[]> => {
    const response = await fetch(`${API_URL}/orders/user/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    return response.json();
  },
  
  getByCookId: async (cookId: string): Promise<Order[]> => {
    const response = await fetch(`${API_URL}/orders/cook/${cookId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch cook orders');
    }
    
    return response.json();
  },
  
  updateStatus: async (orderId: string, status: string): Promise<Order> => {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    
    return response.json();
  },
};