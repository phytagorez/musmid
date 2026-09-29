const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8r6iQn9wQ7ZOTTWz_COXIrdxKPfG3KoKcmhab7vez9SC9pR9f8nK0JfxCLi-6i76j/exec";
const NOMOR_ADMIN = "6283111653455";

const DAFTAR_HARGA = {
  "Dimsum Original": 12000,
  "Dimsum Keju": 14000,
  "Dimsum Crab Stick": 15000
};

// live total
const varianContainer = document.getElementById('varianContainer');
const btnTambahVarian = document.getElementById('btnTambahVarian');
const totalDisplay = document.getElementById('totalHargaDisplay');

function updateLiveTotal() {
  if (!varianContainer || !totalDisplay) return;

  const items = varianContainer.querySelectorAll('.varian-item');
  let grandTotal = 0;

  items.forEach(item => {
    const sel = item.querySelector('.item-varian');
    const inp = item.querySelector('.item-jumlah');
    const price = sel?.selectedOptions?.[0]?.dataset?.price
      ? parseInt(sel.selectedOptions[0].dataset.price)
      : (DAFTAR_HARGA[sel?.value] || 12000);
    const qty = Math.max(1, parseInt(inp?.value) || 1);
    grandTotal += price * qty;
  });

  totalDisplay.textContent = `Rp ${grandTotal.toLocaleString('id-ID')}`;

  totalDisplay.classList.remove('price-pulse');
  void totalDisplay.offsetWidth;
  totalDisplay.classList.add('price-pulse');

  updateTombolHapus();
}

function updateTombolHapus() {
  if (!varianContainer) return;
  const items = varianContainer.querySelectorAll('.varian-item');
  items.forEach(item => {
    const btnHapus = item.querySelector('.btn-hapus-varian');
    if (btnHapus) {
      if (items.length > 1) {
        btnHapus.classList.remove('hidden');
      } else {
        btnHapus.classList.add('hidden');
      }
    }
  });
}

function pasangEventItem(item) {
  const sel = item.querySelector('.item-varian');
  const inp = item.querySelector('.item-jumlah');
  const btnMinus = item.querySelector('.btn-minus');
  const btnPlus = item.querySelector('.btn-plus');
  const btnHapus = item.querySelector('.btn-hapus-varian');

  if (sel) sel.addEventListener('change', updateLiveTotal);

  if (inp) {
    inp.addEventListener('input', () => {
      if (parseInt(inp.value) < 1 || isNaN(parseInt(inp.value))) {
        inp.value = 1;
      }
      updateLiveTotal();
    });
  }

  if (btnMinus) {
    btnMinus.addEventListener('click', () => {
      const current = Math.max(1, parseInt(inp.value) || 1);
      if (current > 1) {
        inp.value = current - 1;
        updateLiveTotal();
      }
    });
  }

  if (btnPlus) {
    btnPlus.addEventListener('click', () => {
      const current = Math.max(1, parseInt(inp.value) || 1);
      inp.value = current + 1;
      updateLiveTotal();
    });
  }

  if (btnHapus) {
    btnHapus.addEventListener('click', () => {
      const items = varianContainer.querySelectorAll('.varian-item');
      if (items.length > 1) {
        item.remove();
        updateLiveTotal();
      }
    });
  }
}

function tambahItemVarian(pilihanVarian = null, defaultQty = 1) {
  if (!varianContainer) return;

  const itemBaru = document.createElement('div');
  itemBaru.className = 'varian-item bg-slate-50/80 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3 transition-all duration-200';
  
  let targetVarian = pilihanVarian;
  if (!targetVarian) {
    const terpilih = Array.from(varianContainer.querySelectorAll('.item-varian')).map(s => s.value);
    const semuaVarian = Object.keys(DAFTAR_HARGA);
    targetVarian = semuaVarian.find(v => !terpilih.includes(v)) || semuaVarian[0];
  }

  itemBaru.innerHTML = `
    <div class="flex-1">
      <select class="item-varian w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none text-sm bg-white font-medium transition">
        <option value="Dimsum Original" data-price="12000"${targetVarian === 'Dimsum Original' ? ' selected' : ''}>Dimsum Original (Rp 12.000)</option>
        <option value="Dimsum Keju" data-price="14000"${targetVarian === 'Dimsum Keju' ? ' selected' : ''}>Dimsum Keju (Rp 14.000)</option>
        <option value="Dimsum Crab Stick" data-price="15000"${targetVarian === 'Dimsum Crab Stick' ? ' selected' : ''}>Dimsum Crab Stick (Rp 15.000)</option>
      </select>
    </div>
    <div class="flex items-center justify-between sm:justify-end gap-3">
      <div class="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
        <button type="button" class="btn-minus w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-brand-100/40 hover:text-brand-600 active:bg-brand-100 transition font-bold select-none text-base" aria-label="Kurangi Jumlah">
          <i class="bi bi-dash"></i>
        </button>
        <input type="number" min="1" value="${defaultQty}" class="item-jumlah w-12 h-9 text-center text-sm font-bold text-slate-800 outline-none border-x border-slate-200 bg-transparent" />
        <button type="button" class="btn-plus w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-brand-100/40 hover:text-brand-600 active:bg-brand-100 transition font-bold select-none text-base" aria-label="Tambah Jumlah">
          <i class="bi bi-plus"></i>
        </button>
      </div>
      <button type="button" class="btn-hapus-varian w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90 transition" aria-label="Hapus Varian">
        <i class="bi bi-trash3 text-base"></i>
      </button>
    </div>
  `;

  varianContainer.appendChild(itemBaru);
  pasangEventItem(itemBaru);
  updateLiveTotal();
}

