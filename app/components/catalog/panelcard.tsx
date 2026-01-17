// ============================================
// components/admin/catalog/panelcard.tsx
// 竖直布局版本
// ============================================

"use client";

import React from "react";

export interface PanelCardProps {
  icon: React.ElementType;
  title: string;
  mainValue: string | number;
  subtitle?: string;
  isLoading?: boolean;
  error?: boolean;
  onError?: () => void;
  onClick?: () => void;
  children?: React.ReactNode;
  // 样式配置
  bgGradient?: string;
  borderColor?: string;
  iconBgGradient?: string;
  titleColor?: string;
  valueColor?: string;
  isClickable?: boolean;
  errorMessage?: string;
}

const PanelCard: React.FC<PanelCardProps> = ({
  icon: Icon,
  title,
  mainValue,
  subtitle,
  isLoading = false,
  error = false,
  onError,
  onClick,
  children,
  bgGradient = "from-blue-50 to-blue-100",
  borderColor = "border-blue-200",
  iconBgGradient = "from-blue-400 to-blue-500",
  titleColor = "text-blue-600",
  valueColor = "text-blue-600",
  isClickable = false,
  errorMessage = "Error Loading",
}) => {
  const Wrapper = isClickable ? "button" : "div";
  const wrapperProps = isClickable
    ? {
        onClick,
        type: "button" as const,
        className: `w-full bg-gradient-to-br ${bgGradient} rounded-3xl p-6 border-2 ${borderColor} shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer text-left`,
      }
    : {
        className: `bg-gradient-to-br ${bgGradient} rounded-3xl p-6 border-2 ${borderColor} shadow-md hover:shadow-lg transition-shadow`,
      };

  if (isLoading) {
    return (
      <div
        className={`bg-gradient-to-br ${bgGradient} rounded-3xl p-6 border-2 ${borderColor} shadow-md animate-pulse`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-300 opacity-30"></div>
          <div className="h-8 bg-gray-300 rounded w-2/3"></div>
          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const ErrorWrapper = onError ? "button" : "div";
    return (
      <ErrorWrapper
        onClick={onError}
        className={`bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-6 border-2 border-red-200 shadow-md hover:shadow-lg transition-all duration-200 ${
          onError ? "w-full cursor-pointer active:scale-95" : ""
        }`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">Error</div>
            <div className="text-xs font-medium text-red-500 mt-1">
              {onError ? "Click to Retry" : "Failed to load"}
            </div>
          </div>
        </div>
      </ErrorWrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps}>
      <div className="flex gap-4 h-20">
        {/* 左边 - Icon */}
        <div className="flex-shrink-0 h-20">
          <div
            className={`w-16 h-16 bg-gradient-to-br ${iconBgGradient} rounded-2xl flex items-center justify-center shadow-lg relative`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* 右边 - 数据和信息 */}
        <div className="flex-1 flex flex-col justify-center">
          {/* 标题 - 小号 */}
          <div className={`text-xs font-bold ${titleColor} uppercase tracking-wider mb-1`}>
            {title}
          </div>

          {/* 数据值 - 大号 */}
          <div className={`text-4xl font-extrabold ${valueColor} leading-none mb-1`}>
            {mainValue}
          </div>

          {/* 副标题 - 更小 */}
          {subtitle && (
            <div className={`text-xs font-medium ${titleColor} opacity-80`}>
              {subtitle}
            </div>
          )}


          {/* 装饰线 */}
          <div className={`h-0.5 w-6 bg-gradient-to-r ${iconBgGradient} rounded-full mt-2`}></div>
        </div>
      </div>

      {/* 子元素 */}
      {children && <div className="w-full mt-4">{children}</div>}
    </Wrapper>
  );
};

export default PanelCard;