// Public-repository reader for Decap's Markdown collection.
// Replace these values with the owner and repository containing this site.
const CMS_GITHUB_OWNER = 'YOUR_GITHUB_USERNAME';
const CMS_GITHUB_REPO = 'YOUR_REPOSITORY';
const CMS_GITHUB_BRANCH = 'main';

async function loadPublishedArticles() {
    const list = document.getElementById('articleList');
    if (!list) return;
    const endpoint = `https://api.github.com/repos/${CMS_GITHUB_OWNER}/${CMS_GITHUB_REPO}/contents/articles?ref=${CMS_GITHUB_BRANCH}`;
    try {
        const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.github+json' } });
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
        const files = (await response.json()).filter(file => file.type === 'file' && file.name.endsWith('.md'));
        const articles = await Promise.all(files.map(async file => {
            const raw = await fetch(file.download_url);
            if (!raw.ok) return null;
            const markdown = await raw.text();
            const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
            if (!match) return null;
            const meta = {};
            for (const line of match[1].split(/\r?\n/)) {
                const item = line.match(/^([\w-]+):\s*(.*)$/);
                if (item) meta[item[1]] = item[2].replace(/^['"]|['"]$/g, '').trim();
            }
            if (meta.draft === 'true') return null;
            return { ...meta, body: markdown.slice(match[0].length) };
        }));
        const published = articles.filter(article => article?.title && article.publishDate && new Date(article.publishDate) <= new Date())
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
        if (!published.length) {
            list.innerHTML = '<p class="articles-status">لا توجد مقالات منشورة حتى الآن.</p>';
            return;
        }
        list.replaceChildren(...published.map(article => {
            const card = document.createElement('article');
            card.className = 'article-card';
            const image = document.createElement('img');
            image.className = 'article-image';
            image.src = article.featuredImage || '';
            image.alt = article.title;
            image.loading = 'lazy';
            const content = document.createElement('div');
            content.className = 'article-copy';
            const category = document.createElement('p');
            category.className = 'article-category';
            category.textContent = article.category || '';
            const title = document.createElement('h3');
            title.textContent = article.title;
            const byline = document.createElement('p');
            byline.className = 'article-byline';
            byline.textContent = `${article.author || ''} · ${article.publishDate}`;
            const body = document.createElement('div');
            body.className = 'article-body';
            body.innerHTML = window.DOMPurify.sanitize(window.marked.parse(article.body));
            content.append(category, title, byline, body);
            if (article.featuredImage) card.append(image);
            card.append(content);
            return card;
        }));
    } catch (error) {
        console.error('Could not load Decap articles:', error);
        list.innerHTML = '<p class="articles-status">تعذّر تحميل المقالات. يرجى المحاولة لاحقاً.</p>';
    }
}

loadPublishedArticles();

const facebookUrl = 'https://www.facebook.com/profile.php?id=100064454691647&ref=nf&hc_ref=ARRyknr38mWHnpMKg2JcIp8mWuo8ffNdenYseiADKBp4W7nete_3jTq6HU9R5QynhU4#';
const facebookIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.4v3h2.7v8h3.4Z"></path></svg>';

document.querySelectorAll('.header-socials, .footer-socials').forEach(group => {
    const link = document.createElement('a');
    link.href = facebookUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'تابعنا على فيسبوك');
    link.title = 'فيسبوك';
    link.className = 'facebook-social';
    link.innerHTML = facebookIcon;
    link.addEventListener('mouseenter', () => { link.style.color = '#3b82f6'; });
    link.addEventListener('mouseleave', () => { link.style.color = ''; });
    group.insertBefore(link, group.firstElementChild?.nextElementSibling || group.firstElementChild);
});

const socialHoverStyles = document.createElement('style');
socialHoverStyles.textContent = '.header-socials .x-social:hover,.footer-socials .x-social:hover{color:#0f172a!important}.dark .header-socials .x-social:hover,.dark .footer-socials .x-social:hover{color:#fff!important}.header-socials .whatsapp-social:hover,.footer-socials .whatsapp-social:hover{color:#10b981!important}';
document.head.appendChild(socialHoverStyles);

const xUrl = 'https://x.com/algalil_vip?s=20';
const whatsappUrl = 'https://api.whatsapp.com/send?phone=96871844452';
document.querySelectorAll('.header-socials a, .footer-socials a').forEach(link => {
    const label = link.getAttribute('aria-label') || '';
    const svgPath = link.querySelector('path')?.getAttribute('d') || '';
    const isX = label.includes('إكس') || svgPath.includes('M5 4l14 16');
    const isWhatsapp = label.includes('واتساب') || svgPath.includes('M20 11.5');

    if (isX) {
        link.href = xUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', 'حساب مجلة حبر الوطن على منصة إكس');
        link.classList.add('x-social');
        link.addEventListener('mouseenter', () => { link.style.color = '#0f172a'; });
        link.addEventListener('mouseleave', () => { link.style.color = ''; });
    }

    if (isWhatsapp) {
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', 'تواصل معنا عبر واتساب');
        link.classList.add('whatsapp-social');
        link.addEventListener('mouseenter', () => { link.style.color = '#10b981'; });
        link.addEventListener('mouseleave', () => { link.style.color = ''; });
    }
});

document.querySelectorAll('.filter-tag').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.filter-tag').forEach(item => item.classList.toggle('active', item === button));
        document.querySelectorAll('.article-card').forEach(card => {
            card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
        });
    });
});

const darkModeToggle = document.getElementById('darkModeToggle');
if (localStorage.getItem('hibrAlwatan-theme') === 'dark') document.documentElement.classList.add('dark');
darkModeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('hibrAlwatan-theme', isDark ? 'dark' : 'light');
});

document.getElementById('newsletterForm').addEventListener('submit', event => {
    event.preventDefault();
    const message = document.getElementById('newsletterMessage');
    message.textContent = 'تم تسجيل اشتراكك. أهلاً بك في مجتمع حبر الوطن.';
    message.style.color = '#e8d7b6';
    event.currentTarget.reset();
});
