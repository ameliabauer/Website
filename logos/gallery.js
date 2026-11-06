(() => {
  const later = (tile, fn, ms) => tile._timers.push(setTimeout(fn, ms));
  const ease = x => x < .5 ? 4*x*x*x : 1-Math.pow(-2*x+2,3)/2;
  function placeOnPath(el,path,len,f,scale=1){
    const d=Math.max(0,Math.min(len,len*f)),p=path.getPointAtLength(d);
    const a=path.getPointAtLength(Math.max(0,d-1)),b=path.getPointAtLength(Math.min(len,d+1));
    const angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
    el.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${angle}) scale(${scale})`);
  }
  function animate(tile,duration,delay,frame,end){
    later(tile,()=>{const start=performance.now();const step=now=>{const f=Math.min(1,(now-start)/duration);frame(f);if(f<1)tile._raf=requestAnimationFrame(step);else if(end)end();};tile._raf=requestAnimationFrame(step);},delay);
  }
  const runners={
    flight(tile){
      const path=tile.querySelector('.fp-trail'),mask=tile.querySelector('.fp-mpath'),plane=tile.querySelector('.plane'),len=path.getTotalLength();
      mask.style.strokeDashoffset=1;placeOnPath(plane,path,len,0,1.1);
      animate(tile,2000,350,f=>{const e=ease(f);mask.style.strokeDashoffset=1-e;placeOnPath(plane,path,len,e,1.1);},()=>tile.classList.add('done'));
    },
    sky(tile){
      const path=tile.querySelector('.sky-trail'),plane=tile.querySelector('.plane'),len=path.getTotalLength();
      path.style.strokeDashoffset=1;placeOnPath(plane,path,len,0,.9);
      animate(tile,2600,300,f=>{const e=ease(f);path.style.strokeDashoffset=1-e;placeOnPath(plane,path,len,e,.9);},()=>tile.classList.add('done'));
    },
    postcard(tile){later(tile,()=>tile.classList.add('flipped'),2500);},
    pixel(tile){
      const svg=tile.querySelector('.pixel'),g=tile.querySelector('.pix'),z=tile.querySelector('.pz');
      const morph=tile.querySelector('.px-morph'),blur=tile.querySelector('.px-blur');
      const rnd=(a,b)=>a+Math.random()*(b-a);
      const ss=(a,b,x)=>{const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u);};
      if(!g.childElementCount){
        const rows=['1111111','0000011','0000110','0001100','0011000','0110000','1100000','1111111'],ns='http://www.w3.org/2000/svg';
        const pal=['#8db6ea','#a99be8','#c487d4','#5d63c9','#b9d0f2'];
        rows.forEach((row,r)=>row.split('').forEach((v,c)=>{
          if(v!=='1')return;
          const t=(r+c)/14,col=t<.33?pal[0]:t<.55?pal[1]:t<.78?pal[3]:pal[2];
          const rect=document.createElementNS(ns,'rect');
          rect.setAttribute('class','px');rect.setAttribute('x',71+c*14);rect.setAttribute('y',30+r*14);
          rect.setAttribute('width',12);rect.setAttribute('height',12);rect.setAttribute('rx',2);rect.setAttribute('fill',col);g.appendChild(rect);
        }));
      }
      morph.removeAttribute('filter');blur.setAttribute('stdDeviation','0');
      g.style.opacity='1';z.style.opacity='0';tile.classList.remove('done');
      g.querySelectorAll('.px').forEach(p=>{p.style.animationDelay=rnd(.1,1.2).toFixed(2)+'s';});
      later(tile,()=>{
        morph.setAttribute('filter','url(#px-melt)');
        const t0=performance.now(),dur=1300;
        const step=now=>{
          const f=Math.min(1,(now-t0)/dur);
          blur.setAttribute('stdDeviation',(Math.sin(Math.PI*f)*5).toFixed(2));
          g.style.opacity=(1-ss(.2,.7,f)).toFixed(3);
          z.style.opacity=ss(.25,.75,f).toFixed(3);
          if(f<1)tile._raf=requestAnimationFrame(step);
          else{morph.removeAttribute('filter');tile.classList.add('done');}
        };
        tile._raf=requestAnimationFrame(step);
      },1650);
    },
    spotlight(tile){
      const top=tile.querySelector('.spot-top'),w=top.offsetWidth;top.style.setProperty('--r','54px');tile._spotIntro=true;
      animate(tile,2200,300,f=>{top.style.setProperty('--mx',(-60+ease(f)*(w+120))+'px');},()=>{tile._spotIntro=false;reveal(top);tile.classList.add('done');});
    },
    stars(tile){
      const g=tile.querySelector('.bgstars');
      if(!g.childElementCount){const ns='http://www.w3.org/2000/svg';for(let i=0;i<28;i++){const s=document.createElementNS(ns,'circle');s.setAttribute('class','bgstar');s.setAttribute('cx',10+Math.random()*220);s.setAttribute('cy',8+Math.random()*162);s.setAttribute('r',.7+Math.random()*.9);s.style.setProperty('--dur',(2+Math.random()*2.5)+'s');s.style.setProperty('--del',(Math.random()*3)+'s');g.appendChild(s);}}
      later(tile,()=>tile.classList.add('done'),2700);
    },
    layers(tile){
      const box=tile.querySelector('.layers');box.style.setProperty('--sx',0);box.style.setProperty('--sy',0);
      later(tile,()=>{box.style.setProperty('--sx',4);box.style.setProperty('--sy',4);},350);
      later(tile,()=>tile.classList.add('done'),1100);
    }
  };
  function reveal(top){let r=54;const grow=()=>{r+=22;top.style.setProperty('--r',r+'px');if(r<420)requestAnimationFrame(grow);};requestAnimationFrame(grow);}
  function play(tile){
    if(tile._raf)cancelAnimationFrame(tile._raf);
    (tile._timers||[]).forEach(clearTimeout);tile._timers=[];
    tile.classList.remove('play','done','flipped');void tile.offsetWidth;tile.classList.add('play');
    const run=runners[tile.dataset.run];
    if(run)run(tile);else later(tile,()=>tile.classList.add('done'),+(tile.dataset.doneAt||2000));
  }
  document.querySelectorAll('.tile').forEach(tile=>{
    tile._timers=[];
    tile.addEventListener('click',()=>play(tile));
    if(tile.dataset.hover)tile.addEventListener('mouseenter',()=>play(tile));
    if(tile.dataset.run==='spotlight'){
      const top=tile.querySelector('.spot-top');
      tile.addEventListener('mousemove',e=>{if(tile._spotIntro)return;const r=top.getBoundingClientRect();top.style.setProperty('--r','54px');top.style.setProperty('--mx',(e.clientX-r.left)+'px');top.style.setProperty('--my',(e.clientY-r.top)+'px');});
      tile.addEventListener('mouseleave',()=>{if(!tile._spotIntro){top.style.setProperty('--my','50%');reveal(top);}});
    }
    if(tile.dataset.run==='layers'){
      const box=tile.querySelector('.layers');
      tile.addEventListener('mousemove',e=>{const r=tile.getBoundingClientRect(),dx=(e.clientX-(r.left+r.width/2))/(r.width/2),dy=(e.clientY-(r.top+r.height/2))/(r.height/2);box.style.setProperty('--sx',(-dx*7).toFixed(2));box.style.setProperty('--sy',(-dy*7).toFixed(2));});
      tile.addEventListener('mouseleave',()=>{box.style.setProperty('--sx',4);box.style.setProperty('--sy',4);});
    }
  });
  document.getElementById('replay').addEventListener('click',()=>document.querySelectorAll('.tile').forEach(play));
  requestAnimationFrame(()=>document.querySelectorAll('.tile').forEach(play));
})();