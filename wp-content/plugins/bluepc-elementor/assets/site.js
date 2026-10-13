(()=>{'use strict';const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#primary-nav');if(!toggle||!nav)return;const close=()=>{toggle.setAttribute('aria-expanded','false');nav.classList.remove('is-open');};toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){close();toggle.focus();}});nav.addEventListener('click',e=>{if(e.target.closest('a'))close();});document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target))close();});matchMedia('(min-width: 901px)').addEventListener('change',e=>{if(e.matches)close();});})();
(()=>{'use strict';const root=document.querySelector('.banner-slider');if(!root||document.body.classList.contains('elementor-editor-active'))return;const track=root.querySelector('.banner-slides'),slides=[...track.children];let index=0,timer,startX=null;const show=next=>{index=(next+slides.length)%slides.length;track.style.transform=`translateX(-${index*100}%)`;slides.forEach((slide,i)=>{slide.inert=i!==index;slide.setAttribute('aria-hidden',String(i!==index));});};const stop=()=>clearInterval(timer);const start=()=>{stop();if(!document.hidden)timer=setInterval(()=>show(index+1),3000);};root.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));start();}if(e.key==='Escape')stop();});root.addEventListener('focusin',stop);root.addEventListener('focusout',start);root.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;stop();},{passive:true});root.addEventListener('touchend',e=>{if(startX!==null){const delta=e.changedTouches[0].clientX-startX;if(Math.abs(delta)>50)show(index+(delta<0?1:-1));startX=null;start();}},{passive:true});document.addEventListener('visibilitychange',start);show(0);start();})();

(()=>{const input=document.querySelector('#catalog-query'),box=document.querySelector('#catalog-results');if(!input||!box)return;const links=[...box.querySelectorAll('a')],empty=box.querySelector('.search-empty'),status=document.querySelector('[data-search-count]');const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const close=()=>{box.hidden=true;input.setAttribute('aria-expanded','false');};const filter=()=>{const q=norm(input.value.trim());let count=0;links.forEach(a=>{a.hidden=!norm(a.textContent).includes(q);if(!a.hidden)count++;});empty.hidden=count>0;box.hidden=false;input.setAttribute('aria-expanded','true');status.textContent=count+' resultados';};input.addEventListener('input',filter);input.addEventListener('focus',filter);input.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='ArrowDown'){e.preventDefault();links.find(a=>!a.hidden)?.focus();}if(e.key==='Enter'){e.preventDefault();links.find(a=>!a.hidden)?.click();}});box.addEventListener('keydown',e=>{if(e.key==='Escape'){input.focus();close();}});document.addEventListener('click',e=>{if(!e.target.closest('.catalog-search'))close();});document.addEventListener('focusin',e=>{if(!e.target.closest('.catalog-search'))close();});})();
(()=>{
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!('IntersectionObserver' in window))return;
  const selector='.section-heading,.category-card,.line-card,.use-grid article,.review-grid blockquote,.market-grid>a,.split-story>*,.faq-layout>*,.help-inner>*,.contact-card';
  const items=[...document.querySelectorAll(selector)];
  let observer;
  const reveal=el=>{el.classList.add('tech-reveal');observer.unobserve(el);};
  const setup=()=>{
    observer?.disconnect();
    items.forEach(el=>el.classList.remove('tech-reveal'));
    if(reduced.matches)return;
    observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting)reveal(entry.target);});
    },{threshold:.08,rootMargin:'0px 0px -24px 0px'});
    items.forEach(el=>{
      const siblings=[...el.parentElement.children].filter(node=>node.matches(selector));
      el.style.setProperty('--reveal-delay',Math.min(siblings.indexOf(el),3)*65+'ms');
      observer.observe(el);
    });
  };
  setup();
  reduced.addEventListener('change',setup);
})();
