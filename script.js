const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8r6iQn9wQ7ZOTTWz_COXIrdxKPfG3KoKcmhab7vez9SC9pR9f8nK0JfxCLi-6i76j/exec";
const NOMOR_ADMIN = "6285808474915";

const DAFTAR_HARGA = {
  "Dimsum Original": 12000,
  "Dimsum Keju": 14000,
  "Dimsum Crab Stick": 15000,
  "Dimsum Mix": 15000
};

const orderForm = document.getElementById('orderForm');
const varianContainer = document.getElementById('varianContainer');
const varianTemplate = document.getElementById('varianTemplate');
const btnTambahVarian = document.getElementById('btnTambahVarian');
const totalDisplay = document.getElementById('totalHargaDisplay');

function formatRupiah(nominal) {
  return `Rp ${nominal.toLocaleString('id-ID')}`;
}

/**
 * Hitung dan perbarui total harga secara langsung
 */
function updateLiveTotal() {
  if (!varianContainer || !totalDisplay) return;

  const items = varianContainer.querySelectorAll('.varian-item');
  let grandTotal = 0;

  items.forEach(item => {
    const sel = item.querySelector('.item-varian');
    const inp = item.querySelector('.item-jumlah');
    const harga = DAFTAR_HARGA[sel?.value] || 12000;
    const qty = Math.max(1, parseInt(inp?.value, 10) || 1);
    grandTotal += harga * qty;
  });

  totalDisplay.textContent = formatRupiah(grandTotal);
  totalDisplay.classList.remove('price-pulse');
  void totalDisplay.offsetWidth;
  totalDisplay.classList.add('price-pulse');

  items.forEach(item => {
    const btnHapus = item.querySelector('.btn-hapus-varian');
    btnHapus?.classList.toggle('hidden', items.length <= 1);
  });
}

/**
 * Tambah baris item varian baru dari <template>
 */
function tambahItemVarian(pilihanVarian = null, defaultQty = 1) {
  if (!varianContainer || !varianTemplate) return;

  const clone = varianTemplate.content.cloneNode(true);
  const item = clone.querySelector('.varian-item');
  const sel = item.querySelector('.item-varian');
  const inp = item.querySelector('.item-jumlah');
  const btnMinus = item.querySelector('.btn-minus');
  const btnPlus = item.querySelector('.btn-plus');
  const btnHapus = item.querySelector('.btn-hapus-varian');

  let targetVarian = pilihanVarian;
  if (!targetVarian) {
    const sudahAda = Array.from(varianContainer.querySelectorAll('.item-varian')).map(s => s.value);
    const semuaVarian = Object.keys(DAFTAR_HARGA);
    targetVarian = semuaVarian.find(v => !sudahAda.includes(v)) || semuaVarian[0];
  }

  sel.value = targetVarian;
  inp.value = defaultQty;

  sel.addEventListener('change', updateLiveTotal);

  inp.addEventListener('input', () => {
    if (parseInt(inp.value, 10) < 1 || isNaN(parseInt(inp.value, 10))) {
      inp.value = 1;
    }
    updateLiveTotal();
  });

  btnMinus.addEventListener('click', () => {
    const current = Math.max(1, parseInt(inp.value, 10) || 1);
    if (current > 1) {
      inp.value = current - 1;
      updateLiveTotal();
    }
  });

  btnPlus.addEventListener('click', () => {
    const current = Math.max(1, parseInt(inp.value, 10) || 1);
    inp.value = current + 1;
    updateLiveTotal();
  });

  btnHapus.addEventListener('click', () => {
    if (varianContainer.querySelectorAll('.varian-item').length > 1) {
      item.remove();
      updateLiveTotal();
    }
  });

  varianContainer.appendChild(item);
  updateLiveTotal();
}

/**
 * Bersihkan form dan hapus seluruh log pesanan ke kondisi awal
 */
function resetFormPesanan() {
  orderForm?.reset();
  if (varianContainer) {
    varianContainer.innerHTML = '';
    tambahItemVarian('Dimsum Original', 1);
  }
}

/**
 * Pilih varian langsung dari tombol pada Card Produk
 */
