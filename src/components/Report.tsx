import React, { useState } from "react";
import { generateMonthlyReport } from "../utils/report";
import { MonthlyReportData } from "../interface/report";

import { Dialog, Button } from "tdesign-mobile-react";

type ReportData = Omit<
  MonthlyReportData,
  | "id"
  | "month"
  | "userId"
  | "createdAt"
  | "tasks"
  | "totalTasks"
  | "completedTasks"
  | "completionRate"
  | "totalTimeSpent"
>;

const Report: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (data: ReportData) => {
    const reportText = `
月度报告

总结
${data.summary}

主要成就
${data.achievements.map((item) => `- ${item}`).join("\n")}

挑战与困难
${data.challenges.map((item) => `- ${item}`).join("\n")}

改进建议
${data.recommendations.map((item) => `- ${item}`).join("\n")}
    `;
    navigator.clipboard.writeText(reportText.trim());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const showReportDialog = (data: ReportData) => {
    setReportData(data);
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setIsCopied(false);
  };

  const showErrorDialog = (error: any) => {
    setReportData(null);
    setDialogVisible(true);
    console.error("Error generating report:", error);
  };

  const getReport = async () => {
    setLoading(true);
    try {
      const data = await generateMonthlyReport();
      showReportDialog(data);
    } catch (error) {
      console.error("获取报告失败:", error);
      showErrorDialog(error);
    } finally {
      setLoading(false);
    }
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: "16px",
    textAlign: "left",
  };
  const headerStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "bold",
    borderBottom: "1px solid #eee",
    paddingBottom: "8px",
    marginBottom: "8px",
  };
  const summaryStyle: React.CSSProperties = {
    lineHeight: "1.6",
    color: "#555",
  };
  const listItemStyle: React.CSSProperties = {
    marginBottom: "6px",
    color: "#555",
  };

  return (
    <div className="t-dialog__demo-wrap">
      <div className="btn-gap"></div>
      <Button
        variant="outline"
        size="large"
        theme="primary"
        block
        onClick={getReport}
        disabled={loading}
      >
        {loading ? "报告生成中..." : "获取月度报告"}
      </Button>
      <Dialog
        visible={isDialogVisible}
        title={reportData ? "月度报告" : "生成失败"}
        closeOnOverlayClick={true}
        onClose={closeDialog}
        onConfirm={closeDialog}
        content={
          reportData ? (
            <div style={{ position: "relative", paddingTop: "10px" }}>
              <div style={{ position: "absolute", top: "0px", right: "0px" }}>
                <Button
                  size="small"
                  variant="text"
                  theme="primary"
                  onClick={() => handleCopy(reportData)}
                  disabled={isCopied}
                >
                  {isCopied ? "已复制!" : "复制"}
                </Button>
              </div>
              <div style={sectionStyle}>
                <h4 style={headerStyle}>总结</h4>
                <p style={summaryStyle}>{reportData.summary}</p>
              </div>
              <div style={sectionStyle}>
                <h4 style={headerStyle}>主要成就</h4>
                <ul style={{ paddingLeft: "20px" }}>
                  {reportData.achievements.map((item, index) => (
                    <li key={index} style={listItemStyle}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={sectionStyle}>
                <h4 style={headerStyle}>挑战与困难</h4>
                <ul style={{ paddingLeft: "20px" }}>
                  {reportData.challenges.map((item, index) => (
                    <li key={index} style={listItemStyle}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ textAlign: "left" }}>
                <h4 style={headerStyle}>改进建议</h4>
                <ul style={{ paddingLeft: "20px" }}>
                  {reportData.recommendations.map((item, index) => (
                    <li key={index} style={listItemStyle}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            "获取报告时发生错误，请稍后重试。"
          )
        }
      />
    </div>
  );
};

export default Report;
