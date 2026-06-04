// AI-Generated Begin 1780597577
// Mock 管理器 - 单条映射到 Fiddler CustomRules.js
let _mockIdCounter = 0;
function _genMockId() { return 'mock_' + Date.now() + '_' + (++_mockIdCounter); }

const MockManager = {
  name: 'MockManager',
  template: `
<div class="container">
  <!-- 服务器状态 -->
  <div class="server-status" :class="{ online: connected, offline: !connected }">
    <span class="status-dot"></span>
    {{ connected ? '已连接服务器' : '服务器未连接 - 请运行 python server.py' }}
  </div>

  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">Mock 数据管理</span>
      <div class="btn-group">
        <button class="btn btn-sm" @click="refresh">刷新列表</button>
        <button class="btn btn-sm" @click="selectFiles">导入文件</button>
        <button class="btn btn-primary btn-sm" @click="addMock">+ 新增 Mock</button>
      </div>
    </div>
    
    <!-- 分类筛选 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">分类：</label>
        <select class="filter-select" v-model="selectedCategory" @change="filterByCategory">
          <option value="">全部分类（{{ mocks.length }}）</option>
          <option v-for="cat in categories" :key="cat.name" :value="cat.name">{{ cat.name }}（{{ cat.count }}）</option>
        </select>
        <button class="btn btn-sm" @click="showCategoryManager = true" title="管理分类">管理</button>
      </div>
    </div>
    
    <div class="search-bar">
      <input class="input" v-model="q" placeholder="搜索名称或 URL...">
    </div>
    <div v-if="filtered.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <div class="empty-text">暂无 Mock 数据。确认已启动 python server.py，点击"刷新列表"</div>
    </div>
    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width:46px">启用</th>
            <th>名称</th>
            <th>URL 匹配</th>
            <th style="width:200px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in filtered" :key="m.id" :class="{ 'row-disabled': !m.enabled }">
            <td><div class="toggle" :class="{active:m.enabled}" @click="m.enabled=!m.enabled"></div></td>
            <td>{{ m.name }}</td>
            <td class="url-cell">{{ m.urlPattern }}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-sm" @click="edit(m)">编辑</button>
                <button class="btn btn-danger btn-sm" @click="del(m)">删除</button>
                <button class="btn btn-sm mapping-btn" 
                        :class="getBtnClass(m)" 
                        @click="applySingle(m)" 
                        :disabled="!m.enabled || m.isApplying">
                  <span>{{ getBtnText(m) }}</span>
                  <span class="status-dot" :class="getStatusClass(m)"></span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- 编辑弹窗 -->
  <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
    <div class="modal modal-lg">
      <div class="modal-header">
        <span class="modal-title">{{ editingFile || '新增 Mock' }}</span>
        <button class="modal-close" @click="closeForm">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-row" v-if="!editingFile">
          <div class="form-group"><label class="form-label">文件名</label><input class="input" v-model="newFileName" placeholder="my_mock.txt"></div>
        </div>
        
        <!-- 分类选择 -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">分类</label>
            <div class="category-selector">
              <select class="input" v-model="f.category" :disabled="editingFile === undefined">
                <option value="" disabled>选择分类</option>
                <option v-for="cat in categories" :key="cat.name" :value="cat.name">{{ cat.name }}</option>
              </select>
              <button class="btn btn-sm" @click="showCategoryManager = true" title="管理分类">管理</button>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">FiddlerScript 内容</label>
            <textarea class="textarea" v-model="f.content" style="min-height:350px;font-family:monospace;font-size:11px;" placeholder="粘贴 FiddlerScript 代码..."></textarea>
          </div>
        </div>
        <div class="btn-group" style="justify-content:flex-end;margin-top:12px;">
          <button class="btn" @click="closeForm">取消</button>
          <button class="btn btn-primary" @click="saveMock" :disabled="!connected">保存到文件</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 分类管理弹窗 -->
  <div v-if="showCategoryManager" class="modal-overlay" @click.self="showCategoryManager = false">
    <div class="modal" style="width:520px;">
      <div class="modal-header">
        <span class="modal-title">分类管理</span>
        <button class="modal-close" @click="showCategoryManager = false">&times;</button>
      </div>
      <div class="modal-body">
        <p class="form-label">所有分类以 mocks/ 文件夹结构为准，增删改即时生效。</p>
        <table style="width:100%;margin:8px 0;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid #e0e0e0;">
              <th style="text-align:left;padding:6px 8px;">分类名</th>
              <th style="text-align:center;padding:6px 8px;width:60px;">文件数</th>
              <th style="text-align:center;padding:6px 8px;width:120px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.name" style="border-bottom:1px solid #f0f0f0;">
              <td style="padding:6px 8px;">{{ cat.name }}</td>
              <td style="text-align:center;padding:6px 8px;">{{ cat.count }}</td>
              <td style="text-align:center;padding:6px 8px;">
                <a href="#" @click.prevent="startRenameCat(cat)" style="margin-right:8px;color:#1976d2;">重命名</a>
                <a href="#" @click.prevent="deleteCategoryConfirm(cat)" 
                   :style="{ color: cat.count > 0 ? '#ccc' : '#e53935', cursor: cat.count > 0 ? 'not-allowed' : 'pointer' }"
                   :title="cat.count > 0 ? '请先删除或移出所有文件' : '删除空分类'">删除</a>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- 新建分类 -->
        <div v-if="showCatCreate" style="display:flex;gap:8px;margin:8px 0;">
          <input class="input" v-model="newCategoryName" placeholder="新分类名称" style="flex:1;">
          <button class="btn btn-primary btn-sm" @click="createNewCategory">创建</button>
          <button class="btn btn-sm" @click="showCatCreate = false; newCategoryName = ''">取消</button>
        </div>
        <div v-else style="margin:8px 0;">
          <a href="#" @click.prevent="showCatCreate = true" style="color:#1976d2;">+ 新建分类</a>
        </div>
        <!-- 重命名 -->
        <div v-if="showCatRename" style="display:flex;gap:8px;margin:8px 0;">
          <span style="line-height:32px;">{{ renamingCatName }} →</span>
          <input class="input" v-model="renameCategoryName" placeholder="新名称" style="flex:1;">
          <button class="btn btn-primary btn-sm" @click="confirmRenameCategory">确认</button>
          <button class="btn btn-sm" @click="showCatRename = false">取消</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 导入分类选择弹窗 -->
  <div v-if="showImportCategory" class="modal-overlay" @click.self="showImportCategory = false">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">导入到分类</span>
        <button class="modal-close" @click="showImportCategory = false; pendingImportFiles = null">&times;</button>
      </div>
      <div class="modal-body">
        <p class="form-label">已选择 {{ (pendingImportFiles || []).length }} 个文件，选择目标分类：</p>
        <div class="form-group">
          <select class="input" v-model="importCategory">
            <option v-for="cat in categories" :key="cat.name" :value="cat.name">{{ cat.name }}</option>
          </select>
        </div>
        <div class="btn-group" style="justify-content:flex-end;margin-top:12px;">
          <button class="btn" @click="showImportCategory = false; pendingImportFiles = null">取消</button>
          <button class="btn btn-primary" @click="confirmImport">确认导入</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 映射结果面板 -->
  <div v-if="applyResult && applyResult.show" class="panel" :class="{ 'apply-success': applyResult.status === 'success', 'apply-fail': applyResult.status === 'error', 'apply-cancel': applyResult.status === 'cancel' }">
    <div class="panel-header">
      <span class="panel-title">
        <span v-if="applyResult.status === 'success'">✓ 映射成功</span>
        <span v-else-if="applyResult.status === 'cancel'">⊗ 已取消映射</span>
        <span v-else>✗ 映射失败</span>
      </span>
      <button class="btn btn-sm" @click="closeApplyResult">关闭</button>
    </div>
    <div class="apply-detail">
      <div class="detail-row">
        <span class="detail-label">Mock 名称：</span>
        <span class="detail-value">{{ applyResult.name || '' }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">映射路径：</span>
        <span class="detail-value code">{{ applyResult.target || '' }}</span>
      </div>
      <div class="detail-row" v-if="applyResult.status === 'error'">
        <span class="detail-label">失败原因：</span>
        <span class="detail-value error">{{ applyResult.error || '' }}</span>
      </div>
      <div class="detail-row" v-if="applyResult.status === 'cancel'">
        <span class="detail-label">详情：</span>
        <span class="detail-value">{{ applyResult.error || '' }}</span>
      </div>
    </div>
  </div>
  
  <input type="file" ref="fileIn" accept=".txt,.js" multiple style="display:none" @change="onImport">
</div>`,
  data() {
    return {
      mocks: [], q: '', _debouncedQ: '', connected: false,
      mockBaseDir: '',  // 从服务端 baseDir 获取
      showForm: false, editingFile: null,
      f: { content: '', category: '' }, newFileName: '',
      applyResult: {
        show: false,
        status: '',  // 'success' | 'error' | 'cancel'
        name: '',
        target: '',
        error: ''
      },
      currentMappingId: null,
      selectedCategory: '',
      categories: [],
      showCategoryManager: false,
      showCatCreate: false,
      showCatRename: false,
      newCategoryName: '',
      renameCategoryName: '',
      renamingCatName: '',
      renamingCatOld: '',
      importCategory: '未分类',
      showImportCategory: false,
      pendingImportFiles: null
    };
  },
  computed: {
    filtered() {
      let result = this.mocks;
      
      if (this.selectedCategory) {
        result = result.filter(m => m.category === this.selectedCategory);
      }
      
      if (this._debouncedQ) {
        const q = this._debouncedQ.toLowerCase();
        result = result.filter(m => 
          m.name.toLowerCase().includes(q) || 
          m.urlPattern.toLowerCase().includes(q)
        );
      }
      
      return result;
    },
    enabledMocks() {
      return this.mocks.filter(m => m.enabled);
    }
  },
  watch: {
    q() {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => { this._debouncedQ = this.q; }, 300);
    }
  },
  async mounted() {
    this.checkServer();
    this._serverCheckInterval = setInterval(() => this.checkServer(), 30000);
    await this.refresh();
  },
  beforeUnmount() {
    clearInterval(this._serverCheckInterval);
    clearTimeout(this._searchTimer);
  },
  methods: {
    // 提取 mocks 基础路径
    getMockPath(category, name) {
      if (this.mockBaseDir) {
        return `${this.mockBaseDir}\\${category}\\${name}`;
      }
      // fallback：从已有文件推断
      const m = this.mocks.find(x => x.filePath && x.filePath.includes('\\mocks\\'));
      if (m) {
        this.mockBaseDir = m.filePath.substring(0, m.filePath.indexOf('\\mocks\\') + 6);
        return `${this.mockBaseDir}\\${category}\\${name}`;
      }
      return `mocks\\${category}\\${name}`;
    },

    // 检查服务器连接
    async checkServer() {
      try {
        const res = await fetch('http://localhost:8765/api/mocks');
        this.connected = res.ok;
      } catch (e) {
        this.connected = false;
      }
    },

    // 刷新 mock 文件列表
    async refresh() {
      const data = await Api.getMocks();
      if (data.error) { this.connected = false; return; }
      this.connected = true;
      if (data.baseDir) this.mockBaseDir = data.baseDir;
      console.log('[MockManager] 刷新列表，服务端返回', data.count || 0, '个文件');
      
      // 保留已有的内容、启用状态、映射状态
      const oldMap = new Map(this.mocks.map(m => [m.filePath, m]));
      this.mocks = (data.files || []).map(f => {
        const old = oldMap.get(f.path);
        return {
          id: old ? old.id : _genMockId(),
          name: f.name.replace('.txt', '').replace('.js', ''),
          urlPattern: old ? old.urlPattern : '',
          filePath: f.path,
          fileName: f.name,
          content: old ? old.content : '',
          category: f.category || '未分类',
          enabled: old ? old.enabled : true,
          lastApplied: old ? old.lastApplied : false,
          rules: old ? old.rules : [{ pattern: '', replacement: '' }],
          rawScript: old ? old.rawScript : ''
        };
      });
      
      // 更新分类列表
      if (data.categories && data.categories.length) {
        this.categories = [...data.categories];
      } else {
        this.categories = [];
      }
      
      // 异步加载内容，不阻塞显示
      this.loadMockContents(data.files);
    },

    // 异步加载 Mock 内容（带并发限制）
    async loadMockContents(files) {
      const BATCH_SIZE = 3; // 每次只加载 3 个文件
      const TIMEOUT = 3000; // 每个文件最多 3 秒
      
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (f) => {
          try {
            const contentData = await Promise.race([
              Api.readMock(f.path),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('超时')), TIMEOUT)
              )
            ]);
            const mock = this.mocks.find(m => m.filePath === f.path);
            if (mock) {
              mock.content = contentData.content || '';
              const parsed = MockParser.parse(mock.content);
              if (parsed.length > 0) {
                mock.urlPattern = parsed[0].urlPattern;
                mock.rules = parsed[0].rules;
                mock.rawScript = parsed[0].rawScript;
              }
            }
          } catch (e) {
            // 静默失败，不影响其他文件
          }
        });
        await Promise.all(promises);
      }
    },

    // 轻量刷新 - 只更新列表元数据（名称、分类），不加载文件内容
    async refreshMeta() {
      const data = await Api.getMocks();
      if (data.error) { this.connected = false; return; }
      this.connected = true;
      if (data.baseDir) this.mockBaseDir = data.baseDir;
      
      const oldMap = new Map(this.mocks.map(m => [m.filePath, m]));
      this.mocks = (data.files || []).map(f => {
        const old = oldMap.get(f.path);
        return {
          id: old ? old.id : _genMockId(),
          name: f.name.replace('.txt', '').replace('.js', ''),
          urlPattern: old ? old.urlPattern : '',
          filePath: f.path,
          fileName: f.name,
          content: old ? old.content : '',
          category: f.category || '未分类',
          enabled: old ? old.enabled : true,
          lastApplied: old ? old.lastApplied : false,
          rules: old ? old.rules : [{ pattern: '', replacement: '' }],
          rawScript: old ? old.rawScript : ''
        };
      });
      
      this.updateCategories();
    },

    // 更新分类列表（从现有 mocks 中提取，用于非全量刷新的场景）
    updateCategories() {
      const catMap = new Map();
      this.mocks.forEach(m => {
        const name = m.category || '未分类';
        catMap.set(name, (catMap.get(name) || 0) + 1);
      });
      this.categories = Array.from(catMap, ([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    },

    // 分类筛选已在 computed.filtered 中处理，此处仅用于 @change 绑定
    filterByCategory() {},

    // ====== 分类管理 ======
    startRenameCat(cat) {
      this.showCatRename = true;
      this.renamingCatName = cat.name;
      this.renamingCatOld = cat.name;
      this.renameCategoryName = cat.name;
    },

    // 创建新分类
    async createNewCategory() {
      const name = (this.newCategoryName || '').trim();
      if (!name) return;
      const result = await Api.createCategory(name);
      if (result.ok) {
        this.newCategoryName = '';
        this.showCatCreate = false;
        const cats = [...this.categories];
        if (!cats.find(c => c.name === name)) {
          cats.push({ name, count: 0 });
          this.categories = cats.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        }
      } else {
        alert('创建分类失败：' + (result.error || '未知错误'));
      }
    },

    // 重命名分类
    async confirmRenameCategory() {
      const newName = (this.renameCategoryName || '').trim();
      if (!newName || newName === this.renamingCatOld) {
        this.showCatRename = false;
        return;
      }
      const result = await Api.renameCategory(this.renamingCatOld, newName);
      if (result.ok) {
        const cats = [...this.categories];
        const idx = cats.findIndex(c => c.name === this.renamingCatOld);
        if (idx !== -1) {
          cats[idx] = { ...cats[idx], name: newName };
          this.categories = cats.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        }
        // 更新 mocks 中的路径
        const base = this.mockBaseDir;
        if (base) {
          const oldDir = `${base}\\${this.renamingCatOld}\\`;
          const newDir = `${base}\\${newName}\\`;
          this.mocks.forEach(m => {
            if (m.filePath.startsWith(oldDir)) {
              m.filePath = m.filePath.replace(oldDir, newDir);
              m.category = newName;
            }
          });
        }
        this.showCatRename = false;
        this.renamingCatOld = '';
        this.renamingCatName = '';
        this.renameCategoryName = '';
      } else {
        alert('重命名分类失败：' + (result.error || '未知错误'));
      }
    },

    async deleteCategoryConfirm(cat) {
      if (cat.count > 0) {
        alert(`"${cat.name}" 目录不为空（${cat.count} 个文件），请先删除或移出所有文件。`);
        return;
      }
      if (!confirm(`确定删除空分类"${cat.name}"？`)) return;
      const result = await Api.deleteCategory(cat.name);
      if (result.ok) {
        this.categories = this.categories.filter(c => c.name !== cat.name);
        if (this.importCategory === cat.name) this.importCategory = '未分类';
      } else {
        alert('删除分类失败：' + (result.error || '未知错误'));
      }
    },

    edit(m) {
      this.editingFile = m.filePath;
      this.f.content = m.content || '';
      this.f.category = m.category || '';
      this.showForm = true;
    },

    async saveMock() {
      const wasEditing = !!this.editingFile;
      const oldPath = this.editingFile;
      
      if (wasEditing) {
        const newCategory = this.f.category || '未分类';
        const fileName = oldPath.split('\\').pop();
        const newPath = this.getMockPath(newCategory, fileName);
        
        if (newPath !== oldPath) {
          const moveResult = await Api.moveMock(oldPath, newPath);
          if (!moveResult.ok) {
            alert('移动文件失败：' + moveResult.error);
            return;
          }
          this.editingFile = newPath;
        }
        
        await Api.saveMock(this.editingFile, this.f.content);
      } else {
        if (!this.newFileName) return;
        const category = this.f.category || '未分类';
        const path = this.getMockPath(category, this.newFileName);
        await Api.saveMock(path, this.f.content);
      }
      
      this.closeForm();
      
      // 局部更新 mock 列表，不重新拉取全部数据
      if (wasEditing) {
        const mock = this.mocks.find(m => m.filePath === oldPath);
        if (mock) {
          mock.filePath = this.editingFile || oldPath;
          mock.category = this.f.category || '未分类';
          mock.content = this.f.content;
          const parsed = MockParser.parse(mock.content);
          if (parsed.length > 0) {
            mock.urlPattern = parsed[0].urlPattern;
            mock.rules = parsed[0].rules;
            mock.rawScript = parsed[0].rawScript;
          }
        }
      } else {
        const category = this.f.category || '未分类';
        const path = this.getMockPath(category, this.newFileName);
        const newMock = {
          id: _genMockId(),
          name: this.newFileName.replace('.txt', '').replace('.js', ''),
          urlPattern: '',
          filePath: path,
          fileName: this.newFileName,
          content: this.f.content,
          category: category,
          enabled: true,
          lastApplied: false,
          rules: [{ pattern: '', replacement: '' }],
          rawScript: ''
        };
        const parsed = MockParser.parse(this.f.content);
        if (parsed.length > 0) {
          newMock.urlPattern = parsed[0].urlPattern;
          newMock.rules = parsed[0].rules;
          newMock.rawScript = parsed[0].rawScript;
        }
        this.mocks.push(newMock);
      }
      
      this.updateCategories();
    },

    async del(m) {
      if (!confirm(`确定删除"${m.name}"？此操作不可撤销。`)) return;
      await Api.deleteMock(m.filePath);
      this.mocks = this.mocks.filter(x => x.id !== m.id);
      this.updateCategories();
    },

    addMock() {
      this.editingFile = null;
      this.newFileName = 'new_mock.txt';
      this.f.content = '';
      this.showForm = true;
    },

    closeForm() { this.showForm = false; this.editingFile = null; },

    // 获取按钮样式
    getBtnClass(m) {
      if (m.isApplying) return 'btn-warning';
      if (m.lastApplied) return 'btn-success';
      return 'btn-primary';
    },

    // 获取按钮文字
    getBtnText(m) {
      if (m.isApplying) return '正在映射...';
      if (m.lastApplied) return '✓ 已映射';
      return '映射此条';
    },

    // 获取状态点样式
    getStatusClass(m) {
      if (m.isApplying) return 'applying';
      if (m.lastApplied) return 'applied';
      return 'pending';
    },

    // 单条映射
    async applySingle(m) {
      // 如果点击的是已经映射的，取消映射 — 从 CustomRules.js 中移除 if-block
      if (m.lastApplied && !m.isApplying) {
        m.isApplying = true;
        try {
          const currentScript = await this.readFiddlerScript();
          const cleanedScript = this.removeMockFromScript(currentScript, m.urlPattern);
          await this.writeFiddlerScript(cleanedScript);
        } catch (e) {
          console.error('取消映射失败:', e);
        }
        m.isApplying = false;
        m.lastApplied = false;
        this.currentMappingId = null;
        this.showApplyResult('cancel', m.name, '%USERPROFILE%\\Documents\\Fiddler2\\Scripts\\CustomRules.js', '已取消映射 - Fiddler 脚本已恢复原状');
        return;
      }
      
      // 设置正在映射状态
      m.isApplying = true;
      
      // 保留之前的映射信息用于清理
      const prevMappingId = this.currentMappingId;
      
      // 设置当前映射 ID
      this.currentMappingId = m.id;
      
      try {
        // 读取当前 Fiddler 脚本
        let currentScript = await this.readFiddlerScript();
        
        // 如果之前有别的 mock 已映射，先从脚本中移除旧的 if-block
        if (prevMappingId && prevMappingId !== m.id) {
          const prevMock = this.mocks.find(x => x.id === prevMappingId);
          if (prevMock && prevMock.urlPattern) {
            prevMock.lastApplied = false;
            currentScript = this.removeMockFromScript(currentScript, prevMock.urlPattern);
          }
        }
        
        // 确保内容已解析：如果 rawScript 为空但 content 有内容，即时解析
        if (!m.rawScript && m.content) {
          const parsed = MockParser.parse(m.content);
          if (parsed.length > 0) {
            m.urlPattern = parsed[0].urlPattern;
            m.rules = parsed[0].rules;
            m.rawScript = parsed[0].rawScript;
          }
        }
        
        // 检查 urlPattern 是否有效
        if (!m.urlPattern) {
          throw new Error('Mock 未解析到有效的 URL 匹配规则，请检查文件内容是否包含 if (oSession.uriContains("..."))');
        }
        
        const ifBlock = MockParser.generateOne(m);
        
        // 寻找 class Handlers 内合法的 OnBeforeResponse（跳过文件顶层的错误残留）
        const fnInClass = this.findFnInClass(currentScript);
        
        if (fnInClass !== -1) {
          // 有合法的 class 内函数
          // 注意: 不能用 currentScript.includes("") 检查（空字符串永远匹配）
          const isApplied = m.urlPattern && currentScript.includes(m.urlPattern);
          
          if (isApplied) {
            // 已映射，替换旧的 if-block
            const updatedScript = this.replaceMockInScript(currentScript, m.urlPattern, ifBlock);
            await this.writeFiddlerScript(updatedScript);
          } else {
            // 未映射，插入到 class 内 OnBeforeResponse 的函数体中
            const lines = currentScript.split('\n');
            let depth = 0, started = false;
            let insertAfter = -1;
            for (let j = fnInClass; j < lines.length; j++) {
              for (const ch of lines[j]) {
                if (ch === '{') { depth++; started = true; }
                if (ch === '}') { depth--; }
              }
              if (started && depth === 0) {
                insertAfter = j;
                break;
              }
            }
            
            if (insertAfter !== -1) {
              const before = lines.slice(0, insertAfter).join('\n');
              const after = lines.slice(insertAfter).join('\n');
              await this.writeFiddlerScript(before + '\n' + ifBlock + '\n' + after);
            } else {
              await this.writeFiddlerScript(currentScript.trim() + '\n\n' + ifBlock);
            }
          }
        } else {
          // 没有 OnBeforeResponse 在 class Handlers 内
          // 查找 class Handlers 的闭合括号位置
          const classEnd = this.findClassEnd(currentScript);
          
          if (classEnd !== -1) {
            // 有 class 但没有 OnBeforeResponse，在类内添加函数
            const lines = currentScript.split('\n');
            const before = lines.slice(0, classEnd).join('\n');
            const after = lines.slice(classEnd).join('\n');
            const fnBlock = [
              '',
              '    static function OnBeforeResponse(oSession: Session)',
              '    {',
              ifBlock,
              '    }'
            ].join('\n');
            await this.writeFiddlerScript(before + fnBlock + '\n' + after);
          } else {
            // 完全没有 class Handlers，追加模板到文件末尾
            const template = [
              '',
              'import System;',
              'import System.Windows.Forms;',
              'import Fiddler;',
              '',
              '// Mock & 埋点工具 - 自动生成 FiddlerScript',
              '// 生成时间：' + new Date().toLocaleString(),
              '// ============================================================',
              '',
              'class Handlers',
              '{',
              '    static function OnBeforeResponse(oSession: Session)',
              '    {',
              ifBlock,
              '    }',
              '}',
              ''
            ].join('\n');
            await this.writeFiddlerScript(currentScript.trim() + template);
          }
        }
        
        // 映射成功
        m.lastApplied = true;
        
        // 显示成功面板
        this.showApplyResult('success', m.name, '%USERPROFILE%\\Documents\\Fiddler2\\Scripts\\CustomRules.js', '');
      } catch (e) {
        console.error('映射失败:', e);
        m.lastApplied = false;
        // 清除当前映射 ID
        this.currentMappingId = null;
        // 显示失败面板
        this.showApplyResult('error', m.name, '%USERPROFILE%\\Documents\\Fiddler2\\Scripts\\CustomRules.js', e.message);
      } finally {
        // 清除正在映射状态
        m.isApplying = false;
      }
    },

    // 显示映射结果
    showApplyResult(status, name, target, error) {
      this.applyResult = {
        show: true,
        status: status,
        name: name,
        target: target,
        error: error || ''
      };
    },

    // 关闭映射结果
    closeApplyResult() {
      this.applyResult.show = false;
    },

    // 查找 class Handlers 内部合法的 OnBeforeResponse 函数起始行
    // 跳过文件顶层残留的错误定义（旧版 bug 写入的）
    findFnInClass(script) {
      const lines = script.split('\n');
      let inClass = false;
      for (let i = 0; i < lines.length; i++) {
        if (/^\s*class\s+Handlers\s*/i.test(lines[i])) {
          inClass = true;
        }
        if (inClass && /static\s+function\s+OnBeforeResponse/i.test(lines[i])) {
          return i;
        }
        // 遇到其他 class 定义但不在 Handlers 内，重置
        if (inClass && /^\s*class\s+/i.test(lines[i]) && !/class\s+Handlers/i.test(lines[i])) {
          inClass = false;
        }
      }
      return -1;
    },

    // 查找 class Handlers 的闭合括号所在行号（用于在类内插入新函数）
    findClassEnd(script) {
      const lines = script.split('\n');
      let inClass = false;
      let depth = 0;
      let started = false;
      for (let i = 0; i < lines.length; i++) {
        if (/^\s*class\s+Handlers\s*/i.test(lines[i])) {
          inClass = true;
        }
        if (inClass) {
          for (const ch of lines[i]) {
            if (ch === '{') { depth++; started = true; }
            if (ch === '}') { depth--; }
          }
          if (started && depth === 0) {
            return i;  // 类闭合括号所在行
          }
        }
      }
      return -1;
    },

    // 从脚本中移除指定 URL 的 mock if-block（含前导注释）
    removeMockFromScript(script, urlPattern) {
      if (!urlPattern) return script;
      const lines = script.split('\n');
      let startIndex = -1;
      let endIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(urlPattern) && lines[i].includes('uriContains')) {
          // 向上找到注释块开头（不越过 function 定义）
          startIndex = i;
          for (let j = i - 1; j >= 0; j--) {
            const trimmed = lines[j].trim();
            if (/^\s*static\s+function\s+/i.test(lines[j])) break;
            if (trimmed.startsWith('//') && !trimmed.includes('===')) {
              startIndex = j;
            } else if (trimmed === '') {
              // 空行可能仍在注释块内，继续向上
            } else {
              break;
            }
          }

          // 使用字符串感知的括号计数找到 if-block 结束（避免 JSON 内的 {} 干扰）
          const charStart = lines.slice(0, startIndex).join('\n').length + (startIndex > 0 ? 1 : 0);
          const closeIdx = MockParser._findBlockEnd(script, charStart);
          if (closeIdx !== -1) {
            endIndex = script.substring(0, closeIdx + 1).split('\n').length;
          }
          break;
        }
      }

      if (startIndex !== -1 && endIndex !== -1) {
        const before = lines.slice(0, startIndex).join('\n');
        const after = lines.slice(endIndex).join('\n');
        // 清理多余空行
        return (before.trimEnd() + '\n' + after.trimStart()).replace(/\n{3,}/g, '\n\n');
      }
      return script;
    },

    // 替换脚本中的某个 Mock（适配有/无函数包裹两种格式）
    replaceMockInScript(currentScript, urlPattern, newScript) {
      const lines = currentScript.split('\n');
      let startIndex = -1;
      let endIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(urlPattern) && lines[i].includes('uriContains')) {
          // 向上找到函数定义或注释开头
          for (let j = i; j >= 0; j--) {
            if (/^\s*static\s+function\s+/i.test(lines[j])) {
              startIndex = j;  // 有函数包裹，从函数定义开始
              break;
            }
            if (lines[j].trim().startsWith('//') && !lines[j].includes('uriContains') && !lines[j].includes('===')) {
              startIndex = j;  // 无函数包裹，从注释开始
              break;
            }
          }
          if (startIndex === -1) startIndex = i;
          
          // 使用字符串感知的括号计数找到 if-block 结束
          const charStart = lines.slice(0, startIndex).join('\n').length + (startIndex > 0 ? 1 : 0);
          const closeIdx = MockParser._findBlockEnd(currentScript, charStart);
          if (closeIdx !== -1) {
            endIndex = currentScript.substring(0, closeIdx + 1).split('\n').length;
          }
          break;
        }
      }
      
      if (startIndex !== -1 && endIndex !== -1) {
        // 替换
        const before = lines.slice(0, startIndex).join('\n');
        const after = lines.slice(endIndex).join('\n');
        return before + '\n' + newScript + '\n' + after;
      }
      
      // 找不到就追加
      return currentScript.trim() + '\n\n' + newScript;
    },

    // 读取 Fiddler 脚本
    async readFiddlerScript() {
      const response = await fetch('http://localhost:8765/api/read-fiddler');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.content || '';
    },

    // 写入 Fiddler 脚本
    async writeFiddlerScript(script) {
      const result = await Api.applyFiddler(script);
      if (!result.ok) throw new Error(result.error);
      return result;
    },

    selectFiles() { this.$refs.fileIn.click(); },
    async onImport(e) {
      const files = e.target.files;
      if (!files.length) return;
      // 先读取所有文件内容（避免清空 input 后 FileList 失效）
      const fileData = [];
      for (const f of files) {
        fileData.push({ name: f.name, text: await f.text() });
      }
      e.target.value = '';
      this.pendingImportFiles = fileData;
      this.showImportCategory = true;
    },
    async confirmImport() {
      const fileData = this.pendingImportFiles;
      if (!fileData || !fileData.length) return;
      const category = this.importCategory || '未分类';
      
      // 检查重名
      const existingNames = new Set(this.mocks.filter(m => m.category === category).map(m => m.fileName));
      const duplicates = fileData.filter(f => existingNames.has(f.name));
      if (duplicates.length > 0) {
        if (!confirm(`以下文件在"${category}"中已存在，是否覆盖？\n${duplicates.map(f => f.name).join('\n')}`)) return;
        // 先删除已有的，再导入
        for (const dup of duplicates) {
          const old = this.mocks.find(m => m.fileName === dup.name && m.category === category);
          if (old) await Api.deleteMock(old.filePath);
        }
      }
      
      for (const f of fileData) {
        const path = this.getMockPath(category, f.name);
        await Api.saveMock(path, f.text);
        const mockName = f.name.replace('.txt', '').replace('.js', '');
        const parsed = MockParser.parse(f.text);
        this.mocks.push({
          id: _genMockId(),
          name: mockName,
          urlPattern: parsed.length > 0 ? parsed[0].urlPattern : '',
          filePath: path,
          fileName: f.name,
          content: f.text,
          category: category,
          enabled: true,
          lastApplied: false,
          rules: parsed.length > 0 ? parsed[0].rules : [{ pattern: '', replacement: '' }],
          rawScript: parsed.length > 0 ? parsed[0].rawScript : ''
        });
      }
      this.showImportCategory = false;
      this.pendingImportFiles = null;
      this.updateCategories();
    }
  },
  components: { 'json-node': JsonNode }
};
window.MockManager = MockManager;
// AI-Generated End 1780597577