function pilihVarian(namaVarian) {
  if (!varianContainer) return;

  const items = Array.from(varianContainer.querySelectorAll('.varian-item'));
  const itemSudahAda = items.find(item => item.querySelector('.item-varian')?.value === namaVarian);

  if (!itemSudahAda) {
    const itemPertama = items[0];
    const qtyPertama = itemPertama?.querySelector('.item-jumlah')?.value;
    const varianPertama = itemPertama?.querySelector('.item-varian')?.value;

    if (items.length === 1 && qtyPertama === '1' && varianPertama === 'Dimsum Original') {
      itemPertama.querySelector('.item-varian').value = namaVarian;
      updateLiveTotal();
    } else {
      tambahItemVarian(namaVarian, 1);
    }
  } else {
    updateLiveTotal();
  }

  document.getElementById('pemesanan')?.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Kirim pesanan ke Google Spreadsheet (SPS) di background,
 * bersihkan form seketika, dan buka WhatsApp
 */
function kirimPesananWhatsApp(event) {
  event.preventDefault();

  const nama = document.getElementById('nama')?.value.trim() || '';
  const telepon = document.getElementById('telepon')?.value.trim() || '';
  const alamat = document.getElementById('alamat')?.value.trim() || '';

  const items = Array.from(varianContainer.querySelectorAll('.varian-item'));
  const daftarPesananWA = [];
  const daftarPesananSheet = [];
  let totalPack = 0;
  let totalBiaya = 0;

  items.forEach(item => {
    const sel = item.querySelector('.item-varian');
    const inp = item.querySelector('.item-jumlah');

    const namaVarian = sel?.value || 'Dimsum Original';
    const qty = Math.max(1, parseInt(inp?.value, 10) || 1);
    const hargaSatuan = DAFTAR_HARGA[namaVarian] || 12000;
    const subtotal = hargaSatuan * qty;

    totalPack += qty;
    totalBiaya += subtotal;

    daftarPesananWA.push(`• ${namaVarian}: ${qty} pack (${formatRupiah(subtotal)})`);
    daftarPesananSheet.push(`${namaVarian} (${qty} pack)`);
  });

  const payload = {
    nama,
    telepon,
    varian: daftarPesananSheet.join(', '),
    jumlah: totalPack,
    alamat,
    total: formatRupiah(totalBiaya)
  };

  const formatPesan = [
    'Halo Admin DimdimSum, saya ingin memesan:',
    '',
    `- *Nama:* ${nama}`,
    `- *No. WhatsApp:* ${telepon}`,
    '- *Pesanan:*',
    daftarPesananWA.join('\n'),
    `- *Jumlah:* ${totalPack} pack`,
    `- *Estimasi Total:* ${formatRupiah(totalBiaya)}`,
    `- *Alamat Pengiriman:* ${alamat}`,
    '',
    'Mohon info konfirmasi stoknya, terima kasih!'
  ].join('\n');

  const urlWA = `https://api.whatsapp.com/send?phone=${NOMOR_ADMIN}&text=${encodeURIComponent(formatPesan)}`;

  // 1. Bersihkan form dan log pesanan seketika
  resetFormPesanan();

  // 2. Kirim ke Google Spreadsheet secara asinkron dengan keepalive
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    keepalive: true,
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).catch(err => console.error('Gagal mengirim ke Spreadsheet:', err));

  // 3. Buka WhatsApp secara langsung
  window.open(urlWA, '_blank');
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  tambahItemVarian('Dimsum Original', 1);

  btnTambahVarian?.addEventListener('click', () => tambahItemVarian());
  orderForm?.addEventListener('submit', kirimPesananWhatsApp);

  // Scroll Reveal Observer
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 40px 0px' });

    revealElements.forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('active');
      } else {
        observer.observe(el);
      }
    });
  } else {
    revealElements.forEach(el => el.classList.add('active'));
  }

  // Efek Bayangan Navbar
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('nav-scrolled', window.scrollY > 30);
  });

  // Dropdown Menu Mobile
  const dotsMenuBtn = document.getElementById('dotsMenuBtn');
  const dotsDropdown = document.getElementById('dotsDropdown');

  if (dotsMenuBtn && dotsDropdown) {
    dotsMenuBtn.addEventListener('click', e => {
      e.stopPropagation();
      dotsDropdown.classList.toggle('hidden');
    });

    dotsDropdown.querySelectorAll('.dropdown-link').forEach(link => {
      link.addEventListener('click', () => dotsDropdown.classList.add('hidden'));
    });

    document.addEventListener('click', e => {
      if (!dotsDropdown.contains(e.target) && !dotsMenuBtn.contains(e.target)) {
        dotsDropdown.classList.add('hidden');
      }
    });
  }
});