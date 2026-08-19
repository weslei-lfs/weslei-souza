(function(){
  "use strict";
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- network canvas background ---------- */
  function NetworkCanvas(canvas){
    var ctx = canvas.getContext('2d');
    var w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [];
    var mouse = { x: -9999, y: -9999, active: false };
    var raf = null;
    var density = parseFloat(canvas.dataset.density) || 0.00009;
    var linkDist = parseFloat(canvas.dataset.linkDist) || 150;

    function resize(){
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      var count = Math.round(w * h * density);
      count = Math.max(18, Math.min(count, 90));
      nodes = [];
      for(var i=0;i<count;i++){
        nodes.push({
          x: Math.random()*w, y: Math.random()*h,
          vx: (Math.random()-0.5)*0.25, vy: (Math.random()-0.5)*0.25,
          r: Math.random()*1.6 + 0.6
        });
      }
    }

    function step(){
      ctx.clearRect(0,0,w,h);
      for(var i=0;i<nodes.length;i++){
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if(n.x < 0 || n.x > w) n.vx *= -1;
        if(n.y < 0 || n.y > h) n.vy *= -1;
      }
      for(var i=0;i<nodes.length;i++){
        for(var j=i+1;j<nodes.length;j++){
          var a = nodes[i], b = nodes[j];
          var dx = a.x-b.x, dy = a.y-b.y;
          var d = Math.sqrt(dx*dx+dy*dy);
          if(d < linkDist){
            var op = (1 - d/linkDist) * 0.5;
            ctx.strokeStyle = 'rgba(31,147,242,' + op.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          }
        }
        if(mouse.active){
          var dx = a.x-mouse.x, dy = a.y-mouse.y;
          var d = Math.sqrt(dx*dx+dy*dy);
          if(d < linkDist*1.3){
            var op = (1 - d/(linkDist*1.3)) * 0.7;
            ctx.strokeStyle = 'rgba(108,192,255,' + op.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke();
          }
        }
      }
      for(var i=0;i<nodes.length;i++){
        var n = nodes[i];
        ctx.fillStyle = 'rgba(150,205,255,0.85)';
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }

    function onMove(e){
      var rect = canvas.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      var cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      if(cx < 0 || cx > rect.width || cy < 0 || cy > rect.height){ mouse.active = false; return; }
      mouse.x = cx; mouse.y = cy; mouse.active = true;
    }
    function onLeave(){ mouse.active = false; }

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('touchmove', onMove, {passive:true});

    document.addEventListener('visibilitychange', function(){
      if(document.hidden){ if(raf) cancelAnimationFrame(raf); raf = null; }
      else if(!raf && !reduceMotion){ raf = requestAnimationFrame(step); }
    });

    resize();
    if(reduceMotion){ step(); if(raf) cancelAnimationFrame(raf); raf = null; }
    else { raf = requestAnimationFrame(step); }
  }

  /* ---------- custom cursor ---------- */
  function initCursor(){
    if(!fine || reduceMotion) return;
    var dot = document.createElement('div');
    var ring = document.createElement('div');
    dot.className = 'cx-dot'; ring.className = 'cx-ring';
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    var rx=0, ry=0, tx=0, ty=0;
    window.addEventListener('mousemove', function(e){
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = 'translate3d(' + (tx-3) + 'px,' + (ty-3) + 'px,0)';
    });
    (function loop(){
      rx += (tx-rx)*0.16; ry += (ty-ry)*0.16;
      ring.style.transform = 'translate3d(' + (rx-16) + 'px,' + (ry-16) + 'px,0)';
      requestAnimationFrame(loop);
    })();
    var hoverables = document.querySelectorAll('a, button, .tilt-card, input, textarea');
    hoverables.forEach(function(el){
      el.addEventListener('mouseenter', function(){ ring.classList.add('cx-big'); });
      el.addEventListener('mouseleave', function(){ ring.classList.remove('cx-big'); });
    });
    document.body.classList.add('cx-active');
  }

  /* ---------- magnetic buttons ---------- */
  function initMagnetic(){
    if(!fine || reduceMotion) return;
    document.querySelectorAll('.magnetic').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width/2;
        var my = e.clientY - r.top - r.height/2;
        el.style.transform = 'translate(' + (mx*0.22).toFixed(1) + 'px,' + (my*0.28).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform = 'translate(0,0)'; });
    });
  }

  /* ---------- tilt cards ---------- */
  function initTilt(){
    if(!fine || reduceMotion) return;
    document.querySelectorAll('.tilt-card').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left)/r.width - 0.5;
        var py = (e.clientY - r.top)/r.height - 0.5;
        el.style.transform = 'perspective(700px) rotateX(' + (-py*7).toFixed(2) + 'deg) rotateY(' + (px*9).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform = ''; });
    });
  }

  /* ---------- reveal on scroll (staggered) ---------- */
  function initReveal(){
    var groups = document.querySelectorAll('.reveal-group');
    groups.forEach(function(g){
      Array.prototype.forEach.call(g.children, function(c, i){
        c.classList.add('reveal');
        c.style.transitionDelay = (i*0.09) + 's';
      });
    });
    var els = document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold:0.15, rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(e){ io.observe(e); });
  }

  /* ---------- count up ---------- */
  function initCountUp(){
    var els = document.querySelectorAll('.count-up');
    if(!els.length) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target;
        var target = parseFloat(el.dataset.target || el.textContent);
        var dur = 1100, start = performance.now();
        function frame(now){
          var p = Math.min(1, (now-start)/dur);
          var eased = 1 - Math.pow(1-p, 3);
          el.textContent = Math.round(target * eased);
          if(p < 1) requestAnimationFrame(frame);
          else el.textContent = target;
        }
        requestAnimationFrame(frame);
      });
    }, {threshold:0.4});
    els.forEach(function(e){ io.observe(e); });
  }

  /* ---------- decode / scramble text ---------- */
  var GLYPHS = '01#$%&*+-/<>^~ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function scramble(el, done){
    var original = el.textContent;
    var len = original.length;
    var frame = 0;
    var maxFrames = 22;
    var iv = setInterval(function(){
      var out = '';
      for(var i=0;i<len;i++){
        var ch = original[i];
        if(ch === ' '){ out += ' '; continue; }
        var reveal = frame/maxFrames*len;
        if(i < reveal - 3){ out += ch; }
        else { out += GLYPHS[Math.floor(Math.random()*GLYPHS.length)]; }
      }
      el.textContent = out;
      frame++;
      if(frame > maxFrames){ clearInterval(iv); el.textContent = original; if(done) done(); }
    }, 28);
  }
  function initDecode(){
    document.querySelectorAll('.decode-text').forEach(function(el){
      if(reduceMotion) return;
      if(el.dataset.decodeOnLoad === 'true'){ scramble(el); return; }
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if(en.isIntersecting){ io.unobserve(en.target); scramble(en.target); } });
      }, {threshold:0.6});
      io.observe(el);
    });
  }

  /* ---------- kinetic word reveal (pre-wrapped .kw > .kw-inner markup) ---------- */
  function initKinetic(){
    document.querySelectorAll('.kinetic').forEach(function(el){
      var words = el.querySelectorAll('.kw-inner');
      words.forEach(function(w,i){ w.style.transitionDelay = (i*0.045)+'s'; });
      if(reduceMotion){ el.classList.add('kinetic-in'); return; }
      if(el.dataset.kineticOnLoad === 'true'){
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.classList.add('kinetic-in'); }); });
      } else {
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('kinetic-in'); io.unobserve(en.target); } });
        }, {threshold:0.4});
        io.observe(el);
      }
    });
  }

  /* ---------- subtle hero parallax on scroll ---------- */
  function initParallax(){
    if(reduceMotion) return;
    var els = document.querySelectorAll('.parallax-img');
    if(!els.length) return;
    var ticking = false;
    function update(){
      els.forEach(function(el){
        var rect = el.parentElement.getBoundingClientRect();
        var speed = parseFloat(el.dataset.speed) || 0.15;
        var offset = rect.top * speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0) scale(1.15)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ requestAnimationFrame(update); ticking = true; }
    }, {passive:true});
    update();
  }

  /* ---------- floating wolf mascot ---------- */
  function initMascot(){
    var wrap = document.createElement('div');
    wrap.className = 'mascot-wrap';
    wrap.innerHTML = '<img class="mascot-img" alt="">';
    document.body.appendChild(wrap);
    var img = wrap.querySelector('.mascot-img');
    img.src = 'assets/mascot-oi.png';

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ wrap.classList.add('in'); });
    });

    if(reduceMotion){ img.src = 'assets/mascot-idle.png'; return; }

    setTimeout(function(){
      img.src = 'assets/mascot-idle.png';
      wrap.classList.add('idle');
    }, 2600);

    var saidBye = false;
    function onScroll(){
      var nearBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 220);
      if(nearBottom && !saidBye){
        saidBye = true;
        img.src = 'assets/mascot-tchau.png';
        wrap.classList.remove('idle');
        wrap.classList.add('bye');
      } else if(!nearBottom && saidBye){
        saidBye = false;
        img.src = 'assets/mascot-idle.png';
        wrap.classList.remove('bye');
        wrap.classList.add('idle');
      }
    }
    window.addEventListener('scroll', onScroll, {passive:true});
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.net-canvas').forEach(function(c){ NetworkCanvas(c); });
    initCursor();
    initMagnetic();
    initTilt();
    initReveal();
    initCountUp();
    initDecode();
    initKinetic();
    initParallax();
    initMascot();
  });
})();
