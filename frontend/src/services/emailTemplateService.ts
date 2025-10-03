import axios from 'axios';

const API_URL = 'http://localhost:8880/api/email-templates';

export interface EmailTemplateData {
  id?: number;
  name: string;
  description?: string;
  templateData: {
    sections: any[];
    globalStyles: any;
  };
  htmlOutput?: string;
  category?: string;
  isPublished?: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Получить все шаблоны
export const getTemplates = async (filters?: {
  category?: string;
  isPublished?: boolean;
  limit?: number;
  offset?: number;
}) => {
  const response = await axios.get(API_URL, {
    params: filters,
    withCredentials: true
  });
  return response.data;
};

// Получить шаблон по ID
export const getTemplateById = async (id: number) => {
  const response = await axios.get(`${API_URL}/${id}`, {
    withCredentials: true
  });
  return response.data;
};

// Создать новый шаблон
export const createTemplate = async (data: Omit<EmailTemplateData, 'id' | 'createdAt' | 'updatedAt'>) => {
  const response = await axios.post(API_URL, data, {
    withCredentials: true
  });
  return response.data;
};

// Обновить шаблон
export const updateTemplate = async (id: number, data: Partial<EmailTemplateData>) => {
  const response = await axios.put(`${API_URL}/${id}`, data, {
    withCredentials: true
  });
  return response.data;
};

// Удалить шаблон
export const deleteTemplate = async (id: number) => {
  const response = await axios.delete(`${API_URL}/${id}`, {
    withCredentials: true
  });
  return response.data;
};

// Дублировать шаблон
export const duplicateTemplate = async (id: number) => {
  const response = await axios.post(`${API_URL}/${id}/duplicate`, {}, {
    withCredentials: true
  });
  return response.data;
};
