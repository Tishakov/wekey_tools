import React, { useState, useRef, useEffect } from 'react';
import './DateRangePicker.css';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface DateRangePickerProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedRange,
  onRangeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(selectedRange.startDate);
  const [tempEndDate, setTempEndDate] = useState(selectedRange.endDate);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Предустановленные диапазоны
  const presets = [
    {
      label: 'Сегодня',
      getValue: () => {
        const today = new Date();
        return { startDate: today, endDate: today };
      }
    },
    {
      label: 'Вчера',
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return { startDate: yesterday, endDate: yesterday };
      }
    },
    {
      label: 'Последние 7 дней',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return { startDate: start, endDate: end };
      }
    },
    {
      label: 'Последние 30 дней',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return { startDate: start, endDate: end };
      }
    },
    {
      label: 'Эта неделя',
      getValue: () => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() + 1); // Понедельник
        return { startDate: start, endDate: today };
      }
    },
    {
      label: 'Этот месяц',
      getValue: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: start, endDate: today };
      }
    }
  ];

  // Закрытие по клику вне элемента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    const newRange = {
      ...range,
      label: preset.label
    };
    onRangeChange(newRange);
    setTempStartDate(range.startDate);
    setTempEndDate(range.endDate);
    setIsOpen(false);
  };

  const handleApply = () => {
    if (tempStartDate && tempEndDate) {
      const label = tempStartDate.getTime() === tempEndDate.getTime() 
        ? formatDate(tempStartDate)
        : `${formatDate(tempStartDate)} - ${formatDate(tempEndDate)}`;
      
      onRangeChange({
        startDate: tempStartDate,
        endDate: tempEndDate,
        label
      });
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(selectedRange.startDate);
    setTempEndDate(selectedRange.endDate);
    setIsOpen(false);
  };

  return (
    <div className="date-range-picker" ref={dropdownRef}>
      <button 
        className="date-range-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="date-range-icon">📅</span>
        <span className="date-range-text">{selectedRange.label}</span>
        <span className="date-range-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="date-range-dropdown">
          <div className="date-range-content">
            {/* Левая панель с пресетами */}
            <div className="date-range-presets">
              <h4>Быстрый выбор</h4>
              {presets.map((preset, index) => (
                <button
                  key={index}
                  className="preset-button"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Правая панель с календарями */}
            <div className="date-range-calendars">
              <div className="calendar-inputs">
                <div className="input-group">
                  <label>От:</label>
                  <div className="calendar-widget">
                    <input
                      type="date"
                      value={formatDateForInput(tempStartDate)}
                      onChange={(e) => setTempStartDate(new Date(e.target.value))}
                      max={formatDateForInput(tempEndDate)}
                    />
                    <div className="calendar-display">
                      📅 {formatDate(tempStartDate)}
                    </div>
                  </div>
                </div>
                <div className="input-group">
                  <label>До:</label>
                  <div className="calendar-widget">
                    <input
                      type="date"
                      value={formatDateForInput(tempEndDate)}
                      onChange={(e) => setTempEndDate(new Date(e.target.value))}
                      min={formatDateForInput(tempStartDate)}
                    />
                    <div className="calendar-display">
                      📅 {formatDate(tempEndDate)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="calendar-actions">
                <button className="cancel-button" onClick={handleCancel}>
                  Отмена
                </button>
                <button className="apply-button" onClick={handleApply}>
                  Применить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;