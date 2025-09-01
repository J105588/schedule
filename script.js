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
    console.log('=== ページ読み込み開始 ===');
    console.log('現在のURL:', window.location.href);
    console.log('ページタイトル:', document.title);
    
    // CSVファイルを読み込む
    loadCSVData();
    
    // モーダル機能
    setupModalHandlers();
    
    // カードホバーエフェクト
    setupCardEffects();
    
    // アニメーション効果
    setupAnimations();
    
    console.log('=== ページ読み込み完了 ===');
});

// CSVファイルを読み込む
async function loadCSVData() {
    try {
        console.log('=== CSVファイルの読み込みを開始 ===');
        console.log('現在のURL:', window.location.href);
        console.log('ページタイトル:', document.title);
        
        const response = await fetch('data.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSVファイルの内容（最初の200文字）:', csvText.substring(0, 200) + '...');
        console.log('CSVファイルの総文字数:', csvText.length);
        
        festivalData = parseCSV(csvText);
        console.log('パースされたデータ:', festivalData);
        console.log('データの行数:', festivalData.length);
        
        if (festivalData.length > 0) {
            console.log('最初の行のサンプル:', festivalData[0]);
            console.log('利用可能なクラス:', [...new Set(festivalData.map(row => row.class))]);
        }
        
        // メインページの場合はクラスカードを生成
        if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
            console.log('メインページ: クラスカードを生成中...');
            generateClassCards();
        }
        
        // 個別クラスページの場合はスケジュールテーブルを生成
        else if (window.location.pathname.includes('.html')) {
            const className = getClassNameFromURL();
            console.log('個別クラスページ: クラス名 =', className);
            if (className) {
                console.log(`${className}のデータをフィルタリング中...`);
                const classData = festivalData.filter(row => row.class === className);
                console.log(`${className}のデータ数:`, classData.length);
                if (classData.length > 0) {
                    generateScheduleTable(className);
                    generateMobileNavigation();
                } else {
                    console.error(`${className}のデータが見つかりません`);
                }
            } else {
                console.error('クラス名を取得できませんでした');
            }
        }
        
        console.log('=== CSVファイルの読み込み完了 ===');
        
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
    console.log(`${className}のスケジュールテーブルを生成中...`);
    
    const classData = festivalData.filter(row => row.class === className);
    if (classData.length === 0) {
        console.error(`${className}のデータが見つかりません`);
        return;
    }
    
    console.log(`${className}のデータ:`, classData);
    
    // ヘッダーを更新
    updateScheduleHeader(className);
    
    // 1日目と2日目のデータを分離
    const day1Data = classData.filter(row => row.day === '1日目');
    const day2Data = classData.filter(row => row.day === '2日目');
    
    console.log('1日目のデータ:', day1Data);
    console.log('2日目のデータ:', day2Data);
    
    // 1日目のテーブルを生成
    generateDayTable('1日目', day1Data);
    
    // 2日目のテーブルを生成
    generateDayTable('2日目', day2Data);
    
    console.log(`${className}のスケジュールテーブル生成完了`);
    
    // 生成完了後にモーダルの状態を確認
    setTimeout(() => {
        debugModalState();
    }, 500);
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
    console.log(`${day}のモーダルを生成中...`, dayData);
    
    const existingModals = document.querySelectorAll(`[data-day="${day}"]`);
    existingModals.forEach(modal => modal.remove());
    
    dayData.forEach((row, index) => {
        const modal = document.createElement('div');
        modal.id = `modal-${day}-${index + 1}`;
        modal.className = 'modal';
        modal.setAttribute('data-day', day);
        
        // 初期スタイルを設定（非表示状態）
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('position', 'fixed', 'important');
        modal.style.setProperty('z-index', '2000', 'important');
        modal.style.setProperty('left', '0', 'important');
        modal.style.setProperty('top', '0', 'important');
        modal.style.setProperty('width', '100%', 'important');
        modal.style.setProperty('height', '100%', 'important');
        modal.style.setProperty('background', 'rgba(0, 0, 0, 0.4)', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('visibility', 'hidden', 'important');
        
        // 役者リストを動的に生成（人数制限なし）
        const castList = row.cast.split(',').map(cast => cast.trim()).filter(cast => cast.length > 0);
        const staffList = row.staff.split(',').map(staff => staff.trim()).filter(staff => staff.length > 0);
        
        console.log(`${day} ${row.time}の役者リスト:`, castList);
        console.log(`${day} ${row.time}のスタッフリスト:`, staffList);
        
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
        console.log(`モーダル ${modal.id} を生成しました（初期状態: 非表示）`);
        
        // モーダルの現在のスタイルを確認
        const computedStyle = window.getComputedStyle(modal);
        console.log(`モーダル ${modal.id} の現在のスタイル:`, {
            display: computedStyle.display,
            position: computedStyle.position,
            zIndex: computedStyle.zIndex,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity
        });
    });
    
    console.log(`${day}のモーダル生成完了`);
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

// モーダルを表示する関数
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        console.log(`モーダル ${modalId} を表示中...`);
        // モーダルを確実に表示（すべてのプロパティを明示的に設定）
        modal.style.setProperty('display', 'block', 'important');
        modal.style.setProperty('position', 'fixed', 'important');
        modal.style.setProperty('z-index', '2000', 'important');
        modal.style.setProperty('left', '0', 'important');
        modal.style.setProperty('top', '0', 'important');
        modal.style.setProperty('width', '100%', 'important');
        modal.style.setProperty('height', '100%', 'important');
        modal.style.setProperty('background', 'rgba(0, 0, 0, 0.4)', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        document.body.style.overflow = 'hidden';
        console.log(`モーダル ${modalId} を表示しました`);
        
        // 表示後のスタイルを確認
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(modal);
            console.log(`モーダル ${modalId} の表示後スタイル:`, {
                display: computedStyle.display,
                position: computedStyle.position,
                zIndex: computedStyle.zIndex,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity
            });
        }, 100);
        
        return true;
    } else {
        console.error(`モーダル ${modalId} が見つかりません`);
        return false;
    }
}

// モーダルを非表示にする関数
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        document.body.style.overflow = 'auto';
        console.log(`モーダル ${modalId} を非表示にしました`);
        return true;
    }
    return false;
}

// モーダルハンドラーを設定
function setupModalHandlers() {
    // モーダルボタンのイベントリスナー
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('cast-btn')) {
            const modalId = e.target.getAttribute('data-modal');
            console.log('モーダルボタンがクリックされました:', modalId);
            showModal(modalId);
        }
        
        if (e.target.classList.contains('close')) {
            const modalId = e.target.getAttribute('data-modal');
            hideModal(modalId);
        }
    });

    // モーダル外クリックで閉じる
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                hideModal(modal.id);
            }
        });
    });
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (window.getComputedStyle(modal).display === 'block') {
                    hideModal(modal.id);
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

// モーダルの状態をデバッグする関数
function debugModalState() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const modalId = modal.id;
        const computedStyle = window.getComputedStyle(modal);
        console.log(`モーダル ${modalId} の現在のスタイル:`, {
            display: computedStyle.display,
            position: computedStyle.position,
            zIndex: computedStyle.zIndex,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity
        });
    });
}