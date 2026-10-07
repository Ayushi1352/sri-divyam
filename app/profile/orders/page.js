"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { apiClient, API_BASE_URL } from "../../utils/apiClient";
import { Loader2, AlertCircle, X, Upload } from "lucide-react";
import { useCurrency } from "../../context/CurrencyContext";

export default function OrdersPage() {
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState(null);

    // Return / Replacement State
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [orderToReturn, setOrderToReturn] = useState(null);
    const [returnForm, setReturnForm] = useState({ type: 'refund', reason: '', comments: '', paymentMethod: 'upi', upiId: '', accountHolder: '', accountNumber: '', ifsc: '' });
    const [returnFiles, setReturnFiles] = useState([]);
    const [isReturning, setIsReturning] = useState(false);
    const [returnError, setReturnError] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getImageUrl = (item) => {
        if (!item) return null;

        let found = item.image || item.image_path || item.thumbnail ||
            item.product?.image_path || item.product?.image ||
            item.product_details?.image_path || null;

        if (!found) {
            if (Array.isArray(item.images) && item.images.length > 0) found = item.images[0];
            else if (Array.isArray(item.product?.images) && item.product.images.length > 0) found = item.product.images[0];
        }

        if (!found) return null;
        if (found.startsWith('http')) return found;

        return `${API_BASE_URL}/uploads/${found.replace(/^\/+/, '')}`;
    };


    const getOrderTotal = (o) => {
        let t = o.total || o.total_amount || o.totalAmount || o.amount || o.totalPrice || o.total_price;
        if (t !== undefined && t !== null && t !== "") return t;

        const items = o.items || o.order_items || [];
        return items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || item.qty || 1)), 0);
    };

    const fetchOrders = async () => {
        try {
            const data = await apiClient.get("/api/orders");
            setOrders(data.orders || data.data || (Array.isArray(data) ? data : []));
        } catch (err) {
            console.error("Failed to fetch orders:", err);
            setError(err.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const openCancelModal = (orderId) => {
        setOrderToCancel(orderId);
        setCancelError(null);
        setCancelModalOpen(true);
    };

    const confirmCancelOrder = async () => {
        if (!orderToCancel) return;
        setIsCancelling(true);
        setCancelError(null);
        try {
            await apiClient.post(`/api/orders/${orderToCancel}/cancel`, { reason: "Customer requested cancellation" });
            fetchOrders();
            setCancelModalOpen(false);
            setOrderToCancel(null);
        } catch (error) {
            setCancelError(error.message || "Failed to cancel order. Please try again.");
        } finally {
            setIsCancelling(false);
        }
    };

    const openReturnModal = (orderId) => {
        setOrderToReturn(orderId);
        // Detect COD orders — COD orders can only do replacement, not refund
        const selectedOrder = orders.find(o => String(o.id || o._id || o.order_id) === String(orderId));
        const paymentMethod = (selectedOrder?.payment_method || selectedOrder?.paymentMethod || selectedOrder?.payment_mode || '').toLowerCase();
        const isCOD = paymentMethod.includes('cod') || paymentMethod.includes('cash');
        const defaultType = isCOD ? 'replacement' : 'refund';
        setReturnForm({ type: defaultType, reason: '', comments: '', paymentMethod: 'upi', upiId: '', accountHolder: '', accountNumber: '', ifsc: '', isCOD });
        setReturnFiles([]);
        setReturnError(null);
        setReturnModalOpen(true);
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const MAX_SIZE = 50 * 1024 * 1024; // 50MB
            const oversized = files.filter(f => f.size > MAX_SIZE);
            if (oversized.length > 0) {
                const names = oversized.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join(', ');
                setReturnError(`File(s) too large: ${names}. Maximum size allowed is 50 MB per file. Please compress or use a smaller file.`);
                e.target.value = ''; // clear selection
                return;
            }
            setReturnError(null);
            setReturnFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (indexToRemove) => {
        setReturnFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    const submitReturnRequest = async (e) => {
        e.preventDefault();
        if (!orderToReturn) return;
        if (!returnForm.reason) {
            setReturnError("Please select a reason.");
            return;
        }

        // Validate payment info for refund type
        if (returnForm.type === 'refund') {
            if (returnForm.paymentMethod === 'upi') {
                if (!returnForm.upiId.trim()) {
                    setReturnError("Please enter your UPI ID.");
                    return;
                }
            } else {
                if (!returnForm.accountHolder.trim() || !returnForm.accountNumber.trim() || !returnForm.ifsc.trim()) {
                    setReturnError("Please fill all bank details (account holder name, account number, IFSC).");
                    return;
                }
            }
        }

        // Backend requires at least one video for return/replacement requests
        const hasVideo = returnFiles.some(file => file.type.startsWith('video/'));
        if (!hasVideo) {
            setReturnError("Please upload at least 1 video showing the issue (Max 50MB).");
            return;
        }

        setIsReturning(true);
        setReturnError(null);

        try {
            const formData = new FormData();
            formData.append('orderId', orderToReturn);
            formData.append('type', returnForm.type);
            formData.append('reason', returnForm.reason);
            formData.append('description', returnForm.comments);

            // Append payment info for refund — ALL possible naming conventions incl. VPA (technical UPI term)
            if (returnForm.type === 'refund') {
                if (returnForm.paymentMethod === 'upi') {
                    const upi = returnForm.upiId.trim();
                    // Flat field names (all variants)
                    formData.append('upiId', upi);
                    formData.append('upi_id', upi);
                    formData.append('upi', upi);
                    formData.append('vpa', upi);
                    formData.append('upiAddress', upi);
                    // JSON object variants (backend may parse nested objects)
                    formData.append('bankDetails', JSON.stringify({ upiId: upi, upi_id: upi, vpa: upi }));
                    formData.append('refundDetails', JSON.stringify({ upiId: upi, upi_id: upi, vpa: upi }));
                    formData.append('paymentDetails', JSON.stringify({ upiId: upi, upi_id: upi, vpa: upi }));
                    // bank fields empty
                    formData.append('accountHolderName', '');
                    formData.append('accountNumber', '');
                    formData.append('ifsc', '');
                } else {
                    const holder = returnForm.accountHolder.trim();
                    const accNum = returnForm.accountNumber.trim();
                    const ifscCode = returnForm.ifsc.trim();
                    // Flat field names
                    formData.append('accountHolderName', holder);
                    formData.append('account_holder_name', holder);
                    formData.append('accountNumber', accNum);
                    formData.append('account_number', accNum);
                    formData.append('ifsc', ifscCode);
                    formData.append('ifscCode', ifscCode);
                    formData.append('ifsc_code', ifscCode);
                    formData.append('IFSC', ifscCode);
                    // JSON object variants
                    formData.append('bankDetails', JSON.stringify({ accountHolderName: holder, accountNumber: accNum, ifsc: ifscCode, account_holder_name: holder, account_number: accNum }));
                    formData.append('refundDetails', JSON.stringify({ accountHolderName: holder, accountNumber: accNum, ifsc: ifscCode }));
                    formData.append('upiId', '');
                    formData.append('upi_id', '');
                    formData.append('vpa', '');
                }
            }

            // Find items for this order and format them correctly for the backend
            const selectedOrder = orders.find(o => String(o.id || o._id || o.order_id) === String(orderToReturn));
            const rawItems = selectedOrder?.items || selectedOrder?.order_items || [];

            // Backend expects productId as a direct field — extract from nested product object
            const itemsToSend = rawItems.map(item => {
                const productId = item.productId || item.product_id ||
                    item.product?._id || item.product?.id ||
                    item._id || item.id;
                return {
                    productId: productId,
                    product_id: productId,
                    product: productId,           // backend may check item.product as string ID
                    name: item.name || item.product_name || item.product?.name || '',
                    price: item.price,
                    quantity: item.quantity || item.qty || 1,
                };
            });
            formData.append('items', JSON.stringify(itemsToSend));


            returnFiles.forEach((file) => {
                if (file.type.startsWith('video/')) {
                    formData.append('videos', file);
                } else {
                    formData.append('photos', file);
                }
            });

            // DEBUG: log exactly what we're sending
            console.log('=== RETURN REQUEST PAYLOAD ===');
            for (let [key, val] of formData.entries()) {
                console.log(`  ${key}:`, val);
            }
            console.log('==============================');

            await apiClient.post(`/api/returns/request`, formData);

            showToast(`${returnForm.type} request submitted successfully!`, 'success');
            fetchOrders();
            setReturnModalOpen(false);
            setOrderToReturn(null);
        } catch (error) {
            setReturnError(error.message || "Failed to submit request. Please try again.");
        } finally {
            setIsReturning(false);
        }
    };



    if (loading) {
        return <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin text-[#135B42]" size={32} /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-12">{error}</div>;
    }

    return (
        <div className="space-y-4 sm:space-y-6 min-w-0">
            <h2 className="text-[18px] sm:text-[24px] md:text-[28px] font-playfair font-bold text-[#135B42]">My Order History</h2>

            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-2 sm:p-4 md:p-6 min-w-0">
                <div className="space-y-4 sm:space-y-6 min-w-0">
                    {orders.map((order, index) => (
                        <div key={order._id || order.id || `order-${index}`} className="border border-gray-200 rounded-lg overflow-hidden bg-[#FAF8F5] shadow-[0_2px_10px_rgb(0,0,0,0.02)] min-w-0">
                            {/* Order Header */}
                            <div className="bg-[#ffffff] px-3 py-3 sm:px-5 sm:py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-2.5 sm:gap-4 border-b border-gray-200 min-w-0">
                                <div className="min-w-0 w-full xl:w-auto">
                                    <p className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-[#303030] whitespace-nowrap overflow-hidden text-ellipsis">
                                        Order ID: <span className="text-[#135B42]">{order.id || order.order_id || order._id}</span>
                                    </p>
                                    <p className="text-[11px] sm:text-[12px] text-gray-500 mt-0.5">Date: {new Date(order.created_at || order.createdAt || order.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto justify-between xl:justify-start min-w-0">
                                    {(order.orderStatus || order.status || order.order_status) && (
                                        <span className={`text-white text-[11px] sm:text-[12px] font-bold px-2.5 py-1 rounded capitalize ${(order.orderStatus || order.status || order.order_status)?.toLowerCase() === 'cancelled'
                                            ? 'bg-[#e11d48]'
                                            : 'bg-[#e67e22]'
                                            }`}>
                                            Order: {String(order.orderStatus || order.status || order.order_status).trim().toLowerCase()}
                                        </span>
                                    )}
                                    {(order.payment_status || order.paymentStatus) && (
                                        <span className="bg-[#135B42] text-white text-[11px] sm:text-[12px] font-bold px-2.5 py-1 rounded capitalize">
                                            Payment: {String(order.payment_status || order.paymentStatus).trim().toLowerCase()}
                                        </span>
                                    )}
                                    <span className="text-[13px] sm:text-[15px] font-bold text-[#303030] ml-auto xl:ml-2">
                                        Total: {formatPrice(getOrderTotal(order), 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="px-3 py-2 sm:px-5 sm:py-4 min-w-0">
                                {(order.items || order.order_items || []).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 sm:gap-4 py-2 sm:py-3 border-b border-gray-100 last:border-0 min-w-0">
                                        <div className="w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] bg-[#0c402d] rounded overflow-hidden relative shrink-0">
                                            {getImageUrl(item) ? (
                                                <img src={getImageUrl(item)} alt={item.name || item.product_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-[#135B42]"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 bg-[#FDFCFB] p-1.5 sm:p-2 rounded-sm min-w-0">
                                            <h4 className="text-[12px] sm:text-[13px] font-bold text-[#111827] truncate sm:whitespace-normal">{item.name || item.product_name || item.product?.name || "Product"}</h4>
                                            <p className="text-[10px] sm:text-[12px] text-gray-500 mt-0.5">Qty: {item.quantity || item.qty} | Price: {formatPrice(item.price, 0)}</p>
                                        </div>
                                        <div className="text-[12px] sm:text-[14px] font-bold text-[#111827] shrink-0 text-right ml-1 sm:ml-2">
                                            {formatPrice((item.price || 0) * (item.quantity || item.qty || 1), 0)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Footer */}
                            <div className="px-3 py-2.5 sm:px-5 sm:py-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-2 sm:gap-4 bg-white min-w-0">
                                <button
                                    onClick={() => window.location.href = `/profile/orders/${order.id || order.order_id || order._id}`}
                                    className="text-[12px] sm:text-[13px] font-medium text-[#135B42] hover:underline cursor-pointer"
                                >
                                    View Order Details
                                </button>
                                {(() => {
                                    const currentStatus = (order.orderStatus || order.status || order.order_status || "").toLowerCase();
                                    const cannotCancel = currentStatus === 'cancelled' || currentStatus === 'delivered' || currentStatus === 'shipped' || currentStatus === 'dispatched';

                                    if (!cannotCancel) {
                                        return (
                                            <button
                                                onClick={() => openCancelModal(order.id || order.order_id || order._id)}
                                                className="bg-[#e11d48] text-white text-[11px] sm:text-[12px] font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded hover:bg-[#be123c] transition-colors uppercase ml-auto"
                                            >
                                                CANCEL ORDER
                                            </button>
                                        );
                                    }
                                    return null;
                                })()}
                                {(order.orderStatus || order.status || order.order_status)?.toLowerCase() === 'delivered' && (
                                    <button
                                        onClick={() => openReturnModal(order.id || order.order_id || order._id)}
                                        className="border border-[#135B42] text-[#135B42] bg-white text-[11px] sm:text-[12px] font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded hover:bg-gray-50 transition-colors uppercase ml-auto"
                                    >
                                        REQUEST RETURN
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {orders.length === 0 && (
                    <div className="text-center py-12 text-gray-500 text-[13px]">
                        No orders found.
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            {cancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-[480px] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[#F7F1EB] bg-[#FDFCFB]">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="text-[#f59e0b]" size={24} strokeWidth={2.5} />
                                <h3 className="text-[17px] font-bold text-[#135B42]">Cancel Order</h3>
                            </div>
                            <button
                                onClick={() => setCancelModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 pb-8">
                            {cancelError ? (
                                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-600 text-[13px] font-medium flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{cancelError}</span>
                                </div>
                            ) : null}
                            <p className="text-[15px] text-[#4b5563] leading-relaxed">
                                Are you sure you want to cancel this order? This action cannot be undone.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-[#F9FAFB] p-5 flex items-center justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => setCancelModalOpen(false)}
                                disabled={isCancelling}
                                className="px-5 py-2.5 bg-white border border-gray-300 rounded text-[13px] font-bold text-[#374151] hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                No, Keep It
                            </button>
                            <button
                                onClick={confirmCancelOrder}
                                disabled={isCancelling}
                                className="px-5 py-2.5 bg-[#e11d48] text-white rounded text-[13px] font-bold hover:bg-[#be123c] transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isCancelling && <Loader2 size={14} className="animate-spin" />}
                                Yes, Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return / Replacement Modal */}
            {returnModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <form onSubmit={submitReturnRequest} className="bg-white rounded-lg shadow-xl w-full max-w-[500px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[#F7F1EB] bg-[#FDFCFB] shrink-0">
                            <div className="flex items-center gap-3">
                                <h3 className="text-[17px] font-bold text-[#135B42]">Request Return / Replacement</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReturnModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            {returnError && (
                                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-md text-red-600 text-[13px] font-medium flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{returnError}</span>
                                </div>
                            )}

                            <div className="space-y-5">
                                {/* Type Selection */}
                                <div>
                                    <label className="block text-[13px] font-bold text-[#303030] mb-2">Request Type</label>
                                    {returnForm.isCOD ? (
                                        // COD order — only replacement allowed
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded flex gap-3 text-[12px] text-amber-800">
                                            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                                            <div>
                                                <p className="font-bold mb-1">Replacement Available for COD Orders</p>
                                                <p>For Cash on Delivery orders, we offer a direct replacement for your item. Refund options are currently available for prepaid orders only.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" checked={returnForm.type === 'refund'} onChange={() => setReturnForm({ ...returnForm, type: 'refund' })} className="accent-[#135B42]" />
                                                <span className="text-[14px] text-gray-700">Return &amp; Refund</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" checked={returnForm.type === 'replacement'} onChange={() => setReturnForm({ ...returnForm, type: 'replacement' })} className="accent-[#135B42]" />
                                                <span className="text-[14px] text-gray-700">Replacement</span>
                                            </label>
                                        </div>
                                    )}
                                    {!returnForm.isCOD && (
                                        <p className="text-[11px] text-gray-500 mt-1.5">
                                            {returnForm.type === 'refund'
                                                ? '⚠️ Return & Refund: Return the item to receive your money back via Bank/UPI. Payment details are required.'
                                                : '✅ Replacement: Return the original item to receive a new replacement. No payment details are needed.'}
                                        </p>
                                    )}
                                </div>

                                {/* Reason Dropdown */}
                                <div>
                                    <label className="block text-[13px] font-bold text-[#303030] mb-2">Reason</label>
                                    <select
                                        value={returnForm.reason}
                                        onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#135B42]"
                                        required
                                    >
                                        <option value="">Select a reason</option>
                                        <option value="Defective / Damaged">Defective / Damaged</option>
                                        <option value="Wrong Item Delivered">Wrong Item Delivered</option>
                                        <option value="Quality not as expected">Quality not as expected</option>
                                        <option value="Changed my mind">Changed my mind</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Comments Box */}
                                <div>
                                    <label className="block text-[13px] font-bold text-[#303030] mb-2">Additional Comments</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Please provide more details..."
                                        value={returnForm.comments}
                                        onChange={(e) => setReturnForm({ ...returnForm, comments: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#135B42] resize-none"
                                    ></textarea>
                                </div>

                                {/* Payment Info for Refund */}
                                {returnForm.type === 'refund' && (
                                    <div className="border border-amber-200 bg-amber-50 rounded p-4 space-y-3">
                                        <p className="text-[12px] font-bold text-amber-700 uppercase tracking-wide">Refund Payment Details</p>

                                        {/* Tab Toggle */}
                                        <div className="flex border border-amber-300 rounded overflow-hidden text-[12px] font-bold">
                                            <button
                                                type="button"
                                                onClick={() => setReturnForm({ ...returnForm, paymentMethod: 'upi', accountHolder: '', accountNumber: '', ifsc: '' })}
                                                className={`flex-1 py-1.5 transition-colors ${returnForm.paymentMethod === 'upi'
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-white text-amber-700 hover:bg-amber-50'
                                                    }`}
                                            >
                                                UPI
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setReturnForm({ ...returnForm, paymentMethod: 'bank', upiId: '' })}
                                                className={`flex-1 py-1.5 transition-colors ${returnForm.paymentMethod === 'bank'
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-white text-amber-700 hover:bg-amber-50'
                                                    }`}
                                            >
                                                Bank Transfer
                                            </button>
                                        </div>

                                        {returnForm.paymentMethod === 'upi' ? (
                                            <div>
                                                <label className="block text-[12px] font-bold text-[#303030] mb-1">UPI ID</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 9876543210@upi"
                                                    value={returnForm.upiId}
                                                    onChange={(e) => setReturnForm({ ...returnForm, upiId: e.target.value })}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#135B42]"
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-[12px] font-bold text-[#303030] mb-1">Account Holder Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Full name as on bank account"
                                                        value={returnForm.accountHolder}
                                                        onChange={(e) => setReturnForm({ ...returnForm, accountHolder: e.target.value })}
                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#135B42]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[12px] font-bold text-[#303030] mb-1">Account Number</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Bank account number"
                                                        value={returnForm.accountNumber}
                                                        onChange={(e) => setReturnForm({ ...returnForm, accountNumber: e.target.value })}
                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#135B42]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[12px] font-bold text-[#303030] mb-1">IFSC Code</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. SBIN0001234"
                                                        value={returnForm.ifsc}
                                                        onChange={(e) => setReturnForm({ ...returnForm, ifsc: e.target.value.toUpperCase() })}
                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#135B42] uppercase"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* File Upload */}
                                <div>
                                    <label className="block text-[13px] font-bold text-[#303030] mb-2">Upload Photos/Videos</label>
                                    
                                    <div className="border border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <Upload className="mx-auto text-gray-400 mb-2" size={20} />
                                        <p className="text-[13px] text-gray-500">Click to upload photos or videos</p>
                                        <p className="text-[11px] text-gray-400 mt-2">Max 50 MB per file • Images & Videos</p>
                                    </div>

                                    {/* Previews (Outside the click area so they can be deleted) */}
                                    {returnFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mt-4">
                                            {returnFiles.map((f, i) => (
                                                <div key={i} className="relative w-16 h-16 border border-gray-200 rounded overflow-hidden shadow-sm bg-white group">
                                                    {f.type.startsWith('video/') ? (
                                                        <video src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={URL.createObjectURL(f)} alt="preview" className="w-full h-full object-cover" />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); removeFile(i); }}
                                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600 cursor-pointer"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-[#F9FAFB] p-5 flex items-center justify-end gap-3 border-t border-gray-100 shrink-0">
                            <button
                                type="button"
                                onClick={() => setReturnModalOpen(false)}
                                disabled={isReturning}
                                className="px-5 py-2.5 bg-white border border-gray-300 rounded text-[13px] font-bold text-[#374151] hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isReturning}
                                className="px-5 py-2.5 bg-[#135B42] text-white rounded text-[13px] font-bold hover:bg-[#0c402d] transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isReturning && <Loader2 size={14} className="animate-spin" />}
                                Submit Request
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-24 right-4 z-[9999] bg-[#F8FAF9] px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-[#1f2937] flex items-start sm:items-center gap-3 transition-all duration-300 animate-in slide-in-from-top-2 max-w-[400px] border border-gray-100">
                    <div className="shrink-0 mt-0.5 sm:mt-0">
                        {toast.type === 'error' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        )}
                    </div>
                    <span className="text-[15px] font-medium leading-snug flex-1">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2 -mr-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            )}
        </div>
    );
}
