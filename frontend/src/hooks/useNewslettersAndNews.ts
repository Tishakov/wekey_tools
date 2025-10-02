import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const API_BASE_URL = 'http://localhost:8880/api';

// Hook для работы с рассылками
export const useNewsletters = () => {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Получить все рассылки
  const fetchNewsletters = async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, params[key]);
        }
      });

      const data = await api.get(`/newsletters?${searchParams}`);
      
      setNewsletters(data.newsletters || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err: any) {
      console.error('Error fetching newsletters:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Создать рассылку
  const createNewsletter = async (newsletterData: any) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔵 API Call: Creating newsletter', newsletterData);
      
      const newNewsletter = await api.post('/newsletters', newsletterData);
      
      console.log('✅ Newsletter created successfully:', newNewsletter);
      
      setNewsletters((prev: any) => [newNewsletter, ...prev]);
      return newNewsletter;
    } catch (err: any) {
      console.error('Error creating newsletter:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Получить конкретную рассылку
  const getNewsletter = async (id) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔵 API Call: Getting newsletter', id);
      
      const newsletter = await api.get(`/newsletters/${id}`);
      
      console.log('✅ Newsletter fetched successfully:', newsletter);
      
      return newsletter;
    } catch (err: any) {
      console.error('Error fetching newsletter:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Обновить рассылку
  const updateNewsletter = async (id: any, updates: any) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔵 API Call: Updating newsletter', id, updates);
      
      const updatedNewsletter = await api.put(`/newsletters/${id}`, updates);
      
      console.log('✅ Newsletter updated successfully:', updatedNewsletter);
      
      setNewsletters((prev: any) => 
        prev.map((newsletter: any) => 
          newsletter.id === id ? updatedNewsletter : newsletter
        )
      );
      return updatedNewsletter;
    } catch (err: any) {
      console.error('Error updating newsletter:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Удалить рассылку
  const deleteNewsletter = async (id: any) => {
    setLoading(true);
    setError(null);

    try {
      await api.delete(`/newsletters/${id}`);
      
      setNewsletters((prev: any) => prev.filter((newsletter: any) => newsletter.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting newsletter:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Предварительный просмотр аудитории
  const previewAudience = async (targetAudience: any, segmentCriteria: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.post('/newsletters/audience/preview', { targetAudience, segmentCriteria });
      return result;
    } catch (err: any) {
      console.error('Error previewing audience:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Отправить рассылку
  const sendNewsletter = async (id: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.post(`/newsletters/${id}/send`, {});
      
      // Обновляем рассылку в списке
      setNewsletters((prev: any) => 
        prev.map((newsletter: any) => 
          newsletter.id === id 
            ? { ...newsletter, status: 'sent', sentAt: new Date().toISOString() }
            : newsletter
        )
      );

      return result;
    } catch (err: any) {
      console.error('Error sending newsletter:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Получить статистику рассылки
  const getNewsletterStats = async (id: any) => {
    try {
      const stats = await api.get(`/newsletters/${id}/stats`);
      return stats;
    } catch (err: any) {
      console.error('Error fetching newsletter stats:', err);
      throw err;
    }
  };

  return {
    newsletters,
    loading,
    error,
    totalCount,
    totalPages,
    fetchNewsletters,
    createNewsletter,
    getNewsletter,
    updateNewsletter,
    deleteNewsletter,
    previewAudience,
    sendNewsletter,
    getNewsletterStats
  };
};

// Hook для работы с новостями
export const useNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Получить все новости
  const fetchNews = async (params = {}) => {
    // Проверяем токен сразу - если его нет, не делаем запрос
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setError('Необходима авторизация');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/news?${searchParams}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setNews(data.news || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Создать новость
  const createNews = async (newsData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/news`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newsData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания новости');
      }

      const newNews = await response.json();
      setNews(prev => [newNews, ...prev]);
      return newNews;
    } catch (err) {
      console.error('Error creating news:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Получить конкретную новость
  const getNewsItem = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/news/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Обновить новость
  const updateNews = async (id, updates) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/news/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка обновления новости');
      }

      const updatedNews = await response.json();
      setNews(prev => 
        prev.map(newsItem => 
          newsItem.id === id ? updatedNews : newsItem
        )
      );
      return updatedNews;
    } catch (err) {
      console.error('Error updating news:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Удалить новость
  const deleteNews = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/news/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка удаления новости');
      }

      setNews(prev => prev.filter(newsItem => newsItem.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting news:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Опубликовать новость
  const publishNews = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/news/${id}/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка публикации новости');
      }

      const publishedNews = await response.json();
      setNews(prev => 
        prev.map(newsItem => 
          newsItem.id === id ? publishedNews : newsItem
        )
      );
      return publishedNews;
    } catch (err) {
      console.error('Error publishing news:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Архивировать новость
  const archiveNews = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/news/${id}/archive`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка архивирования новости');
      }

      const archivedNews = await response.json();
      setNews(prev => 
        prev.map(newsItem => 
          newsItem.id === id ? archivedNews : newsItem
        )
      );
      return archivedNews;
    } catch (err) {
      console.error('Error archiving news:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Загрузить изображение
  const uploadImage = async (file) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/news/upload/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки изображения');
      }

      return await response.json();
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Получить непрочитанные новости
  const getUnreadNews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/news/unread`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching unread news:', err);
      throw err;
    }
  };

  // Отметить как прочитанное
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/news/${id}/read`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error marking news as read:', err);
      throw err;
    }
  };

  return {
    news,
    loading,
    error,
    totalCount,
    totalPages,
    fetchNews,
    createNews,
    getNewsItem,
    updateNews,
    deleteNews,
    publishNews,
    archiveNews,
    uploadImage,
    getUnreadNews,
    markAsRead
  };
};