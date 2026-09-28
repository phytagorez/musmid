const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8r6iQn9wQ7ZOTTWz_COXIrdxKPfG3KoKcmhab7vez9SC9pR9f8nK0JfxCLi-6i76j/exec";
const NOMOR_ADMIN = "6283111653455";

const DAFTAR_HARGA = {
  "Dimsum Original": 12000,
  "Dimsum Keju": 14000,
  "Dimsum Crab Stick": 15000
};

// live total
const selectVarian = document.getElementById('varian');
const inputJumlah = document.getElementById('jumlah');
const totalDisplay = document.getElementById('totalHargaDisplay');

function getHargaSatuan() {
  const selected = selectVarian?.selectedOptions?.[0];
  return (selected && selected.dataset.price)
    ? parseInt(selected.dataset.price)
    : (DAFTAR_HARGA[selectVarian?.value] || 12000);
}

function updateLiveTotal() {
  if (!selectVarian || !totalDisplay) return;
  const hargaSatuan = getHargaSatuan();
  const qty = Math.max(1, parseInt(inputJumlah?.value) || 1);
  const total = hargaSatuan * qty;
  totalDisplay.textContent = `Rp ${total.toLocaleString('id-ID')}`;

  totalDisplay.classList.remove('price-pulse');
  void totalDisplay.offsetWidth;
  totalDisplay.classList.add('price-pulse');
}

if (selectVarian) selectVarian.addEventListener('change', updateLiveTotal);
if (inputJumlah) inputJumlah.addEventListener('input', updateLiveTotal);

// select var for card
function pilihVarian(namaVarian) {
  if (selectVarian) {
    selectVarian.value = namaVarian;
    updateLiveTotal();
  }
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
  const varian = selectVarian?.value || '';
  const jumlah = Math.max(1, parseInt(inputJumlah?.value) || 1);
  const alamat = document.getElementById('alamat')?.value.trim() || '';

  const hargaSatuan = getHargaSatuan();
  const total = (hargaSatuan * jumlah).toLocaleString('id-ID');

  const payload = {
    nama: nama,
    telepon: telepon,
    varian: varian,
    jumlah: jumlah,
    alamat: alamat,
    total: `Rp ${total}`
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

- *Nama:* ${nama}
- *No. WhatsApp:* ${telepon}
- *Pesanan:* ${varian}
- *Jumlah:* ${jumlah} pack
- *Estimasi Total:* Rp ${total}
- *Alamat Pengiriman:* ${alamat}

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