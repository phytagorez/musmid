// =========================================================
// SAKLAR BUKA / TUTUP ORDER:
// true  = Web menerima pesanan seperti biasa
// false = Muncul overlay "Kuota Batch Penuh" & tombol dikunci
// =========================================================
const BUKA_ORDER = true;

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

// Elemen Upload Bukti QRIS
const inputBuktiBayar = document.getElementById('buktiBayar');
const uploadDropzone = document.getElementById('uploadDropzone');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const uploadPreviewBox = document.getElementById('uploadPreviewBox');
const imgPreviewBukti = document.getElementById('imgPreviewBukti');
const namaFileBukti = document.getElementById('namaFileBukti');

// State penyimpanan Base64 hasil kompresi agar siap dikirim instan
let dataBuktiTerpilih = {
  base64: "",
  mimeType: "",
  fileName: ""
};

function formatRupiah(nominal) {
  return `Rp ${nominal.toLocaleString('id-ID')}`;
}

/**
 * Mengatur tampilan halaman saat Batch Buka vs Batch Penuh
 */
function aturStatusBatch() {
  const overlay = document.getElementById('batchClosedOverlay');
  const cardButtons = document.querySelectorAll('.card-btn-outline');
  const formControls = orderForm?.querySelectorAll('input, select, textarea, button') || [];

  if (!BUKA_ORDER) {
    overlay?.classList.remove('hidden');
    formControls.forEach(el => (el.disabled = true));
    cardButtons.forEach(btn => {
      btn.textContent = 'Batch Penuh';
      btn.disabled = true;
      btn.classList.add('btn-disabled-batch');
    });
  } else {
    overlay?.classList.add('hidden');
  }
}

/**
 * Kompresi gambar otomatis menggunakan Canvas agar upload ke SPS cepat & ringan
 */
function kompresGambarKeBase64(file, maxWidth = 900, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Clean = dataUrl.split(',')[1];
        resolve({
          dataUrl,
          base64: base64Clean,
          mimeType: 'image/jpeg',
          fileName: file.name.replace(/\.[^/.]+$/, "") + ".jpg"
        });
      };
      img.onerror = err => reject(err);
    };
    reader.onerror = err => reject(err);
  });
}

/**
 * Event saat user memilih foto bukti transfer QRIS
 */
if (inputBuktiBayar) {
  inputBuktiBayar.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      namaFileBukti.textContent = "Memproses gambar...";
      uploadPlaceholder.classList.add('hidden');
      uploadPreviewBox.classList.remove('hidden');

      const hasil = await kompresGambarKeBase64(file);
      dataBuktiTerpilih = {
        base64: hasil.base64,
        mimeType: hasil.mimeType,
        fileName: hasil.fileName
      };

      imgPreviewBukti.src = hasil.dataUrl;
      namaFileBukti.textContent = `✓ ${file.name}`;
      uploadDropzone.classList.add('has-file');
    } catch (err) {
      console.error("Gagal memproses gambar:", err);
      alert("Gagal memuat gambar, silakan pilih gambar lain.");
    }
  });
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
 * Bersihkan form, preview bukti bayar, dan log pesanan seketika
 */
function resetFormPesanan() {
  orderForm?.reset();

  // Reset state & tampilan preview upload bukti
  dataBuktiTerpilih = { base64: "", mimeType: "", fileName: "" };
  if (imgPreviewBukti) imgPreviewBukti.src = "";
  if (namaFileBukti) namaFileBukti.textContent = "";
  uploadPreviewBox?.classList.add('hidden');
  uploadPlaceholder?.classList.remove('hidden');
  uploadDropzone?.classList.remove('has-file');

  if (varianContainer) {
    varianContainer.innerHTML = '';
    tambahItemVarian('Dimsum Original', 1);
  }
}

/**
 * Pilih varian langsung dari tombol pada Card Produk
 */
function pilihVarian(namaVarian) {
  if (!BUKA_ORDER || !varianContainer) return;

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
 * Kirim pesanan + bukti QRIS ke Google Spreadsheet (SPS),
 * langsung hapus data log form, dan buka WhatsApp
 */
function kirimPesananWhatsApp(event) {
  event.preventDefault();
  if (!BUKA_ORDER) return;

  if (!dataBuktiTerpilih.base64) {
    alert("Harap upload foto bukti pembayaran QRIS terlebih dahulu!");
    inputBuktiBayar?.focus();
    return;
  }

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

  // Salin data bukti sebelum form di-reset
  const payload = {
    nama,
    telepon,
    varian: daftarPesananSheet.join(', '),
    jumlah: totalPack,
    alamat,
    total: formatRupiah(totalBiaya),
    metode: "QRIS",
    buktiBase64: dataBuktiTerpilih.base64,
    buktiMime: dataBuktiTerpilih.mimeType,
    buktiNama: `Bukti_${nama.replace(/\s+/g, '_')}_${Date.now()}.jpg`
  };

  const formatPesan = [
    'Halo Admin DimdimSum, saya ingin memesan:',
    '',
    `- *Nama:* ${nama}`,
    `- *No. WhatsApp:* ${telepon}`,
    '- *Pesanan:*',
    daftarPesananWA.join('\n'),
    `- *Jumlah:* ${totalPack} pack`,
    `- *Total Bayar (QRIS):* ${formatRupiah(totalBiaya)}`,
    `- *Status Bukti QRIS:* Sudah diupload di Form Web`,
    `- *Alamat Pengiriman:* ${alamat}`,
    '',
    'Mohon info konfirmasi pesanan saya, terima kasih!'
  ].join('\n');

  const urlWA = `https://api.whatsapp.com/send?phone=${NOMOR_ADMIN}&text=${encodeURIComponent(formatPesan)}`;

  // 1. Langsung bersihkan form dan log pesanan saat itu juga
  resetFormPesanan();

  // 2. Kirim data & file bukti ke Google Spreadsheet di latar belakang
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).catch(err => console.error('Gagal mengirim ke Spreadsheet:', err));

  // 3. Langsung buka tab WhatsApp
  window.open(urlWA, '_blank');
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  tambahItemVarian('Dimsum Original', 1);
  aturStatusBatch();

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