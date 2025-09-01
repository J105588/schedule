// グローバル変数
let festivalData = [];
let classTitles = {
    '1組': '話が違う！',
    '2組': 'ある脱出ゲーム',
    '3組': 'ポプコーンの降る街',
    '4組': '庭園の何処かに潜伏していると仮定される盗賊の行方に関する一考察 ～羽柴邸に於ける旧ロマノフ家のダイヤ盗難事件を基に～',
    '5組': 'チェンジ・ザ・ワールド',
    '6組': '七人の部長',
    '7組': 'サマータイムマシンブルース',
    '8組': 'Memento ～忘却の夏'
};

document.addEventListener('DOMContentLoaded', () => {
    // CSVファイルを読み込む
    loadCSVData();
    
    // モーダル機能
    setupModalHandlers();
    
    // カードホバーエフェクト
    setupCardEffects();
    
    // アニメーション効果
    setupAnimations();
});

// CSVファイルを読み込む
async function loadCSVData() {
    try {
        const response = await fetch('data.csv');
        const csvText = await response.text();
        festivalData = parseCSV(csvText);
        
        // メインページの場合はクラスカードを生成
        if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
            generateClassCards();
        }
        
        // 個別クラスページの場合はスケジュールテーブルを生成
        else if (window.location.pathname.includes('.html')) {
            const className = getClassNameFromURL();
            if (className) {
                generateScheduleTable(className);
                generateMobileNavigation();
            }
        }
        
    } catch (error) {
        console.error('CSVファイルの読み込みに失敗しました:', error);
        // エラー時のフォールバック
        showError('データの読み込みに失敗しました。ページを再読み込みしてください。');
    }
}

// CSVをパースする
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        
        headers.forEach((header, index) => {
            row[header.trim()] = values[index] ? values[index].trim() : '';
        });
        
        data.push(row);
    }
    
    return data;
}

// CSVの行をパースする（カンマを含むフィールドに対応）
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// クラスカードを生成
function generateClassCards() {
    const classesGrid = document.querySelector('.classes-grid');
    if (!classesGrid) return;
    
    // ユニークなクラスを取得
    const uniqueClasses = [...new Set(festivalData.map(row => row.class))];
    
    classesGrid.innerHTML = '';
    
    uniqueClasses.forEach(className => {
        const classData = festivalData.filter(row => row.class === className);
        const performances = classData.length;
        
        // 役者の総数を動的に計算
        const totalCast = classData.reduce((total, row) => {
            const castCount = row.cast.split(',').filter(cast => cast.trim().length > 0).length;
            return total + castCount;
        }, 0);
        
        const card = document.createElement('a');
        card.href = `${className.replace('組', '')}.html`;
        card.className = 'class-card';
        
        card.innerHTML = `
            <div class="class-card-header">
                <i class="fas fa-users"></i>
                <h4>${className}</h4>
            </div>
            <div class="class-card-content">
                <p>${classTitles[className] || '演劇公演'}</p>
                <div class="schedule-info">
                    <span class="schedule-badge">${performances}公演</span>
                    <span class="cast-count">役者: ${totalCast}名</span>
                </div>
            </div>
        `;
        
        classesGrid.appendChild(card);
    });
    
    // モバイルナビゲーションも生成
    generateMobileNavigation();
}

// スケジュールテーブルを生成
function generateScheduleTable(className) {
    const classData = festivalData.filter(row => row.class === className);
    if (classData.length === 0) return;
    
    // ヘッダーを更新
    updateScheduleHeader(className);
    
    // 1日目と2日目のデータを分離
    const day1Data = classData.filter(row => row.day === '1日目');
    const day2Data = classData.filter(row => row.day === '2日目');
    
    // 1日目のテーブルを生成
    generateDayTable('1日目', day1Data);
    
    // 2日目のテーブルを生成
    generateDayTable('2日目', day2Data);
}

// スケジュールヘッダーを更新
function updateScheduleHeader(className) {
    const header = document.querySelector('.schedule-header h1');
    const description = document.querySelector('.schedule-header p');
    
    if (header) {
        header.textContent = `${className} 上演スケジュール`;
    }
    
    if (description) {
        description.textContent = classTitles[className] || '演劇公演';
    }
}

