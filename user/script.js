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
                htmlFaq = '<p class="text-center">Belum ada FAQ yang tersedia.</p>';
            } else {
                dataFaq.forEach(function(item) {
                    htmlFaq += `
                        <div class="faq-item">
                            <div class="faq-question fw-bold">${item.pertanyaan}</div>
                            <div class="faq-answer">${item.jawaban}</div>
                        </div>
                    `;
                });
            }

            $('#tempat-faq-dinamis').html(htmlFaq);
            
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Gagal mengambil data FAQ:", errorThrown);
            $('#tempat-faq-dinamis').html('<p style="text-align: center; color: red;">Gagal memuat FAQ.</p>');
        });
    }

    muatFaqDariDatabase();

    $('#tempat-faq-dinamis').on('click', '.faq-question', function() {
        var $answer =$(this).next('.faq-answer');
    
        $('.faq-answer').not($answer).slideUp(300);

        $answer.slideToggle(300);
    });

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
        $.get('http://localhost:3000/api/favorit', function(response) {
            let orbitHtml = '';
            let descHtml = '';
            
            let dataFav = response.data || [];
            for(let i = 0; i < 5; i++) {
                let item = dataFav[i];
                
                if(item && item.nama_makanan) {
                    orbitHtml += `
                        <div class="orbit-item">
                            <img src="${item.gambar}" alt="${item.nama_makanan}">
                        </div>
                    `;
                    descHtml += `
                        <div class="menu-desc-item text-center">
                            <h4 class="fw-bold mb-1 d-flex justify-content-center align-items-center">
                                ${item.nama_makanan} 
                                ${renderIconPedasUser(item.pedas)}
                            </h4>
                            <p class="small text-muted mb-0">${item.deskripsi || 'Sajian lezat dengan bumbu khas rempah Timur Indonesia.'}</p>
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

            let htmlMenu = '';

            const urutanKategori = ['APPETIZER', 'MAIN COURSE', 'DESSERT'];

            const kategoriLainnya = Object.keys(menuDikelompokkan).filter(
                kategori => !urutanKategori.includes(kategori)
            );

            const urutanFinal = [...urutanKategori, ...kategoriLainnya];

            urutanFinal.forEach(function(kategori) {
                if (menuDikelompokkan[kategori] && menuDikelompokkan[kategori].length > 0) {
                    htmlMenu += `
                    <div class="menu-group">
                        <div class="category-header">${kategori}</div>
                        <div class="menu-grid">
                    `;

                    menuDikelompokkan[kategori].forEach(function(makanan) {
                        let isTersedia = (makanan.status === true || makanan.status === 'true');
                        let cssKosong = isTersedia ? '' : 'menu-kosong';
                        let tombolKeranjang = isTersedia
                            ? `<button class="add-to-cart-btn" data-id="${makanan.id}" data-nama="${makanan.nama_makanan}" data-harga="${makanan.harga}">+ Keranjang</button>`
                            : `<button class="add-to-cart-btn disabled-btn" disabled>Habis</button>`;
                        let labelStatus = isTersedia ? '' : '<div class="status-badge-kosong">Tidak Tersedia</div>';

                        htmlMenu += `
                            <div class="menu-item menu-card ${cssKosong}" data-id="${makanan.id}">
                                ${labelStatus}
                                <div class="mc-photo">
                                    <img src="${makanan.gambar}" alt="${makanan.nama_makanan}" class="menu-img">
                                    ${makanan.pedas > 0 ? `<div class="mc-spicy spicy" title="${LABEL_PEDAS[makanan.pedas]}">${cabai(makanan.pedas)}</div>` : ''}
                                    <span class="card-open"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
                                    <span class="mc-detail"><i class="fa-regular fa-eye"></i> Lihat Detail</span>
                                </div>
                                <div class="mc-body">
                                    <div class="dish-name">${makanan.nama_makanan}</div>
                                    <div class="mc-orn"><span></span><i class="fa-solid fa-leaf"></i><span></span></div>
                                    <div class="menu-details">
                                        <div class="menu-price">Rp ${makanan.harga.toLocaleString('id-ID')}</div>
                                        ${tombolKeranjang}
                                    </div>
                                </div>
                            </div>
                        `;
                    });

                    htmlMenu += `</div></div>`;
                }
            });

            $('#tempat-menu-dinamis').html(htmlMenu);
            fiturMenuInteraktif(dataMenu);

        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Gagal mengambil data:", errorThrown);
            $('#tempat-menu-dinamis').html('<p style="text-align: center; color: red;">Gagal terhubung ke database. Cek console (F12) untuk detail error.</p>');
        });
    }

    muatMenuDariDatabase();

    /* Cart */
    let cartItemCount = 0; 
    let cartTotal = 0;
    let cartItems = [];

    function updateCartBadge() {
        if (cartItemCount > 0) {
            $('#cart-count').text(cartItemCount).css('display', 'flex'); 
            $('#empty-cart-msg').hide();
        } else {
            $('#cart-count').css('display', 'none'); 
            $('#empty-cart-msg').show();
        }

        $('#cart-total-price').text('Rp ' + cartTotal.toLocaleString('id-ID'));
    }

    updateCartBadge(); 

    $('#tempat-menu-dinamis').on('click', '.add-to-cart-btn', function(e) {
        e.preventDefault(); 

        let itemName = $(this).data('nama');
        let itemPrice = parseInt($(this).data('harga'));
        
        cartItemCount++; 
        cartTotal += itemPrice;
        cartItems.push(itemName);

        let cartItemHtml = `
            <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                ${itemName}
                <span>Rp ${itemPrice.toLocaleString('id-ID')}</span>
            </li>
        `;
        
        $('#cart-items-list').append(cartItemHtml);

        updateCartBadge(); 
        
        let $btn =$(this);
        let originalText = $btn.text(); 
        
        $btn.text('Berhasil!');$btn.css({'background-color': '#27ae60', 'color': 'white'}); 
        
        setTimeout(function() {
            $btn.text(originalText);$btn.css({'background-color': '', 'color': ''}); 
        }, 1000);
    });

    let currentOngkir = 0;

    $('#btn-checkout-cart').on('click', function() {
        if (cartItemCount === 0) {
            alert("Keranjang Anda masih kosong. Silakan pesan menu terlebih dahulu!");
            return;
        }

        var cartSidebarEl = document.getElementById('cartSidebar');
        var cartOffcanvas = bootstrap.Offcanvas.getInstance(cartSidebarEl);
        if(cartOffcanvas) cartOffcanvas.hide();

        $('#modalSubtotal').text('Rp ' + cartTotal.toLocaleString('id-ID'));
        $('#modalTotalBayar').text('Rp ' + cartTotal.toLocaleString('id-ID'));
        
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
            
            currentOngkir = 0;
            updateModalTotal();

        } else if (this.value === 'online') {
            $('#dineInForm').slideUp(300);
            $('#onlineForm').slideDown(300);
            
            currentOngkir = Math.floor(Math.random() * 26 + 10) * 1000;
            $('#modalOngkir').text('+ Rp ' + currentOngkir.toLocaleString('id-ID'));
            
            updateModalTotal();
        }
    });

    function updateModalTotal() {
        let finalTotal = cartTotal + currentOngkir;
        $('#modalTotalBayar').text('Rp ' + finalTotal.toLocaleString('id-ID'));
    }

    $('#btn-confirm-pay').on('click', function() {
        let orderType = $('input[name="orderType"]:checked').val();
        let detailPesananStr = "";
        let finalTotal = cartTotal + currentOngkir;
        
        if (orderType === 'dine-in') {
            let store = $('#checkoutStore').val();
            if (!store) {
                alert('Silakan pilih lokasi gerai restoran terlebih dahulu!');
                return;
            }
            detailPesananStr = `[Dine-in di ${store}] `;
        } else if (orderType === 'online') {
            let address = $('#deliveryAddress').val();
            if (!address || !address.trim()) {
                alert('Silakan masukkan alamat pengiriman Anda secara lengkap!');
                return;
            }
            detailPesananStr = `[Online - Alamat: ${address}] `;
        } else {
             alert('Silakan pilih metode pesanan!');
             return;
        }

        // let namaPelanggan = prompt("Silakan masukkan nama Anda untuk pesanan ini:");
        // if (!namaPelanggan || !namaPelanggan.trim()) {
        //     alert("Nama harus diisi untuk memproses pesanan!");
        //     return;
        // }

        detailPesananStr += cartItems.join(', ');

        let $btn =$(this);
        let originalText = $btn.text();
        
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Memproses...');

        $.ajax({
            url: '/api/pesanan',
            type: 'POST',
            contentType: 'application/json', 
            data: JSON.stringify({
                // nama: namaPelanggan,
                item: detailPesananStr,
                total: finalTotal
            }),
            success: function(response) {
                alert("Berhasil!\nPesanan Anda telah dibuat dan sedang menunggu konfirmasi admin.");
                
                cartItemCount = 0;
                cartTotal = 0;
                cartItems = []; 
                currentOngkir = 0;
                
                $('#cart-items-list').find('li:not(#empty-cart-msg)').remove();
                updateCartBadge();
                
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

    /* Banner hero */
    $.post('/api/pengunjung');

    $.get('/api/konten', function(data) {
        let teksHeroHTML = data.teks_hero.replace(/\n/g, '<br>');
        
        $('#judul-hero').html(teksHeroHTML);
        $('#deskripsi-about').text(data.teks_about);
    });

    /* Maps */
    let CABANG = [];
    const HOP_MIN = 3000, HOP_MAX = 5000;

    let mapUser = null, pinMarker = null;
    let hopTimer = null, hopIndex = 0;
    let isLocked = false, arrived = true, targetBranch = null;

    const esc = s => $('<div>').text(s ?? '').html();

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
        $(this).attr('aria-expanded', opening).find('span').text(opening ? 'Tutup Peta' : 'Lihat Peta Cabang');

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

// Menu & FAQ dibuat dinamis oleh script.js: beri class reveal otomatis
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

// Tombol intro
document.getElementById('btn-start').addEventListener('click', () => {
    const intro = document.getElementById('intro');
    intro.classList.add('hide');
    document.body.classList.remove('intro-active');
    setTimeout(initReveal, 400);
    setTimeout(() => intro.remove(), 1000);
});

// Badge keranjang membal saat jumlah berubah
const badge = document.getElementById('cart-count');
if (badge) {
    new MutationObserver(() => {
        badge.classList.remove('bump');
        void badge.offsetWidth;
        badge.classList.add('bump');
    }).observe(badge, { childList: true, characterData: true, subtree: true });
}

document.body.classList.add('intro-active');

document.getElementById('btn-start').addEventListener('click', () => {
    const intro = document.getElementById('intro');
    intro.classList.add('hide');
    document.body.classList.remove('intro-active');
    setTimeout(() => intro.remove(), 1000);
});

const LABEL_PEDAS = ['Tidak Pedas', 'Mild', 'Mild', 'Medium', 'Hot', 'Extra Hot'];
const cabai = n => [1, 2, 3, 4, 5].map(i => `<i class="fa-solid fa-pepper-hot ${i <= n ? 'on' : ''}" style="--i:${i}"></i>`).join('');

function fiturMenuInteraktif(data) {
    window.menuData = {};
    data.forEach(m => { window.menuData[m.id] = m; });

    const rec = data.find(m => m.rekomendasi && (m.status === true || m.status === 'true'));
    if (!rec) return $('#chef-recommendation').addClass('d-none');

    $('#chef-box').html(`
        <div class="chef-card text-center">
            <span class="chef-badge">★ CHEF'S CHOICE</span>
            <p class="hero-eyebrow mb-1">Today's Recommendation</p>
            <h2 class="chef-title">CHEF'S RECOMMENDATION</h2>
            <img src="${rec.gambar}" alt="${rec.nama_makanan}" class="chef-img">
            <h3 class="chef-name">${rec.nama_makanan}</h3>
            ${rec.deskripsi ? `<p class="chef-desk">${rec.deskripsi}</p>` : ''}
            ${rec.pedas > 0 ? `<div class="spicy justify-content-center mb-2">${cabai(rec.pedas)}</div>` : ''}
            <div class="chef-price">Rp ${rec.harga.toLocaleString('id-ID')}</div>
            <button type="button" class="btn btn-papeda btn-lg chef-order" data-id="${rec.id}">Order Now</button>
        </div>`);
    $('#chef-recommendation').removeClass('d-none');
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
    $(document).on('click', '.chef-order', function () { pesan($(this).data('id')); });
});