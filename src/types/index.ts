export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'cook' | 'admin';
  phone?: string;
}

export interface Cook {
  _id: string;
  userId?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  name: string;
  bio?: string;
  specialties?: string[]; // e.g., ['Diabetic-friendly', 'Low-sodium', 'Gluten-free']
  cuisineTypes?: string[]; // e.g., ['North Indian', 'South Indian', 'Chinese']
  availability?: {
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
    timeSlots?: string; // e.g., "11 AM - 2 PM, 7 PM - 9 PM"
  };
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
    pincode?: string;
    neighborhood: string;
    address?: string;
  };
  kitchenImageUrls: string[];
  upiId?: string;
  averageRating: number;
  ratingCount: number;
  activeMeals?: Meal[];
  topRatedMeal?: Meal & {
    averageRating: number;
    ratingCount: number;
  } | null;
  distance?: number; // In kilometers, calculated from user's location
  createdAt?: string;
}

export interface Meal {
  _id?: string;
  cookId?: string | Cook;
  name: string;
  description?: string;
  image?: string;
  price: number;
  calories?: number;
  quantityAvailable?: number;
  isAvailable?: boolean;
  category?: string;
  tags?: string[];
  createdAt?: string;
}

export interface Order {
  _id: string;
  userId: string;
  cookId: string;
  mealId: string | Meal;
  quantity?: number;
  totalPrice?: number;
  status: 'Placed' | 'Completed' | 'Cancelled';
  rating?: number;
  reviewText?: string;
  createdAt: string;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface MealRevenueData {
  mealName: string;
  revenue: number;
  orders: number;
  avgPrice: number;
}