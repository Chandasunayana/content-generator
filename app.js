const defaultConfig = {
  background_color: "#0f172a",
  surface_color: "#1e293b",
  text_color: "#f1f5f9",
  primary_action_color: "#3b82f6",
  secondary_action_color: "#1e293b",
  font_family: "Inter",
  font_size: 14,
  landing_title: "Creator's Intelligence",
  landing_tagline: "Your AI Partner for YouTube Content Creation",
  landing_description: "Generate engaging YouTube titles, descriptions, hashtags, and full scripts in seconds. Tailored for your audience, powered by creative AI.",
  get_started_text: "Get Started",
  input_header: "Describe your YouTube video",
  input_subtitle: "The more context you share, the smarter the titles, descriptions, and scripts become.",
  output_header: "Your AI-Generated Content",
  history_header: "Saved Content History",
  about_header: "About This Project",
  about_body: "This prototype simulates an AI assistant built for YouTube creators. It walks through the full flow: from entering a video idea, to seeing generated titles, descriptions, hashtags, thumbnail ideas, and a script outline — all in one place.",
  settings_header: "Settings & Personalization",
  footer_text: "AI-powered content generation for modern creators"
};

function applyConfigToUI(config) {
  const merged = { ...defaultConfig, ...config };
  
  // Apply text content
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("landing-title", merged.landing_title);
  setText("landing-tagline", merged.landing_tagline);
  setText("landing-description", merged.landing_description);
  setText("get-started-text", merged.get_started_text);
  setText("input-header", merged.input_header);
  setText("input-subtitle", merged.input_subtitle);
  setText("output-header", merged.output_header);
  setText("history-header", merged.history_header);
  setText("about-header", merged.about_header);
  setText("about-body", merged.about_body);
  setText("settings-header", merged.settings_header);

  // Apply font
  const baseFont = merged.font_family || defaultConfig.font_family;
  const fontStack = `${baseFont}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  document.body.style.fontFamily = fontStack;

  // Apply colors via CSS variables
  document.documentElement.style.setProperty('--accent-primary', merged.primary_action_color);
  document.documentElement.style.setProperty('--bg-primary', merged.background_color);
  document.documentElement.style.setProperty('--text-primary', merged.text_color);
}

if (window.elementSdk) {
  window.elementSdk.init({
    defaultConfig,
    onConfigChange: async (config) => {
      applyConfigToUI(config);
    },
    mapToCapabilities: (config) => {
      const current = config || defaultConfig;
      return {
        recolorables: [
          {
            get: () => current.background_color || defaultConfig.background_color,
            set: (value) => {
              current.background_color = value;
              window.elementSdk.setConfig({ background_color: value });
            }
          },
          {
            get: () => current.surface_color || defaultConfig.surface_color,
            set: (value) => {
              current.surface_color = value;
              window.elementSdk.setConfig({ surface_color: value });
            }
          },
          {
            get: () => current.text_color || defaultConfig.text_color,
            set: (value) => {
              current.text_color = value;
              window.elementSdk.setConfig({ text_color: value });
            }
          },
          {
            get: () => current.primary_action_color || defaultConfig.primary_action_color,
            set: (value) => {
              current.primary_action_color = value;
              window.elementSdk.setConfig({ primary_action_color: value });
            }
          },
          {
            get: () => current.secondary_action_color || defaultConfig.secondary_action_color,
            set: (value) => {
              current.secondary_action_color = value;
              window.elementSdk.setConfig({ secondary_action_color: value });
            }
          }
        ],
        borderables: [],
        fontEditable: {
          get: () => current.font_family || defaultConfig.font_family,
          set: (value) => {
            current.font_family = value;
            window.elementSdk.setConfig({ font_family: value });
          }
        },
        fontSizeable: {
          get: () => current.font_size || defaultConfig.font_size,
          set: (value) => {
            current.font_size = value;
            window.elementSdk.setConfig({ font_size: value });
          }
        }
      };
    },
    mapToEditPanelValues: (config) => {
      const c = { ...defaultConfig, ...config };
      return new Map([
        ["landing_title", c.landing_title],
        ["landing_tagline", c.landing_tagline],
        ["landing_description", c.landing_description],
        ["get_started_text", c.get_started_text],
        ["input_header", c.input_header],
        ["input_subtitle", c.input_subtitle],
        ["output_header", c.output_header],
        ["history_header", c.history_header],
        ["about_header", c.about_header],
        ["about_body", c.about_body],
        ["settings_header", c.settings_header],
        ["footer_text", c.footer_text]
      ]);
    }
  });
  applyConfigToUI(window.elementSdk.config || defaultConfig);
} else {
  applyConfigToUI(defaultConfig);
}

// ==========================================
// 2. STORAGE SYSTEM (Data SDK + localStorage fallback)
// ==========================================
let currentRecords = [];
let lastGeneratedContent = null;
let dataSdkReady = false;
let useLocalStorage = false;

const STORAGE_KEY = 'creator_intelligence_history';

// LocalStorage Helper Functions
function loadFromLocalStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return [];
  }
}

function saveToLocalStorage(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
}

function addToLocalStorage(record) {
  const records = loadFromLocalStorage();
  const newRecord = {
    ...record,
    __backendId: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  };
  records.push(newRecord);
  saveToLocalStorage(records);
  return newRecord;
}

// Data Handler
const dataHandler = {
  onDataChanged(data) {
    currentRecords = data || [];
    renderHistoryList();
  }
};

async function initDataSdk() {
  if (!window.dataSdk) {
    console.log("Data SDK not available - using localStorage fallback");
    useLocalStorage = true;
    dataSdkReady = true;
    // Load from localStorage
    currentRecords = loadFromLocalStorage();
    renderHistoryList();
    return;
  }
  
  try {
    const result = await window.dataSdk.init(dataHandler);
    if (result.isOk) {
      dataSdkReady = true;
      useLocalStorage = false;
      console.log("Data SDK initialized successfully");
    } else {
      console.log("Data SDK init failed, falling back to localStorage");
      useLocalStorage = true;
      dataSdkReady = true;
      currentRecords = loadFromLocalStorage();
      renderHistoryList();
    }
  } catch (error) {
    console.log("Data SDK error, falling back to localStorage");
    useLocalStorage = true;
    dataSdkReady = true;
    currentRecords = loadFromLocalStorage();
    renderHistoryList();
  }
}

// Initialize storage
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDataSdk);
} else {
  initDataSdk();
}

// ==========================================
// 3. NAVIGATION SYSTEM
// ==========================================
function navigateToScreen(screenName) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => {
    screen.classList.remove('active');
  });
  
  const targetScreen = document.getElementById('screen-' + screenName);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }
}

// Setup navigation buttons
document.querySelectorAll('[data-nav]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = e.currentTarget.getAttribute('data-nav');
    navigateToScreen(target);
  });
});

// ==========================================
// 4. TOAST NOTIFICATIONS
// ==========================================
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  toastMessage.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

document.getElementById('toast-close').addEventListener('click', () => {
  document.getElementById('toast').classList.remove('show');
});

// ==========================================
// 5. AI CONTENT GENERATION (SIMULATED)
// ==========================================
function generateTitles(topic, tone, audience, videoType) {
  const base = topic || "Your YouTube video";
  const variations = [
    [
      `${base} – Complete ${tone} Guide for ${audience}`,
      `How I Mastered ${base} (Step-by-Step Tutorial)`,
      `${base}: Everything You Need to Know in 2024`,
      `The Ultimate ${base} Strategy That Actually Works`,
      `${base} Explained in 10 Minutes (${videoType})`,
      `Stop Doing ${base} Wrong – Here's the Right Way`,
      `${base}: From Beginner to Pro in 30 Days`,
      `I Tried ${base} for 90 Days – Here's What Happened`,
      `${base} Secrets Nobody Tells You About`,
      `The Only ${base} Video You'll Ever Need`
    ],
    [
      `${base} – The ${tone} Approach That Changed Everything`,
      `Master ${base} in Record Time (Proven Method)`,
      `${base}: The 2024 Blueprint for ${audience}`,
      `Why ${base} is Easier Than You Think`,
      `${base} Tutorial – ${videoType} Edition`,
      `The ${base} Mistakes Costing You Success`,
      `${base}: Zero to Hero in 60 Days`,
      `My ${base} Journey – Results After 6 Months`,
      `Hidden ${base} Techniques Pros Use Daily`,
      `Everything About ${base} in One Video`
    ],
    [
      `${base} – ${tone} Masterclass for ${audience}`,
      `The ${base} System That Actually Works`,
      `${base}: Advanced Strategies for 2024`,
      `How to Dominate ${base} Like a Pro`,
      `${base} Crash Course (${videoType})`,
      `Common ${base} Errors and How to Fix Them`,
      `${base}: Complete Transformation Guide`,
      `I Tested ${base} for 3 Months – Shocking Results`,
      `${base} Hacks Nobody Talks About`,
      `The Definitive ${base} Tutorial`
    ]
  ];
  
  const randomSet = variations[Math.floor(Math.random() * variations.length)];
  return randomSet;
}

