document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const countryList = document.getElementById('countryList');
    const configContainer = document.getElementById('configContainer');
    const appTitle = document.getElementById('app-title');
    const backBtn = document.getElementById('back-btn');
    const countrySearchInput = document.getElementById('country-search');
    const countrySearchContainer = document.getElementById('country-search-container');
    const countryEmptyMessage = document.getElementById('country-empty-message');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    const toast = document.getElementById('my-toast');

    const GITHUB_REPO_OWNER = 'arshiacomplus';
    const GITHUB_REPO_NAME = 'V2rayExtractor';
    const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/loc`;
    let allCountries = [];
    function showToast(message) {
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => toast.style.opacity = '1', 10);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.style.display = 'none', 300);
        }, 2000);
    }
    function copyToClipboard(text, message = '✅ کپی شد!') {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => showToast(message))
                .catch(() => showToast('❌ خطا در کپی'));
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'absolute';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast(message);
            } catch (err) {
                showToast('❌ خطا در کپی');
            }
            document.body.removeChild(textArea);
        }
    }
    function displayStatsAndConfigs(textContent, countryFileName) {
        configContainer.innerHTML = '';
        const configs = textContent.trim().split('\n').filter(line => line.trim().includes('://'));
        if (configs.length === 0) {
            configContainer.innerHTML = '<div style="text-align:center; color:#ffb4b4;">هیچ کانفیگی برای این کشور یافت نشد.</div>';
            return;
        }
        const stats = { VLESS: 0, VMESS: 0, TROJAN: 0, SS: 0, HY2: 0, OTHER: 0 };
        configs.forEach(config => {
            if (config.startsWith('vless://')) stats.VLESS++;
            else if (config.startsWith('vmess://')) stats.VMESS++;
            else if (config.startsWith('trojan://')) stats.TROJAN++;
            else if (config.startsWith('ss://')) stats.SS++;
            else if (config.startsWith('hy2://') || config.startsWith('hysteria2://') || config.startsWith('hysteria://')) stats.HY2++;
            else stats.OTHER++;
        });
        const statsHtml = `
            <div class="stats-container" style="animation: fadeIn 0.5s;">
                <h2 class="stats-title">آمار پروتکل‌ها</h2>
                <ul class="stats-list">
                    <li><span>VLESS</span><span class="count">${stats.VLESS}</span></li>
                    <li><span>VMESS</span><span class="count">${stats.VMESS}</span></li>
                    <li><span>TROJAN</span><span class="count">${stats.TROJAN}</span></li>
                    <li><span>SS</span><span class="count">${stats.SS}</span></li>
                    <li><span>HY2 / HYSTERIA2</span><span class="count">${stats.HY2}</span></li>
                    ${stats.OTHER > 0 ? `<li><span>سایر</span><span class="count">${stats.OTHER}</span></li>` : ''}
                </ul>
            </div>`;
        configContainer.insertAdjacentHTML('beforeend', statsHtml);
        configs.forEach(configText => {
            const configItem = document.createElement('div');
            configItem.className = 'config-item';
            configItem.textContent = configText;
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn-copy';
            copyBtn.textContent = 'کپی';
            copyBtn.onclick = () => copyToClipboard(configText);
            const copyRawBtn = document.createElement('button');
            copyRawBtn.className = 'btn-copy-raw';
            copyRawBtn.textContent = 'کپی لینک RAW';
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/loc/${encodeURIComponent(countryFileName)}`;
            copyRawBtn.onclick = () => copyToClipboard(rawUrl, '✅ لینک RAW کپی شد!');
            configItem.appendChild(copyBtn);
            configItem.appendChild(copyRawBtn);
            configContainer.appendChild(configItem);
        });
    }
    async function showConfigsForCountry(country) {
        countryList.style.display = 'none';
        countrySearchContainer.style.display = 'none';
        configContainer.innerHTML = '<div id="loader">در حال بارگیری کانفیگ‌ها...</div>';
        configContainer.style.display = 'block';
        backBtn.style.display = 'block';
        appTitle.textContent = `${country.flag} ${country.name}`;
        try {
            const response = await fetch(`loc/${country.fileName}?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const text = await response.text();
            displayStatsAndConfigs(text, country.fileName);
        } catch (error) {
            console.error('Error fetching configs:', error);
            configContainer.innerHTML = '<div style="text-align:center; color:#ffb4b4;">خطا در بارگیری کانفیگ‌ها. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.</div>';
        }
    }
    function showCountryList() {
        configContainer.style.display = 'none';
        backBtn.style.display = 'none';
        countryList.style.display = 'flex';
        countrySearchContainer.style.display = 'block';
        appTitle.textContent = 'V2Ray Extractor';
        countrySearchInput.value = '';
        document.querySelectorAll('.country-item').forEach(item => {
            item.style.display = 'block';
        });
        countryEmptyMessage.style.display = 'none';
    }
    async function loadCountries() {
        try {
            const response = await fetch(`${GITHUB_API_URL}?t=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
            }
            const files = await response.json();
            countryList.innerHTML = '';
            allCountries = [];
            if (!Array.isArray(files)) {
                throw new Error('Invalid response from GitHub API, not an array.');
            }
            files.sort((a, b) => a.name.localeCompare(b.name));
            files.forEach(file => {
                if (file.type !== 'file' || !file.name.endsWith('.txt')) {
                    return;
                }
                const match = file.name.match(/([A-Z]{2})\s(.+)\.txt/);
                if (!match) return;
                const countryCode = match[1];
                const countryNameWithFlag = match[2];
                const countryData = {
                    code: countryCode,
                    name: countryNameWithFlag.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim(),
                    flag: (countryNameWithFlag.match(/[\u{1F1E6}-\u{1F1FF}]/gu) || []).join(''),
                    fileName: file.name,
                };
                allCountries.push(countryData);
                const countryItem = document.createElement('div');
                countryItem.className = 'country-item';
                countryItem.onclick = () => showConfigsForCountry(countryData);
                countryItem.innerHTML = `
                    <div class="country-info">
                        <strong>${countryData.flag} ${countryData.name}</strong>
                        <small>${countryData.code}</small>
                    </div>
                `;
                countryList.appendChild(countryItem);
            });
            loader.style.display = 'none';
            countryList.style.display = 'flex';
            countrySearchContainer.style.display = 'block';
        } catch (error) {
            console.error('Error loading countries:', error);
            loader.textContent = `خطا در بارگیری لیست کشورها: ${error.message}`;
            loader.style.color = '#ffb4b4';
        }
    }
    backBtn.addEventListener('click', showCountryList);
    countrySearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        let visibleCount = 0;
        allCountries.forEach((country, index) => {
            const itemElement = countryList.children[index];
            if (!itemElement) return;
            const isVisible = country.name.toLowerCase().includes(searchTerm) ||
                              country.code.toLowerCase().includes(searchTerm);
            itemElement.style.display = isVisible ? 'block' : 'none';
            if(isVisible) visibleCount++;
        });
        countryEmptyMessage.style.display = visibleCount === 0 && searchTerm.length > 0 ? 'block' : 'none';
    });
    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) {
            scrollToTopBtn.style.display = 'flex';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    loadCountries();
});
