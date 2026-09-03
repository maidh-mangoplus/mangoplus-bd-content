const API_URL = 'https://script.google.com/macros/s/AKfycbwqKTYIwGcieaIzhGc2ohMEiC2A0rUm0ZZA2RErJCcdBLmKQOPknkbZYGuGNeBZ1C2Y/exec';

const RANK_CLASS = { 'S+': 'rank-splus', 'S': 'rank-s', 'A+': 'rank-aplus', 'A': 'rank-a' };
const STATUS_CLASS = { 'Mới ra mắt': 'status-new', 'Đang phát sóng': 'status-live' };
const SECTION_ORDER = ['Show', 'Phim', 'Short'];
const SECTION_CLASS = { 'Show': 'section-show', 'Phim': 'section-phim', 'Short': 'section-short' };

let allData = [];
const state = { group: 'all', exclusiveOnly: false, newOnly: false, search: '' };

function normalize(str) {
  return (str || '').toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function parseDate(str) {
  if (!str) return null;
  const parts = String(str).split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function updateHeaderDate() {
  const dates = allData.map(d => parseDate(d.ngayCapNhat)).filter(Boolean);
  const dateEl = document.getElementById('updateDate');
  const cycleEl = document.getElementById('updateCycle');
  if (dates.length === 0) {
    dateEl.textContent = '—';
    return;
  }
  const latest = new Date(Math.max(...dates.map(d => d.getTime())));
  const dd = String(latest.getDate()).padStart(2, '0');
  const mm = String(latest.getMonth() + 1).padStart(2, '0');
  const yyyy = latest.getFullYear();
  dateEl.textContent = `Cập nhật: ${dd}/${mm}/${yyyy}`;
  cycleEl.textContent = `Kỳ: tháng ${mm}/${yyyy}`;
}

function matchesFilter(item) {
  if (state.group !== 'all' && item.nhom !== state.group) return false;
  if (state.exclusiveOnly && !item.docQuyen) return false;
  if (state.newOnly && item.trangThai !== 'Mới ra mắt') return false;
  if (state.search && !normalize(item.ten).includes(state.search)) return false;
  return true;
}

function renderPoster(item) {
  const poster = document.createElement('div');
  poster.className = 'poster';
  if (item.posterUrl) {
    const img = document.createElement('img');
    img.src = item.posterUrl;
    img.alt = item.ten;
    img.loading = 'lazy';
    img.onerror = () => {
      img.remove();
      poster.insertBefore(document.createTextNode('poster'), poster.firstChild);
    };
    poster.appendChild(img);
  } else {
    poster.textContent = 'poster';
  }
  if (item.docQuyen) {
    const badge = document.createElement('div');
    badge.className = 'excl-badge';
    badge.textContent = 'ĐỘC QUYỀN';
    poster.appendChild(badge);
  }
  return poster;
}

function renderCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.appendChild(renderPoster(item));

  const body = document.createElement('div');
  body.className = 'body';

  const tagRow = document.createElement('div');
  tagRow.className = 'tag-row';
  if (item.hang && RANK_CLASS[item.hang]) {
    const t = document.createElement('span');
    t.className = `tag ${RANK_CLASS[item.hang]}`;
    t.textContent = item.hang;
    tagRow.appendChild(t);
  }
  if (item.trangThai && STATUS_CLASS[item.trangThai]) {
    const t = document.createElement('span');
    t.className = `tag ${STATUS_CLASS[item.trangThai]}`;
    t.textContent = item.trangThai;
    tagRow.appendChild(t);
  }
  if (tagRow.childNodes.length) body.appendChild(tagRow);

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = item.ten;
  body.appendChild(title);

  const meta = [item.chuyenMuc, item.quocGia, item.namDinhDang].filter(Boolean).join(' · ');
  if (meta) {
    const metaEl = document.createElement('div');
    metaEl.className = 'meta';
    metaEl.textContent = meta;
    body.appendChild(metaEl);
  }

  if (item.tomTat) {
    const summary = document.createElement('div');
    summary.className = 'summary';
    summary.textContent = item.tomTat;
    body.appendChild(summary);
  }

  if (item.diemNhan && item.diemNhan.length) {
    const points = document.createElement('div');
    points.className = 'points';
    item.diemNhan.forEach(p => {
      const pt = document.createElement('div');
      pt.className = 'point';
      pt.textContent = p;
      points.appendChild(pt);
    });
    body.appendChild(points);
  }

  card.appendChild(body);
  return card;
}

function render() {
  const filtered = allData.filter(matchesFilter);
  const container = document.getElementById('content');
  container.innerHTML = '';

  if (filtered.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'state-msg';
    msg.textContent = 'Không tìm thấy nội dung phù hợp.';
    container.appendChild(msg);
    return;
  }

  SECTION_ORDER.forEach(group => {
    const items = filtered.filter(i => i.nhom === group);
    if (items.length === 0) return;

    const head = document.createElement('div');
    head.className = `section-head ${SECTION_CLASS[group]}`;
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = group;
    head.appendChild(label);
    container.appendChild(head);

    items.forEach(item => container.appendChild(renderCard(item)));
  });
}

function bindFilters() {
  document.querySelectorAll('#groupFilters .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#groupFilters .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.group = btn.dataset.group;
      render();
    });
  });

  document.getElementById('filterExclusive').addEventListener('click', function () {
    this.classList.toggle('active');
    state.exclusiveOnly = this.classList.contains('active');
    render();
  });

  document.getElementById('filterNew').addEventListener('click', function () {
    this.classList.toggle('active');
    state.newOnly = this.classList.contains('active');
    render();
  });

  document.getElementById('searchInput').addEventListener('input', function () {
    state.search = normalize(this.value);
    render();
  });
}

async function init() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Network error: ' + res.status);
    allData = await res.json();
    updateHeaderDate();
    bindFilters();
    render();
  } catch (err) {
    document.getElementById('content').innerHTML =
      '<div class="state-msg">Không tải được nội dung. Vui lòng thử lại sau.</div>';
    console.error(err);
  }
}

init();
