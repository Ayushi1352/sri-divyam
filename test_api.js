async function run() {
    try {
        const res = await fetch('https://sridhivyam-backend.vercel.app/api/products');
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch(e) {
        console.error(e);
    }
}
run();
