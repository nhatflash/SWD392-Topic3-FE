/* eslint-disable react/prop-types */
import { useEffect, useRef } from 'react';

/**
 * Simple line chart component for SoH visualization
 * No external chart library needed - pure SVG
 */
const SoHChart = ({ batteryId, data, width = 600, height = 300 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.data.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { labels, data: sohData, colors } = data;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up padding and dimensions
    const padding = { top: 20, right: 20, bottom: 60, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min and max for Y-axis (SoH percentage)
    const maxY = 100;
    const minY = Math.max(0, Math.min(...sohData) - 10);
    const rangeY = maxY - minY;

    // Draw grid and Y-axis labels
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5;
      const value = maxY - (rangeY * i) / 5;

      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      // Y-axis label
      ctx.fillText(`${value.toFixed(0)}%`, padding.left - 10, y + 4);
    }

    // Draw threshold line at 60%
    const threshold60Y = padding.top + ((maxY - 60) / rangeY) * chartHeight;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, threshold60Y);
    ctx.lineTo(padding.left + chartWidth, threshold60Y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Threshold label
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'left';
    ctx.fillText('⚠️ 60% threshold', padding.left + 5, threshold60Y - 5);

    // Calculate X positions
    const stepX = chartWidth / (sohData.length - 1 || 1);

    // Draw line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    sohData.forEach((value, index) => {
      const x = padding.left + index * stepX;
      const y = padding.top + ((maxY - value) / rangeY) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points with colors
    sohData.forEach((value, index) => {
      const x = padding.left + index * stepX;
      const y = padding.top + ((maxY - value) / rangeY) * chartHeight;

      // Point circle
      ctx.fillStyle = colors[index] || '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // White border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw X-axis labels (show every nth label to avoid overlap)
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.font = '11px sans-serif';
    
    const labelStep = Math.max(1, Math.floor(labels.length / 8));
    labels.forEach((label, index) => {
      if (index % labelStep === 0 || index === labels.length - 1) {
        const x = padding.left + index * stepX;
        const y = height - padding.bottom + 15;
        
        // Rotate text for better fit
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    });

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

  }, [data, width, height]);

  if (!data || data.data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg" style={{ width, height }}>
        <div className="text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">Chưa có dữ liệu SoH history</p>
          <p className="text-xs mt-1">Dữ liệu sẽ được thu thập theo thời gian</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg bg-white"
      />
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Tốt (≥80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600">Khá (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-600">Yếu (40-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">Kém (&lt;40%)</span>
        </div>
      </div>
    </div>
  );
};

export default SoHChart;
