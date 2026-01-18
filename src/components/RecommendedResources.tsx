import { useEffect, useState } from "react";
import { RecommendedResource } from "../interface/resource";
import "../styles/components/RecommendedResources.css";
import { recommendResources, llmSuggestion } from "../utils/recommendRes";
import { useInferenceStore } from "../store/llmStore";

interface RecommendedResourcesProps {
  selectedDate: Date | null;
  currentDate: Date;
}

function RecommendedResources({
  selectedDate,
  currentDate,
}: RecommendedResourcesProps) {
  const [recommendedResources, setRecommendedResources] = useState<
    RecommendedResource[]
  >([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  const { onDeviceEnabled } = useInferenceStore();
  const [suggestion, setSuggestion] = useState("");

  const fetchRecommendedResources = async (targetDate: Date) => {
    setIsLoadingResources(true);
    try {
      const resources = await recommendResources(targetDate);
      setRecommendedResources(resources || []);
    } catch (error) {
      console.error("Failed to fetch recommended resources:", error);
      setRecommendedResources([]);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const fetchLlmSuggestion = async (targetDate: Date) => {
    setIsLoadingResources(true);
    try {
      const newSuggestion = await llmSuggestion(targetDate);
      setSuggestion(newSuggestion || "");
    } catch (error) {
      console.log("failed to get suggestion : ", error);
      setSuggestion("");
    } finally {
      setIsLoadingResources(false);
    }
  };

  useEffect(() => {
    const targetDate = selectedDate || currentDate;
    if (!onDeviceEnabled) {
      fetchRecommendedResources(targetDate);
    } else {
      fetchLlmSuggestion(targetDate);
    }
  }, [onDeviceEnabled, selectedDate, currentDate]);

  return (
    <div className="recommended-resources-section">
      <div className="section-header">
        <h3>{onDeviceEnabled ? "智能建议" : "推荐资料"}</h3>
        <span className="section-subtitle">
          {onDeviceEnabled ? "基于端侧模型的智能建议" : "基于当前任务推荐"}
        </span>
      </div>

      {isLoadingResources ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>
            {onDeviceEnabled ? "正在生成智能建议..." : "正在加载推荐资料..."}
          </span>
        </div>
      ) : (
        <div className="resources-grid">
          {onDeviceEnabled ? (
            suggestion ? (
              <div className="suggestion-card">
                <div className="suggestion-header">
                  <svg
                    className="suggestion-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h4 className="suggestion-title">AI tip</h4>
                </div>
                <div className="suggestion-content">{suggestion}</div>
              </div>
            ) : null
          ) : recommendedResources.length > 0 ? (
            recommendedResources.map((resource) => (
              <div key={resource.id} className="resource-card">
                <div className="resource-card-header">
                  {resource.siteIcon && (
                    <img
                      src={resource.siteIcon}
                      alt="site icon"
                      className="site-icon"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <h4 className="resource-title">{resource.title}</h4>
                </div>
                <div className="resource-actions">
                  <span className="relevance-score">
                    相关度: {Math.round(resource.relevanceScore * 100)}%
                  </span>
                  {resource.url && (
                    <button
                      className="view-resource-btn"
                      onClick={() => {
                        window.open(
                          resource.url,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      查看
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-resources">
              <p>{onDeviceEnabled ? "暂无智能建议" : "暂无推荐资料"}</p>
              <button
                className="refresh-btn"
                onClick={() => {
                  const targetDate = selectedDate || currentDate;
                  if (onDeviceEnabled) {
                    fetchLlmSuggestion(targetDate);
                  } else {
                    fetchRecommendedResources(targetDate);
                  }
                }}
              >
                刷新{onDeviceEnabled ? "建议" : "推荐"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecommendedResources;
