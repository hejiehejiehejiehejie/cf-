// ==UserScript==
// @name         QwQ
// @namespace    https://codeforces.com/
// @version      4.2
// @description  极致极简阅读视图：去除冗余功能，幽灵悬浮窗隐藏侧边栏；完美自适应深浅色模式
// @match        https://codeforces.com/problemset/problem/*/*
// @match        https://codeforces.com/contest/*/problem/*
// @match        https://codeforces.com/gym/*/problem/*
// @match        https://codeforces.com/group/*/contest/*/problem/*
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

  // 仅保留阅读模式图标
  const ICON_READ_MODE = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;

  const inEditable = (e) => {
    const t = e.target;
    return t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.nodeName));
  };

  /*** -------------------- 样式 -------------------- ***/
  const STYLE = `
    :root {
      --qwq-page-pad: clamp(12px, 3.2vw, 28px);
      --qwq-wide-max: 1280px;
      --qwq-content-max: 1100px;
    }

    body.cf-hide-sidebar #sidebar { display: none !important; }

    body.cf-hide-sidebar #pageContent {
      margin-left: auto !important;
      margin-right: auto !important;
      max-width: var(--qwq-wide-max) !important;
      box-sizing: border-box;
    }

    body.cf-hide-sidebar .qwq-align {
      margin-left: auto !important;
      margin-right: auto !important;
      padding-left: var(--qwq-page-pad) !important;
      padding-right: var(--qwq-page-pad) !important;
      max-width: var(--qwq-content-max) !important;
      box-sizing: border-box;
    }

    body.cf-hide-sidebar .problem-statement {
      margin-left: auto !important;
      margin-right: auto !important;
      padding-left: var(--qwq-page-pad) !important;
      padding-right: var(--qwq-page-pad) !important;
      max-width: var(--qwq-content-max) !important;
      box-sizing: border-box;
    }

    body.cf-hide-sidebar .problem-statement img,
    body.cf-hide-sidebar .problem-statement svg { max-width: 100%; height: auto; }
    body.cf-hide-sidebar .problem-statement table { display: block; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    body.cf-hide-sidebar .problem-statement pre,
    body.cf-hide-sidebar .problem-statement code,
    body.cf-hide-sidebar pre,
    body.cf-hide-sidebar .problem-statement .MathJax_Display { max-width: 100%; overflow: auto; }
    body.cf-hide-sidebar .problem-statement,
    body.cf-hide-sidebar .ttypography { overflow-wrap: anywhere; word-break: normal; }

    /* =========================================
       极致幽灵悬浮窗 UI
       ========================================= */
    #qwq-minimal-fab {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 36px;
      height: 36px;
      z-index: 999999;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      color: inherit; /* 自动继承页面的文字颜色，完美兼容深浅色 */
      background: transparent;
      opacity: 0.15; /* 默认极低存在感 */
      transition: all 0.3s ease;
    }

    /* 鼠标悬停时才显现 */
    #qwq-minimal-fab:hover {
      opacity: 0.8;
      background: rgba(127, 127, 127, 0.15); /* 微微的灰色玻璃感底色 */
      backdrop-filter: blur(2px);
    }

    /* 开启阅读模式时的状态 */
    #qwq-minimal-fab.active {
      opacity: 0.35; /* 开启时稍微亮一点点，方便知道状态 */
    }
    #qwq-minimal-fab.active:hover {
      opacity: 1;
    }
    /* =========================================
       深色模式 UI 深度优化 (修复 Logo 定位版)
       ========================================= */

    /* 1. 修复顶部白色 Logo：利用 alt 和 src 属性精准锁定元素 */
    img[alt="Codeforces"],
    img[src*="codeforces-sponsored-by-ton"] {
      /* 核心：反色 -> 色相归位 -> 微微提亮色彩 */
      filter: invert(0.88) hue-rotate(180deg) brightness(1.2);
      transition: filter 0.3s ease;

      /* 可选：如果你发现 Logo 边缘有去不干净的黑色细边框，可以取消下面这行的注释 */
      /* mix-blend-mode: screen; */
    }

    /* 鼠标悬停时稍微发光 */
    img[alt="Codeforces"]:hover,
    img[src*="codeforces-sponsored-by-ton"]:hover {
      filter: invert(1) hue-rotate(180deg) brightness(1.5) drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
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

  /*** -------------------- 行为控制 -------------------- ***/
  const Sidebar = {
    enable() {
      ensureStyle();
      document.body.classList.add('cf-hide-sidebar');
      localStorage.setItem(STORAGE_KEY, 'on');
      const btn = document.getElementById('qwq-minimal-fab');
      if(btn) btn.classList.add('active');
    },
    disable() {
      document.body.classList.remove('cf-hide-sidebar');
      localStorage.setItem(STORAGE_KEY, 'off');
      const btn = document.getElementById('qwq-minimal-fab');
      if(btn) btn.classList.remove('active');
    },
    toggle() { this.active ? this.disable() : this.enable(); },
    get active() { return document.body.classList.contains('cf-hide-sidebar'); },
    init() { if (localStorage.getItem(STORAGE_KEY) === 'on') { this.enable(); } }
  };

  /*** -------------------- UI 挂载 -------------------- ***/
  function installFloatingUI() {
    if (document.getElementById('qwq-minimal-fab')) return;

    const readBtn = document.createElement('div');
    readBtn.id = 'qwq-minimal-fab';
    readBtn.title = '切换阅读视图 (Alt+Q)';
    readBtn.innerHTML = ICON_READ_MODE;

    if (Sidebar.active) readBtn.classList.add('active');

    readBtn.addEventListener('click', () => Sidebar.toggle());
    document.body.appendChild(readBtn);
  }

  function setupHotkeys() {
    document.addEventListener('keydown', (e) => {
      if (!inEditable(e) && e.altKey && e.key && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        Sidebar.toggle();
      }
    }, { passive: false });
  }

  /*** -------------------- 容器对齐保护 -------------------- ***/
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
      document.querySelectorAll(sel).forEach((el) => { el.classList.add('qwq-align'); });
    });
  }

  function init() {
    ensureStyle();
    Sidebar.init();
    setupHotkeys();
    installFloatingUI();
    alignContainers();

    const mo = new MutationObserver(() => { alignContainers(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  init();
})();
