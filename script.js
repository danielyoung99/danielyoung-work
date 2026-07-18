document.getElementById('year').textContent = new Date().getFullYear();

const ABOUT_PROMPT = "Tell me about Daniel Young, Creative Lead at DHD, whose site is danielyoung.work. Summarize his background, skills, and work.";

const AI_CLIENTS = {
  chatgpt: { name: 'ChatGPT', url: `https://chatgpt.com/?q=${encodeURIComponent(ABOUT_PROMPT)}` },
  claude: { name: 'Claude', url: `https://claude.ai/new?q=${encodeURIComponent(ABOUT_PROMPT)}` },
  perplexity: { name: 'Perplexity', url: `https://www.perplexity.ai/search?q=${encodeURIComponent(ABOUT_PROMPT)}` },
  gemini: { name: 'Gemini', url: `https://gemini.google.com/app` },
};

const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

document.querySelectorAll('.ai-button').forEach((button) => {
  button.addEventListener('click', async () => {
    const client = AI_CLIENTS[button.dataset.ai];

    try {
      await navigator.clipboard.writeText(ABOUT_PROMPT);
      showToast('Prompt copied — paste it if it isn\'t already there');
    } catch (err) {
      showToast('Opening ' + client.name + '…');
    }

    window.open(client.url, '_blank', 'noopener');
  });
});