function generateDescription(topic, tone, audience, keywords, videoType) {
  const kw = keywords ? `Key topics: ${keywords}\n\n` : "";
  return `${topic}\n\n${kw}This ${videoType.toLowerCase()} is designed in a ${tone.toLowerCase()} tone for ${audience.toLowerCase()}. You'll learn practical strategies you can use immediately.\n\n⏱️ TIMESTAMPS:\n00:00 – Introduction\n02:15 – Core concepts explained\n05:30 – Real-world examples\n08:45 – Pro tips and tricks\n12:00 – Final thoughts & next steps\n\n👍 If this helped, please like, subscribe, and share!\n\n#${topic.replace(/\s+/g, '')} #YouTube #ContentCreation`;
}

function generateHashtags(topic, audience, keywords) {
  const tags = [
    "#youtube", "#contentcreator", "#youtubetips", "#youtubegrowth",
    "#videomarketing", "#socialmedia", "#contentcreation", "#youtuber",
    "#digitalmarketing", "#youtubechannel", "#contentmarketing", "#videocontent",
    "#youtubestrategy", "#growyourchannel", "#youtubealgorithm"
  ];
  
  if (topic) tags.push("#" + topic.toLowerCase().replace(/\s+/g, ""));
  if (audience) tags.push("#" + audience.toLowerCase().replace(/\s+/g, ""));
  
  return tags.slice(0, 20).join(" ");
}

