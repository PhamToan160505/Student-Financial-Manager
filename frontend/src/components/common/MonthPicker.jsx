import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthPicker({ value, onChange, className }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // value is expected to be 'YYYY-MM'
  const [selectedYear, selectedMonth] = value ? value.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  
  const [viewYear, setViewYear] = useState(selectedYear);

  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (value) {
       const [y] = value.split('-').map(Number);
       setViewYear(y);
    }
  }, [value]);

  const handleMonthSelect = (month) => {
    const monthStr = month.toString().padStart(2, '0');
    onChange(`${viewYear}-${monthStr}`);
    setIsOpen(false);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    onChange(`${y}-${m}`);
    setIsOpen(false);
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={className || "flex items-center gap-2 h-full text-sm font-bold text-neutral-maintext hover:text-primary transition-colors focus:outline-none whitespace-nowrap"}
      >
        <span>Tháng {selectedMonth}, {selectedYear}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 p-3 bg-white border border-neutral-border rounded-xl shadow-lg z-50 w-72 right-0 sm:right-auto sm:left-0 origin-top">
          <div className="flex items-center justify-between mb-3 bg-neutral-bg p-1 rounded-lg">
            <button 
              type="button"
              onClick={() => setViewYear(y => y - 1)}
              className="p-1 hover:bg-white rounded-md text-neutral-subtext hover:text-neutral-maintext transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-base text-neutral-maintext">{viewYear}</span>
            <button 
              type="button"
              onClick={() => setViewYear(y => y + 1)}
              className="p-1 hover:bg-white rounded-md text-neutral-subtext hover:text-neutral-maintext transition-colors shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((mName, idx) => {
              const mNumber = idx + 1;
              const isSelected = viewYear === selectedYear && mNumber === selectedMonth;
              return (
                <button
                  key={mNumber}
                  type="button"
                  onClick={() => handleMonthSelect(mNumber)}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    isSelected 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-neutral-bg text-neutral-subtext hover:bg-primary-light hover:text-primary'
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-border flex justify-end">
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Tháng hiện tại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
