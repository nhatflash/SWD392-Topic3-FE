import React, { useState } from 'react';
import API from '../../../../services/auth';

const FeedbackModal = ({ order, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }

    if (!feedback.trim()) {
      setError('Vui lòng nhập nội dung đánh giá');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await API.post(`/api/swap/${order.transactionId}/feedback`, {
        rating,
        feedback: feedback.trim()
      });

      alert('✅ Cảm ơn bạn đã đánh giá!');
      onSuccess();
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Đã xảy ra lỗi';
      setError('Không thể gửi đánh giá: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Đánh giá dịch vụ</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Order Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="text-sm space-y-1">
            <p className="text-gray-600">Mã đơn: <span className="font-medium text-gray-900">#{order.code}</span></p>
            {order.stationInfo?.name && (
              <p className="text-gray-600">Trạm: <span className="font-medium text-gray-900">{order.stationInfo.name}</span></p>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4 text-center">Bạn đánh giá như thế nào?</h4>
          
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <svg
                  className={`w-12 h-12 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
            ))}
          </div>

          <div className="text-center text-sm text-gray-600">
            {rating === 0 && 'Chưa chọn'}
            {rating === 1 && '⭐ Rất tệ'}
            {rating === 2 && '⭐⭐ Tệ'}
            {rating === 3 && '⭐⭐⭐ Bình thường'}
            {rating === 4 && '⭐⭐⭐⭐ Tốt'}
            {rating === 5 && '⭐⭐⭐⭐⭐ Xuất sắc'}
          </div>
        </div>

        {/* Feedback Text */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chia sẻ trải nghiệm của bạn
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Hãy cho chúng tôi biết về trải nghiệm của bạn tại trạm này..."
            rows="4"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#0028b8] focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {feedback.length} ký tự
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0 || !feedback.trim()}
              className="flex-1 bg-[#0028b8] text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang gửi...
                </div>
              ) : (
                'Gửi đánh giá'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