function generateThumbnails(topic, tone) {
  return [
    `Bold text "${topic}" with contrasting background colors (red/yellow split)`,
    `Close-up of creator with shocked expression pointing at text overlay`,
    `Before/After comparison split screen with clear visual difference`,
    `Minimalist design: Large text on solid color with small icon/emoji`,
    `Over-the-shoulder shot of screen/workspace with highlighted element`
  ];
}

function generateScript(topic, audience, videoType) {
  return `🎬 INTRO (0:00 - 0:30)
Hook: Start with a bold statement or question about "${topic}"
Preview the transformation viewers will experience
Quick self-introduction

📚 CONTEXT (0:30 - 2:00)
Explain why ${audience.toLowerCase()} need to know about this
Common mistakes people make
What makes this approach different

🎯 MAIN CONTENT (2:00 - 10:00)
Step 1: Foundation and preparation
Step 2: Core implementation strategy
Step 3: Advanced techniques and optimization
Step 4: Common pitfalls to avoid

💡 EXAMPLES (10:00 - 12:00)
Real-world case study or demonstration
Show actual results and outcomes

🎁 CONCLUSION (12:00 - 13:00)
Recap the 3 key takeaways
Call-to-action: Like, subscribe, comment
Tease next video topic`;
}

function generateAllContent(formData) {
  const { topic, tone, audience, keywords, videoType } = formData;
  
  return {
    topic,
    tone,
    audience,
    keywords,
    videoType,
    titles: generateTitles(topic, tone, audience, videoType),
    description: generateDescription(topic, tone, audience, keywords, videoType),
    hashtags: generateHashtags(topic, audience, keywords),
    thumbnails: generateThumbnails(topic, tone),
    script: generateScript(topic, audience, videoType)
  };
}

// ==========================================
// 6. INPUT FORM HANDLING
// ==========================================
document.getElementById('btn-get-started').addEventListener('click', () => {
  navigateToScreen('input');
});

document.getElementById('input-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    topic: document.getElementById('topic').value.trim(),
    tone: document.getElementById('tone').value,
    audience: document.getElementById('audience').value,
    keywords: document.getElementById('keywords').value,
    videoType: document.getElementById('videoType').value
  };

  if (!formData.topic) {
    showToast("Please enter a video topic", true);
    return;
  }

  const btnGenerate = document.getElementById('btn-generate');
  btnGenerate.disabled = true;
  btnGenerate.innerHTML = '<span>Generating...</span>';

  // Show loading screen
  navigateToScreen('loading');

  // Animate progress bars
  setTimeout(() => {
    document.getElementById('progress-1').style.width = '100%';
  }, 300);
  setTimeout(() => {
    document.getElementById('progress-2').style.width = '100%';
  }, 800);
  setTimeout(() => {
    document.getElementById('progress-3').style.width = '100%';
  }, 1300);

  // Generate content after delay
  setTimeout(() => {
    lastGeneratedContent = generateAllContent(formData);
    renderOutput(lastGeneratedContent);
    navigateToScreen('output');
    
    btnGenerate.disabled = false;
    btnGenerate.innerHTML = '<span>Generate Content</span><span>⚡</span>';
    
    // Reset progress bars
    document.getElementById('progress-1').style.width = '0%';
    document.getElementById('progress-2').style.width = '0%';
    document.getElementById('progress-3').style.width = '0%';
  }, 2000);
});

