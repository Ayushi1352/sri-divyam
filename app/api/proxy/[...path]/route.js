import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    const path = (await params).path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/${path}${searchParams ? `?${searchParams}` : ""}`;
    
    const token = request.headers.get("authorization");

    try {
        const response = await fetch(targetUrl, {
            headers: {
                "Accept": "application/json",
                "Authorization": token || ""
            }
        });

        let data = await response.json();

        // 🎯 Apply the specific transformation requested by the user for the Cart API
        if (path === "cart" && data.success && data.cart) {
            const count = data.cart.total_items || 0;
            
            // 1. Move the original list to a new key so the frontend can still work
            data.cart._original_items = data.cart.items;
            
            // 2. Transform the 'items' field to show only the count string as requested
            data.cart.items = `${count} product${count !== 1 ? 's' : ''}`;
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Proxy error", details: error.message }, { status: 500 });
    }
}

// Support other methods if needed
export async function POST(request, { params }) {
    const path = (await params).path.join("/");
    const targetUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/${path}`;
    const token = request.headers.get("authorization");
    const contentType = request.headers.get("content-type") || "";

    try {
        let fetchOptions;

        if (contentType.includes("multipart/form-data")) {
            // FormData — pass raw body + content-type (with boundary) directly through
            const rawBody = await request.arrayBuffer();
            fetchOptions = {
                method: "POST",
                headers: {
                    "Content-Type": contentType,   // must include boundary
                    "Accept": "application/json",
                    "Authorization": token || ""
                },
                body: rawBody
            };
        } else {
            // JSON body
            const body = await request.json();
            fetchOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": token || ""
                },
                body: JSON.stringify(body)
            };
        }

        const response = await fetch(targetUrl, fetchOptions);
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: "Proxy error", details: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const path = (await params).path.join("/");
    const targetUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/${path}`;
    const token = request.headers.get("authorization");

    try {
        const response = await fetch(targetUrl, {
            method: "DELETE",
            headers: {
                "Accept": "application/json",
                "Authorization": token || ""
            }
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Proxy error" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const path = (await params).path.join("/");
    const targetUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/${path}`;
    const token = request.headers.get("authorization");
    const contentType = request.headers.get("content-type") || "";
    
    try {
        let fetchOptions;

        if (contentType.includes("multipart/form-data")) {
            // FormData — pass raw body + content-type (with boundary) directly through
            const rawBody = await request.arrayBuffer();
            fetchOptions = {
                method: "PUT",
                headers: {
                    "Content-Type": contentType,
                    "Accept": "application/json",
                    "Authorization": token || ""
                },
                body: rawBody
            };
        } else {
            // JSON or text body
            let bodyContent;
            if (contentType.includes("application/json")) {
                const body = await request.json();
                bodyContent = JSON.stringify(body);
            } else {
                bodyContent = await request.text();
            }

            fetchOptions = {
                method: "PUT",
                headers: {
                    "Content-Type": contentType,
                    "Accept": "application/json",
                    "Authorization": token || ""
                },
                body: bodyContent
            };
        }

        const response = await fetch(targetUrl, fetchOptions);
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: "Proxy error", details: error.message }, { status: 500 });
    }
}
