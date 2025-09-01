// グローバル変数
let festivalData = [];

// クラスタイトル
const classTitles = {
    '1組': '話が違う！',
    '2組': 'ある脱出ゲーム',
    '3組': 'ポプコーンの降る街',
    '4組': '庭園の何処かに潜伏していると仮定される盗賊の行方に関する一考察 ～羽柴邸に於ける旧ロマノフ家のダイヤ盗難事件を基に～',
    '5組': 'チェンジ・ザ・ワールド',
    '6組': '七人の部長',
    '7組': 'サマータイムマシンブルース',
    '8組': 'Memento ～忘却の夏'
};

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== ページ読み込み開始 ===');
    
    // CSVファイルを読み込む
    loadCSVData();
    
    // モーダル機能を設定
    setupModalHandlers();
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
        
        // ページタイプに応じて処理
        if (isClassPage()) {
            const className = getClassNameFromURL();
            if (className) {
                displayClassSchedule(className);
            }
        } else {
            displayMainPage();
        }
        
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
        descElement.textContent = classTitles[className] || '演劇公演';
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
                        
                        return `
                            <tr>
                                <td class="time-cell">${row.time}</td>
                                <td class="title-cell">${row.title}</td>
                                <td class="cast-count-cell">
                                    <span class="cast-number">${castCount}名</span>
                                    <span class="staff-number">+${staffCount}名</span>
                                </td>
                                <td>
                                    <button class="cast-btn" data-modal="modal-${day}-${index + 1}">
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
    
    // 新しいモーダルを生成
    classData.forEach((row, index) => {
        const day = row.day;
        const modalId = `modal-${day}-${index + 1}`;
        
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
    });
    
    console.log('モーダルの生成完了');
}

// メインページを表示
function displayMainPage() {
    console.log('メインページを表示中...');
    // メインページの処理（必要に応じて実装）
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
                document.body.style.overflow = 'hidden';
            }
        }
        
        // モーダルを閉じる
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