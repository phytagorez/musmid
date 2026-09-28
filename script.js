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
function kirimPesananWhatsApp(event) {
  event.preventDefault();

  const nama = document.getElementById('nama')?.value.trim() || '';
  const telepon = document.getElementById('telepon')?.value.trim() || '';
  const varian = selectVarian?.value || '';
  const jumlah = Math.max(1, parseInt(inputJumlah?.value) || 1);
  const kondisi = document.querySelector('input[name="kondisi"]:checked')?.value || 'Siap Santap (Hangat)';
  const alamat = document.getElementById('alamat')?.value.trim() || '';

  const hargaSatuan = getHargaSatuan();
  const total = (hargaSatuan * jumlah).toLocaleString('id-ID');

  const formatPesan = 
`Halo Admin DimdimSum, saya ingin memesan:

- *Nama:* ${nama}
- *No. WhatsApp:* ${telepon}
- *Pesanan:* ${varian}
- *Jumlah:* ${jumlah} pack
- *Estimasi Total:* Rp ${total}
- *Penyajian:* ${kondisi}
- *Alamat Pengiriman:* ${alamat}

Mohon info konfirmasi stok dan ongkirnya, terima kasih!`;

  const url = `https://api.whatsapp.com/send?phone=${NOMOR_ADMIN}&text=${encodeURIComponent(formatPesan)}`;
  window.open(url, '_blank');
}

// intersection observer
document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
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