/* 才探 TalentRadar · 前端运行配置
 *
 * apiBase：Spring Boot 服务地址。通过 Docker / java -jar 同源部署时为空串（走 /api/...）；
 *          通过 file:// 直接打开时使用绝对地址（且 api.js 会强制降级为演示模式）。
 * fallbackBase：用独立静态服务器（如 python -m http.server 4173）打开页面时，
 *          同源探测失败后自动改连本机 8080 的后端，后端已放开 CORS。
 * 修改后刷新页面即可生效，无需重新构建镜像。
 */
(function () {
  var isHttp = /^https?:$/.test(location.protocol);
  window.TR_CONFIG = {
    apiBase: isHttp ? '' : 'http://localhost:8080',
    fallbackBase: isHttp ? 'http://localhost:8080' : '',
    autoDetect: true,
    timeout: 1500,
    syncDebounce: 450
  };
})();
