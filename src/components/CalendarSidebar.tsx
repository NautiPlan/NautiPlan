import React from "react";

interface CalendarSidebarProps {
  open: boolean;
  selectedDate: Date | null;
  onClose: () => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  open,
  selectedDate,
  onClose,
}) => {
  return (
    <div className={`calendar-sidebar${open ? " animated" : ""}`}>
      <button className="sidebar-close" onClick={onClose}>
        关闭
      </button>
      {selectedDate ? (
        <div>
          <h3>日期信息</h3>
          <p>{selectedDate.toLocaleDateString()}</p>
          {/* 这里可以扩展更多信息 */}
        </div>
      ) : (
        <div>请选择日期</div>
      )}
    </div>
  );
};

export default CalendarSidebar;
