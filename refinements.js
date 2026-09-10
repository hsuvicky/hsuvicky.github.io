(()=>{
const panels=[...document.querySelectorAll('[data-work-panel]')];if(!panels.length)return;
const controls=document.querySelector('.work-controls');const selector=document.createElement('div');selector.className='folio-selector';selector.setAttribute('role','group');selector.setAttribute('aria-label','Select project');controls.insertBefore(selector,controls.querySelector('[data-work-next]'));
let current=0;
const tabs=panels.map((panel,index)=>{const button=document.createElement('button');button.type='button';button.className='folio-tab';button.setAttribute('aria-label',panel.querySelector('h3,h4').textContent.trim());button.addEventListener('click',()=>show(index));selector.append(button);return button});
function show(index){current=(index+panels.length)%panels.length;panels.forEach((panel,i)=>{panel.hidden=i!==current;tabs[i].setAttribute('aria-pressed',String(i===current))})}
document.querySelector('[data-work-previous]').addEventListener('click',()=>show(current-1));document.querySelector('[data-work-next]').addEventListener('click',()=>show(current+1));show(0);
})();
(()=>{
const gallery=document.querySelector('[data-perspective-gallery]');if(!gallery)return;
gallery.classList.add('refined-gallery');const cards=[...gallery.querySelectorAll('[data-gallery-item]')];
const menu=document.createElement('nav');menu.className='gallery-menu';menu.setAttribute('aria-label','Projects and hobbies');gallery.prepend(menu);
let active=0;const buttons=[];
let group;
cards.forEach((card,i)=>{if(i===0||i===2){group=document.createElement('div');group.className='gallery-index-group';const heading=document.createElement('p');heading.textContent=i===0?'Projects':'Hobbies';group.append(heading);menu.append(group)}
 const button=document.createElement('button');button.type='button';button.className='gallery-index-item';
 const preview=document.createElement('span');preview.className='gallery-index-preview';preview.setAttribute('aria-hidden','true');
 const visual=card.querySelector('.gallery-card-visual').cloneNode(true);visual.removeAttribute('id');visual.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));visual.querySelectorAll('img').forEach(e=>{e.alt='';e.loading='eager'});preview.append(visual);
 const label=document.createElement('span');label.className='gallery-index-label';label.textContent=card.querySelector('h3').textContent;button.append(preview,label);
 button.setAttribute('aria-controls',card.id||(card.id='about-item-'+i));button.addEventListener('click',()=>show(i));buttons.push(button);group.append(button);
 card.querySelector('.gallery-card-select')?.remove();card.querySelector('.gallery-close')?.remove();
});
function show(index){active=(index+cards.length)%cards.length;cards.forEach((card,i)=>{card.hidden=i!==active;card.inert=i!==active;card.setAttribute('aria-hidden',String(i!==active));card.dataset.position=i===active?'active':'future';buttons[i].setAttribute('aria-current',i===active?'true':'false')})}
gallery.querySelector('[data-gallery-previous]').addEventListener('click',()=>show(active-1));gallery.querySelector('[data-gallery-next]').addEventListener('click',()=>show(active+1));show(0);
})();
(()=>{
const root=document.querySelector('.career-browser');if(!root)return;
const entries=[...root.querySelectorAll('[data-year]')],years=root.querySelector('.career-years');let active='2026',hobbies=false;
const buttons=entries.map(entry=>{const button=document.createElement('button');button.type='button';button.textContent=entry.dataset.year;button.addEventListener('click',()=>{active=entry.dataset.year;render()});years.append(button);return button});
function render(){entries.forEach((entry,i)=>{const personal=entry.dataset.personal==='true';buttons[i].hidden=personal&&!hobbies;entry.hidden=entry.dataset.year!==active;buttons[i].setAttribute('aria-current',entry.dataset.year===active?'true':'false');entry.querySelectorAll('[data-hobby-content]').forEach(e=>{e.hidden=!hobbies;e.setAttribute('aria-hidden',String(!hobbies))})});}
root.querySelector('[data-career-hobbies]').addEventListener('click',event=>{hobbies=!hobbies;event.currentTarget.textContent=hobbies?'Hide hobbies':'Show hobbies';event.currentTarget.setAttribute('aria-pressed',String(hobbies));if(!hobbies&&entries.find(e=>e.dataset.year===active)?.dataset.personal==='true')active='2026';render()});render();
})();
