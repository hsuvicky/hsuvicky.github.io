(()=>{const panels=[...document.querySelectorAll('[data-work-panel]')];let current=0;function move(delta){panels[current].hidden=true;current=(current+delta+panels.length)%panels.length;panels[current].hidden=false;document.querySelector('[data-work-count]').textContent=`${current+1} / ${panels.length}`;}document.querySelector('[data-work-previous]')?.addEventListener('click',()=>move(-1));document.querySelector('[data-work-next]')?.addEventListener('click',()=>move(1));})();
(()=>{
const gallery=document.querySelector('[data-perspective-gallery]');if(!gallery)return;
gallery.classList.add('refined-gallery');const cards=[...gallery.querySelectorAll('[data-expandable]')];
const menu=document.createElement('nav');menu.className='gallery-menu';menu.setAttribute('aria-label','Projects and hobbies');gallery.prepend(menu);
let active=0;const buttons=[];
cards.forEach((card,i)=>{if(i===0||i===2){const heading=document.createElement('p');heading.textContent=i===0?'Projects':'Hobbies';menu.append(heading)}
 const button=document.createElement('button');button.type='button';button.textContent=card.querySelector('h3').textContent;button.addEventListener('click',()=>show(i));buttons.push(button);menu.append(button);
 card.querySelector('.gallery-card-select')?.remove();card.querySelector('.gallery-close')?.remove();
});
function show(index){active=(index+cards.length)%cards.length;cards.forEach((card,i)=>{card.hidden=i!==active;card.inert=i!==active;card.setAttribute('aria-hidden',String(i!==active));card.dataset.position=i===active?'active':'future';buttons[i].setAttribute('aria-current',i===active?'true':'false')})}
gallery.querySelector('[data-gallery-previous]').addEventListener('click',()=>show(active-1));gallery.querySelector('[data-gallery-next]').addEventListener('click',()=>show(active+1));show(0);
})();
