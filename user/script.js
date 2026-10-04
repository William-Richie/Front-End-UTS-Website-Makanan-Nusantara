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
    /* Navigation */
    $('#hamburger-menu').on('click', function() {
        $('#main-nav').slideToggle(300);
    });

    $('.nav-link').on('click', function() {
        if ($(window).width() < 768) {$('#main-nav').slideUp(300);
        }
    });

    $(window).resize(function() {
        if ($(window).width() >= 768) {$('#main-nav').css('display', ''); 
        }
    });

    /* Scrolling */
    $('a.nav-link').on('click', function(event) {
        if (this.hash !== "") {
            event.preventDefault();
            $('html, body').animate({
                scrollTop: $(this.hash).offset().top - 60 
            }, 500);
        }
    });

    /* FAQ */
    function muatFaqDariDatabase() {
        $.get('/api/faq', function(response) {
            let dataFaq = Array.isArray(response) ? response : (response.data || []);
            let htmlFaq = '';

            if (dataFaq.length === 0) {
                htmlFaq = '<p class="faq-empty"><i class="fa-regular fa-circle-question me-2"></i>Belum ada FAQ yang tersedia.</p>';
            } else {
                dataFaq.forEach(function(item, i) {
                    htmlFaq += `
                        <div class="faq-item">
                            <div class="faq-question fw-bold" style="--d:${Math.min(i, 8) * 0.08}s">
                                <span class="faq-num">${String(i + 1).padStart(2, '0')}</span>
                                <span class="faq-q-text">${esc(item.pertanyaan)}</span>
                                <span class="faq-chevron"><i class="fa-solid fa-chevron-down"></i></span>
                            </div>
                            <div class="faq-answer">${esc(item.jawaban)}</div>
                        </div>
                    `;
                });
            }

            $('#tempat-faq-dinamis').html(htmlFaq);
            
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Gagal mengambil data FAQ:", errorThrown);
            $('#tempat-faq-dinamis').html('<p class="faq-empty faq-empty-error"><i class="fa-solid fa-triangle-exclamation me-2"></i>Gagal memuat FAQ.</p>');
        });
    }

    muatFaqDariDatabase();

    $('#tempat-faq-dinamis').on('click', '.faq-question', function() {
        var $answer =$(this).next('.faq-answer');
    
        $('.faq-answer').not($answer).slideUp(300);

        $answer.slideToggle(300);
    });

    $('#tempat-faq-dinamis').on('click', '.faq-question', function() {
        var $item = $(this).parent('.faq-item');
        var sedangBuka = $item.hasClass('open');

        $('.faq-item.open').not($item).removeClass('open');
        if (sedangBuka) {
            setTimeout(function() { $item.removeClass('open'); }, 280);
        } else {
            $item.addClass('open');
        }
    });

    (function() {
        var $form    = $('#form-faq-ask');
        var $error   = $('#faq-ask-error');
        var $submit  = $('#faq-ask-submit');
        var modalEl  = document.getElementById('faqAskModal');

        function tampilError(pesan) {
            $error.text(pesan).prop('hidden', false);
        }

        $('#faq-ask-text').on('input', function() {
            $('#faq-ask-count').text(this.value.length + '/300');
            $error.prop('hidden', true);
        });

        $form.on('submit', function(e) {
            e.preventDefault();
            if ($('#faq-hp').val()) return;

            var nama       = $.trim($('#faq-ask-nama').val());
            var email      = $.trim($('#faq-ask-email').val());
            var pertanyaan = $.trim($('#faq-ask-text').val());

            if (pertanyaan.length < 10) {
                tampilError('Pertanyaan minimal 10 karakter ya.');
                return;
            }
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                tampilError('Format email belum benar.');
                return;
            }

            $error.prop('hidden', true);
            $submit.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Mengirim...');

            $.ajax({
                url: '/api/faq/pertanyaan',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ nama: nama, email: email, pertanyaan: pertanyaan }),
                success: function() {
                    $('.faq-modal-head').hide();
                    $form.prop('hidden', true);
                    $('#faq-ask-success').prop('hidden', false);
                    notifPapeda('Pertanyaan Anda berhasil dikirim!', 'success');
                },
                error: function(xhr) {
                    console.error('Gagal kirim pertanyaan FAQ:', xhr.responseText);
                    var pesan = (xhr.responseJSON && (xhr.responseJSON.error || xhr.responseJSON.message)) || 'Gagal mengirim pertanyaan. Coba lagi sebentar lagi.';
                    tampilError(pesan);
                },
                complete: function() {
                    $submit.prop('disabled', false).html('<i class="fa-solid fa-paper-plane me-2"></i>Kirim Pertanyaan');
                }
            });
        });

        modalEl.addEventListener('hidden.bs.modal', function() {
            $form[0].reset();
            $('#faq-ask-count').text('0/300');
            $error.prop('hidden', true);
            $form.prop('hidden', false);
            $('.faq-modal-head').show();
            $('#faq-ask-success').prop('hidden', true);
        });
    })();

    /* Tombol ke atas */
    $(window).on('scroll', function() {
        if ($(this).scrollTop() > 200) {
            $('#back-to-top').fadeIn(200).css('display', 'flex');
        } else {
            $('#back-to-top').fadeOut(200);
        }
    });

    $('#back-to-top').on('click', function() {
        $('html, body').animate({ scrollTop: 0 }, 500);
    });

    /* Favorite Menus */
    function renderIconPedasUser(level) {
        let l = Math.max(0, Math.min(5, Number(level) || 0));
        if (l === 0) return '';
        
        let icons = '';
        for (let i = 0; i < l; i++) {
            icons += '<i class="fa-solid fa-pepper-hot" style="color: #c0392b; font-size: 0.85em; margin-left: 3px;"></i>';
        }
        return `<span class="ms-2 d-inline-flex align-items-center">${icons}</span>`;
    }

    function muatMenuFavoritUser() {
        $.get('/api/favorit', function(response) {
            let orbitHtml = '';
            let descHtml = '';
            
            let dataFav = response.data || [];
            for(let i = 0; i < 5; i++) {
                let item = dataFav[i];
                
                if(item && item.nama_makanan) {
                    orbitHtml += `
                        <div class="orbit-item">
                            <img src="${esc(item.gambar)}" alt="${esc(item.nama_makanan)}">
                        </div>
                    `;
                    descHtml += `
                        <div class="menu-desc-item text-center">
                            <h4 class="fw-bold mb-1 d-flex justify-content-center align-items-center">
                                ${esc(item.nama_makanan)} 
                                ${renderIconPedasUser(item.pedas)}
                            </h4>
                            <p class="small text-muted mb-0">${esc(item.deskripsi || 'Sajian lezat dengan bumbu khas rempah Timur Indonesia.')}</p>
                        </div>
                    `;
                } else {
                    orbitHtml += `
                        <div class="orbit-item" style="border: 2px dashed #c9a17a;">
                            <img src="../img/Web-Icon/Papeda-icon.png" alt="Coming Soon" style="object-fit: contain; padding: 20px;">
                        </div>
                    `;
                    descHtml += `
                        <div class="menu-desc-item text-center">
                            <h4 class="fw-bold mb-1 text-muted">Menu Segera Hadir</h4>
                            <p class="small text-muted mb-0">Nantikan rekomendasi masakan spesial dari Chef kami berikutnya.</p>
                        </div>
                    `;
                }
            }
            $('#dynamic-orbit-path').html(orbitHtml);
            $('#dynamic-desc-container').html(descHtml);
        }).fail(function() {
            console.error("Gagal memuat daftar menu favorit dari server.");
            $('#dynamic-orbit-path').html('<p class="text-danger text-center w-100 mt-5">Gagal terhubung ke server.</p>');
        });
    }

    $(document).ready(function() {
        muatMenuFavoritUser();
    });

    /* Menu */
    function muatMenuDariDatabase() {
        $.get('/api/menu', function(response) {
            let dataMenu = response.data;
            let menuDikelompokkan = {};

            dataMenu.forEach(function(item) {
                if (!menuDikelompokkan[item.nama_kategori]) {
                    menuDikelompokkan[item.nama_kategori] = [];
                }
                menuDikelompokkan[item.nama_kategori].push(item);
            });

            const URUTAN = ['APPETIZER', 'MAIN COURSE', 'DESSERT', 'MINUMAN', 'DRINK', 'ADDITIONAL'];
            const idx = k => (URUTAN.indexOf(k) === -1 ? 99 : URUTAN.indexOf(k));
            let kategoriUrut = Object.keys(menuDikelompokkan).sort((a, b) => idx(a) - idx(b));

            let htmlTabs = '<div class="menu-tabs">' + kategoriUrut.map((k, i) =>
                `<button type="button" class="menu-tab ${i === 0 ? 'active' : ''}" data-kat="${k}">${k}</button>`
            ).join('') + '</div>';

            let htmlMenu = '';

            for (let kategori of kategoriUrut) {
                htmlMenu += `
                <div class="menu-group ${kategori === kategoriUrut[0] ? 'active' : ''}" data-kat="${kategori}">
                    <div class="category-header">${kategori}</div>
                    <div class="menu-grid">
                `;

                menuDikelompokkan[kategori].forEach(function(makanan) {
                    let isTersedia = (makanan.status === true || makanan.status === 'true');
                    let cssKosong = isTersedia ? '' : 'menu-kosong';
                    let tombolKeranjang = isTersedia
                        ? `<button class="add-to-cart-btn" data-id="${esc(makanan.id)}" data-nama="${esc(makanan.nama_makanan)}" data-harga="${esc(makanan.harga)}">+ Keranjang</button>`
                        : `<button class="add-to-cart-btn disabled-btn" disabled>Habis</button>`;
                    let labelStatus = isTersedia ? '' : '<div class="status-badge-kosong">Tidak Tersedia</div>';

                    htmlMenu += `
                        <div class="menu-item menu-card ${esc(cssKosong)}" data-id="${esc(makanan.id)}">
                            ${labelStatus}
                            <div class="mc-photo">
                                <img src="${esc(makanan.gambar)}" alt="${esc(makanan.nama_makanan)}" class="menu-img">
                                ${esc(makanan.pedas) > 0 ? `<div class="mc-spicy spicy" title="${esc(LABEL_PEDAS[makanan.pedas])}">${cabai(makanan.pedas)}</div>` : ''}
                                <span class="card-open"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
                                <span class="mc-detail"><i class="fa-regular fa-eye"></i> Lihat Detail</span>
                            </div>
                            <div class="mc-body">
                                <div class="dish-name">${esc(makanan.nama_makanan)}</div>
                                <div class="mc-orn"><span></span><i class="fa-solid fa-leaf"></i><span></span></div>
                                <div class="menu-details">
                                    <div class="menu-price">Rp ${esc(makanan.harga.toLocaleString('id-ID'))}</div>
                                    ${tombolKeranjang}
                                </div>
                            </div>
                        </div>
                    `;
                });

                htmlMenu += `</div></div>`;
            }

            $('#tempat-menu-dinamis').html(htmlTabs + htmlMenu);
            fiturMenuInteraktif(dataMenu);

        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Gagal mengambil data:", errorThrown);
            $('#tempat-menu-dinamis').html('<p style="text-align: center; color: red;">Gagal terhubung ke database. Cek console (F12) untuk detail error.</p>');
        });
    }

    muatMenuDariDatabase();

    $('#tempat-menu-dinamis').on('click', '.menu-tab', function () {
        const kat = $(this).data('kat');
        $('.menu-tab').removeClass('active');
        $(this).addClass('active');
        $('.menu-group').removeClass('active').filter(function () {
            return $(this).data('kat') === kat;
        }).addClass('active');
    });

    /* Cart */
    let cartItems = [];
    try {
        const saved = localStorage.getItem('cartItems');
        if (saved) {
            cartItems = JSON.parse(saved);
            if (!Array.isArray(cartItems)) cartItems = [];
        }
    } catch (e) {
        cartItems = [];
    }

    function saveCart() {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        renderCart();
    }

    function getCartTotal() {
        return cartItems.reduce((acc, item) => acc + ((parseInt(item.harga, 10) || 0) * (parseInt(item.qty, 10) || 0)), 0);
    }

    function getCartCount() {
        return cartItems.reduce((acc, item) => acc + (parseInt(item.qty, 10) || 0), 0);
    }

    function renderCart() {
        const count = getCartCount();
        const total = getCartTotal();

        if (count > 0) {
            $('#cart-count').text(count).css('display', 'flex'); 
            $('#empty-cart-msg').hide();
        } else {
            $('#cart-count').css('display', 'none'); 
            $('#empty-cart-msg').show();
        }

        $('#cart-total-price').text('Rp ' + total.toLocaleString('id-ID'));
        $('#cart-items-list').find('li:not(#empty-cart-msg)').remove();

        cartItems.forEach(item => {
            let itemHtml = `
                <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-3 bg-transparent" data-id="${item.id}">
                    <div class="me-2" style="max-width: 50%;">
                        <div class="cart-item-title text-truncate" title="${esc(item.nama)}">${esc(item.nama)}</div>
                        <div class="cart-item-price">Rp ${(parseInt(item.harga, 10) || 0).toLocaleString('id-ID')}</div>
                    </div>
                    
                    <div class="d-flex align-items-center gap-3">
                        <div class="d-flex align-items-center">
                            <button type="button" class="btn btn-qty-custom btn-qty-minus" data-id="${esc(item.id)}">-</button>
                            <span class="qty-number">${item.qty}</span>
                            <button type="button" class="btn btn-qty-custom btn-qty-plus" data-id="${esc(item.id)}">+</button>
                        </div>
                        
                        <button type="button" class="btn btn-delete-custom btn-cart-delete" data-id="${esc(item.id)}" title="Hapus menu">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </li>
            `;
            $('#cart-items-list').append(itemHtml);
        });
    }

    renderCart();

    $('#tempat-menu-dinamis').on('click', '.add-to-cart-btn', function(e) {
        e.preventDefault(); 

        let itemId = $(this).data('id');
        let itemName = $(this).data('nama');
        let itemPrice = parseInt($(this).data('harga'), 10) || 0;

        let existing = cartItems.find(i => (itemId && String(i.id) === String(itemId)) || i.nama === itemName);
        if (existing) {
            existing.qty = (parseInt(existing.qty, 10) || 0) + 1;
        } else {
            cartItems.push({
                id: itemId,
                nama: itemName,
                harga: itemPrice,
                qty: 1
            });
        }

        saveCart();
        notifPapeda(itemName + ' berhasil ditambahkan ke keranjang!', 'success');

        let $btn = $(this);
        let originalText = $btn.text(); 
        
        $btn.text('Berhasil!').css({'background-color': '#27ae60', 'color': 'white'}); 
        
        setTimeout(function() {
            $btn.text(originalText).css({'background-color': '', 'color': ''}); 
        }, 1000);
    });

    $('#cart-items-list').on('click', '.btn-qty-plus', function() {
        let id = $(this).data('id');
        let item = cartItems.find(i => String(i.id) === String(id));
        if (item) {
            item.qty = (parseInt(item.qty, 10) || 0) + 1;
            saveCart();
        }
    });

    $('#cart-items-list').on('click', '.btn-qty-minus', function() {
        let id = $(this).data('id');
        let idx = cartItems.findIndex(i => String(i.id) === String(id));
        if (idx > -1) {
            if (cartItems[idx].qty > 1) {
                cartItems[idx].qty -= 1;
            } else {
                cartItems.splice(idx, 1);
            }
            saveCart();
        }
    });

    $('#cart-items-list').on('click', '.btn-cart-delete', function() {
        let id = $(this).data('id');
        cartItems = cartItems.filter(i => String(i.id) !== String(id));
        saveCart();
    });

    let currentOngkir = 0;

    $('#btn-checkout-cart').on('click', function() {
        if (cartItems.length === 0) {
            alert("Keranjang Anda masih kosong. Silakan pesan menu terlebih dahulu!");
            return;
        }

        var cartSidebarEl = document.getElementById('cartSidebar');
        var cartOffcanvas = bootstrap.Offcanvas.getInstance(cartSidebarEl);
        if(cartOffcanvas) cartOffcanvas.hide();

        let total = getCartTotal();
        $('#modalSubtotal').text('Rp ' + total.toLocaleString('id-ID'));
        $('#modalTotalBayar').text('Rp ' + total.toLocaleString('id-ID'));
        
        $('input[name="orderType"]').prop('checked', false);
        $('#dineInForm, #onlineForm').hide();
        $('#modalOngkir').text('Rp 0');
        $('#deliveryAddress, #checkoutStore').val('');
        $('#btn-confirm-pay').prop('disabled', true);
        currentOngkir = 0;

        var checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
        checkoutModal.show();
    });

    $('input[name="orderType"]').on('change', function() {
        $('#btn-confirm-pay').prop('disabled', false);

        if (this.value === 'dine-in') {
            $('#dineInForm').slideDown(300);
            $('#onlineForm').slideUp(300);
            $('#ongkirRow').slideUp(300);
            
            currentOngkir = 0;
            updateModalTotal();

        } else if (this.value === 'online') {
            $('#dineInForm').slideUp(300);
            $('#onlineForm').slideDown(300);
            $('#ongkirRow').slideDown(300);
            
            currentOngkir = Math.floor(Math.random() * 26 + 10) * 1000;
            $('#modalOngkir').text('+ Rp ' + currentOngkir.toLocaleString('id-ID'));
            
            updateModalTotal();
        }
    });

    function updateModalTotal() {
        let finalTotal = getCartTotal() + currentOngkir;
        $('#modalTotalBayar').text('Rp ' + finalTotal.toLocaleString('id-ID'));
    }

    $('#btn-confirm-pay').on('click', function() {
        let orderType = $('input[name="orderType"]:checked').val();
        let detailPesananStr = "";
        let finalTotal = getCartTotal() + currentOngkir;
        
        let namaPelanggan = (window.currentUser && window.currentUser.nama)
            || ($('#name').val() && $('#name').val().trim())
            || 'Pelanggan';

        if (orderType === 'dine-in') {
            let store = $('#checkoutStore').val();
            if (!store) {
                alert('Silakan pilih lokasi gerai restoran terlebih dahulu!');
                return;
            }
            detailPesananStr = `[Dine-in: ${store}] [Pelanggan: ${namaPelanggan}] `;
        } else if (orderType === 'online') {
            let address = $('#deliveryAddress').val();
            if (!address || !address.trim()) {
                alert('Silakan masukkan alamat pengiriman Anda secara lengkap!');
                return;
            }
            detailPesananStr = `[Online: ${address.trim()}] [Pelanggan: ${namaPelanggan}] `;
        } else {
             alert('Silakan pilih metode pesanan!');
             return;
        }

        detailPesananStr += cartItems.map(i => `${i.nama} (${i.qty}x)`).join(', ');

        let $btn = $(this);
        let originalText = $btn.text();
        
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Memproses...');

        $.ajax({
            url: '/api/pesanan',
            type: 'POST',
            contentType: 'application/json', 
            data: JSON.stringify({
                nama: namaPelanggan,
                item: detailPesananStr,
                total: finalTotal
            }),
            success: function(response) {
                notifPapeda('Berhasil! Pesanan dan Reservasi Anda sedang diproses admin.', 'success');
                
                cartItems = []; 
                currentOngkir = 0;
                saveCart();
                
                var modalEl = document.getElementById('checkoutModal');
                var modalInst = bootstrap.Modal.getInstance(modalEl);
                if(modalInst) {
                    modalInst.hide();
                }
            },
            error: function(xhr, status, error) {
                console.error("Error Checkout:", xhr.responseText || error);
                alert("Terjadi kesalahan saat memproses pesanan. Pastikan server berjalan dan database terhubung.");
            },
            complete: function() {
                $btn.prop('disabled', false).text('Konfirmasi Pesanan');
            }
        });
    });

    let labelPetaBuka = 'Lihat Peta Cabang';
    let labelPetaTutup = 'Tutup Peta';

    function setTeks(selektor, nilai) {
        if (nilai) $(selektor).text(nilai);
    }

    function setBaris(selektor, nilai) {
        if (nilai) $(selektor).html(esc(nilai).replace(/\n/g, '<br>'));
    }

    function nomorTelepon(teks) {
        let nomor = String(teks).replace(/[^\d+]/g, '');
        if (nomor.charAt(0) === '0') nomor = '+62' + nomor.slice(1);
        return nomor;
    }

    /* Banner hero */
    $.post('/api/pengunjung');

    $.get('/api/konten', function(data) {
        if (data.hero_eyebrow) $('#hero-eyebrow').text(data.hero_eyebrow);
        if (data.teks_hero) {
            let teksHeroHTML = data.teks_hero.replace(/\n/g, '<br>');
            $('#judul-hero').html(teksHeroHTML);
        }
        if (data.hero_sub) $('#hero-sub').text(data.hero_sub);
        if (data.about_eyebrow) $('#about-eyebrow').text(data.about_eyebrow);
        if (data.about_title) $('#about-title').text(data.about_title);
        if (data.teks_about) $('#deskripsi-about').text(data.teks_about);
        if (data.card1_title) $('#card1-title').text(data.card1_title);
        if (data.card1_desc) $('#card1-desc').text(data.card1_desc);
        if (data.card2_title) $('#card2-title').text(data.card2_title);
        if (data.card2_desc) $('#card2-desc').text(data.card2_desc);
        if (data.card3_title) $('#card3-title').text(data.card3_title);
        if (data.card3_desc) $('#card3-desc').text(data.card3_desc);

        /* FAQ */
        setTeks('#faq-eyebrow', data.faq_eyebrow);
        setBaris('#faq-title', data.faq_title);
        setTeks('#faq-total', data.faq_chip1);
        setTeks('#faq-chip2', data.faq_chip2);
        setTeks('#faq-aside-kicker', data.faq_aside_kicker);
        setTeks('#faq-aside-title', data.faq_aside_title);
        setTeks('#faq-aside-desc', data.faq_aside_desc);
        setTeks('#faq-aside-btn', data.faq_aside_btn);

        /* Lokasi */
        setTeks('#loc-eyebrow', data.loc_eyebrow);
        setBaris('#loc-title', data.loc_title);
        setTeks('#loc-chip2', data.loc_chip2);
        setTeks('#loc-kicker', data.loc_kicker);
        setTeks('#loc-heading', data.loc_heading);
        setTeks('#loc-desc', data.loc_desc);
        setTeks('#loc-utama-title', data.loc_utama_title);
        setTeks('#loc-utama-text', data.loc_utama_text);
        setTeks('#loc-telp-title', data.loc_telp_title);
        setTeks('#loc-telp-text', data.loc_telp_text);
        setTeks('#loc-email-title', data.loc_email_title);
        setTeks('#loc-email-text', data.loc_email_text);
        setTeks('#loc-parkir-title', data.loc_parkir_title);
        setTeks('#loc-parkir-text', data.loc_parkir_text);

        if (data.loc_telp_text) $('#loc-telp-link').attr('href', 'tel:' + nomorTelepon(data.loc_telp_text));
        if (data.loc_email_text) $('#loc-email-link').attr('href', 'mailto:' + $.trim(data.loc_email_text));

        if (data.loc_btn_buka) labelPetaBuka = data.loc_btn_buka;
        if (data.loc_btn_tutup) labelPetaTutup = data.loc_btn_tutup;
        if (!$('#map-reveal').hasClass('open')) $('#loc-btn').text(labelPetaBuka);
    });

    /* Maps */
    let CABANG = [];
    const HOP_MIN = 3000, HOP_MAX = 5000;

    let mapUser = null, pinMarker = null;
    let hopTimer = null, hopIndex = 0;
    let isLocked = false, arrived = true, targetBranch = null;

    $.get('/api/maps', function(res) {
        CABANG = (Array.isArray(res) ? res : []).map(c => ({
            id: 'c' + c.id, nama: c.nama, alamat: c.alamat, lat: +c.latitude, lng: +c.longitude
        }));
        targetBranch = CABANG[0] || null;

        $('.jumlah-cabang').text(CABANG.length);
        $('#banner-total-cabang').text(CABANG.length + ' Cabang');
        $('#branch-list').html(CABANG.map(c => `
            <button type="button" class="branch-card" data-id="${c.id}">
                <i class="fa-solid fa-location-dot"></i>
                <strong>${esc(c.nama)}</strong>
            </button>`).join(''));

        let storeOptions = '<option value="" disabled selected>-- Choose The Store --</option>';
        let checkoutOptions = '<option value="" disabled selected>-- Pilih Lokasi --</option>';

        CABANG.forEach(c => {
            storeOptions += `<option value="${esc(c.nama)}">${esc(c.nama)} - ${esc(c.alamat)}</option>`;
            checkoutOptions += `<option value="${esc(c.nama)} (${esc(c.alamat)})">${esc(c.nama)} (${esc(c.alamat)})</option>`;
        });

        $('#store-select').html(storeOptions);
        $('#store-cards').html(CABANG.map((c, i) => `
            <button type="button" class="store-card" style="--i:${i}" data-val="${esc(c.nama)}">
                <span class="store-pin"><i class="fa-solid fa-location-dot"></i></span>
                <span class="store-info"><strong>${esc(c.nama)}</strong><small>${esc(c.alamat)}</small></span>
                <i class="fa-solid fa-circle-check store-check"></i>
            </button>`).join(''));
        $('#checkoutStore').html(checkoutOptions);
    });

    const popupHtml = c => `<b>${esc(c.nama)}</b><br>${esc(c.alamat)}`;

    function updateUI(c, scroll = true) {
        $('.branch-card').removeClass('active').filter(`[data-id="${c.id}"]`).addClass('active');
        $('#branch-list').toggleClass('is-locked', isLocked);
        $('#btn-auto-tour').prop('hidden', !isLocked);
        $('#map-status').text(isLocked
            ? `Lokasi dipilih: ${c.nama}`
            : `Menjelajahi cabang... ${c.nama}`);
        if (scroll) {
            const container = document.getElementById('branch-list');
            const tombolAktif = document.querySelector('.branch-card.active');
            if (container && tombolAktif) {
                const scrollLeft = tombolAktif.offsetLeft - container.offsetWidth / 2 + tombolAktif.offsetWidth / 2;
                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }

    function dropPin() {
        const pin = pinMarker.getElement().querySelector('.pin');
        pin.classList.remove('drop');
        void pin.offsetWidth;
        pin.classList.add('drop');
    }

    function onArrive() {
        if (arrived) return;
        arrived = true;
        pinMarker.setLatLng([targetBranch.lat, targetBranch.lng])
                 .setPopupContent(popupHtml(targetBranch))
                 .setOpacity(1)
                 .openPopup();
        dropPin();
    }

    function goTo(c, zoom, duration) {
        targetBranch = c;
        arrived = false;
        updateUI(c);
        pinMarker.closePopup().setOpacity(0);

        const dekat = mapUser.getCenter().distanceTo([c.lat, c.lng]) < 50;
        if (dekat) mapUser.setView([c.lat, c.lng], zoom, { animate: true });
        else       mapUser.flyTo([c.lat, c.lng], zoom, { duration: duration });
    }

    function scheduleHop() {
        clearTimeout(hopTimer);
        hopTimer = setTimeout(function() {
            hopIndex = (hopIndex + 1) % CABANG.length;
            goTo(CABANG[hopIndex], 15, 1.8);
            scheduleHop();
        }, HOP_MIN + Math.random() * (HOP_MAX - HOP_MIN));
    }

    function stopHop() {
        clearTimeout(hopTimer);
        hopTimer = null;
    }

    function initMap() {
        if (mapUser) return;
        const c = CABANG[0];

        mapUser = L.map('map-user', { scrollWheelZoom: false }).setView([c.lat, c.lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapUser);

        pinMarker = L.marker([c.lat, c.lng], {
            icon: L.divIcon({
                className: 'papeda-pin',
                html: '<span class="pin"><i class="fa-solid fa-utensils"></i></span>',
                iconSize: [38, 38],
                iconAnchor: [19, 46],
                popupAnchor: [0, -46]
            })
        }).addTo(mapUser)
          .bindPopup(popupHtml(c), { autoPan: false })
          .openPopup();

        mapUser.on('moveend', onArrive);
        updateUI(c, false);
        dropPin();
    }

    $('#btn-open-map').on('click', function() {
        if (!CABANG.length) return;
        const opening = !$('#map-reveal').hasClass('open');

        $('#map-reveal').toggleClass('open', opening).attr('aria-hidden', !opening);
        $(this).attr('aria-expanded', opening).find('span').text(opening ? labelPetaTutup : labelPetaBuka);

        if (!opening) {
            stopHop();
            return;
        }

        initMap();
        setTimeout(() => mapUser.invalidateSize(), 900);
        setTimeout(() => $('#map-reveal')[0].scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
        if (!isLocked && CABANG.length > 1) scheduleHop();
    });

    $('#branch-list').on('click', '.branch-card', function() {
        if (!mapUser) return;
        const c = CABANG.find(x => x.id === $(this).data('id'));

        isLocked = true;
        stopHop();
        hopIndex = CABANG.indexOf(c);
        goTo(c, 16, 1.2);
    });

    $('#btn-auto-tour').on('click', function() {
        isLocked = false;
        updateUI(targetBranch);
        scheduleHop();
    });

    (function () {
        const section = document.getElementById('location');
        if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const orns = section.querySelectorAll('.loc-orn[data-speed]');
        let visible = false, ticking = false;

        function update() {
            const r = section.getBoundingClientRect();
            const offset = r.top + r.height / 2 - window.innerHeight / 2;
            orns.forEach(el => el.style.setProperty('--py', (offset * el.dataset.speed).toFixed(1) + 'px'));
            ticking = false;
        }

        new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) update(); }).observe(section);
        window.addEventListener('scroll', () => {
            if (visible && !ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });

        section.querySelectorAll('.loc-card').forEach(card => {
            card.addEventListener('pointermove', e => {
                const b = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - b.left) + 'px');
                card.style.setProperty('--my', (e.clientY - b.top) + 'px');
            });
        });
    })();

    // reservation
    let $reservationForm = $('#reservation-form-group');
    $reservationForm.hide();

    $('#store-select').on('change', function () {
        let selectedStore = $(this).val();
        console.log("Gerai dipilih:", selectedStore);

        if (selectedStore && selectedStore !== "") {
            $reservationForm.slideDown(300);
        } else {
            $reservationForm.slideUp(300);
        }
    });

    function getStatusReservasiUser(status) {
        switch (status) {
            case 'pending':
                return 'Menunggu';

            case 'approved':
            case 'dikonfirmasi':
                return 'Ongoing';

            case 'complete':
            case 'selesai':
                return 'Complete';

            case 'dibatalkan':
            case 'cancelled':
                return 'Dibatalkan';

            default:
                return status || '-';
        }
    }

    // Notification
    function notifPapeda(pesan, tipe = 'success') {
    let iconClass = 'fa-circle-check';
    let iconColor = '#27ae60';

    if (tipe === 'akun') {
        iconClass = 'fa-hand-sparkles';
        iconColor = '#f39c12';
    } else if (tipe === 'info') {
        iconClass = 'fa-circle-info';
        iconColor = '#3498db';
    }

    $('#papedaToastIcon').attr('class', `fa-solid ${iconClass} me-2 fs-5`).css('color', iconColor);
    $('#papedaToastPesan').text(esc(pesan));
    
    let toastEl = document.getElementById('papedaToast');
    let toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
}
});

