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

  const { onDeviceEnabled } = useInferenceStore();
  const [suggestion, setSuggestion] = useState("");

  const fetchLlmSuggestion = async (targetDate: Date) => {
    try {
      const newSuggestion = await llmSuggestion(targetDate);
      setSuggestion(newSuggestion || "");
    } catch (error) {
      console.log("failed to get suggestion : ", error);
    }
  };

  useEffect(() => {
    const targetDate = selectedDate || currentDate;
    if (!onDeviceEnabled) fetchRecommendedResources(targetDate);
    else if (onDeviceEnabled) fetchLlmSuggestion(targetDate);
  }, []);

  return (
    <div className="recommended-resources-section">
      <div className="section-header">
        <h3>推荐资料</h3>
        <span className="section-subtitle">基于当前任务推荐</span>
      </div>

      {isLoadingResources ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>正在加载推荐资料...</span>
        </div>
      ) : (
        <div className="resources-grid">
          {onDeviceEnabled ? (
            <div>{suggestion}</div>
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
              <p>暂无推荐资料</p>
              <button
                className="refresh-btn"
                onClick={() => {
                  const targetDate = selectedDate || currentDate;
                  fetchRecommendedResources(targetDate);
                }}
              >
                刷新推荐
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecommendedResources;