// ==========================================
// 7. OUTPUT RENDERING
// ==========================================
function renderOutput(content) {
  // Titles
  const titlesList = document.getElementById('output-titles');
  titlesList.innerHTML = '';
  content.titles.forEach((title, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${title}`;
    titlesList.appendChild(li);
  });

  // Description
  document.getElementById('output-description').textContent = content.description;

  // Hashtags
  document.getElementById('output-hashtags').textContent = content.hashtags;

  // Thumbnails
  const thumbList = document.getElementById('output-thumbnails');
  thumbList.innerHTML = '';
  content.thumbnails.forEach((thumb, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${thumb}`;
    thumbList.appendChild(li);
  });

  // Script
  document.getElementById('output-script').textContent = content.script;
}

// ==========================================
// 8. OUTPUT ACTIONS
// ==========================================
document.getElementById('btn-edit').addEventListener('click', () => {
  navigateToScreen('input');
});

document.getElementById('btn-regenerate').addEventListener('click', () => {
  if (!lastGeneratedContent) {
    showToast("No content to regenerate", true);
    return;
  }
  
  const btnRegenerate = document.getElementById('btn-regenerate');
  btnRegenerate.disabled = true;
  btnRegenerate.textContent = 'Regenerating...';
  
  navigateToScreen('loading');
  
  // Animate progress bars
  setTimeout(() => {
    document.getElementById('progress-1').style.width = '100%';
  }, 200);
  setTimeout(() => {
    document.getElementById('progress-2').style.width = '100%';
  }, 600);
  setTimeout(() => {
    document.getElementById('progress-3').style.width = '100%';
  }, 1000);
  
  setTimeout(() => {
    const formData = {
      topic: lastGeneratedContent.topic,
      tone: lastGeneratedContent.tone,
      audience: lastGeneratedContent.audience,
      keywords: lastGeneratedContent.keywords,
      videoType: lastGeneratedContent.videoType
    };
    
    // Generate completely new content with variations
    lastGeneratedContent = generateAllContent(formData);
    lastGeneratedContent.timestamp = Date.now();
    
    renderOutput(lastGeneratedContent);
    navigateToScreen('output');
    
    btnRegenerate.disabled = false;
    btnRegenerate.textContent = 'Regenerate';
    
    // Reset progress bars
    document.getElementById('progress-1').style.width = '0%';
    document.getElementById('progress-2').style.width = '0%';
    document.getElementById('progress-3').style.width = '0%';
    
    showToast("Content regenerated successfully!");
  }, 1800);
});

document.getElementById('btn-save').addEventListener('click', async () => {
  if (!lastGeneratedContent) {
    showToast("No content to save", true);
    return;
  }

  if (!dataSdkReady) {
    showToast("Storage not ready. Please wait a moment.", true);
    return;
  }

  if (currentRecords.length >= 999) {
    showToast("History limit reached (999 items)", true);
    return;
  }

  const btnSave = document.getElementById('btn-save');
  btnSave.disabled = true;
  btnSave.textContent = 'Saving...';

  try {
    const truncate = (str, maxLength) => {
      if (!str) return "";
      return str.length > maxLength ? str.substring(0, maxLength) : str;
    };

    const payload = {
      topic: truncate(lastGeneratedContent.topic || "Untitled", 200),
      tone: lastGeneratedContent.tone || "Motivational",
      audience: lastGeneratedContent.audience || "Everyone",
      keywords: truncate(lastGeneratedContent.keywords || "", 200),
      video_type: lastGeneratedContent.videoType || "Long Video",
      title_1: truncate(lastGeneratedContent.titles[0] || "", 300),
      title_2: truncate(lastGeneratedContent.titles[1] || "", 300),
      title_3: truncate(lastGeneratedContent.titles[2] || "", 300),
      description: truncate(lastGeneratedContent.description || "", 1000),
      hashtags: truncate(lastGeneratedContent.hashtags || "", 500),
      thumbnail_1: truncate(lastGeneratedContent.thumbnails[0] || "", 300),
      thumbnail_2: truncate(lastGeneratedContent.thumbnails[1] || "", 300),
      script: truncate(lastGeneratedContent.script || "", 2000),
      created_at: new Date().toISOString()
    };

    if (useLocalStorage) {
      // Save to localStorage
      const newRecord = addToLocalStorage(payload);
      currentRecords = loadFromLocalStorage();
      renderHistoryList();
      showToast("Saved to local history successfully!");
    } else {
      // Save to Data SDK
      const result = await window.dataSdk.create(payload);
      
      if (result.isOk) {
        showToast("Saved to history successfully!");
      } else {
        showToast("Failed to save: " + (result.error?.message || "Unknown error"), true);
      }
    }
  } catch (error) {
    showToast("Error saving: " + error.message, true);
  }

  btnSave.disabled = false;
  btnSave.textContent = 'Save to History';
});