// Scroll reveal
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('show');
            io.unobserve(e.target);
        }
    });
}, { threshold: 0.15 });

function initReveal() {
    document.querySelectorAll('.reveal:not(.show)').forEach(el => io.observe(el));
}

['tempat-menu-dinamis', 'tempat-faq-dinamis'].forEach(id => {
    const box = document.getElementById(id);
    if (!box) return;
    new MutationObserver(() => {
        box.querySelectorAll('.category-header, .menu-item, .faq-question').forEach(el => {
            if (!el.classList.contains('reveal')) {
                el.classList.add('reveal');
                io.observe(el);
            }
        });
    }).observe(box, { childList: true, subtree: true });
});

if (sessionStorage.getItem('hasEntered') === 'true') {
    document.body.classList.remove('intro-active');
    const existingIntro = document.getElementById('intro');
    if (existingIntro) {
        existingIntro.remove();
    }
    setTimeout(initReveal, 300);
}

// Tombol intro
const btnStart = document.getElementById('btn-start');
if (btnStart) {
    btnStart.addEventListener('click', () => {
        sessionStorage.setItem('hasEntered', 'true');
        const intro = document.getElementById('intro');
        if (intro) {
            intro.classList.add('hide');
            document.body.classList.remove('intro-active');
            setTimeout(initReveal, 400);
            setTimeout(() => intro.remove(), 1000);
        }
    });
}

