(function () {
    const KEY = 'papeda_admin_token';
    const LABEL = '<i class="fa-solid fa-right-to-bracket me-2"></i>Masuk';
    const token = () => localStorage.getItem(KEY);
    let timer = null;

    if (token()) document.body.classList.add('al-checking');

    $.ajaxPrefilter((opt, orig, xhr) => {
        if (token() && /\/api\//.test(opt.url)) xhr.setRequestHeader('Authorization', 'Bearer ' + token());
    });
    const _fetch = window.fetch.bind(window);
    window.fetch = (url, opts = {}) => {
        if (String(url).includes('/api/') && token())
            opts = { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + token() } };
        return _fetch(url, opts).then(r => { if (r.status === 401) kunci('Sesi berakhir, silakan login lagi.'); return r; });
    };
    $(document).ajaxError((e, xhr, set) => {
        if (xhr.status === 401 && !/admin\/login/.test(set.url)) kunci(token() ? 'Sesi berakhir, silakan login lagi.' : '');
    });

    function tampilPesan(msg) {
        const el = document.getElementById('al-error');
        $(el).text(msg).removeClass('d-none shake');
        void el.offsetWidth;
        $(el).addClass('shake');
    }

    function kunci(msg) {
        localStorage.removeItem(KEY);
        document.body.classList.remove('al-checking');
        document.body.classList.add('admin-locked');
        if (msg) tampilPesan(msg);
    }

    function hitungMundur(detik) {
        const $btn = $('#al-submit');
        clearInterval(timer);
        $btn.prop('disabled', true);
        timer = setInterval(() => {
            if (detik <= 0) {
                clearInterval(timer);
                $btn.prop('disabled', false).html(LABEL);
                $('#al-error').addClass('d-none');
                return;
            }
            const m = Math.floor(detik / 60), s = String(detik % 60).padStart(2, '0');
            $btn.html(`<i class="fa-solid fa-hourglass-half me-2"></i>Coba lagi ${m}:${s}`);
            detik--;
        }, 1000);
    }

    $('#form-admin-login').on('submit', function (e) {
        e.preventDefault();
        const $btn = $('#al-submit');
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Memeriksa...');

        $.ajax({
            url: '/api/admin/login', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ username: $('#al-user').val().trim(), password: $('#al-pass').val() })
        }).done(res => {
            localStorage.setItem(KEY, res.token);
            $('#al-lock').removeClass('fa-lock').addClass('fa-lock-open');
            $('.al-card').addClass('al-success');
            setTimeout(() => location.reload(), 1100);
        }).fail(x => {
            tampilPesan((x.responseJSON && x.responseJSON.error) || 'Tidak bisa terhubung ke server.');
            $('#al-pass').val('').trigger('focus');
            if (x.status === 429) hitungMundur(x.responseJSON.sisa);
            else $btn.prop('disabled', false).html(LABEL);
        });
    });

    $('#al-eye').on('click', function () {
        const $p = $('#al-pass');
        $p.attr('type', $p.attr('type') === 'password' ? 'text' : 'password');
        $(this).find('i').toggleClass('fa-eye fa-eye-slash');
    });

    $('#btn-admin-logout').on('click', () => { localStorage.removeItem(KEY); location.reload(); });

    if (token()) {
        $.get('/api/admin/cek')
            .done(() => document.body.classList.remove('admin-locked', 'al-checking'))
            .fail(() => kunci(''));
    } else {
        kunci('');
    }
})();

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

