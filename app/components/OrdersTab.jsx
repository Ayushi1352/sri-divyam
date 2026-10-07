"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Package, Search, XCircle, ChevronRight } from "lucide-react";
import { apiClient } from "../utils/apiClient";
import Link from "next/link";

export default function OrdersTab() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [trackingData, setTrackingData] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get("/api/orders");
            if (data && Array.isArray(data.orders)) {
                setOrders(data.orders);
            } else if (Array.isArray(data)) {
                setOrders(data);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (id) => {
        setLoading(true);
        try {
            const data = await apiClient.get(`/api/orders/${id}`);
            if (data && data.order) {
                setSelectedOrder(data.order);
            } else {
                setSelectedOrder(data);
            }
        } catch (error) {
            console.error("Failed to fetch order details:", error);
        } finally {
            setLoading(false);
        }
    };

    const trackOrder = async (id) => {
        setTrackingLoading(true);
        try {
            const data = await apiClient.get(`/api/orders/${id}/track`);
            setTrackingData(data);
        } catch (error) {
            console.error("Failed to track order:", error);
            alert("Failed to get tracking information.");
        } finally {
            setTrackingLoading(false);
        }
    };

    const cancelOrder = async (id) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        setCancelLoading(true);
        try {
            await apiClient.post(`/api/orders/${id}/cancel`, {
                reason: "Customer requested cancellation"
            });
            alert("Order cancelled successfully.");
            fetchOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error("Failed to cancel order:", error);
            alert(error.message || error?.response?.data?.message || "Failed to cancel order. Please try again.");
        } finally {
            setCancelLoading(false);
        }
    };

    if (loading && !selectedOrder && orders.length === 0) {
        return (
            <div className="flex justify-center items-center py-20 bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <Loader2 size={32} className="animate-spin text-[#135B42]" />
            </div>
        );
    }

    if (selectedOrder) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => { setSelectedOrder(null); setTrackingData(null); }} className="text-[#135B42] font-semibold flex items-center gap-2 hover:underline">
                        &larr; Back to Orders
                    </button>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        (() => {
                            const s = (selectedOrder.orderStatus || selectedOrder.status || selectedOrder.order_status || "").toLowerCase();
                            if (s === 'cancelled') return 'bg-red-100 text-red-700';
                            if (s === 'delivered') return 'bg-green-100 text-green-700';
                            if (s === 'shipped' || s === 'dispatched') return 'bg-blue-100 text-blue-700';
                            return 'bg-amber-100 text-amber-700';
                        })()
                    }`}>
                        {selectedOrder.orderStatus || selectedOrder.status || selectedOrder.order_status || "Pending"}
                    </span>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-bold text-[#303030] mb-2">Order #{selectedOrder._id?.slice(-8).toUpperCase()}</h3>
                    <p className="text-sm text-gray-500">Placed on {new Date(selectedOrder.createdAt || selectedOrder.created_at || Date.now()).toLocaleDateString()}</p>
                </div>

                <div className="space-y-4 mb-6">
                    <h4 className="font-bold text-gray-800">Items</h4>
                    <div className="border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
                        {selectedOrder.items?.map((item, idx) => (
                            <div key={idx} className="p-4 flex justify-between items-center bg-[#FAF8F5]">
                                <div>
                                    <p className="font-semibold text-sm">{item.productName || item.product?.title || "Product"}</p>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-bold text-sm">₹{item.price * item.quantity}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-100">
                    <button 
                        onClick={() => trackOrder(selectedOrder._id || selectedOrder.id)}
                        disabled={trackingLoading}
                        className="bg-[#135B42] text-white px-5 py-2.5 rounded-md text-[13px] font-bold flex items-center gap-2 hover:bg-[#0f4a35]"
                    >
                        {trackingLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} 
                        Track Order
                    </button>
                    
                    {(() => {
                        const s = (selectedOrder.orderStatus || selectedOrder.status || selectedOrder.order_status || "").toLowerCase();
                        const cannotCancel = s === 'cancelled' || s === 'delivered' || s === 'shipped' || s === 'dispatched';
                        if (!cannotCancel) {
                            return (
                                <button 
                                    onClick={() => cancelOrder(selectedOrder._id || selectedOrder.id)}
                                    disabled={cancelLoading}
                                    className="bg-white border border-red-500 text-red-500 px-5 py-2.5 rounded-md text-[13px] font-bold flex items-center gap-2 hover:bg-red-50"
                                >
                                    {cancelLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} 
                                    Cancel Order
                                </button>
                            );
                        }
                        return null;
                    })()}
                </div>

                {trackingData && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <h4 className="font-bold text-blue-800 mb-2">Tracking Information</h4>
                        <pre className="text-xs text-blue-900 whitespace-pre-wrap">{JSON.stringify(trackingData, null, 2)}</pre>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <h3 className="text-[18px] font-bold text-[#303030] mb-6 flex items-center gap-2">
                <Package size={20} className="text-[#135B42]" />
                My Orders
            </h3>

            {orders.length === 0 ? (
                <div className="text-center py-10">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                    <Link href="/all-products">
                        <button className="bg-[#135B42] text-white px-6 py-2 rounded-md font-medium hover:bg-[#0f4a35]">
                            Start Shopping
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order._id || order.id} className="border border-gray-100 rounded-lg p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-[#135B42] transition-colors bg-[#FAF8F5]">
                            <div>
                                <p className="font-bold text-gray-800 mb-1">Order #{(order._id || order.id)?.slice(-8).toUpperCase()}</p>
                                <p className="text-xs text-gray-500 mb-2">Placed on {new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString()}</p>
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    (() => {
                                        const s = (order.orderStatus || order.status || order.order_status || "").toLowerCase();
                                        if (s === 'cancelled') return 'bg-red-100 text-red-700';
                                        if (s === 'delivered') return 'bg-green-100 text-green-700';
                                        if (s === 'shipped' || s === 'dispatched') return 'bg-blue-100 text-blue-700';
                                        return 'bg-amber-100 text-amber-700';
                                    })()
                                }`}>
                                    {order.orderStatus || order.status || order.order_status || "Pending"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                                <div className="text-left md:text-right">
                                    <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                                    <p className="font-bold text-[#303030]">₹{order.totalAmount || order.total_amount || 0}</p>
                                </div>
                                <button 
                                    onClick={() => fetchOrderDetails(order._id || order.id)}
                                    className="p-2 bg-white rounded-full border border-gray-200 text-[#135B42] hover:bg-[#135B42] hover:text-white transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
