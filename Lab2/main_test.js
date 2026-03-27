const test = require('node:test');
const assert = require('assert');
const { Application, MailSystem } = require('./main');

// TODO: write your tests here
// Remember to use Stub, Mock, and Spy when necessary
const fs = require('fs');

test('Lab2 100% Coverage Ultimate Solution', async (t) => {
    // 1. 建立環境：使用極簡名單確保索引計算精確 (Stub)
    const fileName = 'name_list.txt';
    fs.writeFileSync(fileName, 'A\nB\nC');

    const ms = new MailSystem();
    const app = new Application();

    // 2. 充足的等待：確保非同步初始化 100% 完成
    await new Promise(resolve => setTimeout(resolve, 200));

    await t.test('MailSystem functionality and branch coverage', (t) => {
        const mockRandom = t.mock.method(Math, 'random');
        
        // 分支 1: 成功 (> 0.5)
        mockRandom.mock.mockImplementation(() => 0.6);
        assert.strictEqual(ms.send('A', 'Context'), true);

        // 分支 2: 失敗 (<= 0.5) - 覆蓋 "mail failed" 區塊
        mockRandom.mock.mockImplementation(() => 0.4);
        assert.strictEqual(ms.send('A', 'Context'), false);
        
        assert.strictEqual(ms.write('A'), 'Congrats, A!');
    });

    await t.test('Application coverage including collision loop (Lines 57-58)', (t) => {
        const mockRandom = t.mock.method(Math, 'random');
        
        // 設計一個精確的隨機數序列：
        // 1. 第一抽：0.1 -> floor(0.1*3) = 0 ('A')
        // 2. 第二抽(衝突)：0.1 -> 'A' (已選過，進入 while)，接著 0.4 -> floor(0.4*3) = 1 ('B')，離開 while
        // 3. 第三抽：0.9 -> floor(0.9*3) = 2 ('C')
        // 4. 第四抽：觸發 all selected 分支
        
        const sequence = [0.1, 0.1, 0.4, 0.9];
        let callCount = 0;
        mockRandom.mock.mockImplementation(() => sequence[callCount++]);

        // 執行第一抽
        assert.strictEqual(app.selectNextPerson(), 'A');

        // 執行第二抽（內含一次衝突，會跑過 57-58 行）
        assert.strictEqual(app.selectNextPerson(), 'B');
        
        // 執行第三抽
        assert.strictEqual(app.selectNextPerson(), 'C');

        // 執行第四抽（應進入 if (length === length) 分支）
        assert.strictEqual(app.selectNextPerson(), null);
    });

    await t.test('Application: notifySelected Spy and remaining calls', (t) => {
        // 使用 Spy 驗證物件間的互動
        const writeSpy = t.mock.method(app.mailSystem, 'write');
        const sendSpy = t.mock.method(app.mailSystem, 'send');
        
        // 此時 app.selected 已經有 ['A', 'B', 'C']
        app.notifySelected();

        assert.strictEqual(writeSpy.mock.callCount(), 3);
        assert.strictEqual(sendSpy.mock.callCount(), 3);

        // 覆蓋 getRandomPerson 剩餘基礎邏輯
        const mockRandom = t.mock.method(Math, 'random');
        mockRandom.mock.mockImplementation(() => 0.1);
        assert.strictEqual(app.getRandomPerson(), 'A');
    });

    // 清理產生的檔案
    if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
});
