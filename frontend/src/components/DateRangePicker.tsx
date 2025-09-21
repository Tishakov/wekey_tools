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
  const [tempStartDate, setTempStartDate] = useState<Date | null>(selectedRange.startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(selectedRange.endDate);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
      label: 'Эта неделя',
      getValue: () => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() + 1); // Понедельник
        return { startDate: start, endDate: today };
      }
    },
    {
      label: 'Последние 3 дня',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 2);
        return { startDate: start, endDate: end };
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
      label: 'Последние 14 дней',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 13);
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
      label: 'Этот месяц',
      getValue: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: start, endDate: today };
      }
    },
    {
      label: 'Последние 3 месяца',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 3);
        return { startDate: start, endDate: end };
      }
    },
    {
      label: 'Полгода',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 6);
        return { startDate: start, endDate: end };
      }
    },
    {
      label: 'Год',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        return { startDate: start, endDate: end };
      }
    },
    {
      label: 'Максимум',
      getValue: () => {
        const end = new Date();
        // Устанавливаем начальную дату как 1 января 2020 года (начало эры WeKey Tools)
        const start = new Date('2020-01-01');
        return { startDate: start, endDate: end };
      }
    }
  ];

  // Функции для работы с календарем
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Преобразуем воскресенье (0) в 6, чтобы неделя начиналась с понедельника
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isDateInRange = (date: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false;
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  };

  const isDateInHoverRange = (date: Date) => {
    if (!tempStartDate || !hoveredDate) return false;
    if (tempEndDate) return false; // Если уже выбран диапазон, не показываем hover
    
    const start = tempStartDate < hoveredDate ? tempStartDate : hoveredDate;
    const end = tempStartDate < hoveredDate ? hoveredDate : tempStartDate;
    
    return isDateInRange(date, start, end);
  };

  const handleDateClick = (date: Date) => {
    // Нормализуем дату - устанавливаем время в полночь
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Начинаем новый выбор
      setTempStartDate(normalizedDate);
      setTempEndDate(null);
    } else {
      // Завершаем выбор диапазона
      if (normalizedDate >= tempStartDate) {
        setTempEndDate(normalizedDate);
      } else {
        setTempStartDate(normalizedDate);
        setTempEndDate(tempStartDate);
      }
    }
  };

  const renderCalendar = (monthOffset: number = 0) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const today = new Date();
    
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    const days = [];
    
    // Пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
      const isToday = isSameDay(currentDate, today);
      const isStartDate = isSameDay(currentDate, tempStartDate);
      const isEndDate = isSameDay(currentDate, tempEndDate);
      const isSelected = isStartDate || isEndDate;
      const isInRange = isDateInRange(currentDate, tempStartDate, tempEndDate);
      const isInHoverRange = isDateInHoverRange(currentDate);
      const isDisabled = currentDate > today;
      
      let className = 'calendar-day';
      if (isToday) className += ' today';
      if (isStartDate) className += ' range-start';
      else if (isEndDate) className += ' range-end';
      else if (isSelected) className += ' selected';
      if (isInRange || isInHoverRange) className += ' in-range';
      if (isDisabled) className += ' disabled';
      
      days.push(
        <div
          key={day}
          className={className}
          onClick={() => !isDisabled && handleDateClick(currentDate)}
          onMouseEnter={() => !isDisabled && setHoveredDate(currentDate)}
          onMouseLeave={() => setHoveredDate(null)}
        >
          {day}
        </div>
      );
    }
    
    return (
      <div className="calendar-month">
        <div className="calendar-header">
          <span className="month-year">
            {monthNames[date.getMonth()]} {date.getFullYear()}
          </span>
        </div>
        <div className="calendar-weekdays">
          {dayNames.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {days}
        </div>
      </div>
    );
  };

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

  // Инициализация currentMonth при изменении selectedRange
  useEffect(() => {
    if (selectedRange.startDate) {
      setCurrentMonth(new Date(selectedRange.startDate.getFullYear(), selectedRange.startDate.getMonth(), 1));
    }
  }, [selectedRange.startDate]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
      // Нормализуем даты - устанавливаем время 00:00:00 для начала и 23:59:59 для конца
      const normalizedStart = new Date(tempStartDate.getFullYear(), tempStartDate.getMonth(), tempStartDate.getDate(), 0, 0, 0, 0);
      const normalizedEnd = new Date(tempEndDate.getFullYear(), tempEndDate.getMonth(), tempEndDate.getDate(), 23, 59, 59, 999);
      
      const label = normalizedStart.getTime() === normalizedEnd.getTime() 
        ? formatDate(normalizedStart)
        : `${formatDate(normalizedStart)} - ${formatDate(normalizedEnd)}`;
      
      console.log('📅 [DateRangePicker] Applying range:', normalizedStart.toISOString(), 'to', normalizedEnd.toISOString());
      
      onRangeChange({
        startDate: normalizedStart,
        endDate: normalizedEnd,
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="date-range-picker" ref={dropdownRef}>
      <button 
        className={`date-range-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img src="/icons/calendar_mini.svg" alt="Calendar" className="date-range-icon" />
        <span className="date-range-text">{selectedRange.label}</span>
        <span className="date-range-arrow"></span>
      </button>

      {isOpen && (
        <div className="date-range-dropdown">
          <div className="date-range-content">
            {/* Левая панель с пресетами */}
            <div className="date-range-presets">
              <h4>Быстрый выбор:</h4>
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
              <div className="calendars-header">
                <button 
                  className="nav-button" 
                  onClick={() => navigateMonth('prev')}
                >
                  ◀
                </button>
                <div className="selected-range">
                  {tempStartDate && tempEndDate ? (
                    <span>
                      {formatDate(tempStartDate)} - {formatDate(tempEndDate)}
                    </span>
                  ) : tempStartDate ? (
                    <span>
                      {formatDate(tempStartDate)} - Выберите конечную дату
                    </span>
                  ) : (
                    <span>Выберите диапазон дат</span>
                  )}
                </div>
                <button 
                  className="nav-button" 
                  onClick={() => navigateMonth('next')}
                >
                  ▶
                </button>
              </div>

              <div className="calendars-container">
                {renderCalendar(0)}
                {renderCalendar(1)}
              </div>

              <div className="calendar-actions">
                <button className="cancel-button" onClick={handleCancel}>
                  Отмена
                </button>
                <button 
                  className="apply-button" 
                  onClick={handleApply}
                  disabled={!tempStartDate || !tempEndDate}
                >
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