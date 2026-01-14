import React from "react";
import { Button } from "antd-mobile";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const buttonStyle = {
    backgroundColor: "#40a9ff",
    borderColor: "#40a9ff",
    color: "#fff",
  };

  return (
    <div
      style={{
        padding: "16px 0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <Button
        size="small"
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        style={buttonStyle}
      >
        首页
      </Button>
      <Button
        size="small"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        style={buttonStyle}
      >
        上一页
      </Button>
      <span
        style={{
          fontSize: "14px",
          color: "#666",
          minWidth: "40px",
          textAlign: "center",
        }}
      >
        {currentPage} / {totalPages}
      </span>
      <Button
        size="small"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        style={buttonStyle}
      >
        下一页
      </Button>
      <Button
        size="small"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
        style={buttonStyle}
      >
        尾页
      </Button>
    </div>
  );
};

export default Pagination;
