(() => {
  const trail = document.getElementById('palTrail');
  const motion = document.getElementById('motion');
  const reduced = () => document.documentElement.dataset.motion === 'off';
  motion.addEventListener('click', () => { if (reduced()) trail.replaceChildren(); });
  document.addEventListener('click', event => {
    // Keep the actual segmentation surface clear, particularly while painting a mask.
    if (reduced() || !event.target.closest || event.target.closest('#medCanvas,input,textarea,select,#motion,.canvas-checker,pre')) return;
    let x = event.clientX, y = event.clientY;
    if (event.detail === 0) {
      const box = event.target.getBoundingClientRect();
      x = box.left + box.width / 2; y = box.top + box.height / 2;
    }
    if (trail.childElementCount >= 3) trail.firstElementChild.remove();
    const fish = document.createElement('i');
    fish.className = 'swim-stamp';
    const rightward = x < 100, dx = rightward ? 55 : -55, dy = y < 84 ? 38 : -45;
    fish.style.left = Math.max(4, Math.min(innerWidth-61, x-22)) + 'px';
    fish.style.top = Math.max(6, Math.min(innerHeight-48, y-27)) + 'px';
    trail.append(fish);
    const flip = rightward ? -1 : 1;
    const animation = fish.animate([
      {opacity:0,transform:'scale(.55) scaleX('+flip+')'},
      {opacity:1,offset:.22,transform:'translate('+dx*.25+'px,'+dy*.38+'px) scaleX('+flip+') rotate(-9deg)'},
      {opacity:1,offset:.63,transform:'translate('+dx*.72+'px,'+dy*.9+'px) scaleX('+flip+') rotate(7deg)'},
      {opacity:0,transform:'translate('+dx+'px,'+dy+'px) scale(.77) scaleX('+flip+')'}
    ],{duration:710,easing:'ease-out'});
    animation.onfinish = animation.oncancel = () => fish.remove();
  },true);
  for (const button of document.querySelectorAll('[data-pal]')) {
    button.addEventListener('click', () => {
      document.querySelector('.card-voice .pal-sticker').dataset.kind = button.dataset.pal;
    });
  }
  const controls = {
    spacingInput:'像素间距决定毫米值。请按当前影像的实际标定填写。',
    polaritySelect:'目标比周围亮，选高信号；色素区域较暗，选低亮度。',
    regionTolSlider:'容差越大，更多相近灰度的邻居会被纳入轮廓。',
    otsuThrSlider:'移动阈值，观察哪些像素进入了掩膜。',
    autoSensSlider:'调高灵敏度，观察候选区域的数量和边界。',
    brushRadiusSlider:'大画笔补内部，小画笔收边缘。',
    minAreaSlider:'把面积下限调大，可以滤掉较小的候选区域。'
  };
  const modeTips = {region:controls.regionTolSlider,auto:controls.autoSensSlider,otsu:controls.otsuThrSlider,brush:controls.brushRadiusSlider};
  const toolTip = document.querySelector('#toolTip');
  document.addEventListener('focusin', e => { if (controls[e.target.id]) toolTip.textContent = controls[e.target.id]; });
  document.querySelectorAll('.algo-mode-btn').forEach(b => b.addEventListener('click', () => { toolTip.textContent = modeTips[b.dataset.mode]; }));
  new MutationObserver(() => {
    const active = document.querySelector('.algo-mode-btn[aria-pressed=true]');
    if (active) toolTip.textContent=modeTips[active.dataset.mode];
  }).observe(document.querySelector('#activeModeBadge'), {childList:true});
  new MutationObserver(() => {
    const content = document.querySelector('#toastText').textContent;
    document.querySelector('#toastBanner .pal-sticker').dataset.kind =
      /报告|导出|参考轮廓/.test(content) ? 'fish' : /样本|导入|载入/.test(content) ? 'chi' : 'nai';
  }).observe(document.querySelector('#toastText'),{childList:true,characterData:true,subtree:true});
})();
