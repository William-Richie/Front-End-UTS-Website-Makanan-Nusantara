$(function () {
    const TOKEN_KEY = 'papeda_token';
    let currentUser = null;
    let afterLogin = null;

    const authModal = new bootstrap.Modal('#authModal');
    const profileModal = new bootstrap.Modal('#profileModal');

    const GATES = {
        reservasi: ['Login untuk Reservasi', 'Silakan masuk atau buat akun terlebih dahulu untuk melanjutkan reservasi.'],
        pesan: ['Login untuk Memesan', 'Silakan masuk atau buat akun terlebih dahulu untuk melanjutkan pesanan.'],
        umum: ['Selamat Datang', 'Login untuk menggunakan fitur interaktif Papeda Restaurant.']
    };
    const STATUS = {
        pending: ['Menunggu', 'warning', 'fa-hourglass-half'],
        dikonfirmasi: ['Dikonfirmasi', 'success', 'fa-circle-check'],
        dibatalkan: ['Dibatalkan', 'danger', 'fa-circle-xmark']
    };

    /* Helper */
    const esc = s => $('<div>').text(s ?? '').html();
    const errMsg = x => (x.responseJSON && x.responseJSON.error) || 'Terjadi kesalahan, coba lagi.';
    const scrollKe = sel => $('html, body').animate({ scrollTop: $(sel).offset().top - 60 }, 500);

    function api(method, url, data) {
        const token = localStorage.getItem(TOKEN_KEY);
        return $.ajax({
            url, method,
            contentType: 'application/json',
            data: data ? JSON.stringify(data) : undefined,
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
    }

    function toast(pesan, ikon = 'fa-circle-check') {
        const $t = $(`<div class="auth-toast"><i class="fa-solid ${ikon} me-2"></i>${esc(pesan)}</div>`).appendTo('body');
        setTimeout(() => $t.fadeOut(400, () => $t.remove()), 2500);
    }

    /* State user */
    function setUser(u) {
        currentUser = u;
        $('body').toggleClass('logged-in', !!u);
        if (u) {
            $('#user-name').text(u.nama.split(' ')[0]);
            $('#user-initial').text(u.nama.charAt(0).toUpperCase());
            $('#name').val(u.nama);
            $('#email').val(u.email);
            muatReservasi();
        } else {
            $('#name, #email').val('');
            $('#my-reservation-list').empty();
        }
    }

    /* Modal auth */
    function gantiTab(tab) {
        $('.auth-tab').removeClass('active').filter(`[data-tab="${tab}"]`).addClass('active');
        $('.auth-pane').removeClass('active');
        $('#form-' + tab).addClass('active');
        $('.auth-error').addClass('d-none');
    }

    function bukaAuth(mode, tab, cb) {
        const g = GATES[mode] || GATES.umum;
        $('#auth-title').text(g[0]);
        $('#auth-desc').text(g[1]);
        afterLogin = cb || null;
        gantiTab(tab || 'login');
        authModal.show();
    }

    $('.auth-tab').on('click', function () { gantiTab($(this).data('tab')); });

    $(document).on('click', '.Sign-in, .regist', function (e) {
        e.preventDefault();
        bukaAuth('umum', $(this).hasClass('regist') ? 'register' : 'login');
    });

    $(document).on('click', '[data-auth]', function () {
        bukaAuth('reservasi', $(this).data('auth'), () => scrollKe('#reservation'));
    });

    $(document).on('click', '.toggle-pass', function () {
        const $in = $(this).siblings('input');
        $in.attr('type', $in.attr('type') === 'password' ? 'text' : 'password');
        $(this).find('i').toggleClass('fa-eye fa-eye-slash');
    });

    /* Gerbang login (capture: jalan sebelum handler lama di script.js) */
    document.addEventListener('click', function (e) {
        if (currentUser) return;

        if (e.target.closest('a[href="#reservation"], a[href="#my-reservation"]')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            bukaAuth('reservasi', 'login', () => scrollKe('#reservation'));
            return;
        }

        if (e.target.closest('#btn-checkout-cart')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const el = document.getElementById('cartSidebar');
            const oc = bootstrap.Offcanvas.getInstance(el);
            if (oc) oc.hide();
            bukaAuth('pesan', 'login', () => bootstrap.Offcanvas.getOrCreateInstance(el).show());
        }
    }, true);

    /* Login & Register */
    function kirimAuth(form, url, payload) {
        const $btn = $(form).find('button[type=submit]');
        const label = $btn.html();
        const $err = $(form).find('.auth-error');
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Memproses...');

        api('POST', url, payload).done(res => {
            localStorage.setItem(TOKEN_KEY, res.token);
            setUser(res.user);
            authModal.hide();
            form.reset();
            toast('Selamat datang, ' + res.user.nama.split(' ')[0] + '!', 'fa-utensils');
            if (afterLogin) { const cb = afterLogin; afterLogin = null; setTimeout(cb, 450); }
        }).fail(x => {
            $err.text(errMsg(x)).removeClass('d-none shake');
            void $err[0].offsetWidth;
            $err.addClass('shake');
        }).always(() => $btn.prop('disabled', false).html(label));
    }

    $('#form-login').on('submit', function (e) {
        e.preventDefault();
        kirimAuth(this, '/api/login', {
            email: $('#login-email').val().trim(),
            password: $('#login-password').val()
        });
    });

    $('#form-register').on('submit', function (e) {
        e.preventDefault();
        if ($('#reg-password').val() !== $('#reg-password2').val()) {
            const $err = $(this).find('.auth-error').text('Password tidak sama.').removeClass('d-none shake');
            void $err[0].offsetWidth;
            $err.addClass('shake');
            return;
        }
        kirimAuth(this, '/api/register', {
            nama: $('#reg-nama').val().trim(),
            email: $('#reg-email').val().trim(),
            password: $('#reg-password').val()
        });
    });

    /* Dropdown user */
    $('#menu-profile').on('click', function (e) {
        e.preventDefault();
        $('#profile-nama').val(currentUser.nama);
        $('#profile-email').val(currentUser.email);
        profileModal.show();
    });

    $('#form-profile').on('submit', function (e) {
        e.preventDefault();
        api('PUT', '/api/me', { nama: $('#profile-nama').val().trim() })
            .done(res => { setUser(res.user); profileModal.hide(); toast('Profil diperbarui'); })
            .fail(x => toast(errMsg(x), 'fa-triangle-exclamation'));
    });

    $('#menu-myres').on('click', function (e) {
        e.preventDefault();
        scrollKe('#my-reservation');
    });

    $('#menu-logout').on('click', function (e) {
        e.preventDefault();
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        toast('Kamu sudah logout', 'fa-right-from-bracket');
        $('html, body').animate({ scrollTop: 0 }, 400);
    });

    /* Reservasi */
    $('#reservation-date').attr('min', new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));

    $('#reservation-form-group').on('submit', function (e) {
        e.preventDefault();
        if (!currentUser) return bukaAuth('reservasi', 'login');

        const form = this;
        const $btn = $(form).find('button[type=submit]');
        const label = $btn.text();
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...');

        api('POST', '/api/reservasi', {
            gerai: $('#store-select option:selected').text(),
            nama: $('#name').val().trim(),
            email: $('#email').val().trim(),
            telepon: $('#phone').val().trim(),
            tanggal: $('#reservation-date').val(),
            jumlah: parseInt($('#total-person').val()),
            sesi: $('#session option:selected').text(),
            jam: $('#time').val(),
            ruangan: $('#room-type option:selected').text(),
            catatan: $('#notes').val().trim()
        }).done(() => {
            toast('Reservasi berhasil dibuat!', 'fa-calendar-check');
            form.reset();
            $('#name').val(currentUser.nama);
            $('#email').val(currentUser.email);
            $('#store-select').val('');
            $(form).slideUp(300);
            muatReservasi();
            setTimeout(() => scrollKe('#my-reservation'), 400);
        }).fail(x => toast(errMsg(x), 'fa-triangle-exclamation'))
          .always(() => $btn.prop('disabled', false).text(label));
    });

    function kartu(r) {
        const s = STATUS[r.status] || STATUS.pending;
        const tgl = new Date(r.tanggal + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const bisaBatal = r.status !== 'dibatalkan';
        return `
        <div class="col-md-6">
            <div class="res-card">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <h5 class="mb-0 fw-bold"><i class="fa-solid fa-store me-2"></i>${esc(r.gerai)}</h5>
                    <span class="badge text-bg-${s[1]}"><i class="fa-solid ${s[2]} me-1"></i>${s[0]}</span>
                </div>
                <ul class="res-info">
                    <li><i class="fa-solid fa-calendar-day"></i>${esc(tgl)}</li>
                    <li><i class="fa-solid fa-clock"></i>${esc(r.jam)} &middot; ${esc(r.sesi)}</li>
                    <li><i class="fa-solid fa-users"></i>${r.jumlah} orang</li>
                    <li><i class="fa-solid fa-chair"></i>${esc(r.ruangan)}</li>
                    ${r.catatan ? `<li><i class="fa-solid fa-note-sticky"></i>${esc(r.catatan)}</li>` : ''}
                </ul>
                ${bisaBatal ? `<button class="btn btn-sm btn-papeda-outline btn-cancel-res" data-id="${r.id}">Batalkan</button>` : ''}
            </div>
        </div>`;
    }

    function muatReservasi() {
        api('GET', '/api/reservasi').done(res => {
            const d = res.data || [];
            $('#my-reservation-list').html(d.length ? d.map(kartu).join('') : `
                <div class="text-center py-4">
                    <div class="gate-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
                    <p class="text-muted">Belum ada reservasi. Yuk buat yang pertama!</p>
                </div>`);
        }).fail(() => $('#my-reservation-list').html('<p class="text-center text-danger">Gagal memuat reservasi.</p>'));
    }

    $('#my-reservation-list').on('click', '.btn-cancel-res', function () {
        if (!confirm('Batalkan reservasi ini?')) return;
        api('PUT', `/api/reservasi/${$(this).data('id')}/batal`)
            .done(() => { toast('Reservasi dibatalkan', 'fa-circle-xmark'); muatReservasi(); })
            .fail(x => toast(errMsg(x), 'fa-triangle-exclamation'));
    });

    /* Cek sesi login saat halaman dibuka */
    if (localStorage.getItem(TOKEN_KEY)) {
        api('GET', '/api/me')
            .done(res => setUser(res.user))
            .fail(() => localStorage.removeItem(TOKEN_KEY));
    }
});