document.getElementById('btn-export').addEventListener('click', () => {
  if (!lastGeneratedContent) {
    showToast("No content to export", true);
    return;
  }

  const content = lastGeneratedContent;
  let text = `TOPIC: ${content.topic}\n\n`;
  text += `=== TITLES ===\n${content.titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n`;
  text += `=== DESCRIPTION ===\n${content.description}\n\n`;
  text += `=== HASHTAGS ===\n${content.hashtags}\n\n`;
  text += `=== THUMBNAIL IDEAS ===\n${content.thumbnails.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n`;
  text += `=== SCRIPT ===\n${content.script}`;

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'youtube-content.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Content exported successfully!");
});

// Copy buttons
document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = e.currentTarget.getAttribute('data-copy');
    let text = '';

    if (!lastGeneratedContent) {
      showToast("No content to copy", true);
      return;
    }

    if (target === 'titles') {
      text = lastGeneratedContent.titles.join('\n');
    } else if (target === 'description') {
      text = lastGeneratedContent.description;
    } else if (target === 'hashtags') {
      text = lastGeneratedContent.hashtags;
    } else if (target === 'script') {
      text = lastGeneratedContent.script;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      showToast("Copied to clipboard!");
    } catch (err) {
      showToast("Failed to copy", true);
    }
    
    document.body.removeChild(textarea);
  });
});

// ==========================================
// 9. HISTORY MANAGEMENT
// ==========================================
function renderHistoryList() {
  const emptyState = document.getElementById('history-empty');
  const historyList = document.getElementById('history-list');

  if (currentRecords.length === 0) {
    emptyState.style.display = 'block';
    historyList.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  historyList.style.display = 'grid';
  historyList.innerHTML = '';

  currentRecords.forEach(record => {
    const card = document.createElement('div');
    card.className = 'history-card';
    
    const date = new Date(record.created_at);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    const firstTitle = record.title_1 || 'No title';

    card.innerHTML = `
      <div class="history-card-date">${dateStr}</div>
      <div class="history-card-title">${firstTitle}</div>
      <div class="history-card-topic">${record.topic}</div>
    `;

    card.addEventListener('click', () => {
      showHistoryDetail(record);
    });

    historyList.appendChild(card);
  });
}

function showHistoryDetail(record) {
  const detail = document.getElementById('history-detail');
  const date = new Date(record.created_at);
  
  document.getElementById('history-detail-meta').textContent = 
    `Saved on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()} • ${record.tone} • ${record.audience}`;
  
  document.getElementById('history-detail-topic').textContent = record.topic;
  document.getElementById('history-detail-description').textContent = record.description;
  document.getElementById('history-detail-hashtags').textContent = record.hashtags;
  document.getElementById('history-detail-script').textContent = record.script;

  const titlesList = document.getElementById('history-detail-titles');
  titlesList.innerHTML = '';
  
  [record.title_1, record.title_2, record.title_3].forEach(title => {
    if (title) {
      const li = document.createElement('li');
      li.textContent = title;
      titlesList.appendChild(li);
    }
  });

  detail.style.display = 'block';
}

document.getElementById('history-detail-close').addEventListener('click', () => {
  document.getElementById('history-detail').style.display = 'none';
});

// ==========================================
// 10. THEME TOGGLE
// ==========================================
document.getElementById('theme-dark').addEventListener('click', () => {
  document.body.className = 'theme-dark';
  document.getElementById('theme-dark').classList.add('active');
  document.getElementById('theme-light').classList.remove('active');
  showToast("Dark theme activated");
});

document.getElementById('theme-light').addEventListener('click', () => {
  document.body.className = 'theme-light';
  document.getElementById('theme-light').classList.add('active');
  document.getElementById('theme-dark').classList.remove('active');
  showToast("Light theme activated");
});

// ==========================================
// 11. INITIALIZE APP
// ==========================================
navigateToScreen('landing');