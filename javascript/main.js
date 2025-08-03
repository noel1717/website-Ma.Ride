document.addEventListener('DOMContentLoaded', function() {
    const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
    const btnsDetail = document.querySelectorAll('.btnDetail');
    const whatsappNumber = "6289515750507";
    
    const baseFare = 10000;
    const ratePerKm = 5000;

    let destinationLocation = null;
    let pickupLocation = null;
    let distanceKm = 0;
    
    function generateStockData(endDate) {
        const stock = {};
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); 
        
        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().slice(0, 10);
            stock[dateString] = {
                '05:00': 10,
                '05:15': 15,
                '05:30': 15
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return stock;
    }
    const endDate2026 = new Date('2026-12-31');
    const stockData = generateStockData(endDate2026);

    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    }
    
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function checkFormAndStockStatus() {
        const namaPembeli = document.getElementById('namaPembeli');
        const alamatLengkap = document.getElementById('alamatLengkap');
        const tanggalBooking = document.getElementById('tanggalBooking');
        const waktuBerangkat = document.querySelector('input[name="waktuBerangkat"]:checked');
        const lokasiGoogleMaps = document.getElementById('lokasiGoogleMaps');
        
        // Cek validasi dan tampilkan peringatan di label
        const isNamaValid = namaPembeli.value.trim() !== '';
        document.querySelector('label[for="namaPembeli"]').classList.toggle('is-invalid-label', !isNamaValid);

        const isAlamatValid = alamatLengkap.value.trim() !== '';
        document.querySelector('label[for="alamatLengkap"]').classList.toggle('is-invalid-label', !isAlamatValid);

        const isTanggalValid = tanggalBooking.value.trim() !== '';
        document.querySelector('label[for="tanggalBooking"]').classList.toggle('is-invalid-label', !isTanggalValid);

        const isLokasiValid = lokasiGoogleMaps.value.trim() !== '';
        document.querySelector('label[for="lokasiGoogleMaps"]').classList.toggle('is-invalid-label', !isLokasiValid);

        const isFormValid = isNamaValid && isAlamatValid && isTanggalValid && isLokasiValid;
        
        const stokStatusEl = document.getElementById('stokStatus');
        let isStockAvailable = false;
        
        if (isTanggalValid && waktuBerangkat) {
            const jam = waktuBerangkat.value;
            const stokHariIni = stockData[tanggalBooking.value] || {};
            const stokSaatIni = stokHariIni[jam] !== undefined ? stokHariIni[jam] : 0;
            
            if (stokSaatIni > 0) {
                stokStatusEl.textContent = `Tersisa ${stokSaatIni} slot`;
                stokStatusEl.className = 'fw-bold ms-2 text-warning';
                isStockAvailable = true;
            } else {
                stokStatusEl.textContent = 'Habis';
                stokStatusEl.className = 'fw-bold ms-2 text-danger';
            }
        } else {
            stokStatusEl.textContent = 'Pilih tanggal dan jam';
            stokStatusEl.className = 'fw-bold ms-2 text-warning';
        }
        
        document.getElementById('pesanSekarangBtn').disabled = !(isFormValid && isStockAvailable);
    }

    function updateTotalPayment() {
        const totalPembayaranEl = document.getElementById('modal-total-pembayaran');
        if (pickupLocation) {
            distanceKm = calculateDistance(pickupLocation.lat, pickupLocation.lon, destinationLocation.lat, destinationLocation.lon);
            const total = baseFare + (distanceKm * ratePerKm);
            totalPembayaranEl.textContent = formatRupiah(total);
        } else {
            totalPembayaranEl.textContent = "Total: Perlu lokasi";
        }
        checkFormAndStockStatus();
    }
    
    btnsDetail.forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.card');
            const judul = card.querySelector('.card-title').textContent;
            const deskripsi = card.querySelector('.deskripsi-tersembunyi').textContent;
            const gambar = card.querySelector('.card-img-top').src;

            const destLat = parseFloat(card.dataset.destinationLat);
            const destLon = parseFloat(card.dataset.destinationLon);
            destinationLocation = { lat: destLat, lon: destLon };

            document.getElementById('modal-judul-produk').textContent = judul;
            document.getElementById('modal-deskripsi-produk').textContent = deskripsi;
            document.getElementById('modal-tarif-dasar').textContent = formatRupiah(baseFare);
            document.getElementById('modal-tarif-per-km').textContent = formatRupiah(ratePerKm);
            document.getElementById('modal-gambar-produk').src = gambar;
            document.getElementById('alamatTujuan').value = `Universitas Brawijaya (${judul})`;

            document.getElementById('bookingForm').reset();
            pickupLocation = null;
            distanceKm = 0;
            
            document.getElementById('geolocationError').classList.add('d-none');

            document.querySelector('label[for="namaPembeli"]').classList.remove('is-invalid-label');
            document.querySelector('label[for="alamatLengkap"]').classList.remove('is-invalid-label');
            document.querySelector('label[for="tanggalBooking"]').classList.remove('is-invalid-label');
            document.querySelector('label[for="lokasiGoogleMaps"]').classList.remove('is-invalid-label');
            
            updateTotalPayment();
            checkFormAndStockStatus();
            detailModal.show();
        });
    });

    document.getElementById('shareLocBtn').addEventListener('click', function() {
        const geolocationErrorEl = document.getElementById('geolocationError');
        geolocationErrorEl.classList.remove('d-none');
        geolocationErrorEl.classList.remove('text-danger');
        geolocationErrorEl.classList.add('text-warning');
        geolocationErrorEl.textContent = "Mendapatkan lokasi...";

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                pickupLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                document.getElementById('lokasiGoogleMaps').value = `http://googleusercontent.com/maps.google.com/7{pickupLocation.lat},${pickupLocation.lon}`;
                geolocationErrorEl.classList.add('d-none');
                updateTotalPayment();
            }, error => {
                let errorMessage;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Akses lokasi ditolak. Mohon izinkan akses.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Informasi lokasi tidak tersedia.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Permintaan mendapatkan lokasi timeout.";
                        break;
                    default:
                        errorMessage = "Terjadi kesalahan yang tidak diketahui.";
                        break;
                }
                geolocationErrorEl.textContent = errorMessage;
                geolocationErrorEl.classList.remove('text-warning');
                geolocationErrorEl.classList.add('text-danger');
                pickupLocation = null;
                updateTotalPayment();
            });
        } else {
            geolocationErrorEl.textContent = "Geolocation tidak didukung oleh browser ini.";
            geolocationErrorEl.classList.remove('text-warning');
            geolocationErrorEl.classList.add('text-danger');
            pickupLocation = null;
            updateTotalPayment();
        }
    });

    document.getElementById('lokasiGoogleMaps').addEventListener('input', function() {
        const url = this.value;
        const geolocationErrorEl = document.getElementById('geolocationError');
        geolocationErrorEl.classList.add('d-none');
        
        if (url.trim() === '') {
            pickupLocation = null;
            updateTotalPayment();
            return;
        }

        const gmapsShareLinkMatch = url.match(/maps\.app\.goo\.gl\/(.*)/);
        const gmapsUrlMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

        if (gmapsUrlMatch) {
            pickupLocation = {
                lat: parseFloat(gmapsUrlMatch[1]),
                lon: parseFloat(gmapsUrlMatch[2])
            };
            updateTotalPayment();
        } else if (gmapsShareLinkMatch) {
            geolocationErrorEl.classList.add('d-none');
            pickupLocation = null;
            updateTotalPayment();
        } else {
            geolocationErrorEl.textContent = "Alamat teks diterima, tapi perhitungan jarak tidak akurat. Mohon gunakan tautan lokasi Google Maps untuk estimasi biaya yang tepat.";
            geolocationErrorEl.classList.remove('d-none');
            geolocationErrorEl.classList.remove('text-danger');
            geolocationErrorEl.classList.add('text-warning');
            pickupLocation = null;
            updateTotalPayment();
        }
    });
    
    const formElements = document.querySelectorAll('#bookingForm input, #bookingForm textarea');
    formElements.forEach(el => el.addEventListener('input', checkFormAndStockStatus));
    document.querySelectorAll('input[name="waktuBerangkat"]').forEach(radio => radio.addEventListener('change', checkFormAndStockStatus));
    document.querySelectorAll('input[name="waktuPulang"]').forEach(radio => radio.addEventListener('change', checkFormAndStockStatus));
    document.getElementById('tanggalBooking').addEventListener('change', checkFormAndStockStatus);


    document.getElementById('pesanSekarangBtn').addEventListener('click', function() {
        checkFormAndStockStatus();

        if (!document.getElementById('pesanSekarangBtn').disabled) {
            const nama = document.getElementById('namaPembeli').value;
            const alamatLengkap = document.getElementById('alamatLengkap').value;
            const tanggal = document.getElementById('tanggalBooking').value;
            const waktuBerangkat = document.querySelector('input[name="waktuBerangkat"]:checked')?.value || "Tidak dipilih";
            const waktuPulang = document.querySelector('input[name="waktuPulang"]:checked')?.value || "Tidak dipilih";
            const judul = document.getElementById('modal-judul-produk').textContent;
            const totalText = document.getElementById('modal-total-pembayaran').textContent;
            const lokasiGoogleMaps = document.getElementById('lokasiGoogleMaps').value || "Tidak ada";
            
            const pesan = `Halo, saya ingin booking layanan MaRide.\n\n*Detail Pesanan:*\n- *Nama:* ${nama}\n- *Layanan:* ${judul}\n- *Tanggal:* ${tanggal}\n- *Jam Berangkat:* ${waktuBerangkat}\n- *Jam Pulang:* ${waktuPulang}\n- *Alamat Lengkap:* ${alamatLengkap}\n- *Titik Lokasi:* ${lokasiGoogleMaps}\n- *Total Pembayaran:* ${totalText} (berdasarkan jarak ${distanceKm.toFixed(2)} km)\n\nMohon konfirmasi pesanan saya. Terima kasih.`;
            const encodedPesan = encodeURIComponent(pesan);
            const url = `https://wa.me/${whatsappNumber}?text=${encodedPesan}`;

            window.open(url, '_blank');
            detailModal.hide();
        }
    });
});