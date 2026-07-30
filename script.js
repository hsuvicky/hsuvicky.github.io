const toggleButton = document.querySelector('.theme-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const storedTheme = localStorage.getItem('theme');

if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
  document.body.classList.add('dark');
} else {
  document.body.classList.remove('dark');
}

toggleButton?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
