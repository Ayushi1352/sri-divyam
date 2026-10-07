async function run() {
    try {
        const payload = {
            shippingAddress: {
                title: "Test User",
                street: "123 Test St",
                city: "Test City",
                state: "Test State",
                zipCode: "123456",
                country: "India",
                mobile: "9999999999"
            },
            paymentMethod: "Razorpay",
            totalAmount: 399.8,
            discountAmount: 0,
            subtotal: 399.8
        };

        const res = await fetch('https://sridhivyam-backend.vercel.app/api/orders/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch(e) {
        console.error(e);
    }
}
run();
