// AI-Generated Begin 1780596762
// 埋点解析组件 - 支持两种格式自动识别 + 历史记录
const TrackingParser = {
  name: 'TrackingParser',
  template: `
<div class="container">
  <!-- 输入区 -->
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">
        埋点数据解析
        <span v-if="activeFormat" :class="activeFormat === 'underscore' ? 'format-tag-underscore' : 'format-tag-query'">
          {{ activeFormat === 'underscore' ? '下划线分隔格式' : 'URL参数格式' }}
        </span>
      </span>
      <div class="btn-group">
        <div class="segmented-control">
          <button :class="['segmented-option', { active: activeFormat === 'underscore' }]" @click="selectFormat('underscore')">下划线分隔格式</button>
          <button :class="['segmented-option', { active: activeFormat === 'query' }]" @click="selectFormat('query')">URL参数格式</button>
        </div>
        <button class="btn btn-sm" @click="showHistory = true" title="查看历史记录">&#128337; 历史记录</button>
        <button class="btn btn-sm" @click="clearCurrent">清空</button>
      </div>
    </div>
    <textarea class="textarea" v-model="inputText" :placeholder="activeFormat === 'query' ? '粘贴 URL Query 格式埋点数据...' : '粘贴下划线分隔格式埋点数据...'" style="min-height:120px;"></textarea>
    <div class="btn-group" style="margin-top:8px;">
      <button class="btn btn-primary" @click="doParse">解析</button>
      <span class="format-info" v-if="detectedFormat">
        检测到: {{ detectedFormat === 'underscore' ? '_ 分隔 + | 子分隔 + 逗号记录分隔' : '= 键值对 + & 分隔' }}
      </span>
      <span class="format-info" v-if="saving">保存中...</span>
      <span class="format-info" style="color:var(--accent-green);" v-if="saved">已保存到历史</span>
    </div>
  </div>

  <!-- 列表 -->
  <div v-if="formatRecords.length" class="panel">
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">{{ formatRecords.length }}</div><div class="stat-label">记录数</div></div>
      <div class="stat-card"><div class="stat-value">{{ evtNames.length }}</div><div class="stat-label">事件类型</div></div>
      <div class="stat-card"><div class="stat-value">{{ totalParams }}</div><div class="stat-label">总字段数</div></div>
    </div>

    <!-- 下划线格式：字段表格 -->
    <div v-if="isUnderscore" class="underscore-table">
      <div class="search-bar">
        <input class="input" v-model="sq" placeholder="搜索商品名、SPU...">
      </div>
      <div class="table-wrapper" style="max-height:500px;overflow:auto;">
        <table style="min-width:800px;">
          <thead>
            <tr>
              <th v-for="h in tableHeaders" :key="h.key" :class="{ 'col-key': h.isKey }">{{ h.label }}</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.id">
              <td v-for="h in tableHeaders" :key="h.key" :class="{ 'cell-null': r.allData[h.label] === null, 'col-key': h.isKey }">
                {{ formatCell(r.allData[h.label]) }}
              </td>
              <td>
                <div class="btn-group">
                  <button class="btn btn-sm" @click="detail(r)">详情</button>
                  <button class="btn btn-danger btn-sm" @click="del(r)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Query格式：JSON视图 -->
    <div v-else>
      <div class="query-result">
        <div v-for="r in formatRecords" :key="r.id" class="query-record">
          <div class="query-event-header">
            <span class="format-tag-query" style="margin-right:8px;">{{ r.eventName || '(无事件名)' }}</span>
            <span style="font-size:11px;color:var(--text-muted);">{{ r.parsedAt }}</span>
          </div>
          <div class="json-tree" style="margin-top:8px;">
            <json-node :data="r.allData" key-name="root" :is-last="true" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">
    <div class="empty-icon">&#128202;</div>
    <div class="empty-text">选择格式，粘贴埋点数据后点击"解析"</div>
  </div>

  <!-- 详情弹窗 -->
  <div v-if="showDetail" class="modal-overlay" @click.self="showDetail=false">
    <div class="modal modal-lg">
      <div class="modal-header">
        <span class="modal-title">埋点详情 - {{ cur?.eventName }}</span>
        <button class="modal-close" @click="showDetail=false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="btn-group" style="margin-bottom:12px;">
          <button class="btn btn-sm" @click="copyRaw">复制原始数据</button>
          <button class="btn btn-sm" @click="copyJSON">复制JSON</button>
        </div>
        <div v-if="isUnderscore && cur?.fields" style="margin-bottom:12px;">
          <label class="form-label">字段列表 ({{cur.fields.length}}个字段)</label>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>序号</th><th>字段名</th><th>原始值</th></tr></thead>
              <tbody>
                <tr v-for="f in cur.fields" :key="f.index">
                  <td>{{ f.index }}</td>
                  <td>{{ f.key }}</td>
                  <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;">{{ f.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style="margin-top:12px;">
          <label class="form-label">JSON视图</label>
          <div class="json-tree">
            <json-node :data="cur?.allData" key-name="root" :is-last="true" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 历史记录弹窗 -->
  <div v-if="showHistory" class="modal-overlay" @click.self="showHistory=false">
    <div class="modal modal-lg">
      <div class="modal-header">
        <span class="modal-title">&#128337; 解析历史记录</span>
        <button class="modal-close" @click="showHistory=false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="history-toolbar">
          <span style="font-size:12px;color:var(--text-secondary);">共 {{ historyList.length }} 条记录</span>
          <button class="btn btn-danger btn-sm" v-if="historyList.length" @click="clearHistory">清空全部</button>
        </div>
        <div class="history-panel" v-if="historyList.length">
          <div class="history-item" v-for="h in historyList" :key="h.id">
            <div class="history-item-left">
              <div class="history-item-time">{{ h.createdAt }}</div>
              <div class="history-item-events">{{ (h.eventNames || []).join(', ') || '(无事件名)' }}</div>
            </div>
            <div class="history-item-right">
              <span :class="h.format === 'underscore' ? 'format-tag-underscore' : 'format-tag-query'">{{ h.format === 'underscore' ? '_分隔' : 'Query' }}</span>
              <span class="history-item-count">{{ h.recordCount }} 条</span>
              <div class="history-item-actions" @click.stop>
                <button class="btn btn-sm" @click="viewHistoryDetail(h)">查看</button>
                <button class="btn btn-danger btn-sm" @click="deleteHistory(h)">删除</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="history-empty">
          <div>&#128203;</div>
          <div>暂无解析历史，解析埋点数据后将自动保存</div>
        </div>
      </div>
    </div>
  </div>
  <!-- 历史记录详情弹窗 -->
  <div v-if="historyDetailShow" class="modal-overlay" @click.self="historyDetailShow=false">
    <div class="modal modal-lg">
      <div class="modal-header">
        <span class="modal-title">&#128337; 历史记录详情 - {{ historyDetailEntry?.createdAt }}</span>
        <button class="modal-close" @click="historyDetailShow=false">&times;</button>
      </div>
      <div class="modal-body">
        <span :class="historyDetailEntry?.format === 'underscore' ? 'format-tag-underscore' : 'format-tag-query'" style="margin-bottom:8px;display:inline-block;">
          {{ historyDetailEntry?.format === 'underscore' ? '_分隔格式' : 'Query格式' }} · {{ historyDetailEntry?.recordCount }} 条记录
        </span>
        <div v-if="historyDetailEntry?.format === 'underscore'" class="underscore-table">
          <div class="table-wrapper" style="max-height:50vh;overflow:auto;">
            <table style="min-width:800px;">
              <thead>
                <tr>
                  <th v-for="h in historyTableHeaders" :key="h.key" :class="{ 'col-key': h.isKey }">{{ h.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in (historyDetailEntry?.records || [])" :key="r.id">
                  <td v-for="h in historyTableHeaders" :key="h.key" :class="{ 'cell-null': r.allData[h.label] === null, 'col-key': h.isKey }">
                    {{ formatCell(r.allData[h.label]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else-if="historyDetailEntry?.format === 'query'">
          <div v-for="r in (historyDetailEntry?.records || [])" :key="r.id" style="margin-bottom:12px;">
            <div class="query-event-header">
              <span class="format-tag-query" style="margin-right:8px;">{{ r.eventName || '(无事件名)' }}</span>
            </div>
            <div class="json-tree" style="margin-top:8px;">
              <json-node :data="r.allData" key-name="root" :is-last="true" />
            </div>
          </div>
        </div>
        <div v-else class="empty-state"><div class="empty-text">无记录数据</div></div>
      </div>
    </div>
  </div>
</div>`,
  data() {
    return {
      inputText: '', inputUnderscore: '', inputQuery: '', records: [], sq: '', showDetail: false, cur: null,
      detectedFormat: '', activeFormat: '',
      showHistory: false, historyList: [],
      historyDetailShow: false, historyDetailEntry: null,
      saving: false, saved: false
    };
  },
  computed: {
    formatRecords() { return this.activeFormat ? this.records.filter(r => r.format === this.activeFormat) : []; },
    evtNames() { return TrackingUtil.eventNames(this.formatRecords); },
    totalParams() { return this.formatRecords.reduce((s, r) => s + Object.keys(r.params || {}).length, 0); },
    isUnderscore() { return this.activeFormat === 'underscore' && this.formatRecords.length > 0; },
    tableHeaders() {
      if (!this.isUnderscore) return [];
      return this.buildHeaders(this.records);
    },
    filtered() {
      let r = this.formatRecords;
      if (this.sq) {
        const q = this.sq.toLowerCase();
        r = r.filter(x => {
          const searchText = (x.eventName || '') + ' ' + (x.raw || '');
          return searchText.toLowerCase().includes(q);
        });
      }
      return r;
    },
    historyTableHeaders() {
      return this.buildHeaders(this.historyDetailEntry?.records || []);
    }
  },
  async mounted() {
    this.records = StorageUtil.tracking();
    this.loadHistoryList();
  },
  methods: {
    buildHeaders(records) {
      const seen = new Set();
      const keyIndex = {};
      const headers = [];
      for (const r of records) {
        const fields = r.fields || [];
        for (const f of fields) {
          if (!seen.has(f.key)) {
            seen.add(f.key);
            keyIndex[f.key] = f.index;
            const keyFields = ['业务ID','商品SPU','商品名称','开始时间','结束时间','MD5','来源渠道','实验标识','关联ID'];
            headers.push({ key: f.key, label: f.key, isKey: keyFields.includes(f.key) });
          } else if (f.index < (keyIndex[f.key] ?? Infinity)) {
            keyIndex[f.key] = f.index;
          }
        }
      }
      headers.sort((a, b) => (keyIndex[a.key] ?? 999) - (keyIndex[b.key] ?? 999));
      return headers;
    },
    selectFormat(format) {
      // 缓存当前输入
      if (this.activeFormat === 'underscore') this.inputUnderscore = this.inputText;
      else if (this.activeFormat === 'query') this.inputQuery = this.inputText;
      if (this.activeFormat !== format) {
        this.records = this.records.filter(r => r.format !== format);
        StorageUtil.saveTracking(this.records);
      }
      this.activeFormat = format;
      this.inputText = '';
    },
    async doParse() {
      if (!this.inputText.trim()) return;
      const nr = TrackingUtil.parse(this.inputText);
      if (!nr.length) return;
      this.detectedFormat = nr[0]?.format || '';
      this.activeFormat = nr[0]?.format || '';
      // 解析后同步缓存
      if (this.activeFormat === 'underscore') this.inputUnderscore = this.inputText;
      else if (this.activeFormat === 'query') this.inputQuery = this.inputText;
      // 先展示数据
      if (nr[0]?.format === 'query') {
        this.records = [...nr, ...this.records.filter(r => r.format !== 'query')];
      } else {
        this.records = [...nr, ...this.records];
      }
      StorageUtil.saveTracking(this.records);
      // 服务端去重检查：重复则只展示不保存
      const checkResult = await Api.checkTrackingDuplicate(this.inputText.trim());
      if (checkResult.duplicate) return;
      this.saveToHistory(nr, nr[0]?.format || '');
    },
    async saveToHistory(records, format) {
      this.saving = true;
      this.saved = false;
      try {
        const raw = this.inputText.trim();
        const result = await Api.saveTrackingHistory(records, raw, format);
        if (result.ok) {
          this.saved = true;
          setTimeout(() => { this.saved = false; }, 2000);
          this.loadHistoryList();
        } else if (result.duplicate) {
          // 服务端去重，静默跳过
        }
      } catch (e) {
        console.error('保存历史失败:', e);
      }
      this.saving = false;
    },
    async loadHistoryList() {
      try {
        const result = await Api.listTrackingHistory();
        if (result.items) {
          this.historyList = result.items;
        }
      } catch (e) {
        console.error('加载历史列表失败:', e);
      }
    },
    async loadHistory(h) {
      try {
        const result = await Api.getTrackingHistory(h.id);
        if (result.entry && result.entry.records) {
          // 合并到当前记录（去重）
          const existingRaws = new Set(this.records.map(r => r.raw));
          const newRecords = result.entry.records.filter(r => !existingRaws.has(r.raw));
          if (newRecords.length > 0) {
            this.records = [...newRecords, ...this.records];
            StorageUtil.saveTracking(this.records);
            this.detectedFormat = result.entry.format || '';
            this.activeFormat = result.entry.format || '';
          }
          this.showHistory = false;
        }
      } catch (e) {
        console.error('加载历史记录失败:', e);
      }
    },
    async deleteHistory(h) {
      try {
        // 先获取完整记录以同步清除主面板
        const entryResult = await Api.getTrackingHistory(h.id);
        const deletedRaws = entryResult.entry?.records?.map(r => r.raw) || [];
        await Api.deleteTrackingHistory(h.id);
        this.historyList = this.historyList.filter(x => x.id !== h.id);
        // 同步移除主面板中对应记录
        if (deletedRaws.length) {
          const rawSet = new Set(deletedRaws);
          this.records = this.records.filter(r => !rawSet.has(r.raw));
          StorageUtil.saveTracking(this.records);
          if (!this.records.length) { this.detectedFormat = ''; this.activeFormat = ''; }
        }
      } catch (e) {
        console.error('删除历史失败:', e);
      }
    },
    async clearHistory() {
      try {
        await Api.clearTrackingHistory();
        this.historyList = [];
        this.showHistory = false;
        // 同步清除主面板全部记录
        this.clearAll();
      } catch (e) {
        console.error('清空历史失败:', e);
      }
    },
    formatCell(v) {
      if (v === null || v === undefined) return '';
      if (Array.isArray(v)) return v.map(x => x === null ? '' : String(x)).join(' | ');
      if (typeof v === 'object') {
        const s = JSON.stringify(v);
        return s.length > 200 ? s.substring(0, 200) + '...' : s;
      }
      return String(v);
    },
    detail(r) { this.cur = r; this.showDetail = true; },
    del(r) {
      this.records = this.records.filter(x => x.id !== r.id);
      StorageUtil.saveTracking(this.records);
      if (!this.records.length) { this.detectedFormat = ''; this.activeFormat = ''; }
    },
    copyRaw() { navigator.clipboard.writeText(this.cur?.raw||''); },
    copyJSON() { navigator.clipboard.writeText(JSON.stringify(this.cur?.allData||{}, null, 2)); },
    async viewHistoryDetail(h) {
      try {
        const result = await Api.getTrackingHistory(h.id);
        if (result.entry) {
          this.historyDetailEntry = result.entry;
          this.historyDetailShow = true;
        }
      } catch (e) {
        console.error('查看历史详情失败:', e);
      }
    },
    clearAll() { this.records = []; this.inputText = ''; this.inputUnderscore = ''; this.inputQuery = ''; StorageUtil.saveTracking([]); this.detectedFormat = ''; this.activeFormat = ''; },
    clearCurrent() {
      if (!this.activeFormat) return;
      this.records = this.records.filter(r => r.format !== this.activeFormat);
      this.inputText = '';
      if (this.activeFormat === 'underscore') this.inputUnderscore = '';
      else this.inputQuery = '';
      StorageUtil.saveTracking(this.records);
      if (!this.records.length) { this.detectedFormat = ''; this.activeFormat = ''; }
    },
    loadQuerySample() {
      this.activeFormat = 'query';
      this.inputText = `activity=active_te_goods_expose&activity_endtime=null&activity_propety={"layout_flag":"2","purepic":"-99","gender":"-99","display_items":{"6921874247546126103":{"1":"632","47":"13","26":"1","49":"branch_rank"}}}`;
      this.inputQuery = this.inputText;
    },
    loadUnderscoreSample() {
      this.activeFormat = 'underscore';
      this.inputText = `1710618487_6921480098149042263_5_1_21105_0_0_9_0_-99_-99_-99_0_-99_0_-1513587638999152336_31b9d885afb3664882fc696948fd42ee_-99_1_-99_0_dft001_0_-99|-99|-99|-99|-99_-99_-99_-99_-99_-99_1_0_0_0_1780539374716_1780539395821_0_-99_444101#ilvb@video_-99_0_0_-99_NikeREVOLUTION8透气网面体,1710618487_6921874247546126103_5_1_21019_0_0_10_0_-99_-99_-99_0_-99_0_-1513587638999152336_c276807c13a5cf030a4c8f9e39a94710_-99_1_-99_0_dft001_0_-99|-99|-99|-99|-99_-99_-99_-99_-99_1_1_0_0_0_1780539374802_1780539395821_0_-99_444101#ilvb@video_-99_0_0_-99_Nike迈柔VOMERO18RR半马全马,1710618487_6921735225580689239_6_1_20682_0_0_11_0_-99_-99_-99_0_-99_0_-1513587638999152336_26ccd16c7ce65c8b176db201e7f649b6_-99_1_-99_0_dft001_0_-99|-99|-99|-99|-99_-99_-99_-99_-99_-99_1_0_0_0_1780539375424_1780539396106_0_-99_444101#ilvb@video_-99_0_0_-99_NikeUPLIFTSC低帮轻便舒适男子,1711949224_6921614923685893128_6_1_20716_0_0_12_0_-99_-99_-99_0_-99_0_-1513587638999152336_a09f41f09ebf5bc4a6356392d8b0ab9a_-99_0_-99_0_dft001_0_-99|-99|-99|-99|-99_-99_-99_-99_-99_1_1_0_0_0_1780539375424_1780539396140_0_-99_-99_-99_0_0_-99_NikeAIRZOOMUPTURNSCS`;
      this.inputUnderscore = this.inputText;
    }
  },
  components: { 'json-node': JsonNode }
};
window.TrackingParser = TrackingParser;
// AI-Generated End 1780596762
