// AI-Generated Begin 1780588259
// JSON展示组件 - 独立Tab，支持粘贴任意JSON并树形展开/收起
const JsonViewerTab = {
  name: 'JsonViewerTab',
  template: `
<div class="container">
  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">JSON 解析展示</span>
      <div class="btn-group">
        <button class="btn btn-sm" @click="loadSample">加载示例</button>
        <button class="btn btn-sm" @click="expandAll = !expandAll">{{ expandAll ? '全部收起' : '全部展开' }}</button>
        <button class="btn btn-sm" @click="copy">{{ parsed ? '复制JSON' : '复制' }}</button>
      </div>
    </div>
    <textarea class="textarea" v-model="input" placeholder="粘贴JSON数据..." style="min-height:150px;"></textarea>
    <div class="btn-group" style="margin-top:8px;">
      <button class="btn btn-primary" @click="doParse">解析展示</button>
    </div>
    <div v-if="error" class="error-msg">{{ error }}</div>
  </div>
  <div v-if="parsed" class="panel">
    <div class="panel-header"><span class="panel-title">JSON 树形视图</span></div>
    <div class="json-tree">
      <json-node :data="parsed" key-name="root" :is-last="true" :global-expand="expandAll" :depth="0" />
    </div>
  </div>
</div>`,
  data() {
    return { input: '', parsed: null, error: '', expandAll: false };
  },
  methods: {
    doParse() {
      this.error = '';
      try { this.parsed = JSON.parse(this.input); } catch (e) { this.parsed = null; this.error = 'JSON解析失败: ' + e.message; }
    },
    copy() {
      const t = this.parsed ? JSON.stringify(this.parsed, null, 2) : this.input;
      navigator.clipboard.writeText(t);
    },
    loadSample() {
      this.input = JSON.stringify({
        name: "首页派券浮层",
        api: "/api/productList/eventData/v1",
        response: { code: 200, data: { floaterData: { popupKey: "1092598", uiStyle: "100", enableClose: 1 } } }
      }, null, 2);
    }
  },
  components: { 'json-node': JsonNode }
};
window.JsonViewerTab = JsonViewerTab;
// AI-Generated End 1780588259
