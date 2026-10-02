$(document).ready(function() {
    let dataKontenAsli = { hero: '', about: '' };
    /* Notification */
    function tampilkanNotif(pesan, tipe = 'success') {
        let $toastEl =$('#liveToast');
        
        $toastEl.removeClass('text-bg-success text-bg-danger').addClass(`text-bg-${tipe}`);
        
        $('#pesan-notif').text(pesan);
        
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
            $('#teks_hero').val(dataKontenAsli.hero);
            $('#teks_about').val(dataKontenAsli.about);
            updateLivePreview(); 
        }

        $('#admin-nav a').removeClass('active');
        $(this).addClass('active');

        let targetId = $(this).data('target');
        $('.tab-section').hide();
        $('#' + targetId).fadeIn(300);
    });

    /* Statistik & Konten */
    function updateLivePreview() {
        let heroText = $('#teks_hero').val() || '';
        let aboutText = $('#teks_about').val() || '';

        $('#preview-hero').html(heroText.replace(/\n/g, '<br>'));
        $('#preview-about').text(aboutText);
    }

    function muatStatistikDanKonten() {
        $.get('http://localhost:3000/api/statistik', function(data) {
            $('#angka-pengunjung').text(data.jumlah_pengunjung);
        });
        
        $.get('http://localhost:3000/api/konten', function(data) {
            $('#teks_hero').val(data.teks_hero);
            $('#teks_about').val(data.teks_about);
            
            dataKontenAsli.hero = data.teks_hero;
            dataKontenAsli.about = data.teks_about;
            
            updateLivePreview();
        });
    }

    muatStatistikDanKonten();

    $('#teks_hero, #teks_about').on('input', function() {
        updateLivePreview();
    });

    /* Update Content */
    $('#form-konten .btn-simpan').on('click', function(e) {
        e.preventDefault();
        let $btn =$(this);
        let originalText = $btn.text();$btn.prop('disabled', true).text('Memperbarui...'); 

        let dataKonten = {
            teks_hero: $('#teks_hero').val(),
            teks_about: $('#teks_about').val()
        };

        $.ajax({
            url: 'http://localhost:3000/api/konten',
            type: 'PUT',
            data: dataKonten,
            success: function(response) {
                tampilkanNotif(response.pesan);

                dataKontenAsli.hero = dataKonten.teks_hero;
                dataKontenAsli.about = dataKonten.teks_about;
            }
        }).always(function() {
            $btn.prop('disabled', false).text(originalText);
        });
    });

    /* Function Menu + FAQ */
    function muatData(endpoint, tbodySelector, counterSelector, templateHTML) {
        $.get(`http://localhost:3000/api/${endpoint}`, function(response) {
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
        $(`#${btnSubmitId}`).text('Simpan ke Database').css('background-color', '#27ae60');
        $(`#${btnCancelId}`).hide();
    }

    function setFormEdit(judulId, textJudul, btnSubmitId, btnCancelId, tabSelector) {
        $(`#${judulId}`).text(textJudul);
        $(`#${btnSubmitId}`).text('Update Data').css('background-color', '#f39c12');
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
    const urlMenu = 'http://localhost:3000/api/menu';

    function muatDataMenu() {
        $.get('http://localhost:3000/api/menu', function(response) {
            let mainRows = '';
            let appetizerRows = '';
            let dessertRows = '';
            let noMain = 1;
            let noApp = 1;
            let noDessert = 1;
            $('#angka-menu').text(response.data.length);
            response.data.sort((a, b) => Number(a.id) - Number(b.id)).forEach(function(item) {
                let nilaiHarga = Number(item.harga);
                window.menuCache = window.menuCache || {};
                window.menuCache[item.id] = item;
                let badgeStatus = item.status
                    ? `<button class="status-badge tersedia btn-toggle-status"
                        data-id="${item.id}"
                        data-status="true"
                        data-kategori="${item.nama_kategori}"
                        data-nama="${item.nama_makanan}"
                        data-harga="${item.harga}"
                        data-gambar="${item.gambar}">
                        Tersedia
                    </button>`
                    : `<button class="status-badge habis btn-toggle-status"
                        data-id="${item.id}"
                        data-status="false"
                        data-kategori="${item.nama_kategori}"
                        data-nama="${item.nama_makanan}"
                        data-harga="${item.harga}"
                        data-gambar="${item.gambar}">
                        Habis
                    </button>`;
                const buatRow = (nomor) => `
                    <tr>
                        <td>
                            <div class="menu-no">
                                ${nomor}
                            </div>
                        </td>
                        <td>
                            <img src="${item.gambar}" 
                                class="preview" 
                                alt="foto">
                        </td>
                        <td>
                            <div class="nama-menu-wrapper">
                                <span class="nama-menu-text">
                                    ${item.nama_makanan}
                                </span>

                                ${tampilkanPedas(item.pedas)}
                            </div>
                        </td>
                        <td>Rp ${nilaiHarga.toLocaleString('id-ID')}</td>
                        <td>${badgeStatus}</td>
                        <td>
                            <button
                                class="btn btn-warning btn-sm fw-bold btn-edit-menu"
                                data-id="${item.id}"
                                data-kategori="${item.nama_kategori}"
                                data-nama="${item.nama_makanan}"
                                data-harga="${item.harga}"
                                data-gambar="${item.gambar}"
                                data-status="${item.status}">
                                Edit
                            </button>

                            <button
                                class="btn btn-danger btn-sm fw-bold btn-hapus-menu"
                                data-id="${item.id}">
                                Hapus
                            </button>
                        </td>
                    </tr>
                `;
                if (item.nama_kategori === 'MAIN COURSE') {
                    mainRows += buatRow(noMain++);
                }

                else if (item.nama_kategori === 'APPETIZER') {
                    appetizerRows += buatRow(noApp++);
                }

                else if (item.nama_kategori === 'DESSERT') {
                    dessertRows += buatRow(noDessert++);
                }
            });

            $('#tabel-main-course tbody').html(mainRows);
            $('#tabel-appetizer tbody').html(appetizerRows);
            $('#tabel-dessert tbody').html(dessertRows);
        });
    }

    function resetFormMenu() {
        $('#form-tambah-menu')[0].reset();
        $('#edit_id').val('');
        $('#judul-form-menu').text('Input Menu Baru');
        $('#btn-menu-submit')
            .text('Tambah')
            .css('background-color', '#27ae60');
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

        $('#teks-konfirmasi-status').html(`Apakah Anda yakin ingin mengubah <strong>${namaMakanan}</strong> menjadi <strong>${labelStatus}</strong>?`);
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
        $('#tabel-main-course tbody tr, \
        #tabel-appetizer tbody tr, \
        #tabel-dessert tbody tr')
        .filter(function() {
            $(this).toggle(
                $(this).text().toLowerCase().indexOf(keyword) > -1
            );
        });
    });
    muatDataMenu();

    /* Data FAQ */
    const urlFaq = 'http://localhost:3000/api/faq';

    function muatDataFaq() {
        muatData('faq', '#tabel-faq tbody', null, function(item) {
            return `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.pertanyaan}</td>
                    <td>${item.jawaban}</td>
                    <td>
                        <button class="btn btn-sm text-dark fw-bold btn-edit-faq btn-edit" data-id="${item.id}" data-pertanyaan="${item.pertanyaan}" data-jawaban="${item.jawaban}">Edit</button>
                        <button class="btn btn-sm fw-bold btn-hapus-faq btn-hapus" data-id="${item.id}">Hapus</button>
                    </td>
                </tr>
            `;
        });
    }

    function resetFormFaq() {
        resetForm('form-faq', 'edit_id_faq', 'judul-form-faq', 'Input Pertanyaan Baru', 'btn-faq-submit', 'btn-faq-cancel');
    }

    $('#form-faq').on('submit', function(e) {
        e.preventDefault();
        let payload = {
            pertanyaan: $('#judul_faq').val(),
            jawaban: $('#jawaban_faq').val()
        };
        simpanData(urlFaq, $('#edit_id_faq').val(), payload, $('#btn-faq-submit'), function() {
            resetFormFaq(); 
            muatDataFaq();
        });
    });

    $(document).on('click', '.btn-edit-faq', function() {
        $('#edit_id_faq').val($(this).data('id'));
        $('#judul_faq').val($(this).data('pertanyaan'));
        $('#jawaban_faq').val($(this).data('jawaban'));
        setFormEdit('judul-form-faq', 'Edit Data FAQ', 'btn-faq-submit', 'btn-faq-cancel', '#tab-faq');
    });

    $('#btn-faq-cancel').on('click', resetFormFaq);

    $(document).on('click', '.btn-hapus-faq', function() {
        hapusData(urlFaq, $(this).data('id'), muatDataFaq);
    });

    fiturPencarian('search-faq', '#tabel-faq tbody tr');
    muatDataFaq();

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

            let rowHtml = `
                <tr>
                    <td><strong>ORD-${shortId}</strong></td>
                    <td>${pesanan.nama}</td>
                    <td><small>${pesanan.item}</small></td>
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
    const urlCabang = 'http://localhost:3000/api/maps';
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
        $.get('http://localhost:3000/api/menu', function(response) {
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
                <li class="option-item" data-id="${item.id}" data-nama="${item.nama_makanan}" data-gambar="${item.gambar}">
                    <img src="${item.gambar}" alt="${item.nama_makanan}" loading="lazy">
                    <div>
                        <div class="option-name">${item.nama_makanan}</div>
                        <span class="option-price">${formatRp(item.harga)}</span>
                    </div>
                </li>
            `;
        });

        $('.options-list').html(htmlList);
    }

    function muatDataFavoritTersimpan() {
        $.get('http://localhost:3000/api/favorit', function(response) {
            if(response && response.data) {
                response.data.forEach(function(fav, index) {
                    let slotNumber = index + 1;
                    if(fav.menu_id) {
                        let targetLi = $(`#fav-list-${slotNumber} .option-item[data-id="${fav.menu_id}"]`);
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
            displayHtml = `<img src="${gambar}" alt="gambar"> <span>${nama}</span>`;
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
            url: 'http://localhost:3000/api/favorit',
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

    async function loadDataUsers() {
        try {
            const res = await fetch('/api/admin/users');
            const result = await res.json();
            const users = result.data || [];

            $('#count-user').text(users.length);

            const $tbody =$('#user-table-body');
            $tbody.empty();

            if (users.length === 0) {
                $tbody.html('<tr><td colspan="6" class="text-center text-muted py-4">Belum ada user terdaftar.</td></tr>');
                return;
            }

            const rows = users.map((u, i) => {
                const formattedId = String(i + 1).padStart(5, '0');
                const tgl = u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-';
                
                return `
                    <tr>
                        <td class="text-center">
                            <input type="checkbox" class="form-check-input user-row-check" value="${u.id}">
                        </td>
                        <td><span class="badge bg-light text-dark border font-monospace">${formattedId}</span></td>
                        <td><strong>${u.nama || '-'}</strong></td>
                        <td>${u.email || '-'}</td>
                        <td>${tgl}</td>
                        <td><span class="badge bg-secondary">${u.total_reserve ?? 0} Kali</span></td>
                    </tr>
                `;
            }).join('');

            $tbody.html(rows);
            syncAction();
        } catch (err) {
            console.error('Gagal mengambil data user:', err);
        }
    }

    async function loadDataReservasi(statusFilter = 'pending') {
        try {
            const res = await fetch('/api/admin/reservasi');
            const result = await res.json();
            semuaReservasi = result.data || [];

            $('#count-pending').text(semuaReservasi.filter(r => r.status === 'pending').length);
            $('#count-approved').text(semuaReservasi.filter(r => r.status === 'approved').length);
            $('#count-complete').text(semuaReservasi.filter(r => r.status === 'complete').length);

            const filtered = semuaReservasi.filter(r => r.status === statusFilter);
            const $tbody =$('#reservation-table-body');
            $tbody.empty();

            if (filtered.length === 0) {
                $tbody.html('<tr><td colspan="8" class="text-center text-muted py-4">Tidak ada reservasi pada status ini.</td></tr>');
                return;
            }

            const rows = filtered.map(r => `
                <tr>
                    <td><strong>${r.gerai || '-'}</strong></td>
                    <td>${r.nama || '-'}</td>
                    <td>${r.telepon || '-'}<br><small class="text-muted">${r.email || '-'}</small></td>
                    <td>${r.tanggal || '-'}<br><small>${r.jam || ''} (${r.sesi || ''})</small></td>
                    <td>${r.jumlah || 0} Orang</td>
                    <td>${r.ruangan || '-'}</td>
                    <td>${r.catatan || '-'}</td>
                    <td>
                        ${r.status === 'complete' 
                            ? '<span class="badge bg-success">Selesai</span>'
                            : `<button class="btn btn-sm btn-outline-dark btn-confirm" data-id="${r.id}" data-next="${r.status === 'pending' ? 'approved' : 'complete'}">✓ Konfirmasi</button>`
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
        const checked = $('.user-row-check:checked');$('#user-action-bar').toggleClass('d-none', checked.length === 0);
        $('#selected-user-count').text(`${checked.length} akun dipilih`);
        $('#check-all-users').prop('checked', checked.length > 0 && checked.length === $('.user-row-check').length);
    };

    $(document).on('change', '#check-all-users', function () {
        $('.user-row-check').prop('checked', this.checked);
        syncAction();
    }).on('change', '.user-row-check', syncAction);

    $('#btn-eksekusi-user-aksi').on('click', function () {
        const aksi = $('#user-action-select').val();
        const ids = $('.user-row-check:checked').map((_, el) => el.value).get();
        
        if (!aksi || !ids.length) return alert('Pilih aksi dan minimal 1 akun!');
        
        if (aksi === 'hapus' && confirm(`Hapus permanen ${ids.length} akun terpilih?`)) {
            console.log('Hapus ID:', ids);
        } else if (aksi === 'blokir') {
            alert(`${ids.length} akun diblokir.`);
        } else if (aksi === 'modifikasi') {
            ids.length === 1 ? console.log('Edit ID:', ids[0]) : alert('Pilih 1 akun saja untuk diedit.');
        }
        $('#user-action-select').val('');
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
                <div class="top-item" style="--d:${i * 0.08}s">

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
                            <span style="width:${(m.qty / maks) * 100}%"></span>
                        </div>

                    </div>
                </div>
            `).join('')
        );
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