$(document).ready(function() {
    let dataKontenAsli = {
        hero: '',
        about: '',
        hero_eyebrow: '',
        hero_sub: '',
        about_eyebrow: '',
        about_title: '',
        card1_title: '',
        card1_desc: '',
        card2_title: '',
        card2_desc: '',
        card3_title: '',
        card3_desc: ''
    };
    let dataFooterAsli = {
        judul: '',
        copyright: '',
        link_ig: '',
        link_wa: '',
        link_tiktok: '',
        email: '',
        link_linkedin: ''
    };

    /* Notification */
    function tampilkanNotif(pesan, tipe = 'success') {
        let $toastEl =$('#liveToast');
        
        $toastEl.removeClass('text-bg-success text-bg-danger').addClass(`text-bg-${esc(tipe)}`);
        
        $('#pesan-notif').text(esc(pesan));
        
        let toast = new bootstrap.Toast($toastEl[0], { delay: 3000 });
        toast.show();
    }

    /* Sidebar */
    $('#sidebar-toggle').on('click', function() {
        $('.sidebar').addClass('show');
        $('#sidebar-overlay').fadeIn(300);
    });

    $('#sidebar-overlay, #admin-nav a').on('click', function() {
        if ($(window).width() <= 768) {
            $('.sidebar').removeClass('show');
            $('#sidebar-overlay').fadeOut(300);
        }
    });

    $('#admin-nav a').on('click', function(e) {
        e.preventDefault();
         
        if (typeof dataKontenAsli !== 'undefined') {
            $('#input_hero_eyebrow').val(esc(dataKontenAsli.hero_eyebrow || ''));
            $('#teks_hero').val(esc(dataKontenAsli.hero || ''));
            $('#input_hero_sub').val(esc(dataKontenAsli.hero_sub || ''));
            $('#input_about_eyebrow').val(esc(dataKontenAsli.about_eyebrow || ''));
            $('#input_about_title').val(esc(dataKontenAsli.about_title || ''));
            $('#teks_about').val(esc(dataKontenAsli.about || ''));
            $('#input_card1_title').val(esc(dataKontenAsli.card1_title || ''));
            $('#input_card1_desc').val(esc(dataKontenAsli.card1_desc || ''));
            $('#input_card2_title').val(esc(dataKontenAsli.card2_title || ''));
            $('#input_card2_desc').val(esc(dataKontenAsli.card2_desc || ''));
            $('#input_card3_title').val(esc(dataKontenAsli.card3_title || ''));
            $('#input_card3_desc').val(esc(dataKontenAsli.card3_desc || ''));
            updateLivePreviewKonten(); 
        }

        if (typeof dataFooterAsli !== 'undefined') {
            $('#footer_title').val(esc(dataFooterAsli.judul));
            $('#footer_copyright').val(esc(dataFooterAsli.copyright));
            $('#input_link_ig').val(esc(dataFooterAsli.link_ig));
            $('#input_link_tiktok').val(esc(dataFooterAsli.link_tiktok));
            $('#input_link_wa').val(esc(dataFooterAsli.link_wa));
            $('#input_email').val(esc(dataFooterAsli.email));
            $('#input_link_linkedin').val(esc(dataFooterAsli.link_linkedin));
        }

        $('#admin-nav a').removeClass('active');
        $(this).addClass('active');

        let targetId = $(this).data('target');
        $('.tab-section').hide();
        $('#' + targetId).fadeIn(300);
    });

    $('.nav-link').on('click', function(e) {
        $('.nav-link').removeClass('text-info fw-bold');
        $(this).addClass('text-info fw-bold');
    });
    

    /* Statistik, Konten, dan Footer */
    function muatStatistik() {
        $.get('/api/statistik', function(data) {
            $('#angka-pengunjung').text(data.jumlah_pengunjung);
        });
    }

    /* Kelola Konten: Home, FAQ, Lokasi */
    const PREVIEW_KONTEN = {
        teks_hero: '#preview-hero',
        teks_about: '#preview-about',
        hero_eyebrow: '#preview-hero-eyebrow',
        hero_sub: '#preview-hero-sub',
        about_eyebrow: '#preview-about-eyebrow',
        about_title: '#preview-about-title',
        card1_title: '#preview-card1-title',
        card1_desc: '#preview-card1-desc',
        card2_title: '#preview-card2-title',
        card2_desc: '#preview-card2-desc',
        card3_title: '#preview-card3-title',
        card3_desc: '#preview-card3-desc',

        faq_eyebrow: '#pv-faq-eyebrow',
        faq_title: '#pv-faq-title',
        faq_chip1: '#pv-faq-chip1',
        faq_chip2: '#pv-faq-chip2',
        faq_aside_kicker: '#pv-faq-aside-kicker',
        faq_aside_title: '#pv-faq-aside-title',
        faq_aside_desc: '#pv-faq-aside-desc',
        faq_aside_btn: '#pv-faq-aside-btn',

        loc_eyebrow: '#pv-loc-eyebrow',
        loc_title: '#pv-loc-title',
        loc_chip2: '#pv-loc-chip2',
        loc_kicker: '#pv-loc-kicker',
        loc_heading: '#pv-loc-heading',
        loc_desc: '#pv-loc-desc',
        loc_btn_buka: '#pv-loc-btn',
        loc_utama_title: '#pv-loc-utama-title',
        loc_utama_text: '#pv-loc-utama-text',
        loc_telp_title: '#pv-loc-telp-title',
        loc_telp_text: '#pv-loc-telp-text',
        loc_email_title: '#pv-loc-email-title',
        loc_email_text: '#pv-loc-email-text',
        loc_parkir_title: '#pv-loc-parkir-title',
        loc_parkir_text: '#pv-loc-parkir-text'
    };
    const KONTEN_BARIS_BARU = ['teks_hero', 'faq_title', 'loc_title'];

    function isiFormKonten(data) {
        $('[data-konten]').each(function() {
            const nilai = data[$(this).attr('data-konten')];
            $(this).val(nilai === undefined || nilai === null ? '' : nilai);
        });
    }

    function nilaiKonten(kunci) {
        return $(`[data-konten="${kunci}"]`).val() || DEFAULT_KONTEN[kunci];
    }

    function updateLivePreviewKonten() {
        $.each(PREVIEW_KONTEN, function(kunci, selektor) {
            const teks = nilaiKonten(kunci);
            if (KONTEN_BARIS_BARU.includes(kunci)) $(selektor).html(esc(teks).replace(/\n/g, '<br>'));
            else $(selektor).text(teks);
        });
    }

    function muatSampelFaqPreview() {
        $.get('/api/faq', function(response) {
            const daftar = (Array.isArray(response) ? response : (response.data || [])).slice(0, 3);

            if (daftar.length === 0) {
                $('#pv-faq-list').html('<p class="pv-faq-empty"><i class="fa-regular fa-circle-question me-2"></i>Belum ada FAQ yang tersedia.</p>');
                return;
            }

            $('#pv-faq-list').html(daftar.map((item, i) => `
                <div class="pv-faq-item${i === 0 ? ' open' : ''}">
                    <div class="pv-faq-question">
                        <span class="pv-faq-num">${String(i + 1).padStart(2, '0')}</span>
                        <span class="pv-faq-q-text">${esc(item.pertanyaan)}</span>
                        <span class="pv-faq-chevron"><i class="fa-solid fa-chevron-down"></i></span>
                    </div>
                    <div class="pv-faq-answer">${esc(item.jawaban)}</div>
                </div>`).join(''));
        });
    }

    $('#pv-faq-list').on('click', '.pv-faq-question', function() {
        const $item = $(this).parent('.pv-faq-item');
        $('#pv-faq-list .pv-faq-item').not($item).removeClass('open');
        $item.toggleClass('open');
    });

    function muatDataKonten() {
        $.get('/api/konten', function(data) {
            const isi = {};
            Object.keys(DEFAULT_KONTEN).forEach(function(kunci) {
                isi[kunci] = data[kunci] || DEFAULT_KONTEN[kunci];
            });

            dataKontenAsli = isi;
            isiFormKonten(isi);
            updateLivePreviewKonten();
        });
    }

    /* Sub-tab Kelola Konten */
    $('#konten-tabs').on('click', '.konten-tab', function() {
        const target = $(this).attr('data-konten-tab');

        $('#konten-tabs .konten-tab').removeClass('active').attr('aria-selected', 'false');
        $(this).addClass('active').attr('aria-selected', 'true');

        $('#tab-konten .konten-panel').removeClass('active');
        $('#' + target).addClass('active');

        if (target === 'konten-faq') muatSampelFaqPreview();
        this.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });

    function updateLivePreviewFooter() {
        let titleVal = $('#footer_title').val();
        let copyVal = $('#footer_copyright').val();

        $('#preview_footer_title').text(titleVal === '' ? 'Ikuti Kami' : titleVal);
        $('#preview_footer_copyright').html(copyVal === '' ? '&copy; 2026 Papeda Restaurant. All Rights Reserved.' : copyVal);
    }

    function muatDataFooter() {
        $.get('/api/footer', function(data) {
            $('#footer_title').val(data.judul);
            $('#footer_copyright').val(data.copyright);
            $('#input_link_ig').val(data.link_ig);
            $(`#input_link_tiktok`).val(data.link_tiktok);
            $('#input_link_wa').val(data.link_wa);
            $('#input_email').val(data.email);
            $('#input_link_linkedin').val(data.link_linkedin);

            dataFooterAsli = { ...data };
            updateLivePreviewFooter();
        });
    }

    $('.form-konten').on('input', 'input, textarea', updateLivePreviewKonten);
    $('#footer_title, #footer_copyright, #input_link_ig, #input_link_tiktok, #input_link_wa, #input_email, #input_link_linkedin').on('input', updateLivePreviewFooter);

    $('.form-konten .btn-simpan').on('click', function(e) {
        e.preventDefault();
        let $btn = $(this);
        let originalHtml = $btn.html();
        $btn.prop('disabled', true).text('Memperbarui...');

        let dataKonten = {};
        $btn.closest('form').find('[data-konten]').each(function() {
            dataKonten[$(this).attr('data-konten')] = $(this).val();
        });

        $.ajax({
            url: '/api/konten',
            type: 'PUT',
            data: dataKonten,
            success: function(response) {
                tampilkanNotif(response.pesan);
                dataKontenAsli = { ...dataKontenAsli, ...dataKonten };
            },
            error: function() {
                tampilkanNotif('Gagal menyimpan konten.', 'danger');
            }
        }).always(function() {
            $btn.prop('disabled', false).html(originalHtml);
        });
    });

    $('#form-footer .btn-simpan').on('click', function(e) {
        e.preventDefault();
        let $btn = $(this);
        let originalText = $btn.text();
        
        $btn.prop('disabled', true).text('Menyimpan...');

        let dataFooter = {
            judul: $('#footer_title').val(),
            copyright: $('#footer_copyright').val(),
            link_ig: $('#input_link_ig').val(),
            link_wa: $('#input_link_wa').val(),
            link_tiktok: $('#input_link_tiktok').val(),
            email: $('#input_email').val(),
            link_linkedin: $('#input_link_linkedin').val()
        };

        $.ajax({
            url: '/api/footer', 
            type: 'PUT',
            data: dataFooter,
            success: function(response) {
                tampilkanNotif(response.pesan);
                dataFooterAsli = { ...dataFooter }; 
            },
            error: function() {
                alert('Gagal menyimpan pengaturan footer.');
            }
        }).always(function() {
            $btn.prop('disabled', false).text(originalText);
        });
    });

    muatStatistik();
    muatDataKonten();
    muatDataFooter();

    /* Function Menu + FAQ */
    function muatData(endpoint, tbodySelector, counterSelector, templateHTML) {
        $.get(`/api/${endpoint}`, function(response) {
            let rows = '';
            let jumlahData = 0;
            response.data.forEach(function(item, index) {
                jumlahData++;
                rows += templateHTML(item);
            });
            $(tbodySelector).html(rows);
            if (counterSelector) $(counterSelector).text(jumlahData);
        });
    }

    function simpanData(urlBase, idTarget, dataPayload, $btnElemen, callbackBerhasil) {
        let textAsli = $btnElemen.text();$btnElemen.prop('disabled', true).text('Menyimpan...');

        let method = idTarget ? 'PUT' : 'POST';
        let url = idTarget ? `${urlBase}/${idTarget}` : urlBase;

        $.ajax({
            url: url,
            type: method,
            contentType: 'application/json',
            data: JSON.stringify(dataPayload),
            success: function(response) {
                tampilkanNotif(response.pesan);
                callbackBerhasil();
            },
            error: function(xhr) {
                console.log('ERROR:', xhr);
                tampilkanNotif('Gagal menyimpan data. Cek Console.', 'danger');
            },
            complete: function() {
                $btnElemen.prop('disabled', false).text(textAsli);
            }
        });
    }

    /* Delete */
    let targetHapus = null;

    function hapusData(urlBase, idTarget, callbackBerhasil) {
        targetHapus = {
            url: `${urlBase}/${idTarget}`,
            callback: callbackBerhasil
        };

        let modalEl = document.getElementById('modalKonfirmasiHapus');
        let modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }

    $('#btn-modal-hapus').on('click', function() {
        if (targetHapus) {
            let $btn =$(this);
            let originalText = $btn.text();

            $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Menghapus...');

            $.ajax({
                url: targetHapus.url,
                type: 'DELETE',
                success: function(response) {
                    tampilkanNotif(response.pesan);
                    targetHapus.callback();
                    
                    let modalEl = document.getElementById('modalKonfirmasiHapus');
                    let modal = bootstrap.Modal.getInstance(modalEl);
                    modal.hide();
                },
                error: function() {
                    tampilkanNotif('Gagal menghapus data.', 'danger');
                },
                complete: function() {
                    $btn.prop('disabled', false).text(originalText);
                    targetHapus = null;
                }
            });
        }
    });

    function resetForm(formId, inputId, judulId, textJudul, btnSubmitId, btnCancelId) {
        $(`#${formId}`)[0].reset();
        $(`#${inputId}`).val('');
        $(`#${judulId}`).text(textJudul);
        $(`#${btnSubmitId}`).text('Simpan ke Database').removeClass('is-editing');
        $(`#${btnCancelId}`).hide();
    }

    function setFormEdit(judulId, textJudul, btnSubmitId, btnCancelId, tabSelector) {
        $(`#${judulId}`).text(textJudul);
        $(`#${btnSubmitId}`).text('Update Data').addClass('is-editing');
        $(`#${btnCancelId}`).show();

        const $main = $('main');
            
        $main.animate({
            scrollTop: $main.scrollTop() + $(tabSelector).position().top
        }, 500);
    }

    function fiturPencarian(inputId, targetBarisTabel) {
        $(`#${inputId}`).on('keyup', function() {
            let keyword = $(this).val().toLowerCase();$(targetBarisTabel).filter(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(keyword) > -1);
            });
        });
    }

    /* Data Menu */
    const urlMenu = '/api/menu';

    function muatDataMenu() {
        $.get('/api/menu', function(response) {
            let mainRows = '';
            let appetizerRows = '';
            let dessertRows = '';
            let drinkRows = '';
            let additionalRows = '';
            let noMain = 1, noApp = 1, noDessert = 1, noDrink = 1, noAdd = 1;

            $('#angka-menu').text(response.data.length);
            response.data.sort((a, b) => Number(a.id) - Number(b.id)).forEach(function(item) {
                let nilaiHarga = Number(item.harga);
                window.menuCache = window.menuCache || {};
                window.menuCache[item.id] = item;

                const buatRow = (nomor) => `
                    <tr>
                        <td><div class="menu-no">${nomor}</div></td>
                        <td><img src="${esc(item.gambar)}" class="preview" alt="foto"></td>
                        <td>
                            <div class="nama-menu-wrapper">
                                <span class="nama-menu-text">${esc(item.nama_makanan)}</span>
                                ${tampilkanPedas(esc(item.pedas))}
                            </div>
                        </td>
                        <td>Rp ${nilaiHarga.toLocaleString('id-ID')}</td>
                        <td>${item.status ? 'Tersedia' : 'Habis'}</td>
                        <td>
                            <button class="btn btn-warning btn-sm fw-bold btn-edit-menu"
                                data-id="${esc(item.id)}"
                                data-kategori="${esc(item.nama_kategori)}"
                                data-nama="${esc(item.nama_makanan)}"
                                data-harga="${esc(item.harga)}"
                                data-gambar="${esc(item.gambar)}"
                                data-status="${esc(item.status)}">Edit</button>
                            <button class="btn btn-danger btn-sm fw-bold btn-hapus-menu"
                                data-id="${esc(item.id)}">Hapus</button>
                        </td>
                    </tr>
                `;

                if (item.nama_kategori === 'MAIN COURSE') {
                    mainRows += buatRow(noMain++);
                } else if (item.nama_kategori === 'APPETIZER') {
                    appetizerRows += buatRow(noApp++);
                } else if (item.nama_kategori === 'DESSERT') {
                    dessertRows += buatRow(noDessert++);
                } else if (item.nama_kategori === 'DRINK' || item.nama_kategori === 'MINUMAN') {
                    drinkRows += buatRow(noDrink++);
                } else if (item.nama_kategori === 'ADDITIONAL') {
                    additionalRows += buatRow(noAdd++);
                }
            });

            $('#tabel-main-course tbody').html(mainRows);
            $('#tabel-appetizer tbody').html(appetizerRows);
            $('#tabel-dessert tbody').html(dessertRows);
            $('#tabel-drink tbody').html(drinkRows);
            $('#tabel-additional tbody').html(additionalRows);
        });
    }

    function resetFormMenu() {
        $('#form-tambah-menu')[0].reset();
        $('#edit_id').val('');
        $('#judul-form-menu').text('Input Menu Baru');
        $('#btn-menu-submit')
            .text('Tambah')
            .removeClass('is-editing');
        $('#btn-menu-cancel').hide();
        setPedas(0);
    }

    $('#form-tambah-menu').on('submit', function(e) {
        e.preventDefault();
        let payload = {
            nama_kategori: $('#kategori').val(),
            nama_makanan: $('#nama_makanan').val(),
            harga: $('#harga').val(),
            gambar: $('#gambar').val(),
            deskripsi: $('#deskripsi').val(),
            pedas: parseInt($('#pedas').val()),
            status: true,
        };
        simpanData(urlMenu, $('#edit_id').val(), payload, $('#btn-menu-submit'), function() {
            resetFormMenu(); 
            muatDataMenu();
        });
    });

    let targetStatusChange = null;
    $(document).on('click', '.btn-toggle-status', function() {
        let $btn =$(this);
        let id = $btn.data('id');
        let isTersedia = String($btn.data('status')) === 'true';
        let newStatus = !isTersedia;
        let labelStatus = newStatus ? 'Tersedia' : 'Habis';
        let namaMakanan = $btn.data('nama');
        let m = (window.menuCache || {})[id] || {};

        targetStatusChange = {
            id: id,
            payload: {
                nama_kategori: $btn.data('kategori'),
                nama_makanan: namaMakanan,
                harga: $btn.data('harga'),
                gambar: $btn.data('gambar'),
                deskripsi: m.deskripsi || '',
                pedas: m.pedas || 0,
                status: newStatus
            }
        };

        $('#teks-konfirmasi-status').html(`Apakah Anda yakin ingin mengubah <strong>${esc(namaMakanan)}</strong> menjadi <strong>${esc(labelStatus)}</strong>?`);
        $('#btn-modal-status').prop('disabled', false).text('Ya, Ubah!');
        let modalEl = document.getElementById('modalKonfirmasiStatus');
        let modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    });

    $('#btn-modal-status').on('click', function() {
        if (targetStatusChange) {
            let $btnModal =$(this);
            simpanData(urlMenu, targetStatusChange.id, targetStatusChange.payload, $btnModal, function() {
                muatDataMenu(); 
                let modalEl = document.getElementById('modalKonfirmasiStatus');
                let modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
                targetStatusChange = null;
            });
        }
    });

    $(document).on('click', '.btn-edit-menu', function() {
        $('#edit_id').val($(this).data('id'));
        $('#kategori').val($(this).data('kategori'));
        $('#nama_makanan').val($(this).data('nama'));
        $('#harga').val($(this).data('harga'));
        $('#gambar').val($(this).data('gambar'));
        let m = (window.menuCache || {})[$(this).data('id')] || {};
        $('#deskripsi').val(m.deskripsi || '');
        setPedas(m.pedas || 0);
        setFormEdit('judul-form-menu', 'Edit Data Menu', 'btn-menu-submit', 'btn-menu-cancel', '#tab-menu');
    });

    $('#btn-menu-cancel').on('click', resetFormMenu);

    $(document).on('click', '.btn-hapus-menu', function() {
        hapusData(urlMenu, $(this).data('id'), muatDataMenu);
    });

    $('#search-menu').on('keyup', function() {
        let keyword = $(this).val().toLowerCase();
        $('#tabel-main-course tbody tr, #tabel-appetizer tbody tr, #tabel-dessert tbody tr, #tabel-drink tbody tr, #tabel-additional tbody tr')
        .filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(keyword) > -1);
        });
    });
    muatDataMenu();

    /* Data FAQ */
    const urlFaq = '/api/faq';
    const urlPertanyaan = '/api/admin/pertanyaan';

    function muatDataFaq() {
        $.get(urlFaq, function(response) {
            const data = response.data || [];
            $('#faq-total').text(data.length);

            const rows = data.map(function(item, i) {
                return `
                    <tr>
                        <td><div class="menu-no">${i + 1}</div></td>
                        <td><span class="faq-clamp faq-q-text">${esc(item.pertanyaan)}</span></td>
                        <td><span class="faq-clamp faq-a-text">${esc(item.jawaban)}</span></td>
                        <td>
                            <div class="faq-aksi">
                                <button type="button" class="btn btn-warning btn-sm fw-bold btn-edit-faq" data-id="${esc(item.id)}" data-pertanyaan="${esc(item.pertanyaan)}" data-jawaban="${esc(item.jawaban)}">
                                    <i class="fa-solid fa-pen-to-square"></i><span>Edit</span>
                                </button>
                                <button type="button" class="btn btn-danger btn-sm fw-bold btn-hapus-faq" data-id="${esc(item.id)}">
                                    <i class="fa-solid fa-trash"></i><span>Hapus</span>
                                </button>
                            </div>
                        </td>
                    </tr>`;
            }).join('');

            $('#tabel-faq tbody').html(rows || '<tr><td colspan="4" class="text-muted">Belum ada FAQ.</td></tr>');
            $('#search-faq').trigger('keyup');
        });
    }

    function lepasSumberFaq() {
        $('#sumber_id_faq').val('');
        $('#faq-sumber').addClass('d-none');
    }

    function resetFormFaq() {
        resetForm('form-faq', 'edit_id_faq', 'judul-form-faq', 'Tambah FAQ Baru', 'btn-faq-submit', 'btn-faq-cancel');
        lepasSumberFaq();
    }

    function scrollKeFormFaq() {
        const $main = $('main');
        $main.stop(true).animate({
            scrollTop: $main.scrollTop() + $('#card-form-faq').offset().top - $main.offset().top - 16
        }, 500);
    }

    $('#form-faq').on('submit', function(e) {
        e.preventDefault();
        const sumberId = $('#sumber_id_faq').val();
        let payload = {
            pertanyaan: $('#judul_faq').val().trim(),
            jawaban: $('#jawaban_faq').val().trim()
        };
        simpanData(urlFaq, $('#edit_id_faq').val(), payload, $('#btn-faq-submit'), function() {
            if (sumberId) setDibaca(sumberId, true, true);
            resetFormFaq();
            muatDataFaq();
        });
    });

    $(document).on('click', '.btn-edit-faq', function() {
        lepasSumberFaq();
        $('#edit_id_faq').val($(this).data('id'));
        $('#judul_faq').val($(this).data('pertanyaan'));
        $('#jawaban_faq').val($(this).data('jawaban'));
        $('#judul-form-faq').text('Edit FAQ');
        $('#btn-faq-submit').text('Update Data').addClass('is-editing');
        $('#btn-faq-cancel').show();
        scrollKeFormFaq();
    });

    $('#btn-faq-cancel').on('click', resetFormFaq);
    $('#btn-lepas-sumber').on('click', function() {
        lepasSumberFaq();
        $('#judul-form-faq').text($('#edit_id_faq').val() ? 'Edit FAQ' : 'Tambah FAQ Baru');
    });

    $(document).on('click', '.btn-hapus-faq', function() {
        hapusData(urlFaq, $(this).data('id'), muatDataFaq, $(this).closest('tr').find('.faq-q-text').text());
    });

    fiturPencarian('search-faq', '#tabel-faq tbody tr');
    muatDataFaq();

    let daftarPertanyaan = [];
    let filterPertanyaan = 'belum';

    function cariPertanyaan(id) {
        return daftarPertanyaan.find(p => String(p.id) === String(id));
    }

    function formatTanggal(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return '';
        return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function renderPertanyaan() {
        const belum = daftarPertanyaan.filter(p => !p.dibaca).length;
        const total = daftarPertanyaan.length;

        $('#faq-belum-dibaca, #faq-count-belum').text(belum);
        $('#faq-total-masuk, #faq-count-semua').text(total);
        $('#faq-count-sudah').text(total - belum);
        $('#badge-pertanyaan-nav').text(belum > 99 ? '99+' : belum).toggleClass('d-none', belum <= 0);
        $('#btn-baca-semua').prop('disabled', belum === 0);

        const kata = $('#search-pertanyaan').val().toLowerCase().trim();
        const hasil = daftarPertanyaan.filter(function(p) {
            if (filterPertanyaan === 'belum' && p.dibaca) return false;
            if (filterPertanyaan === 'sudah' && !p.dibaca) return false;
            return !kata || [p.pertanyaan, p.nama, p.email].join(' ').toLowerCase().includes(kata);
        });

        let kosong = 'Belum ada pertanyaan masuk.';
        if (kata) kosong = 'Tidak ada pertanyaan yang cocok.';
        else if (total && filterPertanyaan === 'belum') kosong = 'Semua pertanyaan sudah dibaca.';
        else if (total && filterPertanyaan === 'sudah') kosong = 'Belum ada pertanyaan yang ditandai dibaca.';

        const $list = $('#faq-in-list');
        const posisi = $list.scrollTop();

        $list.html(hasil.map(function(p) {
            const id = esc(p.id);
            return `
                <div class="faq-in-item ${p.dibaca ? 'is-read' : ''}" data-id="${id}">
                    <span class="faq-in-dot" title="${p.dibaca ? 'Sudah dibaca' : 'Belum dibaca'}"></span>
                    <div class="faq-in-body">
                        <p class="faq-in-q">${esc(p.pertanyaan)}</p>
                        <div class="faq-in-meta">
                            <span><i class="fa-solid fa-user"></i>${esc(p.nama || 'Anonim')}</span>
                            ${p.email ? `<span><i class="fa-solid fa-envelope"></i>${esc(p.email)}</span>` : ''}
                            <span><i class="fa-regular fa-clock"></i>${esc(formatTanggal(p.created_at))}</span>
                        </div>
                        <div class="faq-in-actions">
                            <button type="button" class="btn-faq-in utama btn-jadikan-faq" data-id="${id}"><i class="fa-solid fa-pen-to-square me-1"></i>Jadikan FAQ</button>
                            <button type="button" class="btn-faq-in btn-toggle-baca" data-id="${id}" data-dibaca="${p.dibaca ? 'true' : 'false'}">
                                <i class="fa-solid ${p.dibaca ? 'fa-envelope' : 'fa-check'} me-1"></i>${p.dibaca ? 'Tandai belum dibaca' : 'Tandai dibaca'}
                            </button>
                            <button type="button" class="btn-faq-in bahaya btn-hapus-pertanyaan" data-id="${id}" aria-label="Hapus pertanyaan"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>`;
        }).join('') || `<p class="faq-kosong">${kosong}</p>`);

        $list.scrollTop(posisi);
    }

    function muatPertanyaan() {
        $.get(urlPertanyaan, function(response) {
            daftarPertanyaan = response.data || [];
            renderPertanyaan();
        }).fail(function() {
            $('#faq-in-list').html('<p class="faq-kosong">Gagal memuat pertanyaan masuk.</p>');
        });
    }

    function setDibaca(id, dibaca, senyap) {
        const p = cariPertanyaan(id);
        if (p) { p.dibaca = dibaca; renderPertanyaan(); }

        $.ajax({
            url: `${urlPertanyaan}/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ dibaca: dibaca }),
            success: function(response) {
                if (!senyap) tampilkanNotif(response.pesan);
            },
            error: function() {
                tampilkanNotif('Gagal mengubah status pertanyaan.', 'danger');
                muatPertanyaan();
            }
        });
    }

    $(document).on('click', '.btn-toggle-baca', function() {
        setDibaca($(this).data('id'), String($(this).data('dibaca')) !== 'true');
    });

    $('#btn-baca-semua').on('click', function() {
        const $btn = $(this).prop('disabled', true);
        $.ajax({
            url: urlPertanyaan,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ dibaca: true }),
            success: function(response) {
                tampilkanNotif(response.pesan);
                muatPertanyaan();
            },
            error: function() {
                tampilkanNotif('Gagal menandai semua pertanyaan.', 'danger');
                $btn.prop('disabled', false);
            }
        });
    });

    $(document).on('click', '.btn-hapus-pertanyaan', function() {
        const p = cariPertanyaan($(this).data('id'));
        hapusData(urlPertanyaan, $(this).data('id'), muatPertanyaan, p ? p.pertanyaan : '');
    });

    $(document).on('click', '.btn-jadikan-faq', function() {
        const p = cariPertanyaan($(this).data('id'));
        if (!p) return;

        resetFormFaq();
        $('#sumber_id_faq').val(p.id);
        $('#judul_faq').val(p.pertanyaan);
        $('#faq-sumber-teks').text(p.pertanyaan);
        $('#faq-sumber-nama').text(' · ' + (p.nama || 'Anonim'));
        $('#faq-sumber').removeClass('d-none');
        $('#judul-form-faq').text('Tulis FAQ dari Pertanyaan Pengunjung');

        scrollKeFormFaq();
        $('#jawaban_faq')[0].focus({ preventScroll: true });
    });

    $('#faq-filter').on('click', '.faq-filter-btn', function() {
        filterPertanyaan = $(this).data('filter');
        $('.faq-filter-btn').removeClass('active');
        $(this).addClass('active');
        renderPertanyaan();
    });

    $('#search-pertanyaan').on('input', renderPertanyaan);
    $('#admin-nav a[data-target="tab-faq"]').on('click', muatPertanyaan);
    setInterval(function() { if (!document.hidden) muatPertanyaan(); }, 60000);
    muatPertanyaan();

    /* Pesanan */
    let tabPesananAktif = 'pending';
    let daftarPesanan = [];

    function fetchPesanan() {
        $.get('/api/pesanan', function(response) {
            daftarPesanan = response.data || [];
            updateCountPesanan();
            renderTabelPesanan(tabPesananAktif);
        }).fail(function(xhr) {
            console.error("Gagal mengambil data pesanan dari server:", xhr);
        });
    }

    function updateCountPesanan() {
        $('#count-pesanan-pending').text(daftarPesanan.filter(p => p.status === 'pending').length);
        $('#count-pesanan-diproses').text(daftarPesanan.filter(p => p.status === 'diproses').length);
    }

    function renderTabelPesanan(statusFilter) {
        let filtered = daftarPesanan.filter(p => p.status === statusFilter);
        let $tbody =$('#pesanan-table-body');
        $tbody.empty();

        if (filtered.length === 0) {
            $tbody.html('<tr><td colspan="6" class="text-center text-muted py-4">Tidak ada pesanan di kategori ini.</td></tr>');
            return;
        }

        filtered.forEach(function (pesanan) {
            let actionBtn = '';
            let statusBadge = '';
            
            let shortId = pesanan.id ? pesanan.id.toString().substring(0, 8).toUpperCase() : "NA";
            
            if (pesanan.status === 'pending') {
                statusBadge = '<span class="badge bg-secondary">Menunggu Konfirmasi</span>';
                actionBtn = `<button class="btn btn-primary btn-sm fw-bold btn-konfirmasi-pesanan shadow-sm" data-id="${pesanan.id}"><i class="fa-solid fa-check me-1"></i> Konfirmasi</button>`;
            } else if (pesanan.status === 'diproses') {
                statusBadge = '<span class="badge bg-warning text-dark">Sedang Diproses</span>';
                actionBtn = `<button class="btn btn-success btn-sm fw-bold btn-selesai-pesanan shadow-sm" data-id="${pesanan.id}"><i class="fa-solid fa-flag-checkered me-1"></i> Selesai</button>`;
            }

            let namaPemesan = pesanan.nama;
            if (!namaPemesan && pesanan.item) {
                let match = String(pesanan.item).match(/^\[(.*?)(?:\s*-\s*(?:Dine-in|Online|Alamat)|\])/i);
                if (match && match[1]) {
                    namaPemesan = match[1].replace(/^Nama:\s*/i, '').trim();
                }
            }
            namaPemesan = namaPemesan || 'Pelanggan';

            let rowHtml = `
                <tr>
                    <td><strong>ORD-${shortId}</strong></td>
                    <td><strong>${$('<div>').text(namaPemesan).html()}</strong></td>
                    <td><small>${$('<div>').text(pesanan.item || '-').html()}</small></td>
                    <td class="fw-bold text-success">Rp ${Number(pesanan.total).toLocaleString('id-ID')}</td>
                    <td>${statusBadge}</td>
                    <td>${actionBtn}</td>
                </tr>
            `;
            $tbody.append(rowHtml);
        });
    }

    function updateStatusPesanan(id, statusBaru, $btnElemen, pesanSukses) {
        let originalText = $btnElemen.html();$btnElemen.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i>');

        $.ajax({
            url: `/api/pesanan/${id}`,
            type: 'PUT',
            data: { status: statusBaru },
            success: function(response) {
                if (typeof tampilkanNotif === 'function') {
                    tampilkanNotif(pesanSukses, 'success');
                } else {
                    alert(pesanSukses);
                }
                fetchPesanan();
            },
            error: function(xhr) {
                console.error("Gagal update pesanan:", xhr);
                if (typeof tampilkanNotif === 'function') {
                    tampilkanNotif("Gagal mengubah status pesanan.", 'danger');
                } else {
                    alert("Gagal mengubah status pesanan.");
                }
                $btnElemen.prop('disabled', false).html(originalText);
            }
        });
    }

    fetchPesanan();
    setInterval(fetchPesanan, 10000);

    $('.tab-pesanan-btn').on('click', function () {$('.tab-pesanan-btn').removeClass('active btn-primary btn-warning text-dark').addClass('btn-outline-primary').removeClass('btn-outline-warning');
        
        tabPesananAktif = $(this).data('status');
        
        if (tabPesananAktif === 'pending') {
            $(this).addClass('active btn-primary').removeClass('btn-outline-primary');$('.tab-pesanan-btn[data-status="diproses"]').addClass('btn-outline-warning');
        } else {
            $(this).addClass('active btn-warning text-dark').removeClass('btn-outline-warning btn-outline-primary');$('.tab-pesanan-btn[data-status="pending"]').addClass('btn-outline-primary');
        }
        
        renderTabelPesanan(tabPesananAktif);
    });

    $('#pesanan-table-body').on('click', '.btn-konfirmasi-pesanan', function () {
        let id = $(this).data('id');
        updateStatusPesanan(id, 'diproses', $(this), "Pesanan berhasil dikonfirmasi dan sedang diproses!");
    });

    $('#pesanan-table-body').on('click', '.btn-selesai-pesanan', function () {
        let id = $(this).data('id');
        updateStatusPesanan(id, 'selesai', $(this), "Pesanan telah selesai dan diarsipkan!");
    });

    /* Button Naik Ke Atas */
    $('main').on('scroll', function() {
        if ($(this).scrollTop() > 150) {
            $('#btn-back-to-top').fadeIn(300);
        } else {
            $('#btn-back-to-top').fadeOut(300);
        }
    });

    $('#btn-back-to-top').on('click', function() {
        $('main').animate({ scrollTop: 0 }, 'fast'); 
    });

    /* Kelola Lokasi */
    const urlCabang = '/api/maps';
    const VIEW_DEFAULT = [-2.5, 118];
    const ZOOM_CABANG = 15;

    let mapAdmin = null, markerAdmin = null, layerCabang = null;
    let daftarCabang = [];
    let cabangTerpilih = null;
    let dataLokasiAsli = {};

    const escHtml = s => $('<div>').text(s ?? '').html();
    const koordinatValid = (lat, lng) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    const bacaKoordinat = () => [parseFloat($('#lok-lat').val()), parseFloat($('#lok-lng').val())];
    const cariCabang = id => daftarCabang.find(c => String(c.id) === String(id));

    function cekPerubahanLokasi() {
        const isChanged = 
            $('#lok-nama').val().trim() !== dataLokasiAsli.nama ||
            $('#lok-alamat').val().trim() !== dataLokasiAsli.alamat ||
            $('#lok-lat').val() !== dataLokasiAsli.lat ||
            $('#lok-lng').val() !== dataLokasiAsli.lng;
        
        $('#btn-lokasi-simpan').prop('disabled', !isChanged);
    }

    function isiKoordinat(lat, lng) {
        $('#lok-lat').val(Number(lat).toFixed(6));
        $('#lok-lng').val(Number(lng).toFixed(6)).trigger('change');
    }

    function tampilkanPin(terbang) {
        if (!mapAdmin) return;
        const [lat, lng] = bacaKoordinat();
        if (!koordinatValid(lat, lng)) { markerAdmin.remove(); return; }

        markerAdmin.setLatLng([lat, lng]).addTo(mapAdmin);
        
        if (terbang) {
            mapAdmin.removeLayer(layerCabang); 
            
            mapAdmin.flyTo([lat, lng], ZOOM_CABANG, { duration: 1.2 });
            
            mapAdmin.once('moveend', function() {
                mapAdmin.addLayer(layerCabang);
            });
        }
    }

    function lihatSemua() {
        if (!mapAdmin) return;
        const titik = daftarCabang.map(c => [c.latitude, c.longitude]);
        
        mapAdmin.removeLayer(layerCabang);

        if (titik.length) {
            mapAdmin.flyToBounds(titik, { padding: [40, 40], maxZoom: 12, duration: 1.5 });
        } else {
            mapAdmin.flyTo(VIEW_DEFAULT, 5, { duration: 1.5 });
        }

        mapAdmin.once('moveend', function() {
            mapAdmin.addLayer(layerCabang);
        });
    }

    function renderPeta() {
        if (!mapAdmin) return;
        layerCabang.clearLayers();
        daftarCabang
            .filter(c => String(c.id) !== String(cabangTerpilih))
            .forEach(c => {
                L.circleMarker([c.latitude, c.longitude], {
                    radius: 9, color: '#4a2c17', weight: 2, fillColor: '#b5532d', fillOpacity: .9
                })
                    .bindTooltip(escHtml(c.nama))
                    .on('click', () => pilihCabang(c.id))
                    .addTo(layerCabang);
            });
    }

    function renderDaftar() {
        $('#lok-daftar').html(daftarCabang.map((c, i) => `
            <button type="button" class="lok-item" data-id="${c.id}">
                <span class="lok-no">${i + 1}</span>
                <span class="lok-info"><strong>${escHtml(c.nama)}</strong><small>${escHtml(c.alamat)}</small></span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>`).join('') || '<p class="text-muted text-center py-4 mb-0">Belum ada cabang.</p>');

        $('.jumlah-cabang').text(daftarCabang.length);
    }

    function pilihCabang(id, preventFly = false) {
        const c = cariCabang(id);
        cabangTerpilih = c ? c.id : null;

        $('#lok-id').val(c ? c.id : '');
        $('#lok-nama').val(c ? c.nama : '');
        $('#lok-alamat').val(c ? c.alamat : '');
        if (c) isiKoordinat(c.latitude, c.longitude);
        else $('#lok-lat, #lok-lng').val('');

        $('#judul-form-lokasi').text(c ? 'Edit Cabang' : 'Tambah Cabang Baru');
        $('#lok-dipilih').text(c ? c.nama : '-');
        $('#btn-lokasi-hapus').toggle(!!c);
        $('.lok-item').removeClass('active').filter(`[data-id="${cabangTerpilih}"]`).addClass('active');

        dataLokasiAsli = {
            nama: $('#lok-nama').val().trim(),
            alamat: $('#lok-alamat').val().trim(),
            lat: $('#lok-lat').val(),
            lng: $('#lok-lng').val()
        };
        cekPerubahanLokasi();

        renderPeta();
        tampilkanPin(!!c);
    }

    function muatCabang(pilihId = cabangTerpilih) {
        $.get(urlCabang, function(res) {
            daftarCabang = (Array.isArray(res) ? res : []).map(c => ({ ...c, latitude: +c.latitude, longitude: +c.longitude }));
            if (pilihId === 'terbaru') pilihId = Math.max(0, ...daftarCabang.map(c => c.id));

            $('#search-lokasi').val('');
            renderDaftar();
            pilihCabang(pilihId);
        }).fail(function() {
            tampilkanNotif('Gagal memuat data cabang.', 'danger');
        });
    }

    function initMapAdmin() {
        if (mapAdmin) { mapAdmin.invalidateSize(); return; }

        mapAdmin = L.map('map-admin').setView(VIEW_DEFAULT, 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapAdmin);

        layerCabang = L.layerGroup().addTo(mapAdmin);
        markerAdmin = L.marker(VIEW_DEFAULT, { draggable: true });

        markerAdmin.on('dragend', function() {
            const p = markerAdmin.getLatLng();
            isiKoordinat(p.lat, p.lng);
        });
        mapAdmin.on('click', function(e) {
            isiKoordinat(e.latlng.lat, e.latlng.lng);
            tampilkanPin(false);
        });

        renderPeta();
        if (cabangTerpilih === null) lihatSemua(); else tampilkanPin(true);
    }

    $('#admin-nav a[data-target="tab-lokasi"]').on('click', () => setTimeout(initMapAdmin, 350));
    $('#lok-daftar').on('click', '.lok-item', function() { pilihCabang($(this).data('id')); });
    $('#btn-lokasi-baru').on('click', () => pilihCabang(null));
    $('#btn-lokasi-batal').on('click', () => pilihCabang(cabangTerpilih));
    $('#btn-lokasi-semua').on('click', lihatSemua);
    $('#lok-lat, #lok-lng').on('change', () => tampilkanPin(true));
    $('#lok-nama, #lok-alamat, #lok-lat, #lok-lng').on('input change', cekPerubahanLokasi);
    fiturPencarian('search-lokasi', '#lok-daftar .lok-item');

    $('#form-lokasi').on('submit', function(e) {
        e.preventDefault();
        const [latitude, longitude] = bacaKoordinat();
        if (!koordinatValid(latitude, longitude)) {
            tampilkanNotif('Koordinat tidak valid. Klik peta atau isi latitude/longitude.', 'danger');
            return;
        }

        const id = $('#lok-id').val();
        const payload = {
            nama: $('#lok-nama').val().trim(),
            alamat: $('#lok-alamat').val().trim(),
            latitude, longitude
        };
        simpanData(urlCabang, id, payload, $('#btn-lokasi-simpan'), () => muatCabang(id || 'terbaru', true));
    });

    $('#btn-lokasi-hapus').on('click', function() {
        if (cabangTerpilih !== null) hapusData(urlCabang, cabangTerpilih, () => muatCabang(null));
    });

    muatCabang(null);

    /* Favorite Menus */
    let seluruhMenuTersedia = [];
    const formatRp = (angka) => 'Rp ' + Number(angka).toLocaleString('id-ID');
    function muatOpsiMenuFavorit() {
        $.get('/api/menu', function(response) {
            seluruhMenuTersedia = response.data.filter(item => String(item.status) === 'true');
            renderOptionsKeSemuaSlot(seluruhMenuTersedia);
            muatDataFavoritTersimpan();
        }).fail(function() {
            tampilkanNotif('Gagal memuat daftar menu untuk favorit.', 'danger');
        });
    }

    function renderOptionsKeSemuaSlot(dataArray) {
        let htmlList = `<li class="option-item empty-option" data-id="" data-nama="-- Kosongkan Slot --" data-gambar="">
                            <div class="option-name text-muted">-- Kosongkan Slot --</div>
                        </li>`;
        
        dataArray.forEach(item => {
            htmlList += `
                <li class="option-item" data-id="${esc(item.id)}" data-nama="${esc(item.nama_makanan)}" data-gambar="${esc(item.gambar)}">
                    <img src="${esc(item.gambar)}" alt="${esc(item.nama_makanan)}" loading="lazy">
                    <div>
                        <div class="option-name">${esc(item.nama_makanan)}</div>
                        <span class="option-price">${formatRp(esc(item.harga))}</span>
                    </div>
                </li>
            `;
        });

        $('.options-list').html(htmlList);
    }

    function muatDataFavoritTersimpan() {
        $.get('/api/favorit', function(response) {
            if(response && response.data) {
                response.data.forEach(function(fav, index) {
                    let slotNumber = index + 1;
                    if(fav.menu_id) {
                        let targetLi = $(`#fav-list-${slotNumber} .option-item[data-id="${esc(fav.menu_id)}"]`);
                        if(targetLi.length) {
                            pilihOpsi(targetLi, slotNumber);
                        }
                    }
                });
            }
        }).fail(function() {
            console.log("Data menu favorit belum disetel atau endpoint tidak ditemukan.");
        });
    }

    $(document).on('click', '.selected-display', function(e) {
        e.stopPropagation(); 
        let parentBox = $(this).closest('.custom-select-box');
        
        $('.custom-select-box').not(parentBox).removeClass('active');
        
        parentBox.toggleClass('active');
        if(parentBox.hasClass('active')) {
            parentBox.find('.search-input').focus();
        }
    });

    $(document).on('click', function() {$('.custom-select-box').removeClass('active');
    });

    $(document).on('click', '.dropdown-list-container', function(e) {
        e.stopPropagation();
    });

    $(document).on('click', '.option-item', function() {
        let ul = $(this).closest('.options-list');
        let slotId = ul.data('slot');
        pilihOpsi($(this), slotId);
        $(this).closest('.custom-select-box').removeClass('active');
    });

    function pilihOpsi(liElement, slotId) {
        let id = liElement.data('id');
        let nama = liElement.data('nama');
        let gambar = liElement.data('gambar');
        let wrapper = $(`#wrapper-slot-${slotId}`);

        wrapper.find('.option-item').removeClass('selected');
        liElement.addClass('selected');
        
        $(`#fav-slot-${slotId}`).val(id);
        let displayHtml = '';
        if(id && gambar) {
            displayHtml = `<img src="${esc(gambar)}" alt="gambar"> <span>${esc(nama)}</span>`;
        } else {
            displayHtml = `<span>-- Pilih Menu --</span>`;
        }
        wrapper.find('.selected-text').html(displayHtml);

        let $prevImgWrap =$(`#prev-slot-${slotId} .prev-img-wrap`);
        if(id) {
            $prevImgWrap.addClass('filled').html(`<img src="${gambar}" alt="${nama}" title="${nama}">`);
        } else {
            $prevImgWrap.removeClass('filled').html(`<img src="../img/Web-Icon/Papeda-icon.png" alt="Empty">`);
        }
    }

    $('.search-input').on('keyup', function() {
        let keyword = $(this).val().toLowerCase();
        let listItems = $(this).closest('.dropdown-list-container').find('.option-item');
        
        listItems.each(function() {
            let namaMakanan = String($(this).data('nama')).toLowerCase();
            if(namaMakanan.indexOf(keyword) > -1) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    $('#form-favorit').on('submit', function(e) {
        e.preventDefault();
        let $btn =$('#btn-simpan-favorit');
        let originalText = $btn.html();$btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Menyimpan...');

        let payload = [];
        for(let i = 1; i <= 5; i++) {
            payload.push({
                slot: i,
                menu_id: $(`#fav-slot-${i}`).val() || null
            });
        }

        $.ajax({
            url: '/api/favorit',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ data: payload }),
            success: function(response) {
                tampilkanNotif(response.pesan || 'Menu favorit berhasil diperbarui!');
            },
            error: function() {
                tampilkanNotif('Gagal menyimpan menu favorit.', 'danger');
            },
            complete: function() {
                $btn.prop('disabled', false).html(originalText);
            }
        });
    });

    $('#admin-nav a[data-target="tab-favorit"]').on('click', function() {
        if (seluruhMenuTersedia.length === 0) {
            muatOpsiMenuFavorit();
        }
    });
});

