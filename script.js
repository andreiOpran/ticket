(function(){
  "use strict";

  /* ---------- helpers ---------- */
  function pad(n){return String(n).padStart(2,"0");}
  function fmt(d){
    return pad(d.getDate())+"."+pad(d.getMonth()+1)+"."+d.getFullYear()+"|"+pad(d.getHours())+":"+pad(d.getMinutes());
  }
  function uuid32(){
    if(window.crypto && crypto.randomUUID){
      return crypto.randomUUID().replace(/-/g,"");
    }
    var s="",h="0123456789abcdef";
    for(var i=0;i<32;i++) s+=h[Math.floor(Math.random()*16)];
    return s;
  }

  /* ---------- QR rendering ---------- */
  var qrBox=document.getElementById("qr");
  function drawQR(data){
    qrBox.innerHTML="";
    var count, isDark;
    if(typeof qrcode==="function"){
      try{
        var qr=qrcode(0,"M");
        qr.addData(data);
        qr.make();
        count=qr.getModuleCount();
        isDark=function(r,c){return qr.isDark(r,c);};
      }catch(e){ count=0; }
    }
    if(!count){
      // fallback: deterministic pseudo-QR grid from the data
      count=33;
      var seed=0; for(var k=0;k<data.length;k++) seed=(seed*31+data.charCodeAt(k))>>>0;
      function rnd(){ seed=(seed*1103515245+12345)>>>0; return (seed>>>16)&1; }
      var grid=[];
      for(var r=0;r<count;r++){grid[r]=[];for(var c=0;c<count;c++)grid[r][c]=rnd();}
      // finder patterns
      function finder(or,oc){
        for(var i=-1;i<=7;i++)for(var j=-1;j<=7;j++){
          var rr=or+i,cc=oc+j; if(rr<0||cc<0||rr>=count||cc>=count)continue;
          var on=(i>=0&&i<=6&&(j===0||j===6))||(j>=0&&j<=6&&(i===0||i===6))||(i>=2&&i<=4&&j>=2&&j<=4);
          grid[rr][cc]=on?1:0;
        }
      }
      finder(0,0);finder(0,count-7);finder(count-7,0);
      isDark=function(r,c){return grid[r][c]===1;};
    }

    var size=420;
    var cell=Math.floor(size/count);
    var dim=cell*count;
    var canvas=document.createElement("canvas");
    canvas.width=dim;canvas.height=dim;
    var ctx=canvas.getContext("2d");
    ctx.fillStyle="#fff";ctx.fillRect(0,0,dim,dim);
    ctx.fillStyle="#000";
    for(var r=0;r<count;r++){
      for(var c=0;c<count;c++){
        if(isDark(r,c)) ctx.fillRect(c*cell,r*cell,cell,cell);
      }
    }
    qrBox.appendChild(canvas);
  }

  /* ---------- countdown + QR cycle ---------- */
  var cdLine=document.getElementById("cdLine");
  var secs=14;
  function showCounting(){ cdLine.textContent="Cod control valabil "+secs+" secunde."; }
  function newCode(){ drawQR(uuid32()); secs=14; showCounting(); }
  function loop(){
    if(secs>0){ secs--; showCounting(); setTimeout(loop,1000); return; }
    // secs reached 0 (already shown) -> show loading for a random 0.3-1s
    cdLine.textContent="Încărcare cod de control";
    setTimeout(function(){ newCode(); setTimeout(loop,1000); }, 300+Math.random()*700);
  }
  newCode();
  setTimeout(loop,1000);

  /* ---------- ticket validity (90 min) ---------- */
  var TOTAL_MIN=90;
  var now=new Date();
  // elapsed kept >=10 min after purchase and >=30 min before expiry
  var MIN_SINCE_BUY=10, MIN_BEFORE_EXPIRY=30;
  var span=TOTAL_MIN-MIN_SINCE_BUY-MIN_BEFORE_EXPIRY; // 50
  var elapsedMin=Math.floor(Math.random()*(span+1))+MIN_SINCE_BUY; // 10..60 min in
  var purchase=new Date(now.getTime()-elapsedMin*60000);
  var validTo=new Date(purchase.getTime()+TOTAL_MIN*60000);

  document.getElementById("validFrom").textContent=fmt(purchase);
  document.getElementById("validTo").textContent=fmt(validTo);
  document.getElementById("purchaseDate").textContent=fmt(purchase);

  // order number: 24 + 7 random digits
  var ord="24"; for(var i=0;i<7;i++) ord+=Math.floor(Math.random()*10);
  document.getElementById("orderNo").textContent=ord;

  var progressEl=document.getElementById("progress");
  function updateProgress(){
    var elapsed=(Date.now()-purchase.getTime())/60000;
    var pct=Math.max(0,Math.min(100,(elapsed/TOTAL_MIN)*100));
    progressEl.style.width=pct.toFixed(2)+"%";
  }
  updateProgress();
  setInterval(updateProgress,1000);

  /* ---------- snap content back to original position ---------- */
  var scrollArea=document.getElementById("scrollArea");
  var snapTimer=null;
  scrollArea.addEventListener("scroll",function(){
    if(snapTimer) clearTimeout(snapTimer);
    snapTimer=setTimeout(function(){
      scrollArea.scrollTo({top:0,behavior:"smooth"});
    },180);
  },{passive:true});
})();
