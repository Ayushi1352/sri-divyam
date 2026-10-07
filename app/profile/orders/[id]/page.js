"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, API_BASE_URL } from "../../../utils/apiClient";
import { Loader2, ArrowLeft, Package, MapPin, CreditCard, Clock, FileText, CheckCircle2, X } from "lucide-react";

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [trackingSteps, setTrackingSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!params.id) return;

        const fetchOrderDetails = async () => {
            try {
                const data = await apiClient.get(`/api/orders/${params.id}`);
                setOrder(data.order || data.data || data);
                
                try {
                    const trackData = await apiClient.get(`/api/orders/${params.id}/track`);
                    let steps = trackData.tracking || trackData.data || trackData;
                    if (!Array.isArray(steps)) {
                        // If it's a single object returned, put it in an array
                        if (steps && typeof steps === 'object') {
                            steps = [steps];
                        } else {
                            steps = [];
                        }
                    }
                    setTrackingSteps(steps);
                } catch (e) {
                    console.log("Tracking data not available or failed to fetch", e);
                }
            } catch (err) {
                console.error("Failed to fetch order details:", err);
                setError(err.message || "Failed to load order details");
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [params.id]);

    if (loading) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-[#135B42]" size={40} /></div>;
    }

    if (error || !order) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error || "Order not found"}</p>
                <button onClick={() => router.back()} className="text-[#135B42] hover:underline font-bold text-[13px]">
                    &larr; Back to Orders
                </button>
            </div>
        );
    }

    const orderItems = order.items || order.order_items || [];
    
    const getOrderTotal = (o) => {
        let t = o.total || o.total_amount || o.totalAmount || o.amount || o.totalPrice || o.total_price;
        if (t !== undefined && t !== null && t !== "") return t;
        
        const items = o.items || o.order_items || [];
        return items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || item.qty || 1)), 0);
    };

    const status = order.status || order.order_status || "Processing";
    
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

    // Status colors
    const getStatusColor = (s) => {
        const lower = s.toLowerCase();
        if (lower.includes('delivered') || lower.includes('success')) return "bg-green-100 text-green-700 border-green-200";
        if (lower.includes('cancelled') || lower.includes('failed')) return "bg-red-100 text-red-700 border-red-200";
        return "bg-amber-100 text-amber-700 border-amber-200";
    };

    return (
        <div className="space-y-4 sm:space-y-6 w-full min-w-0 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4 border-b border-gray-200 pb-3 sm:pb-4 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button onClick={() => router.push('/profile/orders')} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0">
                        <ArrowLeft size={16} className="text-gray-600 sm:w-4 sm:h-4" />
                    </button>
                    <h2 className="text-[14px] sm:text-[18px] md:text-[20px] font-playfair font-bold text-[#135B42] truncate min-w-0">Order {order.id || order.order_id}</h2>
                </div>
                <div className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border text-[11px] sm:text-[12px] font-bold uppercase tracking-wider ${getStatusColor(status)}`}>
                    {status}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 min-w-0">
                {/* Left Column (Main Info) */}
                <div className="xl:col-span-2 space-y-4 sm:space-y-6 min-w-0">
                    {/* Items */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden min-w-0">
                        <div className="bg-[#FAF8F5] px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-gray-100 flex items-center gap-2">
                            <Package size={16} className="text-[#135B42]" />
                            <h3 className="font-bold text-[13px] sm:text-[14px] text-[#303030]">Items Ordered ({orderItems.length})</h3>
                        </div>
                        <div className="px-3.5 py-3 sm:px-5 sm:py-4 divide-y divide-gray-100 min-w-0">
                            {orderItems.map((item, idx) => (
                                <div key={idx} className="py-2.5 sm:py-3 first:pt-0 last:pb-0 flex items-center gap-2.5 sm:gap-4 min-w-0">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#F7F1EB] rounded-md overflow-hidden shrink-0 border border-gray-100">
                                        {getImageUrl(item) ? (
                                            <img src={getImageUrl(item)} alt={item.name || item.product_name} className="w-full h-full object-cover mix-blend-darken" />
                                        ) : (
                                            <div className="w-full h-full bg-[#135B42]"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[12px] sm:text-[14px] font-bold text-[#303030] truncate sm:whitespace-normal">{item.name || item.product_name || item.product?.name}</h4>
                                        <p className="text-[11px] sm:text-[12px] text-gray-500 mt-0.5">Quantity: {item.quantity || item.qty}</p>
                                    </div>
                                    <div className="text-[12px] sm:text-[14px] font-bold text-[#303030] shrink-0 text-right">
                                        ₹ {(item.price || 0) * (item.quantity || item.qty || 1)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden p-3.5 sm:p-6 min-w-0">
                        <h3 className="font-bold text-[13px] sm:text-[14px] text-[#303030] mb-4 sm:mb-6 flex items-center gap-2 border-b pb-3 sm:pb-4">
                            <Clock size={16} className="text-[#135B42]" />
                            Order Timeline
                        </h3>
                        <div className="space-y-4 sm:space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px xl:before:mx-auto xl:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E8DDD4] before:to-transparent">
                            {(() => {
                                const history = order.tracking?.statusHistory || [];
                                
                                if (history.length > 0) {
                                    return history.map((event, idx) => {
                                        const statusStr = (event.status || "").toLowerCase();
                                        let Icon = Package;
                                        let colorClass = 'bg-[#135B42] text-white';
                                        let borderClass = 'border-[#135B42]/20 bg-[#FAF8F5]';
                                        let textTitleClass = 'text-[#303030]';
                                        let textTimeClass = 'text-[#135B42]';
                                        let textDescClass = 'text-gray-600';
                                        
                                        if (statusStr.includes('cancel') || statusStr.includes('fail')) {
                                            Icon = X;
                                            colorClass = 'bg-red-600 text-white border-red-600';
                                            borderClass = 'border-red-100 bg-red-50';
                                            textTitleClass = 'text-red-800';
                                            textTimeClass = 'text-red-600';
                                            textDescClass = 'text-red-600';
                                        } else if (statusStr.includes('deliver') || statusStr.includes('complet')) {
                                            Icon = CheckCircle2;
                                        }

                                        return (
                                            <div key={idx} className="relative flex items-center justify-between xl:justify-normal xl:odd:flex-row-reverse group">
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow shrink-0 xl:order-1 xl:group-odd:-translate-x-1/2 xl:group-even:translate-x-1/2 z-10 transition-colors duration-300 ${colorClass}`}>
                                                    <Icon size={14} />
                                                </div>
                                                <div className={`w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] xl:w-[calc(50%-2.5rem)] p-3 sm:p-4 rounded-sm border transition-colors duration-300 ${borderClass} shadow-sm min-w-0`}>
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                        <div className={`font-bold text-[12px] sm:text-[13px] capitalize ${textTitleClass}`}>{event.status}</div>
                                                        <time className={`font-medium text-[10px] sm:text-[11px] ${textTimeClass}`}>
                                                            {new Date(event.timestamp || event.createdAt || event.date || Date.now()).toLocaleString()}
                                                        </time>
                                                    </div>
                                                    <div className={`text-[11px] sm:text-[12px] leading-relaxed ${textDescClass}`}>
                                                        {event.message}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                }

                                // Fallback if no statusHistory is present in older orders
                                const currentStatus = (order.status || order.order_status || order.orderStatus || "placed").toLowerCase();
                                const orderDate = new Date(order.created_at || order.createdAt || order.date || Date.now()).toLocaleString();
                                
                                let activeIndex = 0;
                                if (currentStatus.includes('confirm') || currentStatus.includes('process') || currentStatus.includes('accept')) activeIndex = 1;
                                else if (currentStatus.includes('ship') || currentStatus.includes('dispatch') || currentStatus.includes('transit')) activeIndex = 2;
                                else if (currentStatus.includes('deliver') || currentStatus.includes('complet')) activeIndex = 3;
                                else if (currentStatus.includes('cancel')) activeIndex = -1;

                                if (activeIndex === -1) {
                                    return (
                                        <div className="relative flex items-center justify-between xl:justify-normal xl:odd:flex-row-reverse group">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-red-600 text-white shadow shrink-0 xl:order-1 xl:group-odd:-translate-x-1/2 xl:group-even:translate-x-1/2 z-10">
                                                <CheckCircle2 size={14} />
                                            </div>
                                            <div className="w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] xl:w-[calc(50%-2.5rem)] p-3 sm:p-4 rounded-sm border border-red-100 bg-red-50 shadow-sm min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                    <div className="font-bold text-red-800 text-[12px] sm:text-[13px]">Order Cancelled</div>
                                                    <time className="font-medium text-red-600 text-[10px] sm:text-[11px]">{orderDate}</time>
                                                </div>
                                                <div className="text-red-600 text-[11px] sm:text-[12px]">This order has been cancelled.</div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="relative flex items-center justify-between xl:justify-normal xl:odd:flex-row-reverse group">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow shrink-0 xl:order-1 xl:group-odd:-translate-x-1/2 xl:group-even:translate-x-1/2 z-10 transition-colors duration-300 bg-[#135B42] text-white">
                                            <Package size={14} />
                                        </div>
                                        <div className="w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] xl:w-[calc(50%-2.5rem)] p-3 sm:p-4 rounded-sm border transition-colors duration-300 border-[#135B42]/20 bg-[#FAF8F5] shadow-sm min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                <div className="font-bold text-[12px] sm:text-[13px] capitalize text-[#303030]">{order.orderStatus || 'Pending'}</div>
                                                <time className="font-medium text-[#135B42] text-[10px] sm:text-[11px]">
                                                    {orderDate}
                                                </time>
                                            </div>
                                            <div className="text-[11px] sm:text-[12px] text-gray-600">
                                                Order status is currently {order.orderStatus || 'pending'}.
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Right Column (Summary & Address) */}
                <div className="space-y-4 sm:space-y-6 min-w-0">
                    {/* Summary */}
                    <div className="bg-[#FAF8F5] border border-gray-100 rounded-xl shadow-sm overflow-hidden p-3.5 sm:p-5 min-w-0">
                        <h3 className="font-bold text-[13px] sm:text-[14px] text-[#303030] mb-3 sm:mb-4 flex items-center gap-2 border-b pb-2.5 sm:pb-3">
                            <FileText size={16} className="text-[#135B42]" />
                            Order Summary
                        </h3>
                        {(() => {
                            const isUttarPradesh = (state) => {
                                if (!state) return false;
                                const clean = state.trim().toLowerCase().replace(/[^a-z]/g, "");
                                return clean === "uttarpradesh" || clean === "up";
                            };

                            const items = order.items || order.products || [];
                            const itemsSubtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || item.qty || 1)), 0);
                            const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
                            const shippingCost = order.shippingCost || order.shipping_cost || 0;
                            const discount = order.discount || order.discount_amount || 0;
                            const paymentMethod = (order.paymentMethod || order.payment_method || "").toUpperCase();
                            const isCOD = paymentMethod.includes('COD') || paymentMethod.includes('CASH');
                            
                            const codCharge = order.codCharge !== undefined && order.codCharge !== null 
                                ? order.codCharge 
                                : (isCOD ? 100 : 0);
                                
                            const onlineDiscount = order.onlineDiscount !== undefined && order.onlineDiscount !== null 
                                ? order.onlineDiscount 
                                : (!isCOD ? Number(((itemsSubtotal - discount) * 0.05).toFixed(2)) : 0);

                            const totalDiscount = discount + onlineDiscount;

                            const taxableValue = order.taxableValue !== undefined && order.taxableValue !== null
                                ? order.taxableValue
                                : Number((itemsSubtotal * 0.97).toFixed(2));

                            const gstAmount = order.gstAmount !== undefined && order.gstAmount !== null
                                ? order.gstAmount
                                : Number((itemsSubtotal - taxableValue).toFixed(2));
                            
                            const grandTotal = order.totalAmount || order.total_amount || order.total || order.amount || 0;

                            return (
                                <div className="space-y-2.5 sm:space-y-3 text-[12px] sm:text-[13px] min-w-0">
                                    <div className="flex justify-between text-gray-600 gap-2">
                                        <span className="truncate">Product/Original Price</span>
                                        <span className="font-medium shrink-0">₹{itemsSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 gap-2">
                                        <span>Quantity</span>
                                        <span className="font-medium shrink-0">{totalQuantity}</span>
                                    </div>
                                    
                                    {totalDiscount > 0 && (
                                        <div className="flex justify-between text-[#135B42] gap-2">
                                            <span>Discounts</span>
                                            <span className="font-bold shrink-0">-₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    
                                    {gstAmount > 0 && (
                                        <div className="flex justify-between text-gray-500 text-[11px] sm:text-[12px] gap-2">
                                            <span className="truncate">GST (Included in prices)</span>
                                            <span className="shrink-0">Inclusive</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between text-gray-600 gap-2">
                                        <span className="truncate">Shipping/Delivery</span>
                                        <span className="font-medium shrink-0">
                                            {shippingCost === 0 ? <span className="text-[#047857] font-bold">FREE</span> : `₹${shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </span>
                                    </div>

                                    {codCharge > 0 && (
                                        <div className="flex justify-between text-gray-600 gap-2">
                                            <span className="truncate">Add-on/Additional Charges</span>
                                            <span className="font-medium shrink-0">+₹{codCharge.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    
                                    <div className="pt-2.5 sm:pt-3 mt-1 border-t border-gray-200 flex justify-between font-bold text-[13px] sm:text-[15px] text-[#303030] gap-2">
                                        <span className="truncate">Final/Total Price</span>
                                        <span className="shrink-0">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Address */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden p-3.5 sm:p-5 min-w-0">
                        <h3 className="font-bold text-[13px] sm:text-[14px] text-[#303030] mb-3 sm:mb-4 flex items-center gap-2 border-b pb-2.5 sm:pb-3">
                            <MapPin size={16} className="text-[#135B42]" />
                            Shipping Details
                        </h3>
                        {(() => {
                            const address = order.address || order.shipping_address || order.shippingAddress || order.delivery_address;
                            if (address) {
                                return (
                                    <div className="text-[11px] sm:text-[12px] text-gray-600 leading-relaxed min-w-0">
                                        <p className="font-bold text-[#303030]">
                                            {address.first_name || address.firstName || address.name || ""} {address.last_name || address.lastName || ""}
                                        </p>
                                        <p className="break-words">{address.address1 || address.street || address.address || ""}</p>
                                        {(address.address2 || address.landmark) && <p className="break-words">{address.address2 || address.landmark}</p>}
                                        <p className="break-words">{address.city || ""}, {address.state || ""} - {address.zipcode || address.zip || address.pincode || ""}</p>
                                        {(address.phone || address.mobile) && <p className="mt-1.5 text-gray-500">Phone: {address.phone || address.mobile}</p>}
                                    </div>
                                );
                            }
                            return <p className="text-[11px] sm:text-[12px] text-gray-500">Address details not available.</p>;
                        })()}
                    </div>

                    {/* Payment */}
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden p-3.5 sm:p-5 min-w-0">
                        <h3 className="font-bold text-[13px] sm:text-[14px] text-[#303030] mb-3 sm:mb-4 flex items-center gap-2 border-b pb-2.5 sm:pb-3">
                            <CreditCard size={16} className="text-[#135B42]" />
                            Payment Method
                        </h3>
                        <p className="text-[12px] sm:text-[13px] font-bold text-gray-700 capitalize">
                            {(() => {
                                const method = (order.payment_method || order.paymentMethod || order.payment_type || order.paymentType || "").toLowerCase();
                                if (method.includes('cod') || method.includes('cash on delivery')) {
                                    return "Cash on Delivery";
                                }
                                return order.payment_method || order.paymentMethod || order.payment_type || order.paymentType || "Online Payment";
                            })()}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1">
                            Status: <span className="text-green-600 font-bold capitalize">{order.payment_status || order.paymentStatus || "Completed"}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
