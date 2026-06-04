// AI-Generated Begin 1780588259
const { createApp } = Vue;

const app = createApp({
  data() {
    return {
      currentTab: 'mock',
      tabs: [
        { key: 'mock', label: 'Mock管理' },
        { key: 'tracking', label: '埋点解析' },
        { key: 'json', label: 'JSON展示' }
      ]
    };
  },
  components: {
    'mock-manager': MockManager,
    'tracking-parser': TrackingParser,
    'json-viewer-tab': JsonViewerTab,
    'json-node': JsonNode
  }
});

app.config.errorHandler = function(err, instance, info) {
  console.error('[Vue Error]', err);
  console.error('[Vue Error Info]', info);
  // 避免未捕获异常导致白屏
};

app.mount('#app');
// AI-Generated End 1780588259