// 日別テーブルを生成
function generateDayTable(day, dayData) {
    const existingTable = document.querySelector(`[data-day="${day}"]`);
    if (existingTable) {
        existingTable.remove();
    }
    
    const main = document.querySelector('main');
    const tableContainer = document.createElement('div');
    tableContainer.className = 'schedule-table';
    tableContainer.setAttribute('data-day', day);
    
    tableContainer.innerHTML = `
        <h2><i class="fas fa-calendar-day"></i> ${day}</h2>
        <table>
            <thead>
                <tr>
                    <th class="time-cell">時間</th>
                    <th class="title-cell">演目</th>
                    <th class="cast-count-cell">役者数</th>
                    <th>役者・スタッフ</th>
                </tr>
            </thead>
            <tbody>
                ${dayData.map((row, index) => {
                    const castCount = row.cast.split(',').filter(cast => cast.trim().length > 0).length;
                    const staffCount = row.staff.split(',').filter(staff => staff.trim().length > 0).length;
                    return `
                        <tr>
                            <td class="time-cell">${row.time}</td>
                            <td class="title-cell">${row.title}</td>
                            <td class="cast-count-cell">
                                <span class="cast-number">${castCount}名</span>
                                <span class="staff-number">+${staffCount}名</span>
                            </td>
                            <td>
                                <button class="cast-btn" data-modal="modal-${day}-${index + 1}" 
                                        data-class="${row.class}" data-day="${row.day}" data-time="${row.time}">
                                    詳細を見る
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    // 情報セクションの前に挿入
    const infoSection = document.querySelector('.info-section');
    if (infoSection) {
        main.insertBefore(tableContainer, infoSection);
    } else {
        main.appendChild(tableContainer);
    }
    
    // モーダルを生成
    generateModals(day, dayData);
}

// モーダルを生成
function generateModals(day, dayData) {
    const existingModals = document.querySelectorAll(`[data-day="${day}"]`);
    existingModals.forEach(modal => modal.remove());
    
    dayData.forEach((row, index) => {
        const modal = document.createElement('div');
        modal.id = `modal-${day}-${index + 1}`;
        modal.className = 'modal';
        modal.setAttribute('data-day', day);
        
        // 役者リストを動的に生成（人数制限なし）
        const castList = row.cast.split(',').map(cast => cast.trim()).filter(cast => cast.length > 0);
        const staffList = row.staff.split(',').map(staff => staff.trim()).filter(staff => staff.length > 0);
        
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close" data-modal="modal-${day}-${index + 1}">
                    <i class="fas fa-times"></i>
                </button>
                <h2>${row.title} 役者一覧</h2>
                <div class="cast-section">
                    <h3><i class="fas fa-users"></i> キャスト (${castList.length}名)</h3>
                    <ul>
                        ${castList.map((cast, i) => `
                            <li><i class="fas fa-user"></i> ${i + 1}. ${cast}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="staff-section">
                    <h3><i class="fas fa-cogs"></i> スタッフ (${staffList.length}名)</h3>
                    <ul>
                        ${staffList.map((staff, i) => `
                            <li><i class="fas fa-cog"></i> ${staff}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    });
}

// URLからクラス名を取得
function getClassNameFromURL() {
    const path = window.location.pathname;
    const match = path.match(/(\d+)\.html$/);
    if (match) {
        return `${match[1]}組`;
    }
    return null;
}

// モーダルハンドラーを設定
function setupModalHandlers() {
    // モーダルボタンのイベントリスナー
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('cast-btn')) {
            const modalId = e.target.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }
        
        if (e.target.classList.contains('close')) {
            const modalId = e.target.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
    });

    // モーダル外クリックで閉じる
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }
    });
}

// カードエフェクトを設定
function setupCardEffects() {
    const classCards = document.querySelectorAll('.class-card');
    classCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

// アニメーション効果を設定
function setupAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.class-card, .info-card, .hero');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// モバイルナビゲーションを生成
function generateMobileNavigation() {
    const mobileNavContent = document.querySelector('.mobile-nav-content');
    if (!mobileNavContent) return;
    
    // ユニークなクラスを取得
    const uniqueClasses = [...new Set(festivalData.map(row => row.class))];
    
    mobileNavContent.innerHTML = '';
    
    uniqueClasses.forEach(className => {
        const navItem = document.createElement('a');
        navItem.href = `${className.replace('組', '')}.html`;
        navItem.className = 'mobile-nav-item';
        
        navItem.innerHTML = `
            <i class="fas fa-users"></i>
            <span>${className}</span>
        `;
        
        mobileNavContent.appendChild(navItem);
    });
}

// モバイルナビゲーション切り替え
function toggleNav() {
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
        mobileNav.classList.toggle('active');
        
        if (mobileNav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }
}

// 古いサイドバー関数（後方互換性のため）
function openSidebar() {
    toggleNav();
}

function closeSidebar() {
    toggleNav();
}

// エラー表示
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// ページ読み込み時のアニメーション
window.addEventListener('load', () => {
    setTimeout(() => {
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }
    }, 100);
});

// タッチデバイス対応
if ('ontouchstart' in window) {
    const touchElements = document.querySelectorAll('.class-card, .nav-toggle, .nav-close');
    touchElements.forEach(element => {
        element.addEventListener('touchstart', () => {
            element.style.transform = 'scale(0.98)';
        });
        
        element.addEventListener('touchend', () => {
            element.style.transform = '';
        });
    });
}