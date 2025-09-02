// グローバル変数
let festivalData = [];

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== ページ読み込み開始 ===');
    
    // CSVファイルを読み込む
    loadCSVData();
    
    // モーダル機能を設定
    setupModalHandlers();
    
    // サイドバー機能を設定
    setupSidebarHandlers();
    
    // カウントダウン機能を開始
    startCountdown();
});

// CSVファイルを読み込む
async function loadCSVData() {
    try {
        console.log('CSVファイルの読み込みを開始...');
        
        const response = await fetch('data.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSVファイルの内容（最初の200文字）:', csvText.substring(0, 200) + '...');
        
        // CSVをパース
        festivalData = parseCSV(csvText);
        console.log('パースされたデータ:', festivalData);
        console.log('データの行数:', festivalData.length);
        
        // サイドバーのクラス一覧を更新
        updateSidebarClasses();
        
        // ページタイプに応じて処理
        if (isClassPage()) {
            const className = getClassNameFromURL();
            if (className) {
                displayClassSchedule(className);
            }
        } else {
            displayMainPage();
        }
        
        // サイドバーのクラス一覧を更新
        updateSidebarClasses();
        
    } catch (error) {
        console.error('CSVファイルの読み込みに失敗しました:', error);
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

// クラスページかどうかを判定
function isClassPage() {
    return window.location.pathname.includes('.html') && !window.location.pathname.endsWith('index.html');
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

// クラスページのスケジュールを表示
function displayClassSchedule(className) {
    console.log(`${className}のスケジュールを表示中...`);
    
    // ヘッダーを更新
    updateScheduleHeader(className);
    
    // クラスのデータを取得
    const classData = festivalData.filter(row => row.class === className);
    if (classData.length === 0) {
        showError(`${className}のデータが見つかりません`);
        return;
    }
    
    // スケジュールテーブルを生成
    generateScheduleTables(classData);
    
    // モーダルを生成
    generateModals(classData);
}

// スケジュールヘッダーを更新
function updateScheduleHeader(className) {
    const titleElement = document.getElementById('schedule-title');
    const descElement = document.getElementById('schedule-description');
    
    if (titleElement) {
        titleElement.textContent = `${className} 上演スケジュール`;
    }
    
    if (descElement) {
        // CSVからクラスの公演名を取得
        const classData = festivalData.filter(row => row.class === className);
        if (classData.length > 0) {
            // 最初の公演の公演名を説明として使用
            descElement.textContent = classData[0].play_title || '演劇公演';
        } else {
            descElement.textContent = '演劇公演';
        }
    }
}

// スケジュールテーブルを生成
function generateScheduleTables(classData) {
    const container = document.getElementById('schedule-tables');
    if (!container) {
        console.error('schedule-tables要素が見つかりません');
        return;
    }
    
    // 1日目と2日目のデータを分離
    const day1Data = classData.filter(row => row.day === '1日目');
    const day2Data = classData.filter(row => row.day === '2日目');
    
    // HTMLを生成
    let html = '';
    
    // 1日目のテーブル
    if (day1Data.length > 0) {
        html += generateDayTableHTML('1日目', day1Data);
    }
    
    // 2日目のテーブル
    if (day2Data.length > 0) {
        html += generateDayTableHTML('2日目', day2Data);
    }
    
    // コンテナに挿入
    container.innerHTML = html;
    
    console.log('スケジュールテーブルの生成完了');
}

// 日別テーブルのHTMLを生成
function generateDayTableHTML(day, dayData) {
    return `
        <div class="schedule-day">
            <h2><i class="fas fa-calendar-day"></i> ${day}</h2>
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>時間</th>
                        <th>演目</th>
                        <th>役者数</th>
                        <th>詳細</th>
                    </tr>
                </thead>
                <tbody>
                    ${dayData.map((row, index) => {
                        const castCount = row.cast.split(',').filter(cast => cast.trim().length > 0).length;
                        const staffCount = row.staff.split(',').filter(staff => staff.trim().length > 0).length;
                        
                        // ユニークなモーダルIDを生成（日付と時間を組み合わせ）
                        const modalId = `modal-${day}-${row.time.replace(':', '-')}`;
                        
                        return `
                            <tr>
                                <td class="time-cell">${row.time}</td>
                                <td class="title-cell">${row.title}</td>
                                <td class="cast-count-cell">
                                    <span class="cast-number">${castCount}名</span>
                                    <span class="staff-number">+${staffCount}名</span>
                                </td>
                                <td>
                                    <button class="cast-btn" data-modal="${modalId}">
                                        詳細を見る
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// モーダルを生成
function generateModals(classData) {
    // 既存のモーダルを削除
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => modal.remove());
    
    console.log('モーダル生成開始:', classData.length, '件のデータ');
    
    // 新しいモーダルを生成
    classData.forEach((row) => {
        const day = row.day;
        // ユニークなモーダルIDを生成（日付と時間を組み合わせ）
        const modalId = `modal-${day}-${row.time.replace(':', '-')}`;
        
        console.log(`モーダル生成中: ${modalId} (${day} ${row.time})`);
        
        // CSVから役者とスタッフの情報を取得
        const castList = row.cast.split(',').map(cast => cast.trim()).filter(cast => cast.length > 0);
        const staffList = row.staff.split(',').map(staff => staff.trim()).filter(staff => staff.length > 0);
        
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close" data-modal="${modalId}">
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
        console.log(`モーダル ${modalId} を生成しました`);
    });
    
    // 生成されたモーダルの確認
    const allModals = document.querySelectorAll('.modal');
    console.log('生成されたモーダル数:', allModals.length);
    allModals.forEach(modal => {
        console.log('モーダルID:', modal.id);
    });
    
    console.log('モーダルの生成完了');
}

// メインページを表示
function displayMainPage() {
    console.log('メインページを表示中...');
    
    // 統計情報を更新
    updateHeroStats();
    
    // クラスカードを生成
    generateClassCards();
}

// ヒーローセクションの統計情報を更新
function updateHeroStats() {
    const heroStats = document.getElementById('hero-stats');
    if (!heroStats) return;
    
    // CSVから統計情報を計算
    const uniqueClasses = [...new Set(festivalData.map(row => row.class))];
    const totalPerformances = festivalData.length;
    const totalCast = festivalData.reduce((total, row) => {
        const castCount = row.cast.split(',').filter(cast => cast.trim().length > 0).length;
        return total + castCount;
    }, 0);
    
    heroStats.innerHTML = `
        <div class="stat">
            <span class="stat-number">${uniqueClasses.length}</span>
            <span class="stat-label">クラス</span>
        </div>
        <div class="stat">
            <span class="stat-number">${totalPerformances}</span>
            <span class="stat-label">公演</span>
        </div>
        <div class="stat">
            <span class="stat-number">${totalCast}</span>
            <span class="stat-label">役者</span>
        </div>
    `;
    
    console.log('統計情報を更新しました');
}

// クラスカードを生成
function generateClassCards() {
    const classesGrid = document.getElementById('classes-grid');
    if (!classesGrid) return;
    
    // CSVからユニークなクラスを取得
    const uniqueClasses = [...new Set(festivalData.map(row => row.class))].sort();
    
    classesGrid.innerHTML = '';
    
    uniqueClasses.forEach(className => {
        const classData = festivalData.filter(row => row.class === className);
        const performances = classData.length;
        
        // 最初の公演の公演名を取得
        const firstPerformance = classData[0];
        const performanceTitle = firstPerformance ? firstPerformance.play_title : '演劇公演';
        
        const card = document.createElement('a');
        card.href = `${className.replace('組', '')}.html`;
        card.className = 'class-card';
        
        card.innerHTML = `
            <div class="class-card-header">
                <i class="fas fa-users"></i>
                <h4>${className}</h4>
            </div>
            <div class="class-card-content">
                <p>${performanceTitle}</p>
                <div class="schedule-info">
                    <span class="schedule-badge">${performances}公演</span>
                </div>
            </div>
        `;
        
        classesGrid.appendChild(card);
    });
    
    console.log('クラスカードを生成しました');
}

// サイドバーのクラス一覧を更新
function updateSidebarClasses() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) return;
    
    // 既存のクラスリンクをクリア（ホーム以外）
    const existingLinks = sidebarNav.querySelectorAll('.sidebar-item:not(:first-child)');
    existingLinks.forEach(link => link.remove());
    
    // CSVからユニークなクラスを取得
    const uniqueClasses = [...new Set(festivalData.map(row => row.class))].sort();
    
    // 各クラスのリンクを生成
    uniqueClasses.forEach(className => {
        const classNumber = className.replace('組', '');
        const link = document.createElement('a');
        link.href = `${classNumber}.html`;
        link.className = 'sidebar-item';
        link.innerHTML = `
            <i class="fas fa-users"></i>
            <span>${className}</span>
        `;
        
        sidebarNav.appendChild(link);
    });
    
    console.log('サイドバーのクラス一覧を更新しました');
}

// サイドバーを開く
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// サイドバーを閉じる
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// サイドバーハンドラーを設定
function setupSidebarHandlers() {
    // サイドバー内のリンククリック時にサイドバーを閉じる
    document.addEventListener('click', (e) => {
        if (e.target.closest('.sidebar-item')) {
            closeSidebar();
        }
    });
}

// モーダルハンドラーを設定
function setupModalHandlers() {
    // モーダルを開く
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('cast-btn')) {
            const modalId = e.target.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
                // アニメーションのために少し遅延
                setTimeout(() => {
                    modal.classList.add('show');
                }, 10);
                document.body.style.overflow = 'hidden';
                console.log(`モーダル ${modalId} を開きました`);
            } else {
                console.error(`モーダル ${modalId} が見つかりません`);
            }
        }
        
        // モーダルを閉じる（×ボタン）
        if (e.target.classList.contains('close') || e.target.closest('.close')) {
            const closeButton = e.target.classList.contains('close') ? e.target : e.target.closest('.close');
            const modalId = closeButton.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
                // アニメーション完了後に非表示
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }, 300);
                console.log(`モーダル ${modalId} を閉じました`);
            } else {
                console.error(`モーダル ${modalId} が見つかりません`);
            }
        }
    });
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove('show');
                // アニメーション完了後に非表示
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }, 300);
                console.log(`モーダル外クリックでモーダルを閉じました`);
            }
        });
    });
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.classList.remove('show');
                    // アニメーション完了後に非表示
                    setTimeout(() => {
                        modal.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    }, 300);
                    console.log('ESCキーでモーダルを閉じました');
                }
            });
        }
    });
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

