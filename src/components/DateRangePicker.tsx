import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'Seleccionar periodo';

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      return `Desde ${formatDate(startDate)}`;
    } else if (endDate) {
      return `Hasta ${formatDate(endDate)}`;
    }
    return 'Seleccionar periodo';
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    onStartDateChange(today);
    onEndDateChange(today);
    setIsOpen(false);
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    onStartDateChange(dateStr);
    onEndDateChange(dateStr);
    setIsOpen(false);
  };

  const setLast2Days = () => {
    const today = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);
    onStartDateChange(twoDaysAgo.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const setThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    onStartDateChange(monday.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const setThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    onStartDateChange(firstDay.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const setLast7Days = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    onStartDateChange(sevenDaysAgo.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const setLast30Days = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    onStartDateChange(thirtyDaysAgo.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const applyCustomDates = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-700">{formatDateRange()}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Seleccionar periodo</h3>

            <div className="space-y-1 mb-4">
              <button
                type="button"
                onClick={setToday}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={setYesterday}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Ayer
              </button>
              <button
                type="button"
                onClick={setLast2Days}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Últimos 2 días
              </button>
              <button
                type="button"
                onClick={setThisWeek}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Esta semana
              </button>
              <button
                type="button"
                onClick={setLast7Days}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                onClick={setThisMonth}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Este mes
              </button>
              <button
                type="button"
                onClick={setLast30Days}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Últimos 30 días
              </button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Fechas personalizadas
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={applyCustomDates}
                className="w-full mt-4 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