/* Reservasi */
$(function () {
    let semuaReservasi = [];
    let dataUsersGlobal = [];
    let isDataLoaded = false;

    let globalSearch = '';
    let globalFilter = '';

    const esc = (str) => {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    };

    function dataCocokSearch(data, keyword) {
        if (!keyword) return true;

        keyword = keyword.toLowerCase().trim();

        return Object.values(data).some(value =>
            String(value ?? '').toLowerCase().includes(keyword)
        );
    }

    function renderCurrentSearch() {
        const activeTab = $('.reservation-tabs .tab-btn.active');

        if (!activeTab.length) return;

        const isUserTab = activeTab.data('tab') === 'tab-user';

        if (isUserTab) {
            renderTableUsers();
        } else {
            loadDataReservasi(activeTab.data('status'));
        }
    }

    async function loadDataUsers() {
        try {
            if (!isDataLoaded) {
                const res = await fetch('/api/admin/users');
                const result = await res.json();
                dataUsersGlobal = result.data || [];
                isDataLoaded = true;
            }
            renderTableUsers();
        } catch (err) {
            console.error('Gagal mengambil data user:', err);
        }
    }

    function formatTanggal(dateString) {

        if (!dateString) return '-';

        const date = new Date(dateString);

        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
    }

function renderTableUsers() {
    $('#count-user').text(dataUsersGlobal.length);
    const $tbody = $('#user-table-body');
    $tbody.empty();
    if (dataUsersGlobal.length === 0) {
        $tbody.html(`
            <tr>
                <td colspan="7"
                    class="text-center text-muted py-4">
                    Belum ada user terdaftar.
                </td>
            </tr>
        `);
        return;
    }

    const filteredUsers = dataUsersGlobal.filter(u => {
        if (globalFilter === 'active') {
            const rawActive =
                u.Is_Active !== undefined
                    ? u.Is_Active
                    : u.is_active;
            if (
                rawActive === false ||
                rawActive === 'false' ||
                rawActive === 0
            ) {
                return false;
            }
        }
        if (globalFilter === 'blocked') {
            const rawActive =
                u.Is_Active !== undefined
                    ? u.Is_Active
                    : u.is_active;
            if (!(
                rawActive === false ||
                rawActive === 'false' ||
                rawActive === 0
            )) {
                return false;
            }
        }
        return dataCocokSearch(
            u,
            globalSearch
        );
    });

    const rows = filteredUsers.map(u => {
        const originalIndex =
            dataUsersGlobal.indexOf(u);

        const formattedId =
            String(originalIndex + 1)
                .padStart(5, '0');

        const tgl = u.created_at
            ? new Date(u.created_at)
                .toLocaleDateString('id-ID')
            : '-';

        const rawActive =
            u.Is_Active !== undefined
                ? u.Is_Active
                : u.is_active;

        const isActive =
            rawActive !== false &&
            rawActive !== 'false' &&
            rawActive !== 0;

        const statusText =
            isActive
                ? 'Active'
                : 'Blocked';

        const statusColor =
            isActive
                ? 'bg-success'
                : 'bg-danger';
        return `
            <tr>
                <td class="text-center">
                    <input
                        type="checkbox"
                        class="form-check-input user-row-check"
                        value="${esc(u.id)}">
                </td>
                <td>
                    <span class="badge bg-light text-dark border font-monospace">
                        ${formattedId}
                    </span>
                </td>
                <td>
                    <strong>
                        ${esc(u.nama || '-')}
                    </strong>
                </td>
                <td>
                    ${esc(u.email || '-')}
                </td>
                <td class="text-center">
                    ${esc(tgl)}
                </td>
                <td class="text-center">
                    <span class="badge bg-light text-dark border">
                        ${esc(u.total_reserve || '0')}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge ${statusColor}">
                        ${statusText}
                    </span>
                </td>
            </tr>`;
    }).join('');
    $tbody.html(rows);
    syncAction();
}

    async function loadDataReservasi(statusFilter = 'pending') {
        try {
            const res = await fetch('/api/admin/reservasi');
            const result = await res.json();
            semuaReservasi = result.data || [];

            $('#count-pending').text(semuaReservasi.filter(r => r.status === 'pending').length);
            $('#count-approved').text(semuaReservasi.filter(r => r.status === 'approved' || r.status === 'dikonfirmasi').length);
            $('#count-complete').text(semuaReservasi.filter(r => r.status === 'complete' || r.status === 'selesai').length);
            $('#count-dibatalkan').text(semuaReservasi.filter(r => r.status === 'dibatalkan' || r.status === 'cancelled').length);

            const filtered = semuaReservasi.filter(r => {
                let cocokStatus = false;

                if (statusFilter === 'approved') {
                    cocokStatus =
                        r.status === 'approved' ||
                        r.status === 'dikonfirmasi';

                } else if (statusFilter === 'complete') {
                    cocokStatus =
                        r.status === 'complete' ||
                        r.status === 'selesai';

                } else if (statusFilter === 'dibatalkan') {
                    cocokStatus =
                        r.status === 'dibatalkan' ||
                        r.status === 'cancelled';

                } else {
                    cocokStatus = r.status === statusFilter;
                }
                if (!cocokStatus) return false;
                return dataCocokSearch(r, globalSearch);
            });
            
            const $tbody =$('#reservation-table-body');
            $tbody.empty();

            if (filtered.length === 0) {
                $tbody.html('<tr><td colspan="8" class="text-center text-muted py-4">Tidak ada reservasi pada status ini.</td></tr>');
                return;
            }

            const rows = filtered.map(r => `
                <tr>
                    <td><strong>${esc(r.gerai || '-')}</strong></td>
                    <td>${esc(r.nama || '-')}</td>
                    <td>${esc(r.telepon || '-')}<br><small class="text-muted">${esc(r.email || '-')}</small></td>
                    <td>${esc(r.tanggal || '-')}<br><small>${esc(r.jam || '')} (${esc(r.sesi || '')})</small></td>
                    <td>${esc(r.jumlah || 0)} Orang</td>
                    <td>${esc(r.ruangan || '-')}</td>
                    <td>${esc(r.catatan || '-')}</td>
                    <td class="aksi">
                        ${(r.status === 'complete' || r.status === 'selesai')
                            ? `
                                <span class="badge bg-success">Selesai</span>
                            `
                            : (r.status === 'dibatalkan' || r.status === 'cancelled')
                            ? `
                                <span class="badge bg-danger">Dibatalkan</span>
                            `
                            : (r.status === 'approved' || r.status === 'dikonfirmasi')
                            ? `
                                <div class="reservation-actions">
                                    <button
                                        type="button"
                                        class="btn-action-confirm btn-confirm"
                                        data-id="${esc(r.id)}"
                                        data-next="complete">
                                        ✓ Selesaikan
                                    </button>

                                    <button
                                        type="button"
                                        class="btn-action-cancel btn-cancel"
                                        data-id="${esc(r.id)}"
                                        data-next="dibatalkan">
                                        ✕ Batalkan
                                    </button>
                                </div>
                            `
                            : `
                                <div class="reservation-actions">
                                    <button
                                        type="button"
                                        class="btn-action-confirm btn-confirm"
                                        data-id="${esc(r.id)}"
                                        data-next="approved">
                                        ✓ Konfirmasi
                                    </button>

                                    <button
                                        type="button"
                                        class="btn-action-cancel btn-cancel"
                                        data-id="${esc(r.id)}"
                                        data-next="dibatalkan">
                                        ✕ Batalkan
                                    </button>
                                </div>
                            `
                        }
                    </td>
                </tr>
            `).join('');

            $tbody.html(rows);
        } catch (err) {
            console.error('Gagal mengambil data reservasi:', err);
        }
    }

    $('.reservation-tabs .tab-btn').on('click', function () {
        $('.reservation-tabs .tab-btn').removeClass('active');$(this).addClass('active');

        const isUserTab = $(this).data('tab') === 'tab-user';$('#panel-tab-user').toggleClass('d-none', !isUserTab);
        $('#panel-tab-reservasi').toggleClass('d-none', isUserTab);

        if (isUserTab) {
            loadDataUsers();
        } else {
            loadDataReservasi($(this).data('status'));
        }
    });

    $('#reservation-table-body').on('click', '.btn-confirm', async function () {
        const id = $(this).data('id');
        const nextStatus = $(this).data('next');

        try {
            const res = await fetch(`/api/admin/reservasi/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });

            if (res.ok) {
                const currentStatus = $('.reservation-tabs .tab-btn.active').data('status');
                loadDataReservasi(currentStatus);
            }
        } catch (err) {
            console.error('Gagal memperbarui status reservasi:', err);
        }
    });

    const syncAction = () => {
        const checked = $('.user-row-check:checked');
        const total = $('.user-row-check').length;
        const $actionWrapper =$('#user-action-wrapper');

        $('#check-all-users').prop('checked', checked.length > 0 && checked.length === total);

        if (checked.length > 0) {
            $('#selected-user-count').text(`${checked.length} akun dipilih`);
            if (!$actionWrapper.is(':visible')) {
                $actionWrapper.slideDown(300);            
            }         
        } else {
            $actionWrapper.slideUp(300);
        }
    };

    $(document).on('change', '#check-all-users', function () {
        $('.user-row-check').prop('checked', this.checked);
        syncAction();
    });

    $('#user-table-body').on('change', '.user-row-check', syncAction);

    $('.custom-action-dropdown .dropdown-item').on('click', function(e) {
        e.preventDefault();
        const value = $(this).data('value');
        const textHTML = $(this).html();$('#selected-aksi-text').html(textHTML);
        $('#user-action-select').val(value);
    });

$('#reservation-table-body').on('click', '.btn-cancel', async function () {

    const id = $(this).data('id');
    const nextStatus = $(this).data('next');

    const yakin = await showCancelReservationModal();
    if (!yakin) return;

    try {

        const res = await fetch(`/api/admin/reservasi/${id}/status`, {
            method: 'PUT',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                status: nextStatus
            })
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(
                result.message || 'Gagal membatalkan reservasi'
            );
        }

        const currentStatus =
            $('.reservation-tabs .tab-btn.active').data('status');

        loadDataReservasi(currentStatus);

        } catch (err) {

            console.error(
                'Gagal membatalkan reservasi:',
                err
            );

            alert(
                err.message ||
                'Gagal membatalkan reservasi'
            );
        }
    });

    function showCancelReservationModal() {
    return new Promise((resolve) => {

        const modalElement = document.getElementById(
            'cancelReservationModal'
        );

        const modal = new bootstrap.Modal(modalElement);

        const confirmButton = document.getElementById(
            'btn-confirm-cancel-reservation'
        );

        let finished = false;

        const handleConfirm = () => {
            finished = true;

            modal.hide();

            cleanup();

            resolve(true);
        };

        const handleHidden = () => {

            if (!finished) {
                cleanup();
                resolve(false);
            }
        };

        const cleanup = () => {
            confirmButton.removeEventListener(
                'click',
                handleConfirm
            );

            modalElement.removeEventListener(
                'hidden.bs.modal',
                handleHidden
            );
        };

        confirmButton.addEventListener(
            'click',
            handleConfirm
        );

        modalElement.addEventListener(
            'hidden.bs.modal',
            handleHidden
        );

        modal.show();
    });
    }

    function showCustomConfirm(pesan) {
        return new Promise((resolve) => {
            $('#confirmModalText').text(pesan);
            
            const modalElement = document.getElementById('customConfirmModal');
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            let isConfirmed = false;

            $('#btn-confirm-lanjutkan').off('click').on('click', function () {
                isConfirmed = true; 
                modalInstance.hide();
            });

            $(modalElement).off('hidden.bs.modal').on('hidden.bs.modal', function () {
                resolve(isConfirmed); 
            });

            modalInstance.show();
        });
    }

    $('#btn-eksekusi-user-aksi').off('click').on('click', async function () { 
        const aksi = $('#user-action-select').val(); 
        const ids = $('.user-row-check:checked').map((_, el) => String(el.value)).get();
        
        if (!aksi || !ids.length){ 
            alert('Pilih aksi dan minimal 1 akun!');
            return;
        }

        let pesanKonfirmasi = '';
        if (aksi === 'hapus') {
            pesanKonfirmasi = `Yakin ingin menghapus permanen ${ids.length} akun ini?`;
        } else if (aksi === 'blokir') {
            pesanKonfirmasi = `Blokir ${ids.length} akun terpilih? Mereka tidak akan bisa login.`;
        } else if (aksi === 'modifikasi') {
            pesanKonfirmasi = `Ubah status ${ids.length} akun menjadi Active (Buka Blokir)?`;
        }
        
        const isConfirmed = await showCustomConfirm(pesanKonfirmasi);
        if (!isConfirmed) return; 

        try {
            if (aksi === 'hapus') {
                const res = await fetch('/api/admin/users', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: ids })
                });
                if (!res.ok) throw new Error('Gagal menghapus di database');

                dataUsersGlobal = dataUsersGlobal.filter(u => !ids.includes(String(u.id)));

            } else if (aksi === 'blokir' || aksi === 'modifikasi') {
                const targetIsActive = (aksi === 'modifikasi');
                
                const res = await fetch('/api/admin/users/status', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: ids, Is_Active: targetIsActive })
                });
                if (!res.ok) throw new Error('Gagal memperbarui status di database');

                dataUsersGlobal.forEach(u => {
                    if (ids.includes(String(u.id))) u.Is_Active = targetIsActive;
                });
            }

            $('#user-action-select').val('');
            $('#selected-aksi-text').text('Pilih Aksi...');
            $('#check-all-users').prop('checked', false);
            $('#user-action-wrapper').slideUp(300);
            
            renderTableUsers();

        } catch (error) {
            console.error("Terjadi kesalahan:", error);
            alert("Gagal menyimpan perubahan ke database.");
        }
    });

    $('#global-search').on('input', function () {
        globalSearch = $(this).val().trim();
        renderCurrentSearch();
    });

    $('#global-filter-btn').on('click', function () {
        const activeTab = $('.reservation-tabs .tab-btn.active');
        const isUserTab = activeTab.data('tab') === 'tab-user';

        if (isUserTab) {
            globalFilter = globalFilter === '' ? 'active'
            : globalFilter === 'active'? 'blocked': '';
            renderTableUsers();
            return;
        }
    });

    loadDataUsers();
    loadDataReservasi('pending');
});

$(function () {
    const rp = n => 'Rp ' + Number(n).toLocaleString('id-ID');

    const rpSingkat = v => v >= 1e6
        ? 'Rp' + (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt'
        : v >= 1e3
            ? 'Rp' + Math.round(v / 1e3) + 'K'
            : 'Rp' + v;

    const esc = s => $('<div>').text(s ?? '').html();

    const tglPendek = iso =>
        new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });

    const JUDUL = {
        hari: 'Pendapatan Hari Ini (per Jam)',
        7: 'Pendapatan 7 Hari Terakhir',
        30: 'Pendapatan 30 Hari Terakhir',
    };

    const MEDALI = [
        '<i class="fa-solid fa-medal medal-gold"></i>',
        '<i class="fa-solid fa-medal medal-silver"></i>',
        '<i class="fa-solid fa-medal medal-bronze"></i>'
    ];

    let chart = null;
    let rangeAktif = '7';

    function hitung($el, target, format) {
        const mulai = performance.now();

        (function frame(t) {
            const p = Math.min((t - mulai) / 800, 1);

            $el.text(
                format(
                    Math.round(
                        target * (1 - Math.pow(1 - p, 3))
                    )
                )
            );

            if (p < 1) requestAnimationFrame(frame);
        })(mulai);
    }

    function renderGrafik(grafik, range) {
        const ctx = document
            .getElementById('chart-pendapatan')
            .getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 0, 320);

        grad.addColorStop(0, 'rgba(139, 94, 52, .45)');
        grad.addColorStop(1, 'rgba(139, 94, 52, 0)');

        const labels = grafik.map(g =>
            range === 'hari'
                ? g.label
                : tglPendek(g.label)
        );

        const values = grafik.map(g => g.total);

        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: 'line',

            data: {
                labels,

                datasets: [{
                    data: values,
                    fill: true,
                    backgroundColor: grad,
                    borderColor: '#4a2c17',
                    borderWidth: 3,
                    tension: 0.35,

                    pointRadius: values.length > 15 ? 0 : 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#4a2c17'
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                animation: {
                    duration: 900,
                    easing: 'easeOutQuart'
                },

                interaction: {
                    intersect: false,
                    mode: 'index'
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label: c => ' ' + rp(c.parsed.y)
                        }
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            callback: rpSingkat
                        },

                        grid: {
                            color: 'rgba(216, 195, 171, .4)'
                        }
                    },

                    x: {
                        grid: {
                            display: false
                        },

                        ticks: {
                            maxTicksLimit: 10
                        }
                    }
                }
            }
        });
    }

    function renderTerlaris(list) {
        if (!list.length) {
            $('#top-menu').html(
                '<p class="text-muted mb-0">' +
                'Belum ada pesanan selesai pada periode ini.' +
                '</p>'
            );

            return;
        }

        const maks = list[0].qty;

        $('#top-menu').html(
            list.map((m, i) => `
                <div class="top-item">

                    <div class="top-rank">
                        ${MEDALI[i] || `<span class="rank-number">${i + 1}</span>`}
                    </div>

                    <div class="flex-grow-1">

                        <div class="d-flex justify-content-between gap-2">
                            <strong>${esc(m.nama)}</strong>

                            <span class="text-muted small">
                                ${m.qty} order
                                &middot;
                                ${m.pendapatan ? rp(m.pendapatan) : '-'}
                            </span>
                        </div>

                        <div class="top-bar">
                            <span data-lebar="${(m.qty / maks) * 100}"></span>
                        </div>

                    </div>
                </div>
            `).join('')
        );

        $('#top-menu .top-bar span').each(function() {
            this.style.width = this.dataset.lebar + '%';
        });
    }

    function renderLaporan(laporan, r) {
        $('#tabel-laporan tbody').html(
            laporan.map(l => `
                <tr>
                    <td>${tglPendek(l.tanggal)}</td>
                    <td>${l.pesanan}</td>
                    <td>${l.item}</td>
                    <td class="fw-bold text-success">
                        ${rp(l.pendapatan)}
                    </td>
                </tr>
            `).join('')
        );

        $('#tabel-laporan tfoot').html(`
            <tr class="fw-bold">
                <td>Total</td>
                <td>${r.pesanan}</td>
                <td>${r.item}</td>
                <td>${rp(r.total)}</td>
            </tr>
        `);
    }

    function muat(range) {
        rangeAktif = range;

        $('.range-btn')
            .removeClass('active')
            .filter(`[data-range="${range}"]`)
            .addClass('active');

        $('#judul-grafik').text(JUDUL[range]);

        $.get('/api/pendapatan', { range })
            .done(res => {
                const r = res.ringkasan;

                hitung($('#kpi-total'), r.total, rp);
                hitung($('#kpi-pesanan'), r.pesanan, String);
                hitung($('#kpi-item'), r.item, String);
                hitung($('#kpi-rata'), r.rata, rp);

                renderGrafik(res.grafik, range);
                renderTerlaris(res.terlaris);
                renderLaporan(res.laporan, r);
            })
            .fail(() => {
                $('#top-menu').html(
                    '<p class="text-danger mb-0">' +
                    'Gagal memuat data pendapatan.' +
                    '</p>'
                );
            });
    }

    $('.range-btn').on('click', function () {
        muat($(this).data('range').toString());
    });

    $('#admin-nav a[data-target="tab-pendapatan"]')
        .on('click', () => muat(rangeAktif));

    $('#btn-full-report').on('click', function () {
        const $btn = $(this);

        $('#full-report').slideToggle(300, function () {
            $btn.text(
                $(this).is(':visible')
                    ? 'Tutup Laporan ↑'
                    : 'View Full Report →'
            );

            if ($(this).is(':visible')) {
                $('main').animate({
                    scrollTop:
                        $('main').scrollTop() +
                        $(this).position().top -
                        20
                }, 400);
            }
        });
    });
});

$(function () {
    const rp = n => 'Rp ' + Number(n).toLocaleString('id-ID');
    const STATUS = { pending: ['Menunggu', 'secondary'], diproses: ['Diproses', 'warning'], selesai: ['Selesai', 'success'] };

    function muatDashboard() {
    $.get('/api/pesanan', res => {
        const d = (res.data || []).slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        $('#dash-pesanan').text(d.length);
        $('#recent-orders').html(d.length ? d.slice(0, 5).map(o => {
                const s = STATUS[o.status] || [o.status, 'secondary'];
                const item = String(o.item || '').replace(/^\[[^\]]*\]\s*/, '');
                return `<div class="recent-row"><strong>#${String(o.id).slice(0, 6)}</strong>
                    <span class="flex-grow-1 text-truncate">${$('<div>').text(item).html()}</span>
                    <span class="fw-bold">${rp(o.total)}</span><span class="badge text-bg-${s[1]}">${s[0]}</span></div>`;
            }).join('') : '<p class="text-muted mb-0">Belum ada pesanan masuk.</p>');
        });
    $.get('/api/pendapatan', { range: 'bulan' }, res => {
        const total = res.ringkasan?.total || 0;
        $('#dash-revenue').text(rp(total));
    });
    }
    muatDashboard();
    $('#admin-nav a[data-target="tab-statistik"]').on('click', muatDashboard);
});
const LABEL_PEDAS = [
    'Tidak Pedas',
    'Sedikit Pedas',
    'Ringan',
    'Sedang',
    'Pedas',
    'Sangat Pedas'
];

function setPedas(value) {
    value = Math.max(0, Math.min(5, Number(value) || 0));

    $('#pedas').val(value);
    $('#pedas-value').text(value);
    $('#pedas-label').text(LABEL_PEDAS[value]);

    $('.pedas-btn').each(function () {
        const btnValue = Number($(this).data('value'));

        $(this).toggleClass(
            'active',
            value > 0 && btnValue > 0 && btnValue <= value
        );
    });
}

$('#pedas-picker').on('click', '.pedas-btn', function () {
    setPedas($(this).data('value'));
});

function tampilkanPedas(level) {
    level = Math.max(0, Math.min(5, Number(level) || 0));
    if (level === 0) {
        return `
            <span class="pedas-menu" title="Tidak Pedas">
                <i class="fa-solid fa-ban"></i>
                <span class="pedas-label">Tidak Pedas</span>
            </span>
        `;
    }
    let ikonCabai = "";
    for (let i = 0; i < level; i++) {
        ikonCabai += `
            <i class="fa-solid fa-pepper-hot"></i>
        `;
    }
    return `
        <span class="pedas-menu" title="Tingkat Kepedasan ${level}/5">
            ${ikonCabai}
        </span>
    `;
}