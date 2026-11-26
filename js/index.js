const CLASS_ORDER = ['八尾クラス', '高尾クラス', '井口クラス', '水野クラス', '山下クラス'];
const GROUP_ORDER = ['グループA', 'グループB', 'グループC'];

const CLASS_MAP = {
    '水野クラス': 'mizuno',
    '井口クラス': 'iguchi',
    '高尾クラス': 'takawo',
    '八尾クラス': 'yao',
    '山下クラス': 'yamashita'
};

const VENUE_MAP = {
    '八尾クラス': '832',
    '高尾クラス': '832',
    '井口クラス': '832',
    '水野クラス': '334',
    '山下クラス': '334'
};

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim() || current === '') {
        values.push(current.trim());
    }
    return values;
}

function normalizeGroupName(group) {
    if (group === '1班') return 'グループA';
    if (group === '2班') return 'グループB';
    if (group === '3班') return 'グループC';
    return group;
}

function getClassCssClass(className) {
    return CLASS_MAP[className] || '';
}

function createGroupCard(group) {
    const card = document.createElement('article');
    const classCss = getClassCssClass(group.class);
    card.className = `group-item class-${classCss}`;

    const meta = document.createElement('div');
    meta.className = 'group-meta';

    const classLabel = document.createElement('span');
    classLabel.className = 'group-class-label';
    classLabel.textContent = group.class;
    meta.appendChild(classLabel);

    const groupLabel = document.createElement('span');
    groupLabel.className = 'group-label';
    groupLabel.textContent = normalizeGroupName(group.group);
    meta.appendChild(groupLabel);
    card.appendChild(meta);

    const theme = document.createElement('h3');
    theme.className = 'group-theme';
    const themeText = group.theme || '（テーマ提出待ち）';
    theme.textContent = themeText;
    if (themeText.includes('提出待ち') || themeText.includes('未設定')) {
        theme.classList.add('is-pending');
    }
    card.appendChild(theme);

    const pdfUrl = (group.pdfUrl || '').trim();

    if (pdfUrl) {
        const frameLink = document.createElement('a');
        frameLink.className = 'pdf-frame-wrap';
        frameLink.href = pdfUrl;
        frameLink.target = '_blank';
        frameLink.rel = 'noopener noreferrer';
        frameLink.setAttribute('aria-label', `${normalizeGroupName(group.group)} の発表資料PDFを開く`);

        const iframe = document.createElement('iframe');
        iframe.src = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-width`;
        iframe.title = '';
        iframe.loading = 'lazy';
        iframe.tabIndex = -1;
        frameLink.appendChild(iframe);
        card.appendChild(frameLink);
    }

    const actions = document.createElement('div');
    actions.className = 'group-actions';

    if (pdfUrl) {
        const button = document.createElement('a');
        button.className = 'group-materials-button';
        button.href = pdfUrl;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.innerHTML = 'PDFを開く <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z"/></svg>';
        actions.appendChild(button);
    }

    card.appendChild(actions);
    return card;
}

function buildClassFilter(activeClass) {
    const nav = document.getElementById('class-filter');
    if (!nav) return;
    nav.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.textContent = 'すべて';
    allBtn.dataset.class = 'all';
    if (!activeClass || activeClass === 'all') allBtn.classList.add('is-active');
    allBtn.addEventListener('click', () => filterClasses('all'));
    nav.appendChild(allBtn);

    CLASS_ORDER.forEach((className) => {
        const slug = getClassCssClass(className);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = className.replace('クラス', '');
        btn.dataset.class = slug;
        if (activeClass === slug) btn.classList.add('is-active');
        btn.addEventListener('click', () => filterClasses(slug));
        nav.appendChild(btn);
    });
}

function filterClasses(slug) {
    buildClassFilter(slug);
    document.querySelectorAll('.class-block').forEach((block) => {
        const match = slug === 'all' || block.dataset.class === slug;
        block.hidden = !match;
    });
    if (slug !== 'all') {
        const target = document.querySelector(`.class-block[data-class="${slug}"]`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function initScrollReveal() {
    const nodes = document.querySelectorAll('.group-item');
    if (!('IntersectionObserver' in window)) {
        nodes.forEach((el) => el.classList.add('reveal-visible'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    nodes.forEach((el) => observer.observe(el));
}

async function loadCSV() {
    const container = document.getElementById('list-container');
    try {
        const response = await fetch('data/data_2026.csv');
        if (!response.ok) {
            throw new Error(`data_2026.csv が見つかりません (${response.status})`);
        }
        const text = await response.text();
        const lines = text.trim().split('\n');
        const cardsData = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            const values = parseCSVLine(line);
            if (values.length >= 3) {
                cardsData.push({
                    class: values[0],
                    group: values[1],
                    theme: values[2],
                    presentationUrl: values[3] || '',
                    materialsUrl: values[4] || '',
                    pdfUrl: values[5] || ''
                });
            }
        }

        const classesData = {};
        cardsData.forEach((card) => {
            if (!classesData[card.class]) classesData[card.class] = [];
            classesData[card.class].push(card);
        });

        container.innerHTML = '';
        CLASS_ORDER.forEach((className) => {
            const groups = classesData[className] || [];
            if (!groups.length) return;

            const sorted = GROUP_ORDER.map((g) =>
                groups.find((item) => normalizeGroupName(item.group) === g)
            ).filter(Boolean);

            const block = document.createElement('section');
            block.className = 'class-block';
            block.dataset.class = getClassCssClass(className);
            block.id = `class-${getClassCssClass(className)}`;

            const venue = VENUE_MAP[className] || '';
            const head = document.createElement('div');
            head.className = 'class-block-head';
            head.innerHTML = `
                <h3 class="class-block-title">
                    <span class="class-swatch" aria-hidden="true"></span>${className}
                    <span class="class-venue">${venue}教室</span>
                </h3>
            `;
            block.appendChild(head);

            const row = document.createElement('div');
            row.className = 'groups-row';
            sorted.forEach((group) => row.appendChild(createGroupCard(group)));
            block.appendChild(row);
            container.appendChild(block);
        });

        buildClassFilter('all');
        initScrollReveal();
    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="error-box">
                <strong>データの読み込みに失敗しました</strong>
                <p>${error.message}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCSV();
});
