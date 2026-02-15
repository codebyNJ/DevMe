(function(){
  var PREFIX='devme_';
  var KEY=PREFIX+'snapshot';
  var MAX_AGE=86400000;
  try{
    var raw=localStorage.getItem(KEY);
    if(!raw)return;
    var snapshot=JSON.parse(raw);
    if(!snapshot||!snapshot.html||!snapshot.themeId)return;
    if(snapshot.timestamp&&Date.now()-snapshot.timestamp>MAX_AGE)return;

    // Apply CSS variables immediately
    if(snapshot.cssVariables){
      var root=document.documentElement;
      var vars=snapshot.cssVariables;
      for(var k in vars){
        if(vars.hasOwnProperty(k))root.style.setProperty(k,vars[k]);
      }
    }

    // Store for hydration
    window.__DEVME_SNAPSHOT__=snapshot;
    window.__DEVME_INSTANT_LOAD__=true;

    // Inject HTML as soon as DOM is available
    function inject(){
      var root=document.getElementById('dashboardRoot');
      if(root){
        root.innerHTML=snapshot.html;
        root.className='instant-loaded';
        root.style.display='block';
        console.log('DevMe: Instant load in '+(Date.now()-window.__DEVME_START__)+'ms');
      }
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',inject,{once:true});
    }else{
      inject();
    }
  }catch(e){}
})();
window.__DEVME_START__=Date.now();
