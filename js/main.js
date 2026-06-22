'use strict';

/* =============================================
   DOM 요소 선택
   ============================================= */
const header         = document.querySelector('#header');
const navMenu        = document.querySelector('#nav-menu');
const navLinks       = document.querySelectorAll('.nav__link');
const hamburger      = document.querySelector('#hamburger');
const themeToggle    = document.querySelector('#theme-toggle');
const themeIcon      = document.querySelector('#theme-icon');
const scrollTopBtn   = document.querySelector('#scroll-top');
const projectsGrid   = document.querySelector('#projects-grid');
const projectsStatus = document.querySelector('#projects-status');
const filterBtns     = document.querySelector('#filter-btns');
const contactForm    = document.querySelector('#contact-form');
const formSuccess    = document.querySelector('#form-success');

/* =============================================
   1. 다크 모드
   이벤트 → isDark 상태 변경 → 화면 업데이트
   ============================================= */
let isDark = localStorage.getItem('theme') === 'dark';

function applyTheme(dark) {
  isDark = dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeIcon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

applyTheme(isDark); // 저장된 설정 복원

themeToggle.addEventListener('click', () => {
  applyTheme(!isDark);
});

/* =============================================
   2. 햄버거 메뉴
   classList.toggle('active') 활용
   ============================================= */
hamburger.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  hamburger.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

// 메뉴 링크 클릭 시 닫기
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

/* =============================================
   3. 부드러운 스크롤
   ============================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* =============================================
   4. 스크롤 이벤트
   - nav 배경 변경: 60px 기준 (README에 명시)
   - 스크롤 탑 버튼: 300px 기준 (README에 명시)
   - 활성 nav 링크 추적
   ============================================= */
function onScroll() {
  const scrollY = window.scrollY;

  header.classList.toggle('scrolled', scrollY > 60);
  scrollTopBtn.classList.toggle('visible', scrollY > 300);

  const sections = document.querySelectorAll('section[id]');
  let current = '';
  sections.forEach(sec => {
    if (scrollY >= sec.offsetTop - 80) current = sec.id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* =============================================
   5. 스크롤 탑 버튼
   ============================================= */
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* =============================================
   6. 스크롤 애니메이션 (Intersection Observer)
   threshold: 0.15 (README에 명시)
   ============================================= */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* =============================================
   7. GitHub API 연동
   이벤트 → 상태 변경 → Projects 렌더링
   상태: 'loading' | 'success' | 'error' | 'empty'
   ============================================= */

// ★ 본인의 GitHub 아이디로 변경하세요 ★
const GITHUB_USERNAME = 'loader1017';

let allRepos     = [];
let currentLang  = 'all';

const langColors = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python:     '#3572A5',
  HTML:       '#e34c26',
  CSS:        '#563d7c',
  Java:       '#b07219',
  Shell:      '#89e051',
  Vue:        '#41b883',
};

function renderStatus(state) {
  switch (state) {
    case 'loading':
      projectsStatus.innerHTML = `<div class="spinner"></div><p>불러오는 중...</p>`;
      projectsGrid.innerHTML = '';
      break;
    case 'error':
      projectsStatus.innerHTML = `
        <p>프로젝트를 불러올 수 없습니다.</p>
        <button class="retry-btn" id="retry-btn">다시 시도</button>
      `;
      projectsGrid.innerHTML = '';
      document.querySelector('#retry-btn').addEventListener('click', fetchRepos);
      break;
    case 'empty':
      projectsStatus.innerHTML = `<p>표시할 프로젝트가 없습니다.</p>`;
      projectsGrid.innerHTML = '';
      break;
    case 'success':
      projectsStatus.innerHTML = '';
      break;
  }
}

function renderCards(repos) {
  if (!repos.length) { renderStatus('empty'); return; }

  projectsGrid.innerHTML = repos.map(repo => {
    const { name, description, html_url, language, stargazers_count } = repo;
    const color = langColors[language] || '#888';
    return `
      <article class="project-card">
        <div class="project-card__top">
          <h3 class="project-card__name">${name}</h3>
          <a href="${html_url}" target="_blank" rel="noopener noreferrer"
             class="project-card__link" aria-label="${name} GitHub">
            <i class="fa-brands fa-github"></i>
          </a>
        </div>
        <p class="project-card__desc">${description || '설명이 없습니다.'}</p>
        <div class="project-card__meta">
          ${language ? `<span><span class="lang-dot" style="background:${color}"></span>${language}</span>` : ''}
          <span><i class="fa-solid fa-star" style="color:#f0b429"></i> ${stargazers_count}</span>
        </div>
      </article>
    `;
  }).join('');
}

function renderFilters(repos) {
  // 언어 목록 추출 (보너스: 언어별 필터)
  const langs = ['all', ...new Set(repos.map(r => r.language).filter(Boolean))];
  filterBtns.innerHTML = langs.map(lang => `
    <button class="filter-btn ${lang === currentLang ? 'active' : ''}" data-lang="${lang}">
      ${lang === 'all' ? 'All' : lang}
    </button>
  `).join('');

  filterBtns.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang;
      filterBtns.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 필터 상태 변경 → 카드 목록 변경
      const filtered = currentLang === 'all'
        ? allRepos
        : allRepos.filter(r => r.language === currentLang);
      renderCards(filtered);
    });
  });
}

async function fetchRepos() {
  renderStatus('loading');
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=30&sort=updated`);
    if (res.status === 403) throw new Error('rate limit');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    allRepos = data.filter(r => !r.fork);

    if (!allRepos.length) {
      renderStatus('empty');
    } else {
      renderStatus('success');
      renderCards(allRepos);
      renderFilters(allRepos);
    }
  } catch (err) {
    console.error('GitHub API 오류:', err);
    renderStatus('error');
  }
}

fetchRepos();

/* =============================================
   8. 폼 유효성 검사
   이벤트 → validationState 변경 → 에러 표시
   ============================================= */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validationState = { name: false, email: false, message: false };

function validateField(id) {
  const input = document.querySelector(`#${id}`);
  const error = document.querySelector(`#${id}-error`);
  const val   = input.value.trim();
  let msg     = '';

  if (id === 'name'    && !val)                   msg = '이름을 입력해주세요.';
  if (id === 'email'   && !val)                   msg = '이메일을 입력해주세요.';
  if (id === 'email'   && val && !emailRegex.test(val)) msg = '이메일 형식이 올바르지 않습니다.';
  if (id === 'message' && !val)                   msg = '메시지를 입력해주세요.';

  validationState[id] = !msg;
  error.textContent   = msg;
  input.classList.toggle('error', !!msg);
  return !msg;
}

['name', 'email', 'message'].forEach(id => {
  document.querySelector(`#${id}`).addEventListener('input', () => validateField(id));
});

contactForm.addEventListener('submit', e => {
  e.preventDefault();

  const ok = ['name', 'email', 'message'].map(validateField).every(Boolean);
  if (!ok) return;

  const btn = document.querySelector('#submit-btn');
  btn.disabled    = true;
  btn.textContent = '전송 중...';

  setTimeout(() => {
    contactForm.reset();
    ['name', 'email', 'message'].forEach(id => {
      validationState[id] = false;
      document.querySelector(`#${id}`).classList.remove('error');
      document.querySelector(`#${id}-error`).textContent = '';
    });
    formSuccess.classList.add('visible');
    btn.disabled    = false;
    btn.textContent = '메시지 보내기';
    setTimeout(() => formSuccess.classList.remove('visible'), 3000);
  }, 500);
});
