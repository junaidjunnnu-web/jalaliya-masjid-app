import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://jalaliya-masjid-backend.onrender.com/api';

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn('⚠️ EXPO_PUBLIC_API_URL not set, using fallback:', API_URL);
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`API Request: ${options.method || 'GET'} ${API_URL}${endpoint}`);
    if (options.body) {
      console.log('Request body:', options.body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    console.log(`API Response: ${response.status}`, data);

    if (!response.ok) {
      console.error('API Error:', data.error);
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    console.error('Network error:', error);
    return { error: 'Network error' };
  }
}

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync('token', token);
  } catch (error) {
    console.error('Error setting token:', error);
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync('token');
  } catch (error) {
    console.error('Error clearing token:', error);
  }
}

export const api = {
  auth: {
    login: (phone: string, pin: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, pin }),
      }),
    register: (data: any) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request('/auth/me'),
  },
  families: {
    getAll: (params?: string) => request(`/families${params ? `?${params}` : ''}`),
    getPlaces: () => request('/families/places'),
    getById: (id: number) => request(`/families/${id}`),
    create: (data: any) =>
      request('/families', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request(`/families/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    approve: (id: number) =>
      request(`/families/${id}/approve`, {
        method: 'PATCH',
      }),
    addMember: (familyId: number, data: any) =>
      request(`/families/${familyId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateMember: (familyId: number, memberId: number, data: any) =>
      request(`/families/${familyId}/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteMember: (familyId: number, memberId: number) =>
      request(`/families/${familyId}/members/${memberId}`, {
        method: 'DELETE',
      }),
  },
  committee: {
    getAll: () => request('/committee'),
    getById: (id: number) => request(`/committee/${id}`),
    getByPhone: (phone: string) => request(`/committee/by-phone/${phone}`),
    login: (phone: string, pin: string) =>
      request('/committee/login', {
        method: 'POST',
        body: JSON.stringify({ phone, pin }),
      }),
    setPin: (phone: string, pin: string) =>
      request('/committee/set-pin', {
        method: 'POST',
        body: JSON.stringify({ phone, pin }),
      }),
    create: (data: any) =>
      request('/committee', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request(`/committee/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request(`/committee/${id}`, {
        method: 'DELETE',
      }),
  },
  madrasa: {
    getUstads: () => request('/madrasa/ustads'),
    verifyPin: (pin: string) =>
      request('/madrasa/ustads/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      }),
    createUstad: (data: any) =>
      request('/madrasa/ustads', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateUstad: (id: number, data: any) =>
      request(`/madrasa/ustads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteUstad: (id: number, pin: string) =>
      request(`/madrasa/ustads/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ pin }),
      }),
    getStudents: (params?: string) => request(`/madrasa/students${params ? `?${params}` : ''}`),
    searchStudents: (query: string) => request(`/madrasa/students/search?q=${encodeURIComponent(query)}`),
    getStudent: (id: number) => request(`/madrasa/students/${id}`),
    createStudent: (data: any) =>
      request('/madrasa/students', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStudent: (id: number, data: any) =>
      request(`/madrasa/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteStudent: (id: number, pin: string) =>
      request(`/madrasa/students/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ pin }),
      }),
    markAttendance: (data: any) =>
      request('/madrasa/attendance', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAttendance: (params?: string) => request(`/madrasa/attendance${params ? `?${params}` : ''}`),
  },
  namaz: {
    getTimings: () => request('/namaz'),
    getHistory: () => request('/namaz/history'),
    createTimings: (data: any) =>
      request('/namaz', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTimings: (id: number, data: any) =>
      request(`/namaz/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  dues: {
    getAll: () => request('/dues'),
    getPending: () => request('/dues/pending'),
    getHistory: (personName: string) => request(`/dues/history/${encodeURIComponent(personName)}`),
    addPerson: (data: any) =>
      request('/dues', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    submitPayment: (data: any) =>
      request('/dues/payment', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    submitBalanceEdit: (data: any) =>
      request('/dues/balance-edit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approve: (id: number, committeeMemberId: number) =>
      request(`/dues/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ committeeMemberId }),
      }),
    reject: (id: number) =>
      request(`/dues/${id}/reject`, {
        method: 'POST',
      }),
    deletePerson: (personName: string, phone?: string) =>
      request(`/dues/${encodeURIComponent(personName)}${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`, {
        method: 'DELETE',
      }),
  },
  announcements: {
    getAll: () => request('/announcements'),
    getById: (id: number) => request(`/announcements/${id}`),
    create: (data: any) =>
      request('/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request(`/announcements/${id}`, {
        method: 'DELETE',
      }),
  },
  events: {
    getAll: (params?: string) => request(`/events${params ? `?${params}` : ''}`),
    getById: (id: number) => request(`/events/${id}`),
    create: (data: any) =>
      request('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request(`/events/${id}`, {
        method: 'DELETE',
      }),
  },
  gallery: {
    getAll: (params?: string) => request(`/gallery${params ? `?${params}` : ''}`),
    getById: (id: number) => request(`/gallery/${id}`),
    upload: (data: any) =>
      request('/gallery', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request(`/gallery/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request(`/gallery/${id}`, {
        method: 'DELETE',
      }),
  },
  collections: {
    getAll: (params?: string) => request(`/collections${params ? `?${params}` : ''}`),
    getById: (id: number) => request(`/collections/${id}`),
    create: (data: any) =>
      request('/collections', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request(`/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request(`/collections/${id}`, {
        method: 'DELETE',
      }),
    getSummary: (params?: string) => request(`/collections/summary/total${params ? `?${params}` : ''}`),
  },
  expenses: {
    getAll: (params?: string) => request(`/expenses${params ? `?${params}` : ''}`),
    getById: (id: number) => request(`/expenses/${id}`),
    create: (data: any) =>
      request('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      request(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request(`/expenses/${id}`, {
        method: 'DELETE',
      }),
    getSummary: (params?: string) => request(`/expenses/summary/total${params ? `?${params}` : ''}`),
  },
  fees: {
    getByFamily: (familyId: number) => request(`/fees/family/${familyId}`),
    getByMonth: (month: string) => request(`/fees/month/${month}`),
    getSummary: (month: string) => request(`/fees/summary/${month}`),
    generate: (month: string) =>
      request(`/fees/generate/${month}`, {
        method: 'POST',
      }),
    updatePayment: (id: number, data: any) =>
      request(`/fees/${id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
};
