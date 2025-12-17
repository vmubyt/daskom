/* Quantity Logic */

let qty = 1;
function updateQty(delta) {
    const qtyDisplay = document.getElementById('qtyDisplay');
    if (!qtyDisplay) return;

    qty += delta;
    if (qty < 1) qty = 1;
    if (qty > 50) qty = 50;

    qtyDisplay.innerText = qty;
}

/* WhatsApp Order Logic */
function handleWhatsappOrder(e) {
    e.preventDefault();

    // Get Product Info
    const productTitle = document.querySelector('h1') ? document.querySelector('h1').innerText : 'Product';

    // Construct Message
    const text = `Halo Admin Monotech, saya mau pesan:%0A` +
        `Produk: ${productTitle}%0A` +
        `Jumlah: ${qty}%0A` +
        `--------------------%0A` +
        `Mohon info ketersediaan stok dan total harga.`;

    // WhatsApp API
    const waNumber = "6281225220072";

    // Open WhatsApp
    const url = `https://wa.me/${waNumber}?text=${text}`;
    window.open(url, '_blank');
}

/* Contact Form Logic */
function handleContactSubmit(e) {
    e.preventDefault();

    // Simulate API Call
    const btn = e.target.querySelector('button');

    const originalText = btn.innerText;


    btn.innerText = "Mengirim...";
    btn.disabled = true;

    setTimeout(() => {
        alert("Pesan Anda telah berhasil dikirim! (Simulasi Static)");
        e.target.reset();
        btn.innerText = originalText;
        btn.disabled = false;
    }, 1500);
}
