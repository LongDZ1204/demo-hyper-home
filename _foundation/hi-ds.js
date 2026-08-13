/* HYPER INKERS — DESIGN SYSTEM JS.
   Lead previews use a real inline suffix: "..." + the shared arrow-right icon.
   This keeps the arrow gap identical in every section instead of estimating an
   absolute x-position from the browser's line-clamp ellipsis. */
(function(){
  'use strict';

  var ROOT=document.documentElement;

  function leadLines(){
    return parseInt(getComputedStyle(ROOT).getPropertyValue('--lead-lines'),10)||2;
  }

  function stripIds(node){
    if(node.removeAttribute) node.removeAttribute('id');
    [].slice.call(node.querySelectorAll('[id]')).forEach(function(el){el.removeAttribute('id');});
  }

  function setupLead(cb){
    var box=cb.nextElementSibling;
    if(!box||!box.classList.contains('has-clamp')) return;

    var full=box.querySelector('.lead-txt');
    var more=box.querySelector('.lead-more');
    if(!full||!more) return;

    var preview=document.createElement('span');
    preview.className='lead-preview';
    preview.setAttribute('aria-live','polite');

    var suffix=document.createElement('span');
    suffix.className='lead-suffix';

    var ellipsis=document.createElement('span');
    ellipsis.className='lead-ellipsis';
    ellipsis.setAttribute('aria-hidden','true');
    ellipsis.textContent='...';

    suffix.appendChild(ellipsis);
    suffix.appendChild(more);
    box.insertBefore(preview,full);
    box.insertBefore(suffix,full.nextSibling);

    var template=full.innerHTML;
    var rawText=full.textContent||'';
    var lastWidth=-1;
    var scheduled=false;

    stripIds(preview);
    more.setAttribute('aria-expanded',cb.checked?'true':'false');
    box.classList.add('lead-ready');

    function paint(count){
      preview.innerHTML=template;
      stripIds(preview);

      var walker=document.createTreeWalker(preview,NodeFilter.SHOW_TEXT);
      var nodes=[];
      while(walker.nextNode()) nodes.push(walker.currentNode);

      var left=count;
      nodes.forEach(function(node){
        var value=node.nodeValue||'';
        if(left<=0){node.nodeValue='';return;}
        if(value.length>left){node.nodeValue=value.slice(0,left);left=0;return;}
        left-=value.length;
      });

      for(var i=nodes.length-1;i>=0;i--){
        if(nodes[i].nodeValue){nodes[i].nodeValue=nodes[i].nodeValue.replace(/\s+$/,'');break;}
      }
    }

    function rectLines(){
      var rects=[].slice.call(preview.getClientRects()).filter(function(rect){
        return rect.width>.5&&rect.height>.5;
      });
      if(!suffix.hidden){
        var suffixRect=suffix.getBoundingClientRect();
        if(suffixRect.width>.5&&suffixRect.height>.5) rects.push(suffixRect);
      }
      rects.sort(function(a,b){return a.top-b.top||a.left-b.left;});

      var rows=[];
      rects.forEach(function(rect){
        var center=rect.top+(rect.height/2);
        var row=rows.find(function(item){
          return Math.abs(item.center-center)<=Math.max(3,Math.min(item.height,rect.height)*.45);
        });
        if(row){
          row.center=(row.center+center)/2;
          row.height=Math.max(row.height,rect.height);
        }else{
          rows.push({center:center,height:rect.height});
        }
      });
      return rows.length;
    }

    function wordBoundary(count){
      if(count>=rawText.length) return rawText.length;
      if(count>0&&/\S/.test(rawText.charAt(count-1))&&/\S/.test(rawText.charAt(count))){
        var space=Math.max(rawText.lastIndexOf(' ',count-1),rawText.lastIndexOf('\n',count-1),rawText.lastIndexOf('\t',count-1));
        if(space>0) count=space;
      }
      while(count>0&&/\s/.test(rawText.charAt(count-1))) count--;
      return count;
    }

    function previousWord(count){
      while(count>0&&/\s/.test(rawText.charAt(count-1))) count--;
      while(count>0&&!/\s/.test(rawText.charAt(count-1))) count--;
      while(count>0&&/\s/.test(rawText.charAt(count-1))) count--;
      return count;
    }

    function rebuild(force){
      scheduled=false;
      var width=Math.round(box.getBoundingClientRect().width*10)/10;
      if(!force&&width===lastWidth) return;
      lastWidth=width;

      box.classList.remove('lead-no-overflow');
      suffix.hidden=true;
      paint(rawText.length);

      var maxLines=leadLines();
      if(rectLines()<=maxLines){
        box.classList.add('lead-no-overflow');
        return;
      }

      suffix.hidden=false;
      var low=0,high=rawText.length;
      while(low<high){
        var mid=Math.ceil((low+high)/2);
        paint(mid);
        if(rectLines()<=maxLines) low=mid;
        else high=mid-1;
      }

      var cut=wordBoundary(low);
      paint(cut);
      while(cut>0&&rectLines()>maxLines){
        cut=previousWord(cut);
        paint(cut);
      }
    }

    function schedule(force){
      if(scheduled&&!force) return;
      scheduled=true;
      requestAnimationFrame(function(){rebuild(!!force);});
    }

    cb.addEventListener('change',function(){
      more.setAttribute('aria-expanded',cb.checked?'true':'false');
    });

    if(window.ResizeObserver){
      new ResizeObserver(function(){schedule(false);}).observe(box);
    }else{
      window.addEventListener('resize',function(){schedule(false);});
    }
    window.addEventListener('load',function(){schedule(true);});
    if(document.fonts) document.fonts.ready.then(function(){schedule(true);});
    schedule(true);
  }

  [].slice.call(document.querySelectorAll('.lead-cb')).forEach(setupLead);
})();
