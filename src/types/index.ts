export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'client' | 'consultant' | 'admin';
  accountStatus: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Consultant {
  _id: string;
  user: User;
  specialization: string;
  bio?: string;
  yearsExperience?: number;
  hourlyRate: number;
  averageRating: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  _id: string;
  consultantId: string;
  availableDate: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Appointment {
  _id: string;
  consultant: Consultant;
  client: User;
  appointmentDate: string;
  appointmentTime: string;
  sessionType: 'video_call' | 'chat' | 'other';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  appointmentId: string;
  client: User;
  consultantId: string;
  rating: number;
  reviewText?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalConsultants: number;
  totalBookings: number;
  revenue: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
