import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangePickerLabels {
  selectPeriod: string;
  from: string;
  until: string;
  today: string;
  yesterday: string;
  last2Days: string;
  thisWeek: string;
  last7Days: string;
  thisMonth: string;
  last30Days: string;
  customDates: string;
  startDate: string;
  endDate: string;
  apply: string;
}

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  labels?: DateRangePickerLabels;
  locale?: string;
}

const defaultLabels: DateRangePickerLabels = {
  selectPeriod: 'Seleccionar periodo',
  from: 'Desde',
  until: 'Hasta',
  today: 'Hoy',
  yesterday: 'Ayer',
  last2Days: 'Ultimos 2 dias',
  thisWeek: 'Esta semana',
  last7Days: 'Ultimos 7 dias',
  thisMonth: 'Este mes',
  last30Days: 'Ultimos 30 dias',
  customDates: 'Fechas personalizadas',
  startDate: 'Fecha inicio',
  endDate: 'Fecha fin',
  apply: 'Aplicar',
};

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  labels = defaultLabels,
  locale = 'es-ES',
}: DateRangePickerProps) {
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
    if (!startDate && !endDate) return labels.selectPeriod;

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    if (startDate) {
      return `${labels.from} ${formatDate(startDate)}`;
    }

    if (endDate) {
      return `${labels.until} ${formatDate(endDate)}`;
    }

    return labels.selectPeriod;
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
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white flex items-center justify-between hover:bg-gray-50 transition-colors"
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
            <h3 className="text-sm font-medium text-gray-900 mb-3">{labels.selectPeriod}</h3>

            <div className="space-y-1 mb-4">
              <button
                type="button"
                onClick={setToday}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-soft rounded-lg transition-colors"
              >
                {labels.today}
              </button>
              <button
                type="button"
                onClick={setYesterday}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-soft rounded-lg transition-colors"
              >
                {labels.yesterday}
              </button>
              <button
                type="button"
                onClick={setLast2Days}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-soft rounded-lg transition-colors"
              >
                {labels.last2Days}
              </button>
              <button
                type="button"
                onClick={setThisWeek}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-soft rounded-lg transition-colors"
              >
                {labels.thisWeek}
              </button>
              <button
                type="button"
                onClick={setLast7Days}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-soft rounded-lg transition-colors"
              >
                {labels.last7Days}
              </button>
              <button
                type="button"
                onClick={setThisMonth}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-soft rounded-lg transition-colors"
              >
                {labels.thisMonth}
              </button>
              <button
                type="button"
                onClick={setLast30Days}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-soft rounded-lg transition-colors"
              >
                {labels.last30Days}
              </button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                {labels.customDates}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {labels.startDate}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {labels.endDate}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={applyCustomDates}
                className="w-full mt-4 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
              >
                {labels.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
