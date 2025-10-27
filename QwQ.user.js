// ==UserScript==
// @name         ewe→QwQ
// @namespace    https://codeforces.com/
// @version      3.8
// @description  隐藏侧边栏并提供复制 Markdown；容器与正文对齐；自动隐藏开关（Alt+Q 不改变按钮）；整页横向裁切
// @match        https://codeforces.com/problemset/problem/*/*
// @match        https://codeforces.com/contest/*/problem/*
// @match        https://codeforces.com/gym/*/problem/*
// @match        https://codeforces.com/group/*/contest/*/problem/*
// @grant        GM_setClipboard
// @run-at       document-idle
// @license      MIT
// @homepageURL  https://github.com/hejiehejiehejiehejie/cf-
// @supportURL   https://github.com/hejiehejiehejiehejie/cf-/issues
// @updateURL    https://github.com/hejiehejiehejiehejie/cf-/raw/refs/heads/main/QwQ.user.js
// @downloadURL  https://github.com/hejiehejiehejiehejie/cf-/raw/refs/heads/main/QwQ.user.js
// ==/UserScript==

(() => {
  'use strict';

  /*** -------------------- 常量与工具 -------------------- ***/
  const STORAGE_KEY = 'cf_auto_hide_sidebar';
  const BTN_SIZE = 18;

  const ICON_DATA_URL =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>`
    );

  const $ = (sel, root = document) => root.querySelector(sel);

  const inEditable = (e) => {
    const t = e.target;
    return t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.nodeName));
  };

  const getCanonicalUrl = () =>
    document.querySelector('link[rel="canonical"]')?.href || location.href;

  function parseCFUrl(u) {
    try {
      const url = new URL(u);
      const path = url.pathname.replace(/\/+$/, '');
      const regs = [
        /^\/contest\/(\d+)\/problem\/([0-9A-Z]+)$/i,
        /^\/problemset\/problem\/(\d+)\/([0-9A-Z]+)$/i,
        /^\/group\/[^/]+\/contest\/(\d+)\/problem\/([0-9A-Z]+)$/i,
        /^\/gym\/(\d+)\/problem\/([0-9A-Z]+)$/i,
      ];
      for (const re of regs) {
        const m = path.match(re);
        if (m) return { id: m[1], index: m[2].toUpperCase() };
      }
    } catch {}
    return null;
  }

  function getProblemTitle() {
    const t =
      document.querySelector('.problem-statement .title') ||
      document.querySelector('#pageContent h1, #pageContent h2');
    if (!t) return '';
    return t.textContent.trim().replace(/\s+/g, ' ');
  }

  /*** -------------------- 样式 -------------------- ***/
  const STYLE = `
    :root {
      --qwq-btn-size: ${BTN_SIZE}px;
      --qwq-gap: 10px;

      /* 阅读区左右留白（随屏幕自适应） */
      --qwq-page-pad: clamp(12px, 3.2vw, 28px);

      /* 页面容器最大宽度（含留白） */
      --qwq-wide-max: 1280px;

      /* 正文阅读最大宽度（更窄一些，读起来舒服） */
      --qwq-content-max: 1100px;
    }

    /* 根元素：解除最小宽度；整页横向裁切 */
    html.cf-hide-sidebar {
      min-width: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
      overflow-x: hidden;
      overflow-x: clip;
      scrollbar-gutter: stable both-edges;
    }

    /* 主体承载层：放开 min-width；兜底裁切横向溢出 */
    body.cf-hide-sidebar,
    body.cf-hide-sidebar #body,
    body.cf-hide-sidebar #content,
    body.cf-hide-sidebar .content-with-sidebar,
    body.cf-hide-sidebar .problemindexholder {
      min-width: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
      overflow-x: hidden;
      overflow-x: clip;
    }

    /* 移除侧边栏与占位偏移 */
    body.cf-hide-sidebar #sidebar { display: none !important; }

    /* 顶层容器居中+留白 */
    body.cf-hide-sidebar #pageContent {
      margin: 0 auto !important;
      padding-left: var(--qwq-page-pad);
      padding-right: var(--qwq-page-pad);
      max-width: min(var(--qwq-wide-max), 100%);
      width: auto !important;
      box-sizing: border-box;
    }

    /* 通用“与正文对齐”的工具类，供需要对齐的容器使用 */
    body.cf-hide-sidebar .qwq-align {
      margin-left: auto !important;
      margin-right: auto !important;
      padding-left: var(--qwq-page-pad);
      padding-right: var(--qwq-page-pad);
      max-width: min(var(--qwq-content-max), 100%);
      width: auto !important;
      box-sizing: border-box;
    }

    /* 正文阅读区：限宽 + 留白，避免贴边 */
    body.cf-hide-sidebar .problem-statement {
      margin-left: auto;
      margin-right: auto;
      padding-left: var(--qwq-page-pad);
      padding-right: var(--qwq-page-pad);
      max-width: min(var(--qwq-content-max), 100%);
      width: auto;
      box-sizing: border-box;
      overflow-x: hidden;
      overflow-x: clip;
    }

    /* 媒体自适应 */
    body.cf-hide-sidebar .problem-statement img,
    body.cf-hide-sidebar .problem-statement svg {
      max-width: 100%;
      height: auto;
    }

    /* 表格自身滚动 */
    body.cf-hide-sidebar .problem-statement table {
      display: block;
      max-width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* 代码块自身滚动；如需折行可开启注释 */
    body.cf-hide-sidebar .problem-statement pre,
    body.cf-hide-sidebar .problem-statement code,
    body.cf-hide-sidebar pre {
      max-width: 100%;
      overflow: auto;
      /* 如需强制折行：
      white-space: pre-wrap;
      word-break: break-word;
      */
    }

    /* 数学公式块级展示时局部滚动 */
    body.cf-hide-sidebar .problem-statement .MathJax_Display {
      overflow-x: auto;
      overflow-y: visible;
      max-width: 100%;
    }

    /* 正文可断行，长词/长链接不撑破 */
    body.cf-hide-sidebar .problem-statement,
    body.cf-hide-sidebar .ttypography {
      overflow-wrap: anywhere;
      word-break: normal;
    }

    /* 顶部工具区小屏可换行 */
    body.cf-hide-sidebar .topRightDiv {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    /* 控件样式与交互反馈 */
    #cfAutoHideSwitch, #cfMarkdownCopyBtn {
      display: inline-flex;
      align-items: center;
      margin-left: var(--qwq-gap);
      vertical-align: middle;
      position: relative;
    }
    #cfMarkdownCopyBtn img {
      width: var(--qwq-btn-size);
      height: var(--qwq-btn-size);
      display: block;
    }
    #cfAutoHideSwitch input[type="checkbox"] {
      width: var(--qwq-btn-size);
      height: var(--qwq-btn-size);
      cursor: pointer;
      margin: 0;
      padding: 0;
    }
    @keyframes qwq-click-feedback {
      0% { transform: scale(1); background: #f7f7f7; }
      50% { transform: scale(0.95); background: #e0e0e0; }
      100% { transform: scale(1); background: #f7f7f7; }
    }
    #cfMarkdownCopyBtn.clicked img {
      animation: qwq-click-feedback 0.2s ease;
    }
    .qwq-toast {
      position: absolute;
      top: -26px;
      right: 0;
      background: rgba(60,60,60,0.95);
      color: #fff;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 3px;
      pointer-events: none;
      opacity: 0;
      transform: translateY(-2px);
      transition: opacity 0.15s ease, transform 0.15s ease;
      white-space: nowrap;
    }
    .qwq-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  function ensureStyle() {
    if (!document.querySelector('#qwq-style')) {
      const s = document.createElement('style');
      s.id = 'qwq-style';
      s.textContent = STYLE;
      document.head.appendChild(s);
    }
  }

  /*** -------------------- UI 元素 -------------------- ***/
  function createAutoHideSwitch() {
    const wrap = document.createElement('span');
    wrap.id = 'cfAutoHideSwitch';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.title = '自动隐藏侧边栏（Alt+Q 手动切换不改变本设置）';
    try {
      cb.checked = localStorage.getItem(STORAGE_KEY) === 'on';
    } catch {
      cb.checked = false;
    }
    // 改为“仅偏好设置”：开启后立即隐藏；关闭不自动恢复，仅影响后续页面
    cb.addEventListener('change', () => {
      try {
        localStorage.setItem(STORAGE_KEY, cb.checked ? 'on' : 'off');
      } catch {}
      if (cb.checked) {
        Sidebar.enable();
      } // 关闭时不改变当前状态
    });

    wrap.appendChild(cb);
    return wrap;
  }

  function createToast(text) {
    const t = document.createElement('span');
    t.className = 'qwq-toast';
    t.textContent = text;
    return t;
  }

  function createMarkdownCopyButton() {
    const url = getCanonicalUrl();
    const parsed = parseCFUrl(url);
    if (!parsed) return null;

    const title = getProblemTitle();
    const base = `[CF${parsed.id}${parsed.index}](${url})`;
    const md = title ? `${base} - ${title}` : base;

    const wrap = document.createElement('span');
    wrap.id = 'cfMarkdownCopyBtn';
    wrap.title = '复制 Markdown（Ctrl+M）';

    const img = document.createElement('img');
    img.src = ICON_DATA_URL;
    img.alt = '复制MD';

    const toast = createToast('已复制');
    wrap.appendChild(toast);

    const showToast = () => {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 800);
    };

    const copy = async () => {
      try {
        if (typeof GM_setClipboard !== 'undefined') {
          GM_setClipboard(md);
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(md);
        } else {
          const ta = document.createElement('textarea');
          ta.value = md;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        wrap.classList.add('clicked');
        showToast();
        setTimeout(() => wrap.classList.remove('clicked'), 200);
      } catch {}
    };

    wrap.addEventListener('mousedown', () => wrap.classList.add('clicked'));
    wrap.addEventListener('mouseup', () => setTimeout(() => wrap.classList.remove('clicked'), 200));
    wrap.addEventListener('mouseleave', () => wrap.classList.remove('clicked'));
    wrap.addEventListener('click', (e) => {
      if (inEditable(e)) return;
      copy();
    });

    // Ctrl+M 复制（输入框内不触发）
    document.addEventListener(
      'keydown',
      (e) => {
        if (inEditable(e)) return;
        if (e.ctrlKey && e.key && e.key.toLowerCase() === 'm') {
          e.preventDefault();
          copy();
        }
      },
      { passive: false }
    );

    wrap.appendChild(img);
    return wrap;
  }

  /*** -------------------- 行为控制与对齐 -------------------- ***/
  const Sidebar = {
    enable() {
      ensureStyle();
      document.body.classList.add('cf-hide-sidebar');
      document.documentElement.classList.add('cf-hide-sidebar');
    },
    disable() {
      document.body.classList.remove('cf-hide-sidebar');
      document.documentElement.classList.remove('cf-hide-sidebar');
    },
    toggle() {
      this.active ? this.disable() : this.enable();
    },
    get active() {
      return document.body.classList.contains('cf-hide-sidebar');
    },
  };

  // 根据偏好在加载时自动隐藏
  function applyAutoPreferenceOnLoad() {
    let on = false;
    try {
      on = localStorage.getItem(STORAGE_KEY) === 'on';
    } catch {}
    if (on) Sidebar.enable();
  }

  function setupHotkeys() {
    // Alt+Q 手动开关（不改变“自动隐藏”按钮状态）
    document.addEventListener(
      'keydown',
      (e) => {
        if (inEditable(e)) return;
        if (e.altKey && e.key && e.key.toLowerCase() === 'q') {
          e.preventDefault();
          Sidebar.toggle();
        }
      },
      { passive: false }
    );
  }

  // 让工具条与“提交代码”等容器与正文对齐
  const ALIGN_SELECTORS = [
    '#problemToolbar',
    '#pageContent #submitForm',
    '#pageContent .submit-form',
    '#pageContent #submitSolutionForm',
    '#pageContent form[action*="/submit"]',
    '#pageContent .custom-test',
    '#pageContent .customTest',
    '#pageContent .cf-submit-container',
  ];

  function alignContainers() {
    ALIGN_SELECTORS.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.classList.add('qwq-align');
      });
    });
  }

  function installIntoToolbar() {
    const toolbar = document.querySelector('#problemToolbar');
    if (!toolbar || document.querySelector('#cfAutoHideSwitch')) return false;

    // 工具条与正文对齐
    toolbar.classList.add('qwq-align');

    const sw = createAutoHideSwitch();
    toolbar.appendChild(sw);

    const mdBtn = createMarkdownCopyButton();
    if (mdBtn) toolbar.appendChild(mdBtn);

    // 根据偏好自动隐藏
    applyAutoPreferenceOnLoad();

    return true;
  }

  /*** -------------------- 启动流程 -------------------- ***/
  function init() {
    ensureStyle();
    setupHotkeys();

    // 初次尝试安装并对齐
    const ready = installIntoToolbar();
    alignContainers();

    // 监听后续动态节点（工具条/提交容器等可能晚到）
    if (!ready) {
      const mo = new MutationObserver(() => {
        const ok = installIntoToolbar();
        alignContainers();
        if (ok) {
          // 工具条已安装后仍保留 align 的观察，便于 late-load 的提交容器
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } else {
      const mo2 = new MutationObserver(alignContainers);
      mo2.observe(document.body, { childList: true, subtree: true });
    }
  }

  init();
})();
