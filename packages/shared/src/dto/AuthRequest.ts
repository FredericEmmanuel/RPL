export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  schoolOrUniversity?: string;
  favoriteSubjects?: string[];
  preferredLocation?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: import("../models/User").User;
}

export interface UpdateProfileRequest {
  schoolOrUniversity: string;
  favoriteSubjects: string[];
  preferredLocation: string;
}