// カウントダウン機能
function startCountdown() {
    // 演劇祭の開始日時を設定（日本時間 2025年9月20日 9:15）
    const festivalDate = new Date('2025-09-20T09:15:00+09:00');
    
    function updateCountdown() {
        // 現在の日本時間を取得
        const now = new Date();
        const jstOffset = 9 * 60; // 日本時間のオフセット（分）
        const localOffset = now.getTimezoneOffset(); // ローカル時間のオフセット（分）
        const totalOffset = (jstOffset + localOffset) * 60 * 1000; // ミリ秒に変換
        
        const nowJST = new Date(now.getTime() + totalOffset);
        const timeLeft = festivalDate - nowJST;
        
        if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            // カウントダウン要素を更新
            const daysElement = document.getElementById('countdown-days');
            const hoursElement = document.getElementById('countdown-hours');
            const minutesElement = document.getElementById('countdown-minutes');
            const secondsElement = document.getElementById('countdown-seconds');
            
            if (daysElement) daysElement.textContent = days;
            if (hoursElement) hoursElement.textContent = hours;
            if (minutesElement) minutesElement.textContent = minutes;
            if (secondsElement) secondsElement.textContent = seconds;
        } else {
            // 演劇祭が開始された場合
            const countdownSection = document.getElementById('countdown-section');
            if (countdownSection) {
                countdownSection.innerHTML = '<div class="festival-started">演劇祭開催中！</div>';
            }
        }
    }
    
    // 初回更新
    updateCountdown();
    
    // 1秒ごとに更新
    setInterval(updateCountdown, 1000);
}