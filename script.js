const contentGrid = document.getElementById('content');
const topSelect = document.getElementById('top-select');
const tabBtns = document.querySelectorAll('.tab-btn');
const langToggle = document.getElementById('lang-toggle');
const footerText = document.getElementById('footer-text');
const topLabel = document.getElementById('top-label');

let currentTab = 'th';
let currentTop = parseInt(topSelect.value);
let currentLang = 'th';
let favorites = JSON.parse(localStorage.getItem('favorites')||'[]');
let lastVideos = [];

const LANG = {
  th:{
    tabs:{th:'ไทย', global:'ทั่วโลก', favorite:'รายการโปรด', topchart:'Top Charts', trending:'Trending Channels'},
    top:'Top N:', fav:'ลบออก', favAdd:'Favorite', views:'views', footer:'© 2025 ncrstation — Powered by YouTube API'
  },
  en:{
    tabs:{th:'Thailand', global:'Global', favorite:'Favorite', topchart:'Top Charts', trending:'Trending Channels'},
    top:'Top N:', fav:'Remove', favAdd:'Favorite', views:'views', footer:'© 2025 ncrstation — Powered by YouTube API'
  }
};

// --- Language Toggle ---
langToggle.addEventListener('click',()=>{
  currentLang = currentLang==='th' ? 'en':'th';
  updateLanguage();
  loadTab(currentTab);
});

function updateLanguage(){
  tabBtns.forEach(btn=>{
    btn.textContent = LANG[currentLang].tabs[btn.dataset.tab];
  });
  topLabel.childNodes[0].textContent = LANG[currentLang].top;
  footerText.textContent = LANG[currentLang].footer;
  langToggle.textContent = currentLang==='th' ? 'ENG':'ไทย';
}

// --- Top N change ---
topSelect.addEventListener('change',()=>{
  currentTop=parseInt(topSelect.value);
  loadTab(currentTab);
});

// --- Tab switch ---
tabBtns.forEach(btn=>{
  btn.addEventListener('click',()=>{
    currentTab=btn.dataset.tab;
    loadTab(currentTab);
  });
});

// --- Load Tab ---
async function loadTab(tab){
  contentGrid.innerHTML='<p>Loading...</p>';
  if(tab==='trending'){ loadTrending(); }
  else if(tab==='favorite'){ renderVideos(lastVideos.filter(v=>favorites.includes(v.id))); }
  else { await loadVideos(tab); }
}

// --- Load Videos ---
async function loadVideos(region){
  try {
    const regionCode = region==='th'?'TH':'US';
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=${currentTop}&key=${API_KEY}&videoCategoryId=10`;
    const res = await fetch(url);
    const data = await res.json();
    lastVideos = data.items;
    renderVideos(data.items);
  } catch(err){
    console.error(err);
    contentGrid.innerHTML='<p>Error loading videos.</p>';
  }
}

// --- Render Videos ---
function renderVideos(videos){
  contentGrid.innerHTML='';
  if(videos.length===0){ contentGrid.innerHTML='<p>No videos</p>'; return; }
  videos.forEach((v,idx)=>{
    const {title, thumbnails, channelTitle} = v.snippet;
    const views = v.statistics.viewCount;
    const videoId = v.id;
    let rankClass = idx===0?'rank-1':idx===1?'rank-2':idx===2?'rank-3':'rank-other';
    const isFav = favorites.includes(videoId)?'favorited':'';

    const card = document.createElement('div');
    card.className='card';
    card.innerHTML=`
      <div class="rank ${rankClass}">#${idx+1}</div>
      <img class="thumb" src="${thumbnails.medium.url}" alt="${title}">
      <iframe class="preview" src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}"></iframe>
      <h3>${title}</h3>
      <p>${channelTitle}</p>
      <p>${Number(views).toLocaleString()} ${LANG[currentLang].views}</p>
      <button class="btn-fav ${isFav}">${favorites.includes(videoId)?LANG[currentLang].fav:LANG[currentLang].favAdd}</button>
      <a class="btn-youtube" href="https://www.youtube.com/watch?v=${videoId}" target="_blank">YouTube</a>
    `;

    const thumb = card.querySelector('.thumb');
    const iframe = card.querySelector('.preview');
    iframe.style.display='none';
    card.addEventListener('mouseenter',()=>{ if(window.matchMedia("(hover:hover)").matches){ thumb.style.display='none'; iframe.style.display='block'; } });
    card.addEventListener('mouseleave',()=>{ if(window.matchMedia("(hover:hover)").matches){ iframe.style.display='none'; thumb.style.display='block'; } });

    const favBtn = card.querySelector('.btn-fav');
    favBtn.addEventListener('click',()=>{
      if(favorites.includes(videoId)) favorites=favorites.filter(id=>id!==videoId);
      else favorites.push(videoId);
      localStorage.setItem('favorites',JSON.stringify(favorites));
      loadTab(currentTab);
    });

    contentGrid.appendChild(card);
  });
}

// --- Trending Channels ---
async function loadTrending(){
  contentGrid.innerHTML='<p>Loading Trending Channels...</p>';
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=20&key=${API_KEY}&videoCategoryId=10`;
    const res = await fetch(url);
    const data = await res.json();
    const channelsMap = {};
    for(const v of data.items){
      const chId = v.snippet.channelId;
      if(!channelsMap[chId]) channelsMap[chId] = {title:v.snippet.channelTitle, channelId:chId};
    }
    const channelIds = Object.keys(channelsMap).slice(0,10).join(',');
    const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${API_KEY}`;
    const chRes = await fetch(chUrl);
    const chData = await chRes.json();
    contentGrid.innerHTML='';
    chData.items.forEach((ch,idx)=>{
      const card = document.createElement('div');
      card.className='channel-card';
      const subs = Number(ch.statistics.subscriberCount).toLocaleString();
      card.innerHTML=`
        <img src="${ch.snippet.thumbnails.default.url}" alt="${ch.snippet.title}">
        <div>
          <h3>${ch.snippet.title}</h3>
          <p>${subs} subscribers</p>
        </div>
      `;
      contentGrid.appendChild(card);
    });
  } catch(err){
    console.error(err);
    contentGrid.innerHTML='<p>Error loading trending channels.</p>';
  }
}

// --- Load default tab ---
updateLanguage();
loadTab(currentTab);
