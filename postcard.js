(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('#motion');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let userChoice;
  try { userChoice = localStorage.getItem('medseg-journal-motion'); } catch {}
  function motion(enabled) {
    root.dataset.motion = enabled ? 'on' : 'off';
    toggle.setAttribute('aria-pressed',String(enabled));
    toggle.querySelector('span').textContent = enabled ? '动效开' : '动效关';
  }
  motion(userChoice ? userChoice === 'on' : !preference.matches);
  preference.addEventListener('change', e => { if (!userChoice) motion(!e.matches); });
  toggle.addEventListener('click', () => {
    motion(root.dataset.motion !== 'on');
    userChoice = root.dataset.motion;
    try { localStorage.setItem('medseg-journal-motion',userChoice); } catch {}
  });
  const messages = {
    chi:['Chiikawa　·　呜哇～这朵小花送给今天的你。','Chiikawa　·　想换一张观察？翻翻下面的样本夹。'],
    nai:['奶娃　·　肚肚站稳啦，来试试 CT 筛查！','奶娃　·　种子点选好，轮廓就能慢慢长出来啦。'],
    fish:['蓝色大肥鱼　·　我的小本本，专门记病灶的面积。','蓝色大肥鱼　·　咕噜～翻开报告，今天的测量都在里面。']
  };
  const counts = {chi:0,nai:0,fish:0};
  for (const button of document.querySelectorAll('[data-pal]')) {
    button.addEventListener('click', () => {
      const id = button.dataset.pal;
      document.querySelector('#palNote').textContent = messages[id][counts[id]++ % messages[id].length];
      const spark = document.querySelector('#spark');
      spark.style.left = ({chi:25,nai:48,fish:72})[id]+'%';
      spark.textContent = ({chi:'✿',nai:'✧',fish:'◌'})[id];
      if (root.dataset.motion === 'on') spark.animate([{transform:'translateY(4px) scale(.5)',opacity:0},{transform:'translateY(-9px) scale(1.1)',opacity:1,offset:.35},{transform:'translateY(-31px)',opacity:0}],{duration:660});
    });
  }
})();