// Badge keranjang membal saat jumlah berubah
const badge = document.getElementById('cart-count');
if (badge) {
    new MutationObserver(() => {
        badge.classList.remove('bump');
        void badge.offsetWidth;
        badge.classList.add('bump');
    }).observe(badge, { childList: true, characterData: true, subtree: true });
}

const LABEL_PEDAS = ['Tidak Pedas', 'Mild', 'Mild', 'Medium', 'Hot', 'Extra Hot'];
const cabai = n => [1, 2, 3, 4, 5].map(i => `<i class="fa-solid fa-pepper-hot ${i <= n ? 'on' : ''}" style="--i:${i}"></i>`).join('');

function fiturMenuInteraktif(data) {
    window.menuData = {};
    (data || []).forEach(m => { window.menuData[m.id] = m; });
}

$(function () {
    const modal = new bootstrap.Modal('#menuModal');
    let aktifId = null;
    const pesan = id => $(`#tempat-menu-dinamis .add-to-cart-btn[data-id="${id}"]`).trigger('click');

    $('#tempat-menu-dinamis').on('click', '.menu-card', function (e) {
        if ($(e.target).closest('.add-to-cart-btn').length) return;
        const m = (window.menuData || {})[$(this).data('id')];
        if (!m) return;
        const ada = m.status === true || m.status === 'true';
        aktifId = m.id;
        $('#mm-img').attr('src', m.gambar);
        $('#mm-kategori').text(m.nama_kategori);
        $('#mm-nama').text(m.nama_makanan);
        $('#mm-desk').text(m.deskripsi || 'Deskripsi belum tersedia.');
        $('#mm-pedas').html(cabai(m.pedas || 0));
        $('#mm-pedas-label').text(LABEL_PEDAS[m.pedas || 0]);
        $('#mm-harga').text('Rp ' + m.harga.toLocaleString('id-ID'));
        $('#mm-order').prop('disabled', !ada).html(ada ? '<i class="fa-solid fa-bag-shopping me-2"></i>Tambah ke Keranjang' : 'Habis');
        modal.show();
    });

    $('#mm-order').on('click', () => { pesan(aktifId); modal.hide(); });
});

$('#store-cards').on('click', '.store-card', function () {
    $('#store-select').val($(this).attr('data-val')).trigger('change');
});
$('#store-select').on('change', function () {
    const v = $(this).val();
    $('.store-card').each(function () { $(this).toggleClass('active', $(this).attr('data-val') === v); });
});