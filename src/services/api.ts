import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('apex_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('apex_token');
      localStorage.removeItem('apex_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data: Record<string, unknown>) => API.post('/auth/register', data);
export const loginUser = (data: { email: string; password: string }) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Advisors (public listing)
export const getAdvisors = (params?: { query?: string; industry?: string }) =>
  API.get('/advisors', { params });
export const getAdvisorById = (id: string) => API.get(`/advisors/${id}`);
export const getAdvisorAvailability = (id: string) => API.get(`/advisors/${id}/availability`);

// Consultant self-management (authenticated)
export const getMyConsultantProfile = () => API.get('/consultants/me');
export const updateMyConsultantProfile = (data: Record<string, unknown>) =>
  API.patch('/consultants/me', data);
export const getMyAvailability = () => API.get('/consultants/me/availability');
export const addMyAvailability = (slots: { availableDate: string; startTime: string; endTime: string }[]) =>
  API.post('/consultants/me/availability', { slots });
export const deleteMyAvailability = (slotId: string) =>
  API.delete(`/consultants/me/availability/${slotId}`);

// Appointments
export const createAppointment = (data: Record<string, unknown>) => API.post('/appointments', data);
export const getMyAppointments = () => API.get('/appointments/mine');
export const getAppointmentById = (id: string) => API.get(`/appointments/${id}`);
export const updateAppointmentStatus = (id: string, status: string) =>
  API.patch(`/appointments/${id}/status`, { status });

// Reviews
export const createReview = (data: Record<string, unknown>) => API.post('/reviews', data);
export const getConsultantReviews = (consultantId: string) =>
  API.get(`/reviews/consultant/${consultantId}`);

// Admin
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminUsers = () => API.get('/admin/users');
export const updateUserStatus = (id: string, status: string) =>
  API.patch(`/admin/users/${id}/status`, { status });
export const getAdminConsultants = () => API.get('/admin/consultants');
export const updateConsultantStatus = (id: string, status: string) =>
  API.patch(`/admin/consultants/${id}/status`, { status });
export const getAdminSessions = () => API.get('/admin/sessions');

// Contact
export const submitContactForm = (data: { name: string; email: string; subject: string; message: string }) =>
  API.post('/contact', data);

// Plans
export const getPlans = () => API.get('/plans');
export const subscribeToPlan = (planId: string) => API.post('/plans/subscribe', { planId });
export const getMyPlanUsage = () => API.get('/plans/my-usage');

export default API;