if (btnTambahVarian) {
  btnTambahVarian.addEventListener('click', () => {
    tambahItemVarian();
  });
}

// Inisialisasi baris varian pertama
if (varianContainer) {
  const itemAwal = varianContainer.querySelector('.varian-item');
  if (itemAwal) pasangEventItem(itemAwal);
}

// select var for card
function pilihVarian(namaVarian) {
  if (!varianContainer) return;

  const items = varianContainer.querySelectorAll('.varian-item');
  let ditemukan = false;

  items.forEach(item => {
    const sel = item.querySelector('.item-varian');
    if (sel && sel.value === namaVarian) {
      ditemukan = true;
    }
  });

  if (!ditemukan) {
    if (items.length === 1 && items[0].querySelector('.item-jumlah').value === '1') {
      items[0].querySelector('.item-varian').value = namaVarian;
    } else {
      tambahItemVarian(namaVarian, 1);
    }
  }

  updateLiveTotal();
  document.getElementById('pemesanan')?.scrollIntoView({ behavior: 'smooth' });
}

// send to whatsapp
async function kirimPesananWhatsApp(event) {
  event.preventDefault();

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin text-xl"></i> <span>Menyimpan Pesanan...</span>`;
  }

  const nama = document.getElementById('nama')?.value.trim() || '';
  const telepon = document.getElementById('telepon')?.value.trim() || '';
  const alamat = document.getElementById('alamat')?.value.trim() || '';

  const items = varianContainer.querySelectorAll('.varian-item');
  const daftarPesananWA = [];
  const daftarPesananSheet = [];
  let totalPack = 0;
  let totalBiaya = 0;

  items.forEach(item => {
    const sel = item.querySelector('.item-varian');
    const inp = item.querySelector('.item-jumlah');
    const namaVarian = sel?.value || 'Dimsum Original';
    const qty = Math.max(1, parseInt(inp?.value) || 1);
    const hargaSatuan = sel?.selectedOptions?.[0]?.dataset?.price
      ? parseInt(sel.selectedOptions[0].dataset.price)
      : (DAFTAR_HARGA[namaVarian] || 12000);
    const subtotal = hargaSatuan * qty;

    totalPack += qty;
    totalBiaya += subtotal;

    daftarPesananWA.push(`• ${namaVarian}: ${qty} pack (Rp ${subtotal.toLocaleString('id-ID')})`);
    daftarPesananSheet.push(`${namaVarian} (${qty} pack)`);
  });

  const varianWA = daftarPesananWA.join('\n');
  const varianSheet = daftarPesananSheet.join(', ');
  const totalFormatted = totalBiaya.toLocaleString('id-ID');

  const payload = {
    nama: nama,
    telepon: telepon,
    varian: varianSheet,
    jumlah: totalPack,
    alamat: alamat,
    total: `Rp ${totalFormatted}`
  };

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Gagal mengirim ke Spreadsheet:", error);
  } finally {
    const formatPesan = 
`Halo Admin DimdimSum, saya ingin memesan:

- *Nama:* 
${nama}
- *No. WhatsApp:* 
${telepon}
- *Pesanan:* 
${varianWA}
- *Jumlah:* 
${totalPack} pack
- *Estimasi Total:* Rp 
${totalFormatted}
- *Alamat Pengiriman:* 
${alamat}

Mohon info konfirmasi stoknya, terima kasih!`;

    const url = `https://api.whatsapp.com/send?phone=${NOMOR_ADMIN}&text=${encodeURIComponent(formatPesan)}`;

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }

    window.open(url, '_blank');
  }
}

// intersection observer
document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px 40px 0px'
    });

    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('active');
      } else {
        observer.observe(el);
      }
    });
  } else {
    revealElements.forEach(el => el.classList.add('active'));
  }

  updateLiveTotal();
});

// shadow navbar
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (!navbar) return;
  if (window.scrollY > 30) {
    navbar.classList.add('nav-scrolled');
  } else {
    navbar.classList.remove('nav-scrolled');
  }
});

// toggle dropdown
const dotsMenuBtn = document.getElementById('dotsMenuBtn');
const dotsDropdown = document.getElementById('dotsDropdown');

if (dotsMenuBtn && dotsDropdown) {
  dotsMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dotsDropdown.classList.toggle('hidden');
  });

  // close dropdown
  dotsDropdown.querySelectorAll('.dropdown-link').forEach(link => {
    link.addEventListener('click', () => {
      dotsDropdown.classList.add('hidden');
    });
  });

  // close dropdown if > area
  document.addEventListener('click', (e) => {
    if (!dotsDropdown.contains(e.target) && !dotsMenuBtn.contains(e.target)) {
      dotsDropdown.classList.add('hidden');
    }
  });
}