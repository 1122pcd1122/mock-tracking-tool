// AI-Generated Begin 1780588259
// API 工具 - 与本地 Python 服务器通信
const API_BASE = 'http://localhost:8765';
const REQUEST_TIMEOUT = 10000;  // 10秒超时

const Api = {
  async request(method, url, data) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      const opts = { method, headers: { 'Content-Type': 'application/json' }, signal: controller.signal };
      if (data) opts.body = JSON.stringify(data);
      const res = await fetch(API_BASE + url, opts);
      clearTimeout(timeoutId);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { error: `HTTP ${res.status}: ${res.statusText}${text ? ' - ' + text.substring(0, 200) : ''}` };
      }
      return await res.json();
    } catch (e) {
      if (e.name === 'AbortError') {
        console.error('[API] 请求超时:', url);
        return { error: '请求超时（' + (REQUEST_TIMEOUT / 1000) + '秒）' };
      }
      console.error('[API] Error:', e);
      return { error: e.message };
    }
  },
  // 获取所有 mock 文件
  getMocks() { return this.request('GET', '/api/mocks'); },
  // 读取单个 mock 文件内容
  readMock(path) { return this.request('POST', '/api/read-mock', { path }); },
  // 保存单个 mock 文件
  saveMock(filepath, content) { return this.request('POST', '/api/save-mock', { path: filepath, content }); },
  // 移动 mock 文件（更换分类）
  moveMock(oldPath, newPath) { return this.request('POST', '/api/move-mock', { oldPath, newPath }); },
  // 创建分类
  createCategory(name) { return this.request('POST', '/api/create-category', { name }); },
  // 重命名分类
  renameCategory(oldName, newName) { return this.request('POST', '/api/rename-category', { oldName, newName }); },
  // 批量保存
  saveMocksBatch(items) { return this.request('POST', '/api/save-mocks-batch', { items }); },
  // 一键映射到 Fiddler
  applyFiddler(script) { return this.request('POST', '/api/apply-fiddler', { script }); },
  // 删除 mock 文件
  deleteMock(path) { return this.request('POST', '/api/delete-mock', { path }); },
  // 删除分类（仅空目录）
  deleteCategory(name) { return this.request('POST', '/api/category/delete', { name }); },
  // 埋点历史记录
  saveTrackingHistory(records, raw, format) { return this.request('POST', '/api/tracking-history/save', { records, raw, format }); },
  listTrackingHistory() { return this.request('GET', '/api/tracking-history/list'); },
  getTrackingHistory(id) { return this.request('POST', '/api/tracking-history/get', { id }); },
  deleteTrackingHistory(id) { return this.request('POST', '/api/tracking-history/delete', { id }); },
  clearTrackingHistory() { return this.request('POST', '/api/tracking-history/clear', {}); },
  // 检查埋点数据是否已存在于历史记录
  checkTrackingDuplicate(raw) { return this.request('POST', '/api/tracking-history/check-duplicate', { raw }); }
};
window.Api = Api;
// AI-Generated End 1780588259
