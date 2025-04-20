document.addEventListener('DOMContentLoaded', () => {
    // --- Konfigurasi Awal ---
    const waterIntervalMinutes = 60; // Pengingat minum setiap 60 menit
    const breakIntervalMinutes = 20; // Pengingat istirahat setiap 20 menit
    const waterInterval = waterIntervalMinutes * 60 * 1000;
    const breakInterval = breakIntervalMinutes * 60 * 1000;

    // --- Elemen DOM ---
    const waterTimerDisplay = document.getElementById('water-timer');
    const breakTimerDisplay = document.getElementById('break-timer');
    const resetWaterButton = document.getElementById('reset-water');
    const resetBreakButton = document.getElementById('reset-break');
    const waterCard = document.querySelector('.reminder-card.water');
    const breakCard = document.querySelector('.reminder-card.break');
    const waterProgress = document.getElementById('water-progress');
    const breakProgress = document.getElementById('break-progress');
    const reminderSound = document.getElementById('reminder-sound');
    const enableSoundCheckbox = document.getElementById('enable-sound');

    // --- Variabel Timer ---
    let waterTimeoutId;
    let breakTimeoutId;
    let waterIntervalId;
    let breakIntervalId;
    let nextWaterTime;
    let nextBreakTime;

    // --- Fungsi Helper ---
    function formatTime(milliseconds) {
        if (milliseconds < 0) milliseconds = 0;
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function updateProgress(progressBar, startTime, interval) {
        const now = Date.now();
        const elapsed = now - (startTime - interval); // Waktu yang sudah berlalu sejak timer dimulai
        const percentage = Math.max(0, 100 - (elapsed / interval) * 100);
        progressBar.style.width = `${percentage}%`;
    }

    function updateTimers() {
        const now = Date.now();

        const waterTimeLeft = nextWaterTime - now;
        waterTimerDisplay.textContent = formatTime(waterTimeLeft);
        updateProgress(waterProgress, nextWaterTime, waterInterval);

        const breakTimeLeft = nextBreakTime - now;
        breakTimerDisplay.textContent = formatTime(breakTimeLeft);
        updateProgress(breakProgress, nextBreakTime, breakInterval);
    }

    function playNotificationSound() {
        if (enableSoundCheckbox.checked && reminderSound.src) { // Cek jika suara diaktifkan & ada sumber
             // Coba putar suara. Peramban mungkin memerlukan interaksi pengguna pertama.
             const playPromise = reminderSound.play();
             if (playPromise !== undefined) {
                 playPromise.catch(error => {
                     // Seringkali karena interaksi pengguna belum terjadi
                     console.warn("Gagal memutar suara notifikasi:", error);
                     // Mungkin tampilkan pesan ke pengguna untuk klik di mana saja
                 });
             }
        }
    }

    function showNotification(title, body, cardElement) {
        // 1. Efek Visual pada Kartu
        cardElement.classList.add('reminder-active');

        // 2. Notifikasi Browser (jika diizinkan)
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💧</text></svg>' // Gunakan ikon yang sama
            });
        } else if (Notification.permission !== 'denied') {
            // Minta izin jika belum ditolak
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showNotification(title, body, cardElement); // Coba lagi jika diizinkan
                }
            });
        }
         // 3. Mainkan Suara
         playNotificationSound();
    }

    // --- Fungsi Reset dan Mulai Timer ---
    function resetWaterTimer() {
        clearTimeout(waterTimeoutId);
        clearInterval(waterIntervalId);
        waterCard.classList.remove('reminder-active'); // Hapus animasi jika ada

        nextWaterTime = Date.now() + waterInterval;
        waterTimeoutId = setTimeout(() => {
            showNotification('💧 Waktunya Minum!', 'Jangan lupa hidrasi tubuh Anda.', waterCard);
            resetWaterTimer(); // Otomatis reset setelah notifikasi
        }, waterInterval);

        // Update tampilan setiap detik
        updateTimers(); // Update langsung
        waterIntervalId = setInterval(updateTimers, 1000);
    }

    function resetBreakTimer() {
        clearTimeout(breakTimeoutId);
        clearInterval(breakIntervalId);
        breakCard.classList.remove('reminder-active'); // Hapus animasi jika ada

        nextBreakTime = Date.now() + breakInterval;
        breakTimeoutId = setTimeout(() => {
            showNotification('☕ Waktunya Istirahat Mata!', 'Lihat objek jauh selama 20 detik.', breakCard);
            resetBreakTimer(); // Otomatis reset setelah notifikasi
        }, breakInterval);

        // Update tampilan setiap detik
        updateTimers(); // Update langsung
        // Kita bisa gunakan interval yang sama atau buat baru
        // Jika pakai yg sama, pastikan clear interval di kedua reset
         if (!waterIntervalId && !breakIntervalId) { // Hanya mulai jika belum ada
             breakIntervalId = setInterval(updateTimers, 1000);
         } else if (!breakIntervalId) {
              // Jika hanya interval air yang jalan, kita perlu ID terpisah
              // Atau, sederhananya, interval updateTimers cukup satu
              // Jika sudah ada waterIntervalId, tidak perlu buat breakIntervalId baru
              // Jika waterIntervalId tidak ada (misal air saja yg direset manual), buat baru
               if (!waterIntervalId) breakIntervalId = setInterval(updateTimers, 1000);
         }
         // PENYEDERHANAAN: Cukup satu interval global untuk updateTimers
         startGlobalUpdateTimer(); // Panggil fungsi terpusat
    }

     // SATU INTERVAL UNTUK UPDATE SEMUA TIMER
     let globalUpdateIntervalId = null;
     function startGlobalUpdateTimer() {
         if (!globalUpdateIntervalId) {
              globalUpdateIntervalId = setInterval(updateTimers, 1000);
         }
     }
     // Modifikasi fungsi reset untuk menggunakan interval global
      function resetWaterTimer() {
        clearTimeout(waterTimeoutId);
        // clearInterval(waterIntervalId); // Tidak perlu ID terpisah
        waterCard.classList.remove('reminder-active');

        nextWaterTime = Date.now() + waterInterval;
        waterTimeoutId = setTimeout(() => {
            showNotification('💧 Waktunya Minum!', 'Jangan lupa hidrasi tubuh Anda.', waterCard);
            resetWaterTimer();
        }, waterInterval);

        updateTimers(); // Update langsung
        startGlobalUpdateTimer(); // Pastikan timer update berjalan
    }

    function resetBreakTimer() {
        clearTimeout(breakTimeoutId);
        // clearInterval(breakIntervalId); // Tidak perlu ID terpisah
        breakCard.classList.remove('reminder-active');

        nextBreakTime = Date.now() + breakInterval;
        breakTimeoutId = setTimeout(() => {
            showNotification('☕ Waktunya Istirahat Mata!', 'Lihat objek jauh selama 20 detik.', breakCard);
            resetBreakTimer();
        }, breakInterval);

        updateTimers(); // Update langsung
        startGlobalUpdateTimer(); // Pastikan timer update berjalan
    }


    // --- Event Listener ---
    resetWaterButton.addEventListener('click', resetWaterTimer);
    resetBreakButton.addEventListener('click', resetBreakTimer);

    // --- Inisialisasi ---
    // Minta izin notifikasi saat halaman dimuat (lebih baik)
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // Mulai timer saat halaman dimuat
    resetWaterTimer();
    resetBreakTimer();
});