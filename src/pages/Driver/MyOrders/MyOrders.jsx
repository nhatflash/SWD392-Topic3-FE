import React, { useState, useEffect } from 'react';
import { 
  getAllOrders, 
  getTransactionStatusText, 
  getOrderTypeText, 
  canPayOrder 
} from '../../../services/driverOrders';
import PaymentModal from './components/PaymentModal';
import FeedbackModal from './components/FeedbackModal';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, typeFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const ordersData = await getAllOrders();
      setOrders(ordersData);
    } catch (e) {
      setError('Không thể tải danh sách đơn hàng: ' + (e?.response?.data?.message || e?.message));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(order => order.type === typeFilter);
    }

    setFilteredOrders(filtered);
  };

  const handlePayment = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
    // Reload orders to update payment status
    loadOrders();
  };

  const handleFeedback = (order) => {
    setSelectedOrder(order);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackModal(false);
    setSelectedOrder(null);
    // Reload orders to update feedback
    loadOrders();
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800', 
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELED': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {getTransactionStatusText(status)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeStyles = {
      'SCHEDULED': 'bg-indigo-100 text-indigo-800',
      'WALK_IN': 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeStyles[type] || 'bg-gray-100 text-gray-800'}`}>
        {getOrderTypeText(type)}
      </span>
    );
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    return new Date(dateTimeString).toLocaleString('vi-VN');
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0028b8]"></div>
          <p className="mt-2 text-gray-600">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
          <p className="mt-2 text-gray-600">Theo dõi lịch sử đổi pin và thanh toán</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0028b8]"
              >
                <option value="ALL">Tất cả</option>
                <option value="SCHEDULED">Đã đặt lịch</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELED">Đã hủy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại đơn</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0028b8]"
              >
                <option value="ALL">Tất cả</option>
                <option value="SCHEDULED">Đặt lịch</option>
                <option value="WALK_IN">Tại chỗ</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadOrders}
                className="bg-[#0028b8] text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                🔄 Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có đơn hàng</h3>
              <p className="text-gray-600">Bạn chưa có đơn đổi pin nào.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.transactionId} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">#{order.code}</h3>
                      {getStatusBadge(order.status)}
                      {getTypeBadge(order.type)}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0028b8]">{formatPrice(order.swapPrice)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Thời gian đặt</p>
                      <p className="font-medium">{formatDateTime(order.scheduledTime)}</p>
                    </div>
                    
                    {order.arrivalTime && (
                      <div>
                        <p className="text-sm text-gray-600">Thời gian đến</p>
                        <p className="font-medium">{formatDateTime(order.arrivalTime)}</p>
                      </div>
                    )}

                    {order.swapStartTime && (
                      <div>
                        <p className="text-sm text-gray-600">Bắt đầu đổi pin</p>
                        <p className="font-medium">{formatDateTime(order.swapStartTime)}</p>
                      </div>
                    )}

                    {order.swapEndTime && (
                      <div>
                        <p className="text-sm text-gray-600">Hoàn thành</p>
                        <p className="font-medium">{formatDateTime(order.swapEndTime)}</p>
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Ghi chú</p>
                      <p className="text-gray-800">{order.notes}</p>
                    </div>
                  )}

                  {/* Payment Button - Only show for CONFIRMED orders */}
                  {canPayOrder(order) && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Đơn hàng đã được xác nhận</p>
                          <p className="text-xs text-green-600">✓ Sẵn sàng thanh toán</p>
                        </div>
                        <button
                          onClick={() => handlePayment(order)}
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                          💳 Thanh toán
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback Button - Only show for COMPLETED orders with swapEndTime and without feedback */}
                  {order.status === 'COMPLETED' && order.swapEndTime && !order.driverRating && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Đơn hàng đã hoàn thành</p>
                          <p className="text-xs text-blue-600">💬 Hãy chia sẻ trải nghiệm của bạn</p>
                        </div>
                        <button
                          onClick={() => handleFeedback(order)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                          ⭐ Đánh giá
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show feedback if already rated */}
                  {order.status === 'COMPLETED' && order.swapEndTime && order.driverRating && (
                    <div className="pt-4 border-t border-gray-200 bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-yellow-400 text-xl">
                          {'⭐'.repeat(order.driverRating)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">Đánh giá của bạn</p>
                          {order.driverFeedback && (
                            <p className="text-sm text-gray-700 italic">"{order.driverFeedback}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show message if COMPLETED but no swapEndTime yet */}
                  {order.status === 'COMPLETED' && !order.swapEndTime && (
                    <div className="pt-4 border-t border-gray-200 bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-600">⏳</span>
                        <div className="flex-1">
                          <p className="text-sm text-yellow-800">
                            Giao dịch đang được xử lý. Bạn có thể đánh giá sau khi hoàn tất.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng kết</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'SCHEDULED').length}</p>
              <p className="text-sm text-gray-600">Đã đặt lịch</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'CONFIRMED').length}</p>
              <p className="text-sm text-gray-600">Đã xác nhận</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'IN_PROGRESS').length}</p>
              <p className="text-sm text-gray-600">Đang xử lý</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{orders.filter(o => o.status === 'COMPLETED').length}</p>
              <p className="text-sm text-gray-600">Hoàn thành</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{orders.filter(o => o.status === 'CANCELED').length}</p>
              <p className="text-sm text-gray-600">Đã hủy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedOrder && (
        <FeedbackModal
          order={selectedOrder}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
};

export default MyOrders;