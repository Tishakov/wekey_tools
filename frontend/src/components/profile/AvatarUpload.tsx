import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import './AvatarUpload.css';

interface AvatarUploadProps {
  onAvatarUpdate?: (avatarUrl: string | null) => void;
  className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ onAvatarUpdate, className }) => {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Получаем полный URL аватара
  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:8880${avatarPath}`;
  };

  const currentAvatarUrl = getAvatarUrl(user?.avatar || null);

  // Валидация файла
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Неподдерживаемый тип файла. Разрешены только изображения (JPEG, PNG, GIF, WebP)';
    }

    if (file.size > maxSize) {
      return 'Файл слишком большой. Максимальный размер: 5MB';
    }

    return null;
  };

  // Создание превью изображения
  const createPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  // Загрузка аватара
  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiService.uploadAvatar(formData);
      
      if (response.success) {
        console.log('✅ Avatar upload successful:', response.data);
        
        // Обновляем контекст пользователя
        if (updateUser && response.data.user) {
          console.log('🔄 Updating user context with:', response.data.user);
          updateUser(response.data.user);
        } else {
          console.warn('⚠️ No user data returned or updateUser not available');
          // Альтернативно - обновляем только аватар в текущем пользователе
          if (updateUser && user) {
            updateUser({ ...user, avatar: response.data.avatar });
          }
        }
        
        // Уведомляем родительский компонент
        if (onAvatarUpdate) {
          onAvatarUpdate(response.data.avatar);
        }

        setPreview(null);
        setSelectedFile(null);
        alert('Аватар успешно обновлен!');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Ошибка при загрузке аватара');
      setPreview(null);
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Удаление аватара
  const deleteAvatar = async () => {
    if (!user?.avatar) return;
    
    if (!confirm('Вы уверены что хотите удалить аватар?')) return;

    setIsUploading(true);
    
    try {
      const response = await apiService.deleteAvatar();
      
      if (response.success) {
        // Обновляем контекст пользователя
        if (updateUser && response.data.user) {
          updateUser(response.data.user);
        }
        
        // Уведомляем родительский компонент
        if (onAvatarUpdate) {
          onAvatarUpdate(null);
        }

        alert('Аватар успешно удален!');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.message || 'Ошибка при удалении аватара');
    } finally {
      setIsUploading(false);
    }
  };

  // Обработка выбора файла
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    createPreview(file);
  }, []);

  // Обработка drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Обработка клика по input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Загрузка выбранного файла
  const handleUpload = () => {
    if (selectedFile) {
      uploadAvatar(selectedFile);
    }
  };

  // Отмена превью
  const handleCancelPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`avatar-upload ${className || ''}`}>
      <div className="avatar-upload__container">
        {/* Текущий аватар */}
        <div className="avatar-upload__current">
          {currentAvatarUrl ? (
            <img 
              src={currentAvatarUrl} 
              alt="Current avatar" 
              className="avatar-upload__current-image"
            />
          ) : (
            <div className="avatar-upload__placeholder">
              <span className="avatar-upload__placeholder-icon">👤</span>
            </div>
          )}
          
          {user?.avatar && (
            <button 
              onClick={deleteAvatar}
              disabled={isUploading}
              className="avatar-upload__delete-btn"
              title="Удалить аватар"
            >
              ✕
            </button>
          )}
        </div>

        {/* Превью нового изображения */}
        {preview && (
          <div className="avatar-upload__preview">
            <img 
              src={preview} 
              alt="Preview" 
              className="avatar-upload__preview-image"
            />
            <div className="avatar-upload__preview-actions">
              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="avatar-upload__btn avatar-upload__btn--primary"
              >
                {isUploading ? 'Загрузка...' : 'Сохранить'}
              </button>
              <button 
                onClick={handleCancelPreview}
                disabled={isUploading}
                className="avatar-upload__btn avatar-upload__btn--secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Зона загрузки - показываем только если нет превью */}
        {!preview && (
          <div 
            className={`avatar-upload__dropzone ${dragActive ? 'avatar-upload__dropzone--active' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="avatar-upload__dropzone-icon">📁</span>
            <span className="avatar-upload__dropzone-text">
              {user?.avatar ? 'Изменить фото' : 'Добавить фото'}
            </span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleInputChange}
          className="avatar-upload__input"
          style={{ display: 'none' }}
        />
      </div>

      {isUploading && (
        <div className="avatar-upload__loading">
          <div className="avatar-upload__spinner"></div>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;