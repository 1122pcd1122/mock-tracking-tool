// AI-Generated Begin 1780588259
// JSON树节点组件 - 公用，支持展开/收起、全局展开、深度限制
const JsonNode = {
  name: 'JsonNode',
  props: {
    data: {},
    keyName: { type: String, default: '' },
    isLast: { type: Boolean, default: true },
    globalExpand: { type: Boolean, default: false },
    depth: { type: Number, default: 0 }
  },
  template: `
    <div>
      <template v-if="isObj(data) && depth < maxDepth">
        <div class="jn-line" @click="open = !open" style="cursor:pointer;">
          <span class="jn-arrow" :class="{ collapsed: !open }">&#9660;</span>
          <span v-if="keyName" class="jn-key">"{{ keyName }}": </span>
          <span class="jn-bracket">{{ isArr(data) ? '[' : '{' }}</span>
          <span v-if="!open" class="jn-preview">{{ preview(data) }}</span>
        </div>
        <div v-show="open" class="jn-children">
          <json-node v-for="(v, k, i) in data" :key="k"
            :data="v" :key-name="String(k)" :is-last="i === childCount - 1"
            :global-expand="globalExpand" :depth="depth + 1" />
        </div>
        <div class="jn-line"><span class="jn-bracket">{{ isArr(data) ? ']' : '}' }}</span><span v-if="!isLast" class="jn-comma">,</span></div>
      </template>
      <template v-else-if="isObj(data)">
        <span class="jn-line">
          <span v-if="keyName" class="jn-key">"{{ keyName }}": </span>
          <span class="jn-preview">{{ preview(data) }}</span>
          <span v-if="!isLast" class="jn-comma">,</span>
        </span>
      </template>
      <template v-else>
        <span class="jn-line">
          <span v-if="keyName" class="jn-key">"{{ keyName }}": </span>
          <span :class="valClass(data)">{{ fmt(data) }}</span>
          <span v-if="!isLast" class="jn-comma">,</span>
        </span>
      </template>
    </div>
  `,
  data() {
    return { open: false, maxDepth: 50 };
  },
  computed: {
    childCount() {
      if (this.data === null || typeof this.data !== 'object') return 0;
      return Array.isArray(this.data) ? this.data.length : Object.keys(this.data).length;
    }
  },
  watch: {
    globalExpand(val) { this.open = val; }
  },
  mounted() {
    if (this.globalExpand) this.open = true;
  },
  methods: {
    isObj(v) { return v !== null && typeof v === 'object'; },
    isArr(v) { return Array.isArray(v); },
    preview(v) {
      const len = Array.isArray(v) ? v.length : Object.keys(v).length;
      return Array.isArray(v) ? `Array(${len})` : `{...} (${len})`;
    },
    valClass(v) {
      if (v === null) return 'jn-null';
      const m = { string: 'jn-str', number: 'jn-num', boolean: 'jn-bool' };
      return m[typeof v] || 'jn-str';
    },
    fmt(v) {
      if (v === null) return 'null';
      if (typeof v === 'string') return `"${v}"`;
      return String(v);
    }
  }
};
window.JsonNode = JsonNode;
// AI-Generated End 1780588259
