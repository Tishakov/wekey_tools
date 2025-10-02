import { useState, useCallback } from 'react';
import { api } from '../utils/api';

export interface EmailVariable {
  id: number;
  key: string;
  description: string;
  example: string;
  category: 'user' | 'system' | 'custom';
}

export interface GroupedVariables {
  [category: string]: EmailVariable[];
}

export const useEmailVariables = () => {
  const [variables, setVariables] = useState<EmailVariable[]>([]);
  const [grouped, setGrouped] = useState<GroupedVariables>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузить все переменные
  const fetchVariables = useCallback(async (category?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = category ? `?category=${category}` : '';
      const response = await api.get(`/email-variables${params}`);
      
      if (response.success) {
        setVariables(response.variables || []);
        setGrouped(response.grouped || {});
      } else {
        setError(response.error || 'Ошибка загрузки переменных');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки переменных');
      console.error('Error fetching email variables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Получить одну переменную
  const getVariable = useCallback(async (id: number) => {
    try {
      const response = await api.get(`/email-variables/${id}`);
      return response.success ? response.variable : null;
    } catch (err: any) {
      console.error('Error fetching variable:', err);
      return null;
    }
  }, []);

  // Создать новую переменную
  const createVariable = useCallback(async (data: {
    key: string;
    description: string;
    example?: string;
    category?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/email-variables', data);
      
      if (response.success) {
        await fetchVariables();
        return response.variable;
      } else {
        setError(response.error || 'Ошибка создания переменной');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка создания переменной');
      console.error('Error creating variable:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchVariables]);

  // Обновить переменную
  const updateVariable = useCallback(async (id: number, data: {
    description?: string;
    example?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/email-variables/${id}`, data);
      
      if (response.success) {
        await fetchVariables();
        return response.variable;
      } else {
        setError(response.error || 'Ошибка обновления переменной');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления переменной');
      console.error('Error updating variable:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchVariables]);

  // Удалить переменную
  const deleteVariable = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/email-variables/${id}`);
      
      if (response.success) {
        await fetchVariables();
        return true;
      } else {
        setError(response.error || 'Ошибка удаления переменной');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления переменной');
      console.error('Error deleting variable:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchVariables]);

  // Парсить переменные из текста
  const parseVariables = useCallback((text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }

    return matches;
  }, []);

  // Заменить переменные на примеры
  const replaceWithExamples = useCallback((text: string): string => {
    if (variables.length === 0) return text;

    let result = text;
    variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
      result = result.replace(regex, variable.example || `{{${variable.key}}}`);
    });

    return result;
  }, [variables]);

  // Заменить переменные на реальные значения
  const replaceWithValues = useCallback((
    text: string, 
    userData: Record<string, string>
  ): string => {
    if (variables.length === 0) return text;

    let result = text;
    variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
      const value = userData[variable.key] || variable.example || `{{${variable.key}}}`;
      result = result.replace(regex, value);
    });

    return result;
  }, [variables]);

  // Получить список используемых переменных
  const getUsedVariables = useCallback((text: string): EmailVariable[] => {
    const usedKeys = parseVariables(text);
    return variables.filter(v => usedKeys.includes(v.key));
  }, [parseVariables, variables]);

  // ❌ ОТКЛЮЧЕНА автозагрузка при монтировании - вызывала logout!
  // Переменные загружаются только при явном вызове fetchVariables()
  // useEffect(() => {
  //   fetchVariables();
  // }, [fetchVariables]);

  return {
    variables,
    grouped,
    loading,
    error,
    fetchVariables,
    getVariable,
    createVariable,
    updateVariable,
    deleteVariable,
    parseVariables,
    replaceWithExamples,
    replaceWithValues,
    getUsedVariables
  };
};
