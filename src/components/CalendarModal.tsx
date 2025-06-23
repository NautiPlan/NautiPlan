import React from "react";
import ReactDOM from "react-dom";

interface CalendarModalProps {
  open: boolean;
  selectedDate: Date | null;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  open,
  selectedDate,
  onClose,
}) => {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        {selectedDate ? (
          <div className="modal-body">
            <h3>日期详情</h3>
            <p>{selectedDate.toLocaleDateString("zh-CN")}</p>
            {/* 这里可以添加更多日期详情内容 */}
          </div>
        ) : (
          <div>请选择日期</div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CalendarModal